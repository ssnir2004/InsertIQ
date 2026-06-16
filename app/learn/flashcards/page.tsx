"use client";
import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RefreshCw, RotateCcw } from "lucide-react";

interface Grade {
  id: string; code: string; substrate: string; coatingType: string;
  isoMaterials: string[]; applications: string[]; conditions: string[];
  advantages: string[]; disadvantages: string[]; description: string;
  vcMin?: number; vcMax?: number;
}

export default function FlashcardsPage() {
  const [grade, setGrade] = useState<Grade | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setFlipped(false);
    setError("");
    try {
      const res = await fetch("/api/quiz?mode=flashcard");
      if (!res.ok) { setError("הוסף לפחות גרייד אחד."); setLoading(false); return; }
      const data = await res.json();
      setGrade(data.grade);
      setCount((c) => c + 1);
    } catch { setError("שגיאת רשת"); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (error) return <div className="text-center mt-16 text-muted-foreground">{error}</div>;
  if (loading || !grade) return <div className="text-center mt-16 text-muted-foreground">טוען...</div>;

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">כרטיסיות</h1>
        <span className="text-sm text-muted-foreground">כרטיסייה #{count}</span>
      </div>

      {/* Flashcard */}
      <div
        className="border rounded-xl cursor-pointer select-none transition-all min-h-64 p-8 flex flex-col items-center justify-center text-center gap-4"
        style={{ background: flipped ? "hsl(var(--card))" : "hsl(var(--primary))", color: flipped ? undefined : "hsl(var(--primary-foreground))" }}
        onClick={() => setFlipped((f) => !f)}
      >
        {!flipped ? (
          <>
            <p className="text-4xl font-mono font-bold">{grade.code}</p>
            <p className="text-sm opacity-80">לחץ לראות תכונות</p>
          </>
        ) : (
          <div className="space-y-4 w-full text-right">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-muted-foreground">סאבסטרט:</span> <span className="font-medium">{grade.substrate}</span></div>
              <div><span className="text-muted-foreground">ציפוי:</span> <span className="font-medium">{grade.coatingType || "ללא"}</span></div>
              {grade.vcMin && <div><span className="text-muted-foreground">Vc:</span> <span className="font-medium">{grade.vcMin}–{grade.vcMax} m/min</span></div>}
            </div>
            {grade.description && <p className="text-sm text-muted-foreground">{grade.description}</p>}
            {grade.isoMaterials.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">חומרי ISO:</p>
                <div className="flex gap-1 flex-wrap justify-center">
                  {grade.isoMaterials.map((m) => <Badge key={m} variant="outline">{m}</Badge>)}
                </div>
              </div>
            )}
            {grade.applications.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">אפליקציות:</p>
                <div className="flex gap-1 flex-wrap justify-center">
                  {grade.applications.map((a) => <Badge key={a}>{a}</Badge>)}
                </div>
              </div>
            )}
            {grade.advantages.length > 0 && (
              <div className="text-sm">
                <span className="text-green-600 font-medium">✓ </span>
                {grade.advantages.join(" · ")}
              </div>
            )}
            {grade.disadvantages.length > 0 && (
              <div className="text-sm">
                <span className="text-red-500 font-medium">✗ </span>
                {grade.disadvantages.join(" · ")}
              </div>
            )}
          </div>
        )}
      </div>

      {!flipped && (
        <Progress value={0} className="h-1 opacity-0" />
      )}

      <div className="flex gap-3 justify-center">
        {flipped && (
          <Button variant="outline" onClick={() => setFlipped(false)}>
            <RotateCcw className="h-4 w-4 ml-1" />הפוך חזרה
          </Button>
        )}
        <Button onClick={load}>
          <RefreshCw className="h-4 w-4 ml-1" />כרטיסייה הבאה
        </Button>
      </div>
    </div>
  );
}
