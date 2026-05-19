"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useEffect, useRef } from "react";
import { saveEntry, type EntryFormState } from "./actions";

const INIT_STATE: EntryFormState = { ok: false };
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type DocType = { id: string; name: string };
type InitialEntry = {
  id: string;
  docTypeId: string;
  workDate: string;
  numRecords: number;
  numPages: number;
  numUploaded: number;
  numErrors: number;
  hours: number;
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

export function EntryForm({
  docTypes,
  initial,
  onSaved,
}: {
  docTypes: DocType[];
  initial?: InitialEntry;
  onSaved?: () => void;
}) {
  const [state, formAction] = useFormState<EntryFormState, FormData>(saveEntry, INIT_STATE);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) {
      toast.success(state.message ?? "Đã lưu");
      if (!initial) formRef.current?.reset();
      onSaved?.();
    } else if (state.message) {
      toast.error(state.message);
    }
  }, [state, initial, onSaved]);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <form ref={formRef} action={formAction} className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {initial && <input type="hidden" name="id" value={initial.id} />}
      <Field label="Ngày" error={state.errors?.workDate}>
        <Input type="date" name="workDate" defaultValue={initial?.workDate ?? today} required />
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
      <Field label="Số HS" error={state.errors?.numRecords}>
        <Input type="number" min={0} name="numRecords" defaultValue={initial?.numRecords ?? 0} required />
      </Field>
      <Field label="Số trang" error={state.errors?.numPages}>
        <Input type="number" min={0} name="numPages" defaultValue={initial?.numPages ?? 0} required />
      </Field>
      <Field label="Upload" error={state.errors?.numUploaded}>
        <Input type="number" min={0} name="numUploaded" defaultValue={initial?.numUploaded ?? 0} required />
      </Field>
      <Field label="Lỗi" error={state.errors?.numErrors}>
        <Input type="number" min={0} name="numErrors" defaultValue={initial?.numErrors ?? 0} required />
      </Field>
      <Field label="Giờ" error={state.errors?.hours}>
        <Input type="number" min={0} max={24} step={0.5} name="hours" defaultValue={initial?.hours ?? 0.5} required />
      </Field>
      <Field label="Ghi chú" className="md:col-span-3">
        <Input name="note" defaultValue={initial?.note ?? ""} placeholder="Tuỳ chọn" />
      </Field>
      <div className="md:col-span-3 flex justify-end gap-2">
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
      <Label className="text-xs text-slate-700">{label}</Label>
      {children}
      {error && <p className="text-xs text-rose-600">{error}</p>}
    </div>
  );
}
