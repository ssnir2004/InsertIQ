import { NextRequest, NextResponse } from "next/server";
import officeparser from "officeparser";
import { extractText, getDocumentProxy } from "unpdf";
import prisma from "@/lib/prisma";
import { writeFile, unlink } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";

const MAX_TEXT = 12000;

function buildVisionPrompt(count: number, language: "he" | "en") {
  if (language === "en") {
    return `Analyze this image carefully — read all visible text and understand the visual content (diagrams, charts, labels, illustrations, tool geometry, etc.).

Based on everything you see in the image, generate exactly ${count} trivia questions in English.

Each question must include exactly 4 answer options, with only one correct answer.

Return valid JSON only, no explanation, no markdown:
{
  "questions": [
    {
      "question": "Question here",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "answer": 0,
      "explanation": "Brief explanation of the correct answer"
    }
  ]
}

The "answer" field is the index (0-3) of the correct answer.`;
  }

  return `נתח את התמונה הזו בקפידה — קרא את כל הטקסט הגלוי והבן את התוכן הוויזואלי (דיאגרמות, גרפים, תוויות, איורים, גאומטריית כלי חיתוך וכד׳).

על סמך כל מה שאתה רואה בתמונה, צור בדיוק ${count} שאלות טריוויה בעברית.

כל שאלה חייבת לכלול בדיוק 4 אפשרויות תשובה, כאשר תשובה אחת בלבד נכונה.

החזר JSON תקין בלבד, ללא הסבר, ללא markdown:
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

שדה "answer" הוא האינדקס (0-3) של התשובה הנכונה.`;
}

function buildPrompt(text: string, count: number, language: "he" | "en") {
  if (language === "en") {
    return `You are a professional trivia question generator. Based on the following content, generate exactly ${count} trivia questions in English.

Each question must include exactly 4 answer options, with only one correct answer.

Return valid JSON only, no explanation, no markdown, in the following format:
{
  "questions": [
    {
      "question": "Question here",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "answer": 0,
      "explanation": "Brief explanation of the correct answer"
    }
  ]
}

The "answer" field is the index (0-3) of the correct answer.
Generate questions that test understanding of the key concepts in the material.

Content:
${text.slice(0, MAX_TEXT)}`;
  }

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
  const imageFile = formData.get("imageFile") as File | null;
  const categoryId = formData.get("categoryId") as string | null;
  const newCategoryName = formData.get("newCategoryName") as string | null;
  const questionCount = Math.min(parseInt(formData.get("questionCount") as string) || 10, 30);
  const language = (formData.get("language") as string) === "en" ? "en" : "he";

  if (!file && !url?.trim() && !imageFile) return NextResponse.json({ error: "נא לבחור קובץ, קישור או תמונה" }, { status: 400 });
  if (!categoryId && !newCategoryName?.trim()) {
    return NextResponse.json({ error: "נא לבחור נושא או ליצור חדש" }, { status: 400 });
  }

  let questions: Array<{ question: string; options: string[]; answer: number; explanation?: string }> = [];

  const parseGroqResponse = (json: Record<string, unknown>) => {
    const responseText = ((json.choices as Array<{message:{content:string}}>)?.[0]?.message?.content ?? "").trim();
    const jsonStr = responseText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
    const match = jsonStr.match(/\{[\s\S]*\}/);
    if (!match) throw new Error(`No JSON in response: ${jsonStr.slice(0, 200)}`);
    const parsed = JSON.parse(match[0]);
    return parsed.questions as typeof questions;
  };

  if (imageFile) {
    // Vision path — analyze image directly with llama-4-scout
    try {
      const bytes = await imageFile.arrayBuffer();
      const base64 = Buffer.from(bytes).toString("base64");
      const mimeType = imageFile.type || "image/png";
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: "meta-llama/llama-4-scout-17b-16e-instruct",
          messages: [{
            role: "user",
            content: [
              { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64}` } },
              { type: "text", text: buildVisionPrompt(questionCount, language) },
            ],
          }],
          temperature: 0.7,
          max_tokens: 8192,
          response_format: { type: "json_object" },
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        const errMsg = json?.error?.message ?? JSON.stringify(json).slice(0, 300);
        if (res.status === 429) return NextResponse.json({ error: "מגבלת בקשות (429). המתן דקה ונסה שוב." }, { status: 429 });
        throw new Error(errMsg);
      }
      questions = parseGroqResponse(json);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("Groq vision error:", msg);
      return NextResponse.json({ error: `שגיאה בניתוח התמונה: ${msg.slice(0, 300)}` }, { status: 500 });
    }
  } else {
    // Text extraction path
    let text: string;

    if (url?.trim()) {
      try {
        const jinaUrl = `https://r.jina.ai/${url.trim()}`;
        const pageRes = await fetch(jinaUrl, {
          headers: { "Accept": "text/plain", "X-No-Cache": "true" },
        });
        if (!pageRes.ok) throw new Error(`HTTP ${pageRes.status}`);
        text = (await pageRes.text()).trim();
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

    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: buildPrompt(text, questionCount, language) }],
          temperature: 0.7,
          max_tokens: 8192,
          response_format: { type: "json_object" },
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        const errMsg = json?.error?.message ?? JSON.stringify(json).slice(0, 300);
        if (res.status === 429) return NextResponse.json({ error: "מגבלת בקשות (429). המתן דקה ונסה שוב." }, { status: 429 });
        throw new Error(errMsg);
      }
      questions = parseGroqResponse(json);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("Groq error:", msg);
      return NextResponse.json({ error: `שגיאה ביצירת השאלות: ${msg.slice(0, 300)}` }, { status: 500 });
    }
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
