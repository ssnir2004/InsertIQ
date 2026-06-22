"use client";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pencil, Trash2, Plus, ChevronDown, ChevronUp, Sparkles, Upload, Link } from "lucide-react";

interface Category {
  id: string;
  name: string;
  description?: string;
  content?: string;
  _count?: { questions: number };
}

interface Question {
  id: string;
  categoryId: string;
  question: string;
  options: string[];
  answer: number;
  explanation?: string;
}

function CategoryForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Partial<Category>;
  onSave: (data: Omit<Category, "id" | "_count">) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [content, setContent] = useState(initial?.content ?? "");

  return (
    <div className="space-y-4">
      <div>
        <Label>שם הנושא</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="לדוגמה: Ceramic Grades" />
      </div>
      <div>
        <Label>תיאור קצר</Label>
        <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="תיאור קצר של הנושא" />
      </div>
      <div>
        <Label>תוכן לימוד (Markdown)</Label>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="הכנס כאן את חומר הלימוד..."
          className="min-h-[300px] font-mono text-sm"
        />
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onCancel}>ביטול</Button>
        <Button onClick={() => onSave({ name, description, content })} disabled={!name.trim()}>שמור</Button>
      </div>
    </div>
  );
}

function QuestionForm({
  initial,
  categoryId,
  onSave,
  onCancel,
}: {
  initial?: Partial<Question>;
  categoryId: string;
  onSave: (data: Omit<Question, "id">) => void;
  onCancel: () => void;
}) {
  const [question, setQuestion] = useState(initial?.question ?? "");
  const [options, setOptions] = useState<string[]>(initial?.options ?? ["", "", "", ""]);
  const [answer, setAnswer] = useState<number>(initial?.answer ?? 0);
  const [explanation, setExplanation] = useState(initial?.explanation ?? "");

  const setOption = (i: number, val: string) => {
    const next = [...options];
    next[i] = val;
    setOptions(next);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>שאלה</Label>
        <Textarea value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="הכנס שאלה..." className="min-h-[80px]" />
      </div>
      <div className="space-y-2">
        <Label>אפשרויות (סמן את התשובה הנכונה)</Label>
        {options.map((opt, i) => (
          <div key={i} className="flex gap-2 items-center">
            <input
              type="radio"
              name="answer"
              checked={answer === i}
              onChange={() => setAnswer(i)}
              className="cursor-pointer"
            />
            <Input
              value={opt}
              onChange={(e) => setOption(i, e.target.value)}
              placeholder={`אפשרות ${i + 1}`}
              className={answer === i ? "border-green-500" : ""}
            />
          </div>
        ))}
      </div>
      <div>
        <Label>הסבר (אופציונלי)</Label>
        <Textarea value={explanation} onChange={(e) => setExplanation(e.target.value)} placeholder="הסבר לתשובה הנכונה..." className="min-h-[60px]" />
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onCancel}>ביטול</Button>
        <Button
          onClick={() => onSave({ categoryId, question, options, answer, explanation })}
          disabled={!question.trim() || options.some((o) => !o.trim())}
        >
          שמור
        </Button>
      </div>
    </div>
  );
}

