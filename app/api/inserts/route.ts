import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  const inserts = await prisma.insert.findMany({
    orderBy: { code: "asc" },
    include: { grade: { select: { code: true } } },
  });
  return NextResponse.json(inserts);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const insert = await prisma.insert.create({ data: body });
  return NextResponse.json(insert, { status: 201 });
}
