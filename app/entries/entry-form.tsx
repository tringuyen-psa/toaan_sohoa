"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { saveEntry, type EntryFormState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const INIT_STATE: EntryFormState = { ok: false };

type DocType = { id: string; name: string };
type UserOpt = { id: string; name: string };
type WorkdayLite = { userId: string; workDate: Date | string; hours: number };
type InitialEntry = {
  id: string;
  userId: string;
  docTypeId: string;
  workDate: string;
  numRecords: number;
  numPages: number;
  numUploaded: number;
  numErrors: number;
  status: "DONE" | "IN_PROGRESS" | "REVIEW";
  note: string | null;
};

function SubmitBtn({ editing }: { editing: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Đang lưu..." : editing ? "Cập nhật" : "Thêm bản ghi"}
    </Button>
  );
}

function workdayKey(userId: string, isoDate: string) {
  return `${userId}|${isoDate}`;
}

export function EntryForm({
  docTypes,
  users,
  workdays = [],
  defaultUserId,
  initial,
  onSaved,
}: {
  docTypes: DocType[];
  users: UserOpt[];
  workdays?: WorkdayLite[];
  defaultUserId?: string;
  initial?: InitialEntry;
  onSaved?: () => void;
}) {
  const [state, formAction] = useFormState<EntryFormState, FormData>(saveEntry, INIT_STATE);
  const formRef = useRef<HTMLFormElement>(null);

  const today = new Date().toISOString().slice(0, 10);
  const startingUser = initial?.userId ?? defaultUserId ?? "";
  const startingDate = initial?.workDate ?? today;

  const [userId, setUserId] = useState(startingUser);
  const [workDate, setWorkDate] = useState(startingDate);
  const [hoursTouched, setHoursTouched] = useState(false);
  const [hours, setHours] = useState<string>("");

  const workdayMap = useMemo(() => {
    const m = new Map<string, number>();
    for (const w of workdays) {
      const iso = typeof w.workDate === "string"
        ? w.workDate.slice(0, 10)
        : new Date(w.workDate).toISOString().slice(0, 10);
      m.set(workdayKey(w.userId, iso), w.hours);
    }
    return m;
  }, [workdays]);

  useEffect(() => {
    if (hoursTouched) return;
    if (!userId || !workDate) {
      setHours("");
      return;
    }
    const existing = workdayMap.get(workdayKey(userId, workDate));
    setHours(existing !== undefined ? String(existing) : "");
  }, [userId, workDate, workdayMap, hoursTouched]);

  useEffect(() => {
    if (state.ok) {
      toast.success(state.message ?? "Đã lưu");
      if (!initial) {
        formRef.current?.reset();
        setHoursTouched(false);
      }
      onSaved?.();
    } else if (state.message) {
      toast.error(state.message);
    }
  }, [state, initial, onSaved]);

  return (
    <form ref={formRef} action={formAction} className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {initial && <input type="hidden" name="id" value={initial.id} />}

      <Field label="Người thực hiện" error={state.errors?.userId}>
        <select
          name="userId"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          required
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
        >
          <option value="" disabled>— chọn —</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>
      </Field>

      <Field label="Ngày" error={state.errors?.workDate}>
        <Input
          type="date"
          name="workDate"
          value={workDate}
          onChange={(e) => setWorkDate(e.target.value)}
          required
        />
      </Field>

      <Field label="Số giờ làm trong ngày" error={state.errors?.workdayHours}>
        <Input
          type="number"
          name="workdayHours"
          min={0}
          max={24}
          step={0.5}
          value={hours}
          onChange={(e) => {
            setHours(e.target.value);
            setHoursTouched(true);
          }}
          placeholder="VD: 8"
        />
        <p className="text-[11px] text-slate-500 mt-1">
          Set 1 lần cho cả ngày của người này — sẽ tự cập nhật khi lưu.
        </p>
      </Field>

      <Field label="Loại hồ sơ" error={state.errors?.docTypeId}>
        <select
          name="docTypeId"
          defaultValue={initial?.docTypeId ?? ""}
          required
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
        >
          <option value="" disabled>— chọn —</option>
          {docTypes.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      </Field>

      <Field label="Số HS" error={state.errors?.numRecords}>
        <Input type="number" min={0} name="numRecords" defaultValue={initial?.numRecords ?? 0} required />
      </Field>

      <Field label="Số trang" error={state.errors?.numPages}>
        <Input type="number" min={0} name="numPages" defaultValue={initial?.numPages ?? 0} required />
      </Field>

      <Field label="Số trang đã upload" error={state.errors?.numUploaded}>
        <Input type="number" min={0} name="numUploaded" defaultValue={initial?.numUploaded ?? 0} required />
      </Field>

      <Field label="Lỗi" error={state.errors?.numErrors}>
        <Input type="number" min={0} name="numErrors" defaultValue={initial?.numErrors ?? 0} required />
      </Field>

      <Field label="Trạng thái">
        <select
          name="status"
          defaultValue={initial?.status ?? "DONE"}
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
        >
          <option value="DONE">Hoàn thành</option>
          <option value="IN_PROGRESS">Đang làm</option>
          <option value="REVIEW">Kiểm tra</option>
        </select>
      </Field>

      <Field label="Ghi chú" className="md:col-span-3">
        <Input name="note" defaultValue={initial?.note ?? ""} placeholder="Tuỳ chọn" />
      </Field>

      <div className="md:col-span-3 flex justify-end">
        <SubmitBtn editing={!!initial} />
      </div>
    </form>
  );
}

function Field({
  label,
  children,
  error,
  className,
}: {
  label: string;
  children: React.ReactNode;
  error?: string;
  className?: string;
}) {
  return (
    <div className={`space-y-1 ${className ?? ""}`}>
      <Label className="text-sm font-bold text-slate-900">{label}</Label>
      {children}
      {error && <p className="text-xs text-rose-600">{error}</p>}
    </div>
  );
}
