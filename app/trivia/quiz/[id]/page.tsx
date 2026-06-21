export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { QuizClient } from "./QuizClient";

export default async function QuizPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const category = await prisma.triviaCategory.findUnique({
    where: { id },
    include: { questions: { orderBy: { createdAt: "asc" } } },
  });
  if (!category) notFound();
  if (category.questions.length === 0) notFound();

  return <QuizClient category={category} />;
}
