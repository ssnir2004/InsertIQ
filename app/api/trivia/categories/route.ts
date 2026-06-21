import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  const categories = await prisma.triviaCategory.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { questions: true } } },
  });
  return NextResponse.json(categories);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const category = await prisma.triviaCategory.create({ data: body });
  return NextResponse.json(category, { status: 201 });
}
