import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const grade = await prisma.grade.findUnique({ where: { id }, include: { inserts: true } });
  if (!grade) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(grade);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const grade = await prisma.grade.update({ where: { id }, data: body });
  return NextResponse.json(grade);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.grade.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
