"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { saveHandover } from "./actions";
import { Plus, Trash2, Save, Loader2 } from "lucide-react";

type DocType = { id: string; name: string };
type Session = "MORNING" | "AFTERNOON" | "";
type Item = { docTypeId: string; quantity: number };

export type HandoverInitial = {
  id: string;
  category: string;
  recordDate: string;
  receivedDate: string;
  receivedTime: string | null;
  receivedSession: Session;
  handedOverDate: string;
  handedOverTime: string | null;
  handedOverSession: Session;
  note: string | null;
  items: Item[];
};

export function HandoverForm({
  docTypes,
  initial,
  onSaved,
}: {
  docTypes: DocType[];
  initial?: HandoverInitial;
  onSaved?: () => void;
}) {
  const today = new Date().toISOString().slice(0, 10);

  const [category, setCategory] = useState(initial?.category ?? "Hồ sơ xử lý đơn");
  const [recordDate, setRecordDate] = useState(initial?.recordDate ?? today);

  const [receivedDate, setReceivedDate] = useState(initial?.receivedDate ?? today);
  const [receivedMode, setReceivedMode] = useState<"session" | "time">(
    initial?.receivedTime ? "time" : "session"
  );
  const [receivedSession, setReceivedSession] = useState<Session>(initial?.receivedSession ?? "MORNING");
  const [receivedTime, setReceivedTime] = useState(initial?.receivedTime ?? "");

  const [handedOverDate, setHandedOverDate] = useState(initial?.handedOverDate ?? today);
  const [handedOverMode, setHandedOverMode] = useState<"session" | "time">(
    initial?.handedOverTime ? "time" : "session"
  );
  const [handedOverSession, setHandedOverSession] = useState<Session>(initial?.handedOverSession ?? "AFTERNOON");
  const [handedOverTime, setHandedOverTime] = useState(initial?.handedOverTime ?? "");

  const [note, setNote] = useState(initial?.note ?? "");
  const [items, setItems] = useState<Item[]>(
    initial?.items?.length
      ? initial.items
      : [{ docTypeId: "", quantity: 1 }]
  );

  const [pending, start] = useTransition();

  function addItem() {
    setItems([...items, { docTypeId: "", quantity: 1 }]);
  }
  function removeItem(idx: number) {
    setItems(items.filter((_, i) => i !== idx));
  }
  function updateItem(idx: number, patch: Partial<Item>) {
    setItems(items.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  }

  function submit() {
    if (items.length === 0 || items.some((it) => !it.docTypeId || it.quantity < 1)) {
      toast.error("Cần ít nhất 1 dòng số lượng hợp lệ");
      return;
    }
    start(async () => {
      const r = await saveHandover({
        id: initial?.id,
        category,
        recordDate,
        receivedDate,
        receivedTime: receivedMode === "time" ? receivedTime : null,
        receivedSession: receivedMode === "session" ? receivedSession : "",
        handedOverDate,
        handedOverTime: handedOverMode === "time" ? handedOverTime : null,
        handedOverSession: handedOverMode === "session" ? handedOverSession : "",
        note,
        items,
      });
      if (r.ok) {
        toast.success(r.message ?? "Đã lưu");
        if (!initial) {
          setItems([{ docTypeId: "", quantity: 1 }]);
          setNote("");
        }
        onSaved?.();
      } else {
        toast.error(r.message ?? "Lỗi");
      }
    });
  }

  return (
    <div className="space-y-6">
      <Section title="Thông tin chung">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Loại bàn giao">
            <Input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="VD: Hồ sơ xử lý đơn"
              list="category-suggestions"
            />
            <datalist id="category-suggestions">
              {docTypes.map((d) => <option key={d.id} value={d.name} />)}
            </datalist>
          </Field>
          <Field label="Hồ sơ ngày">
            <Input type="date" value={recordDate} onChange={(e) => setRecordDate(e.target.value)} />
          </Field>
        </div>
      </Section>

      <Section title="Số lượng theo loại">
        <div className="space-y-2">
          {items.map((it, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-2 items-end">
              <div className="col-span-7">
                <Label className="text-xs">Loại hồ sơ</Label>
                <select
                  value={it.docTypeId}
                  onChange={(e) => updateItem(idx, { docTypeId: e.target.value })}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm"
                >
                  <option value="" disabled>— chọn —</option>
                  {docTypes.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div className="col-span-3">
                <Label className="text-xs">Số lượng</Label>
                <Input
                  type="number"
                  min={1}
                  value={it.quantity}
                  onChange={(e) => updateItem(idx, { quantity: Number(e.target.value) || 1 })}
                />
              </div>
              <div className="col-span-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={items.length === 1}
                  onClick={() => removeItem(idx)}
                  className="w-full"
                >
                  <Trash2 className="h-4 w-4 text-rose-600" /> Xoá
                </Button>
              </div>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addItem}>
            <Plus className="h-4 w-4" /> Thêm dòng
          </Button>
        </div>
      </Section>

      <Section title="Nhận từ HCTP">
        <TimeSection
          date={receivedDate}
          onDateChange={setReceivedDate}
          mode={receivedMode}
          onModeChange={setReceivedMode}
          session={receivedSession}
          onSessionChange={setReceivedSession}
          time={receivedTime}
          onTimeChange={setReceivedTime}
        />
      </Section>

      <Section title="Bàn giao số hoá">
        <TimeSection
          date={handedOverDate}
          onDateChange={setHandedOverDate}
          mode={handedOverMode}
          onModeChange={setHandedOverMode}
          session={handedOverSession}
          onSessionChange={setHandedOverSession}
          time={handedOverTime}
          onTimeChange={setHandedOverTime}
        />
      </Section>

      <Section title="Ghi chú">
        <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Tuỳ chọn" />
      </Section>

      <div className="flex justify-end pt-2 border-t">
        <Button size="lg" onClick={submit} disabled={pending} className="min-w-[160px]">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {initial ? "Cập nhật" : "Thêm bàn giao"}
        </Button>
      </div>
    </div>
  );
}

function TimeSection({
  date,
  onDateChange,
  mode,
  onModeChange,
  session,
  onSessionChange,
  time,
  onTimeChange,
}: {
  date: string;
  onDateChange: (v: string) => void;
  mode: "session" | "time";
  onModeChange: (m: "session" | "time") => void;
  session: Session;
  onSessionChange: (s: Session) => void;
  time: string;
  onTimeChange: (v: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Field label="Ngày">
        <Input type="date" value={date} onChange={(e) => onDateChange(e.target.value)} />
      </Field>
      <div className="space-y-1.5">
        <Label className="text-sm font-bold text-slate-900">Buổi</Label>
        <div className="inline-flex rounded-md border bg-white shadow-sm overflow-hidden text-sm">
          <button
            type="button"
            onClick={() => { onModeChange("session"); onSessionChange("MORNING"); }}
            className={modeBtn(mode === "session" && session === "MORNING")}
          >
            Sáng
          </button>
          <button
            type="button"
            onClick={() => { onModeChange("session"); onSessionChange("AFTERNOON"); }}
            className={modeBtn(mode === "session" && session === "AFTERNOON")}
          >
            Chiều
          </button>
          <button
            type="button"
            onClick={() => onModeChange("time")}
            className={modeBtn(mode === "time")}
          >
            Giờ cụ thể
          </button>
        </div>
      </div>
      <Field label="Giờ (tuỳ chọn)">
        <Input
          type="time"
          value={time}
          disabled={mode !== "time"}
          onChange={(e) => onTimeChange(e.target.value)}
          placeholder="HH:MM"
        />
      </Field>
    </div>
  );
}

function modeBtn(active: boolean) {
  return (
    "px-3 py-1.5 transition-colors " +
    (active ? "bg-[#1e3a8a] text-white font-semibold" : "hover:bg-slate-100")
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
        <span className="h-px flex-1 bg-slate-200" />
        <span>{title}</span>
        <span className="h-px flex-1 bg-slate-200" />
      </h3>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-bold text-slate-900">{label}</Label>
      {children}
    </div>
  );
}
