"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TagsInput } from "@/components/TagsInput";

export interface GradeData {
  id?: string;
  code: string;
  substrate: string;
  coatingType: string;
  description: string;
  advantages: string[];
  disadvantages: string[];
  isoMaterials: string[];
  conditions: string[];
  applications: string[];
  vcMin: string;
  vcMax: string;
}

const EMPTY: GradeData = {
  code: "", substrate: "", coatingType: "", description: "",
  advantages: [], disadvantages: [], isoMaterials: [],
  conditions: [], applications: [], vcMin: "", vcMax: "",
};

interface GradeFormProps {
  initial?: GradeData;
  onSave: (data: GradeData) => Promise<void>;
  onCancel: () => void;
}

export function GradeForm({ initial = EMPTY, onSave, onCancel }: GradeFormProps) {
  const [form, setForm] = useState<GradeData>(initial);
  const [saving, setSaving] = useState(false);

  const set = (key: keyof GradeData, value: unknown) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>קוד גרייד *</Label>
          <Input value={form.code} onChange={(e) => set("code", e.target.value)} required placeholder="IC908" />
        </div>
        <div className="space-y-1">
          <Label>סאבסטרט *</Label>
          <Select value={form.substrate} onValueChange={(v) => set("substrate", v)}>
            <SelectTrigger><SelectValue placeholder="בחר..." /></SelectTrigger>
            <SelectContent>
              {["Carbide", "Cermet", "Ceramic", "CBN", "PCD"].map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1">
          <Label>סוג ציפוי</Label>
          <Select value={form.coatingType} onValueChange={(v) => set("coatingType", v)}>
            <SelectTrigger><SelectValue placeholder="ללא / CVD / PVD" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">ללא ציפוי</SelectItem>
              <SelectItem value="CVD">CVD</SelectItem>
              <SelectItem value="PVD">PVD</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Vc מינימום (m/min)</Label>
          <Input type="number" value={form.vcMin} onChange={(e) => set("vcMin", e.target.value)} placeholder="80" />
        </div>
        <div className="space-y-1">
          <Label>Vc מקסימום (m/min)</Label>
          <Input type="number" value={form.vcMax} onChange={(e) => set("vcMax", e.target.value)} placeholder="350" />
        </div>
      </div>

      <div className="space-y-1">
        <Label>תיאור</Label>
        <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={2} />
      </div>

      <div className="space-y-1">
        <Label>חומרי ISO מומלצים (P, M, K, N, S, H)</Label>
        <TagsInput value={form.isoMaterials} onChange={(v) => set("isoMaterials", v)} placeholder="P, M, K..." />
      </div>

      <div className="space-y-1">
        <Label>אפליקציות</Label>
        <TagsInput value={form.applications} onChange={(v) => set("applications", v)} placeholder="Milling, Turning..." />
      </div>

      <div className="space-y-1">
        <Label>תנאי עבודה</Label>
        <TagsInput value={form.conditions} onChange={(v) => set("conditions", v)} placeholder="Stable, Unstable, Wet..." />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>יתרונות</Label>
          <TagsInput value={form.advantages} onChange={(v) => set("advantages", v)} placeholder="High wear resistance..." />
        </div>
        <div className="space-y-1">
          <Label>חסרונות</Label>
          <TagsInput value={form.disadvantages} onChange={(v) => set("disadvantages", v)} placeholder="Brittle at high impact..." />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>ביטול</Button>
        <Button type="submit" disabled={saving}>{saving ? "שומר..." : "שמור"}</Button>
      </div>
    </form>
  );
}
