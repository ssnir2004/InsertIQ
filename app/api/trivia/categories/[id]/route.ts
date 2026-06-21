import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const category = await prisma.triviaCategory.findUnique({
    where: { id },
    include: { questions: { orderBy: { createdAt: "asc" } } },
  });
  if (!category) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(category);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const category = await prisma.triviaCategory.update({ where: { id }, data: body });
  return NextResponse.json(category);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.triviaCategory.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
