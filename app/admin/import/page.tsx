"use client";
import { useRef, useState } from "react";
import Papa from "papaparse";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Download, CheckCircle, XCircle } from "lucide-react";

type ImportType = "grades" | "inserts";

const ARRAY_FIELDS: Record<ImportType, string[]> = {
  grades: ["advantages", "disadvantages", "isoMaterials", "conditions", "applications"],
  inserts: ["advantages", "disadvantages", "materials", "conditions"],
};

const GRADE_TEMPLATE = `code,substrate,coatingType,description,isoMaterials,applications,conditions,advantages,disadvantages,vcMin,vcMax
IC908,Carbide,CVD,General purpose turning,P;M,Turning;Milling,Stable;Unstable,Wear resistant,Brittle,100,300
IC907,Carbide,PVD,Finishing steel,P,Turning,Stable,Long tool life,Sensitive to vibration,150,400`;

const INSERT_TEMPLATE = `code,application,geometry,gradeId,materials,conditions,advantages,disadvantages
APMT1135PDER,Milling,Positive rake 35deg corner,IC908,P20;Stainless,Stable;High feed,Low cutting forces,Not for interrupted cuts`;

function downloadCsv(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function ImportPage() {
  const [tab, setTab] = useState<ImportType>("grades");
  const [preview, setPreview] = useState<Record<string, string>[]>([]);
  const [result, setResult] = useState<{ ok?: number; error?: string } | null>(null);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const parseArrays = (rows: Record<string, string>[], type: ImportType): Record<string, unknown>[] =>
    rows.map((row) => {
      const out: Record<string, unknown> = { ...row };
      ARRAY_FIELDS[type].forEach((f) => {
        out[f] = row[f] ? row[f].split(";").map((s) => s.trim()).filter(Boolean) : [];
      });
      if (type === "grades") {
        out.vcMin = row.vcMin ? parseFloat(row.vcMin) : null;
        out.vcMax = row.vcMax ? parseFloat(row.vcMax) : null;
        out.coatingType = row.coatingType === "none" ? null : row.coatingType || null;
      }
      return out;
    });

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setResult(null);
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => setPreview(res.data),
    });
    e.target.value = "";
  };

  const doImport = async () => {
    if (!preview.length) return;
    setImporting(true);
    try {
      const rows = parseArrays(preview, tab);
      const res = await fetch("/api/import", {
        method: "POST",
        body: JSON.stringify({ type: tab, rows }),
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (res.ok) setResult({ ok: data.imported });
      else setResult({ error: data.error || "שגיאה בייבוא" });
    } catch {
      setResult({ error: "שגיאת רשת" });
    }
    setImporting(false);
    setPreview([]);
  };

  const cols = preview.length ? Object.keys(preview[0]) : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">ייבוא CSV</h1>
        <p className="text-muted-foreground mt-1">ייבא גריידים או שימות בכמות מקובץ Excel/CSV</p>
      </div>

      <Tabs value={tab} onValueChange={(v) => { setTab(v as ImportType); setPreview([]); setResult(null); }}>
        <TabsList>
          <TabsTrigger value="grades">גריידים</TabsTrigger>
          <TabsTrigger value="inserts">שימות</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="space-y-4 mt-4">
          <Card>
            <CardContent className="pt-4 space-y-3">
              <p className="text-sm text-muted-foreground">
                ערכים מרובים בשדות מערך יש להפריד ב-<code className="bg-muted px-1 rounded">;</code>
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => downloadCsv(tab === "grades" ? GRADE_TEMPLATE : INSERT_TEMPLATE, `${tab}-template.csv`)}>
                  <Download className="h-4 w-4 ml-1" />הורד תבנית CSV
                </Button>
                <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                  <Upload className="h-4 w-4 ml-1" />בחר קובץ CSV
                </Button>
                <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={onFile} />
              </div>
            </CardContent>
          </Card>

          {result && (
            <Alert variant={result.error ? "destructive" : "default"}>
              <AlertDescription className="flex items-center gap-2">
                {result.error ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                {result.error ?? `יובאו בהצלחה ${result.ok} רשומות`}
              </AlertDescription>
            </Alert>
          )}

          {preview.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{preview.length} שורות זוהו — תצוגה מקדימה:</p>
                <Badge variant="secondary">{tab}</Badge>
              </div>
              <div className="overflow-auto border rounded-md max-h-64">
                <table className="text-xs w-full">
                  <thead className="bg-muted sticky top-0">
                    <tr>{cols.map((c) => <th key={c} className="px-2 py-1 text-right font-medium">{c}</th>)}</tr>
                  </thead>
                  <tbody>
                    {preview.slice(0, 10).map((row, i) => (
                      <tr key={i} className="border-t">
                        {cols.map((c) => <td key={c} className="px-2 py-1 max-w-32 truncate">{row[c]}</td>)}
                      </tr>
                    ))}
                    {preview.length > 10 && (
                      <tr><td colSpan={cols.length} className="px-2 py-1 text-muted-foreground text-center">...ועוד {preview.length - 10} שורות</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <Button onClick={doImport} disabled={importing}>
                {importing ? "מייבא..." : `ייבא ${preview.length} רשומות`}
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
