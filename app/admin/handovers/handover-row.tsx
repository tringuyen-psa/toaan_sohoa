"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { HandoverForm, type HandoverInitial } from "./handover-form";
import { deleteHandover } from "./actions";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";

type DocType = { id: string; name: string };
type Row = {
  id: string;
  category: string;
  recordDate: Date;
  receivedAt: Date;
  receivedSession: "MORNING" | "AFTERNOON" | null;
  handedOverAt: Date;
  handedOverSession: "MORNING" | "AFTERNOON" | null;
  note: string | null;
  items: { id: string; quantity: number; docType: { id: string; name: string } }[];
};

function isoDate(d: Date) {
  return new Date(d).toISOString().slice(0, 10);
}
function isoTime(d: Date) {
  const iso = new Date(d).toISOString();
  return iso.slice(11, 16);
}
function dateVN(d: Date) {
  const iso = isoDate(d);
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;
}
function sessionLabel(s: "MORNING" | "AFTERNOON" | null, at: Date) {
  if (s === "MORNING") return "sáng";
  if (s === "AFTERNOON") return "chiều";
  return isoTime(at);
}

export function HandoverRow({ row, docTypes }: { row: Row; docTypes: DocType[] }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  function onDelete() {
    start(async () => {
      const r = await deleteHandover(row.id);
      if (r.ok) toast.success(r.message ?? "Đã xoá");
      else toast.error(r.message ?? "Lỗi");
    });
  }

  const total = row.items.reduce((s, it) => s + it.quantity, 0);

  const initial: HandoverInitial = {
    id: row.id,
    category: row.category,
    recordDate: isoDate(row.recordDate),
    receivedDate: isoDate(row.receivedAt),
    receivedTime: row.receivedSession === null ? isoTime(row.receivedAt) : null,
    receivedSession: row.receivedSession ?? "",
    handedOverDate: isoDate(row.handedOverAt),
    handedOverTime: row.handedOverSession === null ? isoTime(row.handedOverAt) : null,
    handedOverSession: row.handedOverSession ?? "",
    note: row.note,
    items: row.items.map((it) => ({ docTypeId: it.docType.id, quantity: it.quantity })),
  };

  return (
    <tr>
      <td className="font-semibold text-[#1e3a8a]">{row.category}</td>
      <td>
        <ul className="space-y-0.5 text-sm">
          {row.items.map((it) => (
            <li key={it.id}>
              <span className="font-semibold tabular-nums">{it.quantity}</span> {it.docType.name}
            </li>
          ))}
        </ul>
        <div className="text-xs text-slate-500 mt-1">Tổng: <strong>{total}</strong> bộ</div>
      </td>
      <td className="text-center">{dateVN(row.recordDate)}</td>
      <td className="text-center">
        {dateVN(row.receivedAt)} <br />
        <span className="text-xs text-slate-500">({sessionLabel(row.receivedSession, row.receivedAt)})</span>
      </td>
      <td className="text-center">
        {dateVN(row.handedOverAt)} <br />
        <span className="text-xs text-slate-500">({sessionLabel(row.handedOverSession, row.handedOverAt)})</span>
      </td>
      <td className="max-w-[180px] truncate text-sm">{row.note}</td>
      <td>
        <div className="action-bar">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <button type="button">
                <Pencil className="h-3.5 w-3.5" /> Sửa
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Cập nhật bàn giao</DialogTitle>
              </DialogHeader>
              <HandoverForm docTypes={docTypes} initial={initial} onSaved={() => setOpen(false)} />
            </DialogContent>
          </Dialog>
          <ConfirmDialog
            title="Xoá bàn giao?"
            description={<>Xoá bàn giao <strong>{row.category}</strong> ngày hồ sơ {dateVN(row.recordDate)}.</>}
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
