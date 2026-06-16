"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { InsertForm, InsertData } from "@/components/InsertForm";
import { Pencil, Trash2, Plus } from "lucide-react";

interface InsertRow extends InsertData {
  id: string;
  grade: { code: string };
}

export default function InsertsPage() {
  const [inserts, setInserts] = useState<InsertRow[]>([]);
  const [grades, setGrades] = useState<{ id: string; code: string }[]>([]);
  const [dialog, setDialog] = useState<"new" | InsertRow | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [insertsRes, gradesRes] = await Promise.all([
      fetch("/api/inserts"),
      fetch("/api/grades"),
    ]);
    setInserts(await insertsRes.json());
    setGrades(await gradesRes.json());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const save = async (data: InsertData) => {
    if (data.id) {
      await fetch(`/api/inserts/${data.id}`, { method: "PUT", body: JSON.stringify(data), headers: { "Content-Type": "application/json" } });
    } else {
      await fetch("/api/inserts", { method: "POST", body: JSON.stringify(data), headers: { "Content-Type": "application/json" } });
    }
    setDialog(null);
    load();
  };

  const del = async (id: string) => {
    if (!confirm("למחוק שימה זו?")) return;
    await fetch(`/api/inserts/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">שימות</h1>
        <Button onClick={() => setDialog("new")}><Plus className="h-4 w-4 ml-1" />שימה חדשה</Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground">טוען...</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>קוד שימה</TableHead>
              <TableHead>אפליקציה</TableHead>
              <TableHead>גרייד</TableHead>
              <TableHead>גיאומטריה</TableHead>
              <TableHead>חומרים</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inserts.map((ins) => (
              <TableRow key={ins.id}>
                <TableCell className="font-mono font-medium">{ins.code}</TableCell>
                <TableCell><Badge>{ins.application}</Badge></TableCell>
                <TableCell className="font-mono text-sm">{ins.grade?.code}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{ins.geometry || "—"}</TableCell>
                <TableCell>
                  <div className="flex gap-1 flex-wrap">
                    {ins.materials?.slice(0, 3).map((m) => <Badge key={m} variant="outline" className="text-xs">{m}</Badge>)}
                    {(ins.materials?.length ?? 0) > 3 && <Badge variant="outline" className="text-xs">+{ins.materials.length - 3}</Badge>}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setDialog(ins)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => del(ins.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={!!dialog} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{dialog === "new" ? "שימה חדשה" : "עריכת שימה"}</DialogTitle>
          </DialogHeader>
          {dialog && (
            <InsertForm
              initial={dialog === "new" ? undefined : dialog as InsertData}
              grades={grades}
              onSave={save}
              onCancel={() => setDialog(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
