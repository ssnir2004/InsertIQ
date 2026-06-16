export const dynamic = "force-dynamic";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import prisma from "@/lib/prisma";

async function getStats() {
  try {
    const [grades, inserts, quizResults] = await Promise.all([
      prisma.grade.count(),
      prisma.insert.count(),
      prisma.quizResult.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
    ]);
    return { grades, inserts, quizResults };
  } catch {
    return { grades: 0, inserts: 0, quizResults: [] as { id: string; score: number; total: number; mode: string }[] };
  }
}

export default async function Home() {
  const { grades, inserts, quizResults } = await getStats();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">InsertIQ</h1>
        <p className="text-muted-foreground mt-1">למד את מוצרי Iscar — גריידים, שימות והתאמה לאפליקציה</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">גריידים</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{grades}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">שימות</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{inserts}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">חידונים</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{quizResults.length > 0 ? quizResults.length : "—"}</p></CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">ניהול נתונים</h2>
        <div className="grid sm:grid-cols-3 gap-3">
          {[
            { href: "/admin/grades", title: "גריידים", desc: "הוסף, ערוך, מחק גריידים" },
            { href: "/admin/inserts", title: "שימות", desc: "הוסף, ערוך, מחק שימות" },
            { href: "/admin/import", title: "ייבוא CSV", desc: "ייבא נתונים בכמות מ-Excel/CSV" },
          ].map((item) => (
            <Link key={item.href} href={item.href}>
              <Card className="hover:border-primary transition-colors cursor-pointer h-full">
                <CardContent className="pt-4">
                  <p className="font-medium">{item.title}</p>
                  <p className="text-sm text-muted-foreground mt-1">{item.desc}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">מצבי למידה</h2>
        <div className="grid sm:grid-cols-3 gap-3">
          {[
            { href: "/learn/quiz", title: "חידון תרחיש", desc: "קבל תרחיש עיבוד → בחר גרייד מתאים" },
            { href: "/learn/flashcards", title: "כרטיסיות", desc: "ראה קוד גרייד → נחש תכונות" },
            { href: "/learn/match", title: "התאמה הפוכה", desc: "חומר + תנאים → בחר אפליקציה וגרייד" },
          ].map((item) => (
            <Link key={item.href} href={item.href}>
              <Card className="hover:border-primary transition-colors cursor-pointer h-full">
                <CardContent className="pt-4">
                  <p className="font-medium">{item.title}</p>
                  <p className="text-sm text-muted-foreground mt-1">{item.desc}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {quizResults.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">תוצאות אחרונות</h2>
          <div className="flex gap-2 flex-wrap">
            {quizResults.map((r) => (
              <Badge key={r.id} variant={r.score / r.total >= 0.7 ? "default" : "secondary"}>
                {r.mode}: {r.score}/{r.total}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
