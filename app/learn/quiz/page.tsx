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
  vcMin?: number; vcMax?: number;
}

interface QuizData {
  grade: Grade;
  choices: { id: string; code: string }[];
}

const TOTAL = 10;

export default function QuizPage() {
  const [data, setData] = useState<QuizData | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(0);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadQuestion = useCallback(async () => {
    setLoading(true);
    setSelected(null);
    setError("");
    try {
      const res = await fetch("/api/quiz?mode=scenario");
      if (!res.ok) { setError("אין מספיק נתונים. הוסף לפחות 2 גריידים."); setLoading(false); return; }
      setData(await res.json());
    } catch { setError("שגיאת רשת"); }
    setLoading(false);
  }, []);

  useEffect(() => { loadQuestion(); }, [loadQuestion]);

  const choose = (id: string) => {
    if (selected) return;
    setSelected(id);
    if (id === data?.grade.id) setScore((s) => s + 1);
  };

  const next = async () => {
    const nextRound = round + 1;
    if (nextRound >= TOTAL) {
      await fetch("/api/quiz", { method: "POST", body: JSON.stringify({ score: score + (selected === data?.grade.id ? 0 : 0), total: TOTAL, mode: "scenario" }), headers: { "Content-Type": "application/json" } });
      setDone(true);
    } else {
      setRound(nextRound);
      loadQuestion();
    }
  };

  const restart = () => { setScore(0); setRound(0); setDone(false); loadQuestion(); };

  if (done) {
    const pct = Math.round((score / TOTAL) * 100);
    return (
      <div className="max-w-md mx-auto text-center space-y-6 mt-16">
        <div className="text-6xl">{pct >= 70 ? "🎯" : "📚"}</div>
        <h1 className="text-3xl font-bold">{score}/{TOTAL}</h1>
        <Progress value={pct} className="h-3" />
        <p className="text-muted-foreground">{pct >= 70 ? "מעולה! הלכת על הגריידים נכון." : "המשך להתאמן — הגריידים ייכנסו לך."}</p>
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
        <h1 className="text-xl font-bold">חידון תרחיש</h1>
        <span className="text-sm text-muted-foreground">{round + 1} / {TOTAL}</span>
      </div>
      <Progress value={((round) / TOTAL) * 100} className="h-2" />

      {/* Scenario card */}
      <Card>
        <CardHeader><CardTitle className="text-base">בחר את הגרייד המתאים לתרחיש הבא:</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            {g.applications.length > 0 && (
              <div>
                <span className="text-muted-foreground">אפליקציה:</span>{" "}
                <span className="font-medium">{g.applications.join(", ")}</span>
              </div>
            )}
            {g.isoMaterials.length > 0 && (
              <div>
                <span className="text-muted-foreground">חומר ISO:</span>{" "}
                <span className="font-medium">{g.isoMaterials.join(", ")}</span>
              </div>
            )}
            {g.conditions.length > 0 && (
              <div>
                <span className="text-muted-foreground">תנאים:</span>{" "}
                <span className="font-medium">{g.conditions.join(", ")}</span>
              </div>
            )}
            {g.vcMin && g.vcMax && (
              <div>
                <span className="text-muted-foreground">מהירות חיתוך:</span>{" "}
                <span className="font-medium">{g.vcMin}–{g.vcMax} m/min</span>
              </div>
            )}
          </div>
          {g.advantages.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {g.advantages.map((a) => <Badge key={a} variant="outline" className="text-xs">{a}</Badge>)}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Choices */}
      <div className="grid grid-cols-2 gap-3">
        {data.choices.map((c) => {
          const isSelected = selected === c.id;
          const isAnswer = c.id === g.id;
          const variant = !selected ? "outline"
            : isAnswer ? "default"
            : isSelected ? "destructive"
            : "outline";
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

      {/* Result explanation */}
      {selected && (
        <Card className={isCorrect ? "border-green-500" : "border-destructive"}>
          <CardContent className="pt-4 space-y-2">
            <p className="font-semibold">{isCorrect ? "✓ נכון!" : `✗ לא נכון — התשובה: ${g.code}`}</p>
            <p className="text-sm">{g.description}</p>
            {!isCorrect && g.applications.length > 0 && (
              <p className="text-sm text-muted-foreground">
                גרייד זה מיועד ל: {g.applications.join(", ")} עבור חומרים {g.isoMaterials.join(", ")}
              </p>
            )}
            <Button className="mt-2" onClick={next}>
              {round + 1 >= TOTAL ? "סיים חידון" : "שאלה הבאה →"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
