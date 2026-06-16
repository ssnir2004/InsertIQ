import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("mode") || "scenario";
  const grades = await prisma.grade.findMany({ include: { inserts: { take: 1 } } });

  if (grades.length < 2) return NextResponse.json({ error: "Not enough data" }, { status: 400 });

  const shuffle = <T>(arr: T[]) => [...arr].sort(() => Math.random() - 0.5);
  const pick = shuffle(grades)[0];

  if (mode === "flashcard") {
    return NextResponse.json({ grade: pick });
  }

  // scenario / match: build 4 choices
  const others = shuffle(grades.filter((g) => g.id !== pick.id)).slice(0, 3);
  const choices = shuffle([pick, ...others]).map((g) => ({ id: g.id, code: g.code }));

  return NextResponse.json({ grade: pick, choices });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const result = await prisma.quizResult.create({ data: body });
  return NextResponse.json(result, { status: 201 });
}
