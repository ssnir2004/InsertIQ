import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  const grades = await prisma.grade.findMany({
    orderBy: { code: "asc" },
    include: { _count: { select: { inserts: true } } },
  });
  return NextResponse.json(grades);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const grade = await prisma.grade.create({ data: body });
  return NextResponse.json(grade, { status: 201 });
}
