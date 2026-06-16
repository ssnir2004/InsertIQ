"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TagsInput } from "@/components/TagsInput";

export interface InsertData {
  id?: string;
  code: string;
  application: string;
  geometry: string;
  gradeId: string;
  advantages: string[];
  disadvantages: string[];
  materials: string[];
  conditions: string[];
}

const EMPTY: InsertData = {
  code: "", application: "", geometry: "", gradeId: "",
  advantages: [], disadvantages: [], materials: [], conditions: [],
};

const APPLICATIONS = ["Milling", "Turning", "Grooving", "FAST-FEED", "Threading", "Drilling", "Boring"];

interface InsertFormProps {
  initial?: InsertData;
  grades: { id: string; code: string }[];
  onSave: (data: InsertData) => Promise<void>;
  onCancel: () => void;
}

export function InsertForm({ initial = EMPTY, grades, onSave, onCancel }: InsertFormProps) {
  const [form, setForm] = useState<InsertData>(initial);
  const [saving, setSaving] = useState(false);

  const set = (key: keyof InsertData, value: unknown) => setForm((f) => ({ ...f, [key]: value }));

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
          <Label>קוד שימה *</Label>
          <Input value={form.code} onChange={(e) => set("code", e.target.value)} required placeholder="APMT1135PDER" />
        </div>
        <div className="space-y-1">
          <Label>אפליקציה *</Label>
          <Select value={form.application} onValueChange={(v) => set("application", v)}>
            <SelectTrigger><SelectValue placeholder="בחר אפליקציה..." /></SelectTrigger>
            <SelectContent>
              {APPLICATIONS.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>גרייד *</Label>
          <Select value={form.gradeId} onValueChange={(v) => set("gradeId", v)}>
            <SelectTrigger><SelectValue placeholder="בחר גרייד..." /></SelectTrigger>
            <SelectContent>
              {grades.map((g) => <SelectItem key={g.id} value={g.id}>{g.code}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>גיאומטריה</Label>
          <Input value={form.geometry} onChange={(e) => set("geometry", e.target.value)} placeholder="Positive rake, 35° corner" />
        </div>
      </div>

      <div className="space-y-1">
        <Label>חומרים מומלצים</Label>
        <TagsInput value={form.materials} onChange={(v) => set("materials", v)} placeholder="P20, Stainless..." />
      </div>

      <div className="space-y-1">
        <Label>תנאי עבודה</Label>
        <TagsInput value={form.conditions} onChange={(v) => set("conditions", v)} placeholder="Stable, High feed..." />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>יתרונות</Label>
          <TagsInput value={form.advantages} onChange={(v) => set("advantages", v)} />
        </div>
        <div className="space-y-1">
          <Label>חסרונות</Label>
          <TagsInput value={form.disadvantages} onChange={(v) => set("disadvantages", v)} />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>ביטול</Button>
        <Button type="submit" disabled={saving}>{saving ? "שומר..." : "שמור"}</Button>
      </div>
    </form>
  );
}
