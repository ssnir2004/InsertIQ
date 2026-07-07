export const dynamic = "force-dynamic";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import prisma from "@/lib/prisma";

async function getCategories() {
  try {
    return await prisma.triviaCategory.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { questions: true } } },
    });
  } catch {
    return [];
  }
}

export default async function Home() {
  const categories = await getCategories();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">InsertIQ</h1>
          <p className="text-muted-foreground mt-1">טריוויה לפי נושאים — שאלות שנוצרו באמצעות AI</p>
        </div>
        <Link href="/admin/trivia">
          <Button variant="outline">ניהול וייצור שאלות</Button>
        </Link>
      </div>

      {categories.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg mb-4">אין נושאים עדיין</p>
          <Link href="/admin/trivia">
            <Button>צור נושא ראשון עם AI</Button>
          </Link>
        </div>
      ) : (
        <div>
          <h2 className="text-lg font-semibold mb-3">בחר נושא</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {categories.map((cat) => (
              <Link key={cat.id} href={`/trivia/study/${cat.id}`}>
                <Card className="hover:border-primary transition-colors cursor-pointer h-full">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium">{cat.name}</p>
                      <Badge variant="secondary" className="text-xs shrink-0">
                        {cat._count.questions} שאלות
                      </Badge>
                    </div>
                    {cat.description && (
                      <p className="text-sm text-muted-foreground mt-1">{cat.description}</p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
