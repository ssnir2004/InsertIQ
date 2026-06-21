export const dynamic = "force-dynamic";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, HelpCircle } from "lucide-react";
import prisma from "@/lib/prisma";

export default async function TriviaPage() {
  const categories = await prisma.triviaCategory.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { questions: true } } },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">שאלון טריוויה</h1>
        <p className="text-muted-foreground mt-1">למד נושא ואז בחן את עצמך בחידון</p>
      </div>

      {categories.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p>אין נושאים עדיין.</p>
          <Link href="/admin/trivia" className="mt-2 inline-block">
            <Button variant="outline" className="mt-3">עבור לניהול והוסף נושאים</Button>
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <Card key={cat.id} className="flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg leading-tight">{cat.name}</CardTitle>
                  <Badge variant="secondary" className="shrink-0">{cat._count.questions} שאלות</Badge>
                </div>
                {cat.description && (
                  <p className="text-sm text-muted-foreground">{cat.description}</p>
                )}
              </CardHeader>
              <CardContent className="flex gap-2 mt-auto pt-0">
                <Link href={`/trivia/study/${cat.id}`} className="flex-1">
                  <Button variant="outline" className="w-full gap-2">
                    <BookOpen className="h-4 w-4" />
                    למד
                  </Button>
                </Link>
                {cat._count.questions > 0 && (
                  <Link href={`/trivia/quiz/${cat.id}`} className="flex-1">
                    <Button className="w-full gap-2">
                      <HelpCircle className="h-4 w-4" />
                      חידון
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
