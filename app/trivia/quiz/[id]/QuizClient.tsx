"use client";
import { useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, XCircle, ArrowRight, RotateCcw, BookOpen } from "lucide-react";

interface Question {
  id: string;
  question: string;
  options: string[];
  answer: number;
  explanation?: string | null;
}

interface Category {
  id: string;
  name: string;
  questions: Question[];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function QuizClient({ category }: { category: Category }) {
  const [questions] = useState(() => shuffle(category.questions));
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [wrongAnswers, setWrongAnswers] = useState<Question[]>([]);

  const q = questions[current];
  const isCorrect = selected === q?.answer;
  const progress = ((current + (selected !== null ? 1 : 0)) / questions.length) * 100;

  const choose = useCallback((i: number) => {
    if (selected !== null) return;
    setSelected(i);
    if (i === q.answer) {
      setScore((s) => s + 1);
    } else {
      setWrongAnswers((prev) => [...prev, q]);
    }
  }, [selected, q]);

  const next = useCallback(() => {
    if (current + 1 >= questions.length) {
      setDone(true);
    } else {
      setCurrent((c) => c + 1);
      setSelected(null);
    }
  }, [current, questions.length]);

  const restart = useCallback(() => {
    setCurrent(0);
    setSelected(null);
    setScore(0);
    setDone(false);
    setWrongAnswers([]);
  }, []);

  if (done) {
    const pct = Math.round((score / questions.length) * 100);
    const passed = pct >= 70;
    return (
      <div className="max-w-lg mx-auto space-y-6 text-center">
        <div className={`text-6xl font-bold ${passed ? "text-green-500" : "text-orange-500"}`}>
          {pct}%
        </div>
        <div>
          <p className="text-xl font-semibold">{passed ? "כל הכבוד!" : "נסה שוב!"}</p>
          <p className="text-muted-foreground mt-1">
            {score} מתוך {questions.length} נכון
          </p>
        </div>

        {wrongAnswers.length > 0 && (
          <div className="text-right space-y-2">
            <p className="text-sm font-medium text-destructive">שאלות שטעית בהן:</p>
            {wrongAnswers.map((wq) => (
              <Card key={wq.id}>
                <CardContent className="pt-3 pb-3 space-y-1">
                  <p className="text-sm font-medium">{wq.question}</p>
                  <p className="text-xs text-green-600">תשובה נכונה: {wq.options[wq.answer]}</p>
                  {wq.explanation && <p className="text-xs text-muted-foreground">{wq.explanation}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="flex gap-3 justify-center flex-wrap">
          <Button onClick={restart} variant="outline" className="gap-2">
            <RotateCcw className="h-4 w-4" />
            נסה שוב
          </Button>
          <Link href={`/trivia/study/${category.id}`}>
            <Button variant="outline" className="gap-2">
              <BookOpen className="h-4 w-4" />
              חזור ללימוד
            </Button>
          </Link>
          <Link href="/trivia">
            <Button className="gap-2">
              <ArrowRight className="h-4 w-4" />
              כל הנושאים
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">{category.name}</h1>
          <p className="text-sm text-muted-foreground">
            שאלה {current + 1} מתוך {questions.length}
          </p>
        </div>
        <Badge variant={score > 0 ? "default" : "secondary"}>
          {score} נקודות
        </Badge>
      </div>

      <Progress value={progress} className="h-2" />

      <Card>
        <CardContent className="pt-6 pb-4">
          <p className="text-lg font-medium leading-relaxed">{q.question}</p>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {q.options.map((opt, i) => {
          let variant: "default" | "outline" | "secondary" = "outline";
          let icon = null;
          if (selected !== null) {
            if (i === q.answer) {
              variant = "default";
              icon = <CheckCircle2 className="h-4 w-4 text-green-400" />;
            } else if (i === selected) {
              icon = <XCircle className="h-4 w-4 text-destructive" />;
            }
          }
          return (
            <button
              key={i}
              onClick={() => choose(i)}
              disabled={selected !== null}
              className={`w-full text-right p-3 rounded-lg border transition-all flex items-center gap-3
                ${selected === null ? "hover:bg-muted cursor-pointer" : "cursor-default"}
                ${selected !== null && i === q.answer ? "bg-green-50 border-green-400 dark:bg-green-950" : ""}
                ${selected !== null && i === selected && i !== q.answer ? "bg-red-50 border-red-300 dark:bg-red-950" : ""}
                ${selected === null ? "bg-background" : ""}
              `}
            >
              <span className="text-muted-foreground text-sm w-6 shrink-0 text-center font-mono">
                {String.fromCharCode(65 + i)}.
              </span>
              <span className="flex-1 text-sm">{opt}</span>
              {icon}
            </button>
          );
        })}
      </div>

      {selected !== null && (
        <div className="space-y-3">
          <div className={`p-3 rounded-lg text-sm ${isCorrect ? "bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-300" : "bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-300"}`}>
            {isCorrect ? "נכון!" : `טעות. התשובה הנכונה: ${q.options[q.answer]}`}
            {q.explanation && <p className="mt-1 text-xs opacity-80">{q.explanation}</p>}
          </div>
          <Button onClick={next} className="w-full gap-2">
            {current + 1 < questions.length ? "השאלה הבאה" : "סיים חידון"}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