export default function TriviaAdminPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [questions, setQuestions] = useState<Record<string, Question[]>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [catDialog, setCatDialog] = useState<"new" | Category | null>(null);
  const [qDialog, setQDialog] = useState<{ categoryId: string; question?: Question } | null>(null);
  const [loading, setLoading] = useState(true);

  // AI generation state
  const [aiDialog, setAiDialog] = useState(false);
  const [genInputMode, setGenInputMode] = useState<"file" | "url">("file");
  const [genFile, setGenFile] = useState<File | null>(null);
  const [genUrl, setGenUrl] = useState("");
  const [genCategoryMode, setGenCategoryMode] = useState<"existing" | "new">("existing");
  const [genCategoryId, setGenCategoryId] = useState("");
  const [genNewName, setGenNewName] = useState("");
  const [genCount, setGenCount] = useState(10);
  const [generating, setGenerating] = useState(false);
  const [genResult, setGenResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [reviewQuestions, setReviewQuestions] = useState<Question[] | null>(null);
  const [reviewCategoryId, setReviewCategoryId] = useState<string>("");
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadCategories = async () => {
    const res = await fetch("/api/trivia/categories");
    setCategories(await res.json());
    setLoading(false);
  };

  const loadQuestions = async (categoryId: string) => {
    const res = await fetch(`/api/trivia/questions?categoryId=${categoryId}`);
    const qs = await res.json();
    setQuestions((prev) => ({ ...prev, [categoryId]: qs }));
  };

  useEffect(() => { loadCategories(); }, []);

  const toggleExpand = (id: string) => {
    if (expanded === id) {
      setExpanded(null);
    } else {
      setExpanded(id);
      if (!questions[id]) loadQuestions(id);
    }
  };

  const saveCat = async (data: Omit<Category, "id" | "_count">) => {
    if (catDialog && catDialog !== "new") {
      await fetch(`/api/trivia/categories/${(catDialog as Category).id}`, {
        method: "PUT",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });
    } else {
      await fetch("/api/trivia/categories", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });
    }
    setCatDialog(null);
    loadCategories();
  };

  const delCat = async (id: string) => {
    if (!confirm("למחוק נושא זה וכל שאלותיו?")) return;
    await fetch(`/api/trivia/categories/${id}`, { method: "DELETE" });
    loadCategories();
  };

  const saveQ = async (data: Omit<Question, "id">) => {
    if (qDialog?.question) {
      await fetch(`/api/trivia/questions/${qDialog.question.id}`, {
        method: "PUT",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });
    } else {
      await fetch("/api/trivia/questions", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });
    }
    const catId = data.categoryId;
    setQDialog(null);
    loadQuestions(catId);
    loadCategories();
  };

  const delQ = async (id: string, categoryId: string) => {
    if (!confirm("למחוק שאלה זו?")) return;
    await fetch(`/api/trivia/questions/${id}`, { method: "DELETE" });
    loadQuestions(categoryId);
    loadCategories();
  };

  const deleteReviewQuestion = async (id: string) => {
    await fetch(`/api/trivia/questions/${id}`, { method: "DELETE" });
    setReviewQuestions((prev) => prev?.filter((q) => q.id !== id) ?? null);
    loadCategories();
  };

  const saveReviewQuestion = async (data: Omit<Question, "id">) => {
    if (!editingReviewId) return;
    await fetch(`/api/trivia/questions/${editingReviewId}`, {
      method: "PUT",
      body: JSON.stringify(data),
      headers: { "Content-Type": "application/json" },
    });
    setReviewQuestions((prev) =>
      prev?.map((q) => (q.id === editingReviewId ? { ...q, ...data } : q)) ?? null
    );
    setEditingReviewId(null);
    if (expanded === reviewCategoryId) loadQuestions(reviewCategoryId);
  };

  const openAiDialog = () => {
    setGenFile(null);
    setGenUrl("");
    setGenInputMode("file");
    setGenCategoryMode("existing");
    setGenCategoryId(categories[0]?.id ?? "");
    setGenNewName("");
    setGenCount(10);
    setGenResult(null);
    setReviewQuestions(null);
    setReviewCategoryId("");
    setEditingReviewId(null);
    setAiDialog(true);
  };

  const generateWithAI = async () => {
    setGenerating(true);
    setGenResult(null);
    const fd = new FormData();
    if (genInputMode === "file" && genFile) {
      fd.append("file", genFile);
    } else if (genInputMode === "url" && genUrl.trim()) {
      fd.append("url", genUrl.trim());
    } else return;
    fd.append("questionCount", String(genCount));
    if (genCategoryMode === "existing") {
      fd.append("categoryId", genCategoryId);
    } else {
      fd.append("newCategoryName", genNewName.trim());
    }
    const res = await fetch("/api/trivia/generate", { method: "POST", body: fd });
    const data = await res.json();
    if (res.ok) {
      const catId = data.categoryId;
      setGenResult({ ok: true, message: `✓ נוצרו ${data.count} שאלות — בדוק וערוך לפי הצורך` });
      loadCategories();
      if (expanded === catId) loadQuestions(catId);
      // Load questions for review
      const qRes = await fetch(`/api/trivia/questions?categoryId=${catId}`);
      const allQs: Question[] = await qRes.json();
      // Show only the newly generated ones (last data.count)
      setReviewQuestions(allQs.slice(-data.count));
      setReviewCategoryId(catId);
    } else {
      setGenResult({ ok: false, message: `שגיאה: ${data.error}` });
    }
    setGenerating(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">ניהול טריוויה</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={openAiDialog}>
            <Sparkles className="h-4 w-4 ml-1 text-purple-500" />ייצור עם AI
          </Button>
          <Button onClick={() => setCatDialog("new")}><Plus className="h-4 w-4 ml-1" />נושא חדש</Button>
        </div>
      </div>

      {loading ? (
        <p className="text-muted-foreground">טוען...</p>
      ) : categories.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">אין נושאים עדיין. לחץ "נושא חדש" להתחיל.</p>
      ) : (
        <div className="space-y-3">
          {categories.map((cat) => (
            <Card key={cat.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button onClick={() => toggleExpand(cat.id)} className="flex items-center gap-2 text-left">
                      {expanded === cat.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      <CardTitle className="text-lg">{cat.name}</CardTitle>
                    </button>
                    <Badge variant="secondary">{cat._count?.questions ?? 0} שאלות</Badge>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setCatDialog(cat)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => delCat(cat.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </div>
                {cat.description && <p className="text-sm text-muted-foreground mr-6">{cat.description}</p>}
              </CardHeader>

              {expanded === cat.id && (
                <CardContent className="pt-0">
                  <div className="border-t pt-3 space-y-2">
                    <div className="flex justify-end">
                      <Button size="sm" variant="outline" onClick={() => setQDialog({ categoryId: cat.id })}>
                        <Plus className="h-3 w-3 ml-1" />שאלה חדשה
                      </Button>
                    </div>
                    {(questions[cat.id] ?? []).length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">אין שאלות עדיין</p>
                    ) : (
                      <div className="space-y-2">
                        {(questions[cat.id] ?? []).map((q, idx) => (
                          <div key={q.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                            <span className="text-sm text-muted-foreground w-6 shrink-0">{idx + 1}.</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium">{q.question}</p>
                              <div className="mt-1 flex flex-wrap gap-1">
                                {q.options.map((opt, i) => (
                                  <span
                                    key={i}
                                    className={`text-xs px-2 py-0.5 rounded-full ${i === q.answer ? "bg-green-100 text-green-800 font-medium" : "bg-muted text-muted-foreground"}`}
                                  >
                                    {opt}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div className="flex gap-1 shrink-0">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setQDialog({ categoryId: cat.id, question: q })}>
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => delQ(q.id, cat.id)}>
                                <Trash2 className="h-3 w-3 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!catDialog} onOpenChange={(o) => !o && setCatDialog(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{catDialog === "new" ? "נושא חדש" : "עריכת נושא"}</DialogTitle>
          </DialogHeader>
          {catDialog && (
            <CategoryForm
              initial={catDialog === "new" ? undefined : (catDialog as Category)}
              onSave={saveCat}
              onCancel={() => setCatDialog(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!qDialog} onOpenChange={(o) => !o && setQDialog(null)}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{qDialog?.question ? "עריכת שאלה" : "שאלה חדשה"}</DialogTitle>
          </DialogHeader>
          {qDialog && (
            <QuestionForm
              initial={qDialog.question}
              categoryId={qDialog.categoryId}
              onSave={saveQ}
              onCancel={() => setQDialog(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* AI Generation Dialog */}
      <Dialog open={aiDialog} onOpenChange={(o) => !o && setAiDialog(false)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              ייצור שאלות טריוויה עם AI
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            {/* Input mode toggle */}
            <div className="flex gap-1 p-1 bg-muted rounded-lg">
              <button
                className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-sm font-medium transition-colors ${genInputMode === "file" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                onClick={() => setGenInputMode("file")}
              >
                <Upload className="h-4 w-4" /> קובץ
              </button>
              <button
                className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-sm font-medium transition-colors ${genInputMode === "url" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                onClick={() => setGenInputMode("url")}
              >
                <Link className="h-4 w-4" /> קישור
              </button>
            </div>

            {/* File upload */}
            {genInputMode === "file" && (
              <div>
                <Label>קובץ מצגת (PDF או PPTX)</Label>
                <div
                  className="mt-1 border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  {genFile ? (
                    <p className="text-sm font-medium text-primary">{genFile.name}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">לחץ לבחירת קובץ PDF או PPTX</p>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.pptx,.ppt"
                    className="hidden"
                    onChange={(e) => setGenFile(e.target.files?.[0] ?? null)}
                  />
                </div>
              </div>
            )}

            {/* URL input */}
            {genInputMode === "url" && (
              <div>
                <Label>קישור לדף אינטרנט</Label>
                <Input
                  className="mt-1"
                  placeholder="https://..."
                  value={genUrl}
                  onChange={(e) => setGenUrl(e.target.value)}
                  dir="ltr"
                />
                <p className="text-xs text-muted-foreground mt-1">הקישור יאוחזר ויחולץ ממנו טקסט לצורך יצירת שאלות</p>
              </div>
            )}

            {/* Category */}
            <div>
              <Label>נושא</Label>
              <div className="flex gap-2 mt-1">
                <Button
                  size="sm"
                  variant={genCategoryMode === "existing" ? "default" : "outline"}
                  onClick={() => setGenCategoryMode("existing")}
                  disabled={categories.length === 0}
                >
                  קיים
                </Button>
                <Button
                  size="sm"
                  variant={genCategoryMode === "new" ? "default" : "outline"}
                  onClick={() => setGenCategoryMode("new")}
                >
                  חדש
                </Button>
              </div>
              {genCategoryMode === "existing" ? (
                <select
                  className="mt-2 w-full border rounded-md px-3 py-2 text-sm bg-background"
                  value={genCategoryId}
                  onChange={(e) => setGenCategoryId(e.target.value)}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              ) : (
                <Input
                  className="mt-2"
                  placeholder="שם הנושא החדש"
                  value={genNewName}
                  onChange={(e) => setGenNewName(e.target.value)}
                />
              )}
            </div>

            {/* Question count */}
            <div>
              <Label>מספר שאלות: <span className="font-bold text-primary">{genCount}</span></Label>
              <input
                type="range"
                min={5}
                max={30}
                step={5}
                value={genCount}
                onChange={(e) => setGenCount(parseInt(e.target.value))}
                className="w-full mt-1"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>5</span><span>10</span><span>15</span><span>20</span><span>25</span><span>30</span>
              </div>
            </div>

            {/* Result */}
            {genResult && (
              <p className={`text-sm font-medium rounded-md px-3 py-2 ${genResult.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                {genResult.message}
              </p>
            )}

            {/* Review Questions */}
            {reviewQuestions && reviewQuestions.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-semibold">סקירת שאלות ({reviewQuestions.length})</Label>
                <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                  {reviewQuestions.map((q, idx) => (
                    <div key={q.id} className="border rounded-lg p-3 space-y-2 bg-muted/30">
                      {editingReviewId === q.id ? (
                        <QuestionForm
                          initial={q}
                          categoryId={reviewCategoryId}
                          onSave={saveReviewQuestion}
                          onCancel={() => setEditingReviewId(null)}
                        />
                      ) : (
                        <>
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium flex-1">{idx + 1}. {q.question}</p>
                            <div className="flex gap-1 shrink-0">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingReviewId(q.id)}>
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteReviewQuestion(q.id)}>
                                <Trash2 className="h-3 w-3 text-destructive" />
                              </Button>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {q.options.map((opt, i) => (
                              <span key={i} className={`text-xs px-2 py-0.5 rounded-full ${i === q.answer ? "bg-green-100 text-green-800 font-medium" : "bg-muted text-muted-foreground"}`}>
                                {opt}
                              </span>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setAiDialog(false)}>סגור</Button>
              <Button
                onClick={generateWithAI}
                disabled={
                  generating ||
                  (genInputMode === "file" && !genFile) ||
                  (genInputMode === "url" && !genUrl.trim()) ||
                  (genCategoryMode === "existing" && !genCategoryId) ||
                  (genCategoryMode === "new" && !genNewName.trim())
                }
              >
                {generating ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    מייצר שאלות...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    ייצר שאלות
                  </span>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
