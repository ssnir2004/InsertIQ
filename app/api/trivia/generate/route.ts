import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI, Part } from "@google/generative-ai";
import officeparser from "officeparser";
import prisma from "@/lib/prisma";
import { writeFile, unlink } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";

const PROMPT_SUFFIX = (count: number) => `
אתה מחולל שאלות טריוויה מקצועי. על סמך תוכן המצגת/המסמך, צור בדיוק ${count} שאלות טריוויה בעברית.

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
צור שאלות שבודקות הבנה של המושגים המרכזיים בחומר.`;

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "your_gemini_api_key_here") {
    return NextResponse.json({ error: "GEMINI_API_KEY לא מוגדר" }, { status: 500 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "שגיאה בקריאת הטופס" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  const categoryId = formData.get("categoryId") as string | null;
  const newCategoryName = formData.get("newCategoryName") as string | null;
  const questionCount = Math.min(parseInt(formData.get("questionCount") as string) || 10, 30);

  if (!file) return NextResponse.json({ error: "לא נבחר קובץ" }, { status: 400 });
  if (!categoryId && !newCategoryName?.trim()) {
    return NextResponse.json({ error: "נא לבחור נושא או ליצור חדש" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const isPdf = file.name.toLowerCase().endsWith(".pdf");

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  let contentParts: Part[];

  if (isPdf) {
    // Send PDF directly to Gemini — no text extraction needed
    contentParts = [
      {
        inlineData: {
          data: buffer.toString("base64"),
          mimeType: "application/pdf",
        },
      },
      { text: PROMPT_SUFFIX(questionCount) },
    ];
  } else {
    // PPTX/PPT — extract text first
    const tmpPath = join(tmpdir(), `trivia_${Date.now()}_${file.name}`);
    await writeFile(tmpPath, buffer);
    let text: string;
    try {
      text = String(await officeparser.parseOffice(tmpPath));
    } catch {
      await unlink(tmpPath).catch(() => {});
      return NextResponse.json({ error: "לא ניתן לקרוא את הקובץ. וודא שהוא PPTX תקין." }, { status: 400 });
    } finally {
      await unlink(tmpPath).catch(() => {});
    }
    if (!text || text.trim().length < 50) {
      return NextResponse.json({ error: "הקובץ ריק מדי — לא נמצא מספיק טקסט" }, { status: 400 });
    }
    contentParts = [{ text: `תוכן המצגת:\n${text.slice(0, 15000)}\n\n${PROMPT_SUFFIX(questionCount)}` }];
  }

  let questions: Array<{ question: string; options: string[]; answer: number; explanation?: string }>;
  try {
    const result = await model.generateContent(contentParts);
    const responseText = result.response.text().trim();
    const jsonStr = responseText.replace(/^```json\s*/i, "").replace(/\s*```$/, "");
    ({ questions } = JSON.parse(jsonStr));
  } catch {
    return NextResponse.json({ error: "שגיאה ביצירת השאלות מה-AI. נסה שוב." }, { status: 500 });
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
