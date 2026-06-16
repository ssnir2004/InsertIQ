"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { GradeForm, GradeData } from "@/components/GradeForm";
import { Pencil, Trash2, Plus } from "lucide-react";

interface Grade extends GradeData {
  id: string;
  _count?: { inserts: number };
}

function toFormData(g: Grade): GradeData {
  return { ...g, vcMin: g.vcMin?.toString() ?? "", vcMax: g.vcMax?.toString() ?? "" };
}

function toApiData(d: GradeData) {
  return {
    ...d,
    coatingType: d.coatingType === "none" ? null : d.coatingType || null,
    vcMin: d.vcMin ? parseFloat(d.vcMin) : null,
    vcMax: d.vcMax ? parseFloat(d.vcMax) : null,
  };
}

export default function GradesPage() {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [dialog, setDialog] = useState<"new" | Grade | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const res = await fetch("/api/grades");
    setGrades(await res.json());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const save = async (data: GradeData) => {
    const payload = toApiData(data);
    if (data.id) {
      await fetch(`/api/grades/${data.id}`, { method: "PUT", body: JSON.stringify(payload), headers: { "Content-Type": "application/json" } });
    } else {
      await fetch("/api/grades", { method: "POST", body: JSON.stringify(payload), headers: { "Content-Type": "application/json" } });
    }
    setDialog(null);
    load();
  };

  const del = async (id: string) => {
    if (!confirm("למחוק גרייד זה?")) return;
    await fetch(`/api/grades/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">גריידים</h1>
        <Button onClick={() => setDialog("new")}><Plus className="h-4 w-4 ml-1" />גרייד חדש</Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground">טוען...</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>קוד</TableHead>
              <TableHead>סאבסטרט</TableHead>
              <TableHead>ציפוי</TableHead>
              <TableHead>חומרי ISO</TableHead>
              <TableHead>אפליקציות</TableHead>
              <TableHead>Vc (m/min)</TableHead>
              <TableHead>שימות</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {grades.map((g) => (
              <TableRow key={g.id}>
                <TableCell className="font-mono font-medium">{g.code}</TableCell>
                <TableCell>{g.substrate}</TableCell>
                <TableCell>{g.coatingType || "—"}</TableCell>
                <TableCell>
                  <div className="flex gap-1 flex-wrap">
                    {g.isoMaterials?.map((m) => <Badge key={m} variant="outline" className="text-xs">{m}</Badge>)}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1 flex-wrap">
                    {g.applications?.map((a) => <Badge key={a} variant="secondary" className="text-xs">{a}</Badge>)}
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {g.vcMin && g.vcMax ? `${g.vcMin}–${g.vcMax}` : "—"}
                </TableCell>
                <TableCell>{g._count?.inserts ?? 0}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setDialog(g)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => del(g.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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
            <DialogTitle>{dialog === "new" ? "גרייד חדש" : "עריכת גרייד"}</DialogTitle>
          </DialogHeader>
          {dialog && (
            <GradeForm
              initial={dialog === "new" ? undefined : toFormData(dialog as Grade)}
              onSave={save}
              onCancel={() => setDialog(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
