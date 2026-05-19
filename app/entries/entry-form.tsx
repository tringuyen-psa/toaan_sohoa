"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useEffect, useRef, useState } from "react";
import { saveEntry, type EntryFormState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { userColor } from "@/lib/colors";
import {
  UserRound,
  CalendarDays,
  FolderTree,
  Files,
  FileText,
  Upload,
  AlertTriangle,
  StickyNote,
  Save,
  CheckCircle2,
  Loader2,
  Eye,
} from "lucide-react";

const INIT_STATE: EntryFormState = { ok: false };

type Status = "DONE" | "IN_PROGRESS" | "REVIEW";

const STATUS_OPTIONS: { value: Status; label: string; icon: React.ComponentType<{ className?: string }>; activeClass: string }[] = [
  {
    value: "DONE",
    label: "Hoàn thành",
    icon: CheckCircle2,
    activeClass: "border-emerald-500 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-200/60",
  },
  {
    value: "IN_PROGRESS",
    label: "Đang làm",
    icon: Loader2,
    activeClass: "border-amber-500 bg-amber-50 text-amber-700 ring-2 ring-amber-200/60",
  },
  {
    value: "REVIEW",
    label: "Kiểm tra",
    icon: Eye,
    activeClass: "border-sky-500 bg-sky-50 text-sky-700 ring-2 ring-sky-200/60",
  },
];

type DocType = { id: string; name: string };
type UserOpt = { id: string; name: string };
type InitialEntry = {
  id: string;
  userId: string;
  docTypeId: string;
  workDate: string;
  numRecords: number;
  numPages: number;
  numUploaded: number;
  numErrors: number;
  status: Status;
  note: string | null;
};

function SubmitBtn({ editing }: { editing: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} size="lg" className="min-w-[140px]">
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Save className="h-4 w-4" />
      )}
      {pending ? "Đang lưu..." : editing ? "Cập nhật" : "Thêm bản ghi"}
    </Button>
  );
}

