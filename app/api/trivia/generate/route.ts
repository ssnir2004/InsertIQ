import { NextRequest, NextResponse } from "next/server";
import officeparser from "officeparser";
import { extractText, getDocumentProxy } from "unpdf";
import prisma from "@/lib/prisma";
import { writeFile, unlink } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";

const MAX_TEXT = 12000;

function buildPrompt(text: string, count: number) {
  return `אתה מחולל שאלות טריוויה מקצועי. על סמך תוכן המצגת/המסמך הבא, צור בדיוק ${count} שאלות טריוויה בעברית.

כל שאלה חייבת לכלול בדיוק 4 אפשרויות תשובה, כאשר תשובה אחת בלבד נכונה.

החזר JSON תקין בלבד, ללא הסבר, ללא markdown, בפורמט הבא:
{
  "questions": [
    {
      "question": "השאלה כאן",
      "options": ["תשובה א", "תשובה ב", "תשובה ג", "תשובה ד"],
      "answer": 0,
      "explanation": "הסבר קצר לתשובה הנכונה"
    }
  ]
}

שדה "answer" הוא האינדקס (0-3) של התשובה הנכונה.
צור שאלות שבודקות הבנה של המושגים המרכזיים בחומר.

תוכן:
${text.slice(0, MAX_TEXT)}`;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GROQ_API_KEY לא מוגדר" }, { status: 500 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "שגיאה בקריאת הטופס" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  const url = formData.get("url") as string | null;
  const categoryId = formData.get("categoryId") as string | null;
  const newCategoryName = formData.get("newCategoryName") as string | null;
  const questionCount = Math.min(parseInt(formData.get("questionCount") as string) || 10, 30);

  if (!file && !url?.trim()) return NextResponse.json({ error: "נא לבחור קובץ או להזין קישור" }, { status: 400 });
  if (!categoryId && !newCategoryName?.trim()) {
    return NextResponse.json({ error: "נא לבחור נושא או ליצור חדש" }, { status: 400 });
  }

  // Extract text from source
  let text: string;

  if (url?.trim()) {
    try {
      const pageRes = await fetch(url.trim(), { headers: { "User-Agent": "Mozilla/5.0" } });
      if (!pageRes.ok) throw new Error(`HTTP ${pageRes.status}`);
      const html = await pageRes.text();
      text = html
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    } catch (urlErr) {
      const msg = urlErr instanceof Error ? urlErr.message : String(urlErr);
      return NextResponse.json({ error: `לא ניתן לאחזר את הקישור: ${msg.slice(0, 150)}` }, { status: 400 });
    }
  } else {
    const bytes = await file!.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const isPdf = file!.name.toLowerCase().endsWith(".pdf");

    if (isPdf) {
      try {
        const pdf = await getDocumentProxy(new Uint8Array(buffer));
        const { text: extracted } = await extractText(pdf, { mergePages: true });
        text = extracted;
      } catch (pdfErr) {
        const pdfMsg = pdfErr instanceof Error ? pdfErr.message : String(pdfErr);
        console.error("pdfjs error:", pdfMsg);
        return NextResponse.json({ error: `שגיאת PDF: ${pdfMsg.slice(0, 200)}` }, { status: 400 });
      }
    } else {
      const tmpPath = join(tmpdir(), `trivia_${Date.now()}_${file!.name}`);
      await writeFile(tmpPath, buffer);
      try {
        text = String(await officeparser.parseOffice(tmpPath));
      } catch {
        await unlink(tmpPath).catch(() => {});
        return NextResponse.json({ error: "לא ניתן לקרוא את הקובץ. וודא שהוא PPTX תקין." }, { status: 400 });
      } finally {
        await unlink(tmpPath).catch(() => {});
      }
    }
  }

  if (!text || text.trim().length < 50) {
    return NextResponse.json({ error: "המקור ריק מדי — לא נמצא מספיק טקסט" }, { status: 400 });
  }

  // Generate questions with Groq (llama-3.3-70b, free tier)
  let questions: Array<{ question: string; options: string[]; answer: number; explanation?: string }> = [];

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: buildPrompt(text, questionCount) }],
        temperature: 0.7,
        max_tokens: 8192,
        response_format: { type: "json_object" },
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      const errMsg = json?.error?.message ?? JSON.stringify(json).slice(0, 300);
      if (res.status === 429) {
        return NextResponse.json({ error: `מגבלת בקשות (429). המתן דקה ונסה שוב.` }, { status: 429 });
      }
      throw new Error(errMsg);
    }
    const responseText = (json.choices?.[0]?.message?.content ?? "").trim();
    const jsonStr = responseText
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```\s*$/, "")
      .trim();
    const match = jsonStr.match(/\{[\s\S]*\}/);
    if (!match) throw new Error(`No JSON in response: ${jsonStr.slice(0, 200)}`);
    ({ questions } = JSON.parse(match[0]));
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("Groq error:", msg);
    return NextResponse.json({ error: `שגיאה ביצירת השאלות: ${msg.slice(0, 300)}` }, { status: 500 });
  }

  if (!Array.isArray(questions) || questions.length === 0) {
    return NextResponse.json({ error: "ה-AI לא החזיר שאלות תקינות" }, { status: 500 });
  }

  // Resolve category
  let resolvedCategoryId: string;
  if (categoryId) {
    resolvedCategoryId = categoryId;
  } else {
    const existing = await prisma.triviaCategory.findFirst({ where: { name: newCategoryName!.trim() } });
    if (existing) {
      resolvedCategoryId = existing.id;
    } else {
      const created = await prisma.triviaCategory.create({ data: { name: newCategoryName!.trim() } });
      resolvedCategoryId = created.id;
    }
  }

  const created = await prisma.triviaQuestion.createMany({
    data: questions.map((q) => ({
      categoryId: resolvedCategoryId,
      question: q.question,
      options: q.options,
      answer: q.answer,
      explanation: q.explanation ?? null,
    })),
  });

  return NextResponse.json({ count: created.count, categoryId: resolvedCategoryId });
}
