import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const categoryId = searchParams.get("categoryId");
  const questions = await prisma.triviaQuestion.findMany({
    where: categoryId ? { categoryId } : undefined,
    orderBy: { createdAt: "asc" },
    include: { category: { select: { name: true } } },
  });
  return NextResponse.json(questions);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const question = await prisma.triviaQuestion.create({ data: body });
  return NextResponse.json(question, { status: 201 });
}