export function EntryForm({
  docTypes,
  users,
  defaultUserId,
  initial,
  onSaved,
}: {
  docTypes: DocType[];
  users: UserOpt[];
  defaultUserId?: string;
  initial?: InitialEntry;
  onSaved?: () => void;
}) {
  const [state, formAction] = useFormState<EntryFormState, FormData>(saveEntry, INIT_STATE);
  const formRef = useRef<HTMLFormElement>(null);

  const today = new Date().toISOString().slice(0, 10);
  const startingUserId = initial?.userId ?? defaultUserId ?? "";

  const [selectedUserId, setSelectedUserId] = useState(startingUserId);
  const [status, setStatus] = useState<Status>(initial?.status ?? "DONE");

  useEffect(() => {
    if (state.ok) {
      toast.success(state.message ?? "Đã lưu");
      if (!initial) {
        formRef.current?.reset();
        setStatus("DONE");
        setSelectedUserId(defaultUserId ?? "");
      }
      onSaved?.();
    } else if (state.message) {
      toast.error(state.message);
    }
  }, [state, initial, onSaved, defaultUserId]);

  const selectedUser = users.find((u) => u.id === selectedUserId);
  const userClr = selectedUser ? userColor(selectedUser.id) : null;

  return (
    <form ref={formRef} action={formAction} className="space-y-6">
      {initial && <input type="hidden" name="id" value={initial.id} />}
      <input type="hidden" name="status" value={status} />

      <Section title="Thông tin cơ bản">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field icon={UserRound} label="Người thực hiện" error={state.errors?.userId}>
            <div className="space-y-1.5">
              <select
                name="userId"
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                required
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                style={userClr ? { borderLeftWidth: 4, borderLeftColor: userClr.border } : undefined}
              >
                <option value="" disabled>— chọn người —</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
              {selectedUser && userClr && (
                <div
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
                  style={{ background: userClr.bg, color: userClr.text }}
                >
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: userClr.border }} />
                  {selectedUser.name}
                </div>
              )}
            </div>
          </Field>

          <Field icon={CalendarDays} label="Ngày làm việc" error={state.errors?.workDate}>
            <Input
              type="date"
              name="workDate"
              defaultValue={initial?.workDate ?? today}
              required
              className="h-10"
            />
          </Field>

          <Field icon={FolderTree} label="Loại hồ sơ" error={state.errors?.docTypeId}>
            <select
              name="docTypeId"
              defaultValue={initial?.docTypeId ?? ""}
              required
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="" disabled>— chọn loại —</option>
              {docTypes.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </Field>
        </div>
      </Section>

      <Section title="Số liệu sản lượng">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <NumberField icon={Files} label="Số HS" name="numRecords" defaultValue={initial?.numRecords ?? 0} error={state.errors?.numRecords} accent="blue" />
          <NumberField icon={FileText} label="Số trang" name="numPages" defaultValue={initial?.numPages ?? 0} error={state.errors?.numPages} accent="emerald" />
          <NumberField icon={Upload} label="Đã upload" name="numUploaded" defaultValue={initial?.numUploaded ?? 0} error={state.errors?.numUploaded} accent="violet" />
          <NumberField icon={AlertTriangle} label="Lỗi" name="numErrors" defaultValue={initial?.numErrors ?? 0} error={state.errors?.numErrors} accent="rose" />
        </div>
        <p className="text-xs text-slate-500 mt-2 flex items-center gap-1.5">
          <Eye className="h-3.5 w-3.5" /> Giờ làm và năng suất được tính ở mức ngày — set "Giờ làm trong ngày" 1 lần ở khung phía trên.
        </p>
      </Section>

      <Section title="Trạng thái">
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((opt) => {
            const active = status === opt.value;
            const Icon = opt.icon;
            return (
              <button
                type="button"
                key={opt.value}
                onClick={() => setStatus(opt.value)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all",
                  active
                    ? opt.activeClass
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300"
                )}
              >
                <Icon className={cn("h-4 w-4", active && opt.value === "IN_PROGRESS" && "animate-spin")} />
                {opt.label}
              </button>
            );
          })}
        </div>
      </Section>

      <Section title="Ghi chú">
        <Field icon={StickyNote} label="" hideLabel>
          <Input
            name="note"
            defaultValue={initial?.note ?? ""}
            placeholder="Ghi chú thêm (tuỳ chọn)"
            className="h-10"
          />
        </Field>
      </Section>

      <div className="flex justify-end pt-2 border-t">
        <SubmitBtn editing={!!initial} />
      </div>
    </form>
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

function Field({
  icon: Icon,
  label,
  children,
  error,
  hideLabel,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
  error?: string;
  hideLabel?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      {!hideLabel && (
        <Label className="text-xs font-medium text-slate-700 inline-flex items-center gap-1.5">
          <Icon className="h-3.5 w-3.5 text-slate-400" />
          {label}
        </Label>
      )}
      {children}
      {error && <p className="text-xs text-rose-600 flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> {error}</p>}
    </div>
  );
}

const ACCENT_CLASSES: Record<string, string> = {
  blue: "focus-within:border-blue-400 focus-within:ring-blue-200/50",
  emerald: "focus-within:border-emerald-400 focus-within:ring-emerald-200/50",
  violet: "focus-within:border-violet-400 focus-within:ring-violet-200/50",
  rose: "focus-within:border-rose-400 focus-within:ring-rose-200/50",
  amber: "focus-within:border-amber-400 focus-within:ring-amber-200/50",
};

function NumberField({
  icon: Icon,
  label,
  name,
  defaultValue,
  step = 1,
  max,
  error,
  accent = "blue",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  name: string;
  defaultValue?: number;
  step?: number;
  max?: number;
  error?: string;
  accent?: keyof typeof ACCENT_CLASSES;
}) {
  return (
    <div className={cn("rounded-lg border bg-white p-3 transition-all focus-within:ring-2 focus-within:shadow-sm", ACCENT_CLASSES[accent])}>
      <Label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 inline-flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </Label>
      <input
        type="number"
        min={0}
        max={max}
        step={step}
        name={name}
        defaultValue={defaultValue}
        required
        className="w-full bg-transparent text-2xl font-bold tabular-nums text-slate-900 focus:outline-none mt-0.5 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      {error && <p className="text-xs text-rose-600 mt-1">{error}</p>}
    </div>
  );
}
