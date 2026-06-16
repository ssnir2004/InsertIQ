import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { type, rows } = body as { type: "grades" | "inserts"; rows: Record<string, unknown>[] };

  if (type === "grades") {
    const result = await prisma.$transaction(
      rows.map((row) =>
        prisma.grade.upsert({
          where: { code: row.code as string },
          update: row as Parameters<typeof prisma.grade.update>[0]["data"],
          create: row as Parameters<typeof prisma.grade.create>[0]["data"],
        })
      )
    );
    return NextResponse.json({ imported: result.length });
  }

  if (type === "inserts") {
    const result = await prisma.$transaction(
      rows.map((row) =>
        prisma.insert.upsert({
          where: { code: row.code as string },
          update: row as Parameters<typeof prisma.insert.update>[0]["data"],
          create: row as Parameters<typeof prisma.insert.create>[0]["data"],
        })
      )
    );
    return NextResponse.json({ imported: result.length });
  }

  return NextResponse.json({ error: "Invalid type" }, { status: 400 });
}
