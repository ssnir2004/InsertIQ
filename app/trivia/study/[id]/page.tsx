export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, HelpCircle } from "lucide-react";
import prisma from "@/lib/prisma";
import ReactMarkdown from "react-markdown";

export default async function StudyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const category = await prisma.triviaCategory.findUnique({
    where: { id },
    include: { _count: { select: { questions: true } } },
  });
  if (!category) notFound();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/trivia">
          <Button variant="ghost" size="sm" className="gap-1">
            <ArrowRight className="h-4 w-4" />
            חזרה
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">{category.name}</h1>
          <Badge variant="secondary">{category._count.questions} שאלות</Badge>
        </div>
      </div>

      {category.description && (
        <p className="text-muted-foreground">{category.description}</p>
      )}

      {category.content ? (
        <div className="prose prose-sm max-w-none dark:prose-invert
          prose-headings:font-bold prose-headings:text-foreground
          prose-p:text-foreground prose-li:text-foreground
          prose-strong:text-foreground prose-code:bg-muted prose-code:px-1 prose-code:rounded
          prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg
          prose-ul:list-disc prose-ol:list-decimal
          [&>*:first-child]:mt-0">
          <ReactMarkdown>{category.content}</ReactMarkdown>
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground border rounded-lg">
          <p>אין תוכן לימוד לנושא זה עדיין.</p>
          <Link href="/admin/trivia">
            <Button variant="outline" className="mt-3">הוסף תוכן בניהול</Button>
          </Link>
        </div>
      )}

      {category._count.questions > 0 && (
        <div className="border-t pt-6 flex justify-center">
          <Link href={`/trivia/quiz/${id}`}>
            <Button size="lg" className="gap-2">
              <HelpCircle className="h-5 w-5" />
              מוכן לחידון? ({category._count.questions} שאלות)
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
