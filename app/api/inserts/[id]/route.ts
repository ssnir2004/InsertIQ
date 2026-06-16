import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const insert = await prisma.insert.update({ where: { id }, data: body });
  return NextResponse.json(insert);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.insert.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
