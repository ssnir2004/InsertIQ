import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  const [grades, inserts, quizResults] = await Promise.all([
    prisma.grade.count(),
    prisma.insert.count(),
    prisma.quizResult.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
  ]);
  return NextResponse.json({ grades, inserts, quizResults });
}
