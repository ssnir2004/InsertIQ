"use client";
import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, XCircle, RefreshCw } from "lucide-react";

interface Grade {
  id: string; code: string; substrate: string; coatingType: string;
  isoMaterials: string[]; applications: string[]; conditions: string[];
  advantages: string[]; disadvantages: string[]; description: string;
}

interface QuizData {
  grade: Grade;
  choices: { id: string; code: string }[];
}

const TOTAL = 8;

export default function MatchPage() {
  const [data, setData] = useState<QuizData | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(0);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setSelected(null);
    setError("");
    try {
      const res = await fetch("/api/quiz?mode=match");
      if (!res.ok) { setError("הוסף לפחות 2 גריידים."); setLoading(false); return; }
      setData(await res.json());
    } catch { setError("שגיאת רשת"); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const choose = (id: string) => {
    if (selected) return;
    setSelected(id);
    if (id === data?.grade.id) setScore((s) => s + 1);
  };

  const next = () => {
    const nextRound = round + 1;
    if (nextRound >= TOTAL) { setDone(true); return; }
    setRound(nextRound);
    load();
  };

  const restart = () => { setScore(0); setRound(0); setDone(false); load(); };

  if (done) {
    const pct = Math.round((score / TOTAL) * 100);
    return (
      <div className="max-w-md mx-auto text-center space-y-6 mt-16">
        <div className="text-6xl">{pct >= 70 ? "🏆" : "💪"}</div>
        <h1 className="text-3xl font-bold">{score}/{TOTAL}</h1>
        <Progress value={pct} className="h-3" />
        <p className="text-muted-foreground">
          {pct >= 70 ? "כל הכבוד! התאמת חומר וגרייד בצורה מצוינת." : "טיפ: שים לב לחומרי ISO ולתנאי העבודה."}
        </p>
        <Button onClick={restart}><RefreshCw className="h-4 w-4 ml-1" />שחק שוב</Button>
      </div>
    );
  }

  if (error) return <div className="text-center mt-16 text-muted-foreground">{error}</div>;
  if (loading || !data) return <div className="text-center mt-16 text-muted-foreground">טוען...</div>;

  const g = data.grade;
  const isCorrect = selected === g.id;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">התאמה הפוכה</h1>
        <span className="text-sm text-muted-foreground">{round + 1} / {TOTAL}</span>
      </div>
      <Progress value={((round) / TOTAL) * 100} className="h-2" />

      <Card>
        <CardHeader><CardTitle className="text-base">בהינתן החומר והתנאים — איזה גרייד מתאים?</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            {g.isoMaterials.length > 0 && (
              <div>
                <span className="text-muted-foreground">חומר ISO:</span>
                <div className="flex gap-1 flex-wrap mt-1">
                  {g.isoMaterials.map((m) => <Badge key={m} variant="outline">{m}</Badge>)}
                </div>
              </div>
            )}
            {g.conditions.length > 0 && (
              <div>
                <span className="text-muted-foreground">תנאי עבודה:</span>
                <div className="flex gap-1 flex-wrap mt-1">
                  {g.conditions.map((c) => <Badge key={c} variant="secondary">{c}</Badge>)}
                </div>
              </div>
            )}
            {g.applications.length > 0 && (
              <div className="col-span-2">
                <span className="text-muted-foreground">אפליקציה:</span>{" "}
                <span className="font-medium">{g.applications.join(", ")}</span>
              </div>
            )}
          </div>
          {g.substrate && (
            <p className="text-sm text-muted-foreground">סאבסטרט: {g.substrate} · ציפוי: {g.coatingType || "ללא"}</p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        {data.choices.map((c) => {
          const isSelected = selected === c.id;
          const isAnswer = c.id === g.id;
          const variant = !selected ? "outline" : isAnswer ? "default" : isSelected ? "destructive" : "outline";
          return (
            <Button
              key={c.id}
              variant={variant as "outline" | "default" | "destructive"}
              className="h-14 text-lg font-mono"
              onClick={() => choose(c.id)}
              disabled={!!selected && !isAnswer && !isSelected}
            >
              {c.code}
              {selected && isAnswer && <CheckCircle className="h-4 w-4 mr-2" />}
              {selected && isSelected && !isAnswer && <XCircle className="h-4 w-4 mr-2" />}
            </Button>
          );
        })}
      </div>

      {selected && (
        <Card className={isCorrect ? "border-green-500" : "border-destructive"}>
          <CardContent className="pt-4 space-y-2">
            <p className="font-semibold">{isCorrect ? "✓ נכון!" : `✗ הגרייד הנכון: ${g.code}`}</p>
            {g.description && <p className="text-sm">{g.description}</p>}
            <Button className="mt-2" onClick={next}>
              {round + 1 >= TOTAL ? "סיים" : "הבא →"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
