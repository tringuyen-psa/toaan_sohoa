"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useEffect, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { saveDocType, toggleDocTypeActive, deleteDocType, type ActionState } from "./actions";
import { ConfirmDialog } from "@/components/confirm-dialog";

const INIT: ActionState = { ok: false };
import { Pencil, Trash2, Power } from "lucide-react";
import { toast } from "sonner";

type DT = { id: string; name: string; note: string | null; active: boolean };

function SubmitBtn({ editing }: { editing: boolean }) {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending}>{pending ? "..." : editing ? "Cập nhật" : "Thêm"}</Button>;
}

function DocTypeForm({ initial, onSaved }: { initial?: DT; onSaved?: () => void }) {
  const [state, action] = useFormState(saveDocType, INIT);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) {
      toast.success(state.message ?? "OK");
      if (!initial) ref.current?.reset();
      onSaved?.();
    } else if (state.message) toast.error(state.message);
  }, [state, initial, onSaved]);

  return (
    <form ref={ref} action={action} className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {initial && <input type="hidden" name="id" value={initial.id} />}
      <div className="space-y-1">
        <Label className="text-xs">Tên loại hồ sơ</Label>
        <Input name="name" defaultValue={initial?.name ?? ""} required />
      </div>
      <div className="md:col-span-2 space-y-1">
        <Label className="text-xs">Ghi chú</Label>
        <Input name="note" defaultValue={initial?.note ?? ""} />
      </div>
      <div className="md:col-span-3 flex justify-end">
        <SubmitBtn editing={!!initial} />
      </div>
    </form>
  );
}

export function DocTypeManager({ items }: { items: DT[] }) {
  return (
    <div className="space-y-6">
      <DocTypeForm />
      <div className="overflow-x-auto">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Tên</th>
              <th>Ghi chú</th>
              <th>Trạng thái</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((d) => (
              <DocTypeRow key={d.id} d={d} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DocTypeRow({ d }: { d: DT }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  function onToggle() {
    start(async () => {
      await toggleDocTypeActive(d.id);
      toast.success(d.active ? "Đã ẩn" : "Đã hiện");
    });
  }

  function onDelete() {
    start(async () => {
      const r = await deleteDocType(d.id);
      if (r.ok) toast.success("Đã xoá");
      else toast.error(r.message ?? "Lỗi");
    });
  }

  return (
    <tr>
      <td className="font-medium">{d.name}</td>
      <td className="text-slate-600">{d.note}</td>
      <td>
        {d.active ? <Badge variant="success">Hiện</Badge> : <Badge variant="secondary">Ẩn</Badge>}
      </td>
      <td>
        <div className="action-bar">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <button type="button">
                <Pencil className="h-3.5 w-3.5" /> Sửa
              </button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Sửa loại hồ sơ</DialogTitle>
              </DialogHeader>
              <DocTypeForm initial={d} onSaved={() => setOpen(false)} />
            </DialogContent>
          </Dialog>
          <ConfirmDialog
            title={d.active ? "Ẩn loại hồ sơ?" : "Hiện loại hồ sơ?"}
            description={
              d.active
                ? <>Sau khi ẩn, <strong>{d.name}</strong> sẽ không xuất hiện trong dropdown nhập liệu. Các bản ghi cũ vẫn còn.</>
                : <>Cho phép sử dụng lại loại hồ sơ <strong>{d.name}</strong> trong form nhập liệu.</>
            }
            variant={d.active ? "destructive" : "default"}
            confirmLabel={d.active ? "Ẩn" : "Hiện"}
            onConfirm={onToggle}
            trigger={
              <button disabled={pending} type="button" title={d.active ? "Ẩn" : "Hiện"}>
                <Power className="h-3.5 w-3.5" /> {d.active ? "Ẩn" : "Hiện"}
              </button>
            }
          />
          <ConfirmDialog
            title="Xoá loại hồ sơ?"
            description={<>Xoá <strong>{d.name}</strong>. Chỉ xoá được nếu chưa có bản ghi nào dùng đến — nếu đã có, hãy ẩn thay vì xoá.</>}
            confirmLabel="Xoá"
            onConfirm={onDelete}
            trigger={
              <button className="danger" disabled={pending} type="button">
                <Trash2 className="h-3.5 w-3.5 text-rose-600" /> Xoá
              </button>
            }
          />
        </div>
      </td>
    </tr>
  );
}
