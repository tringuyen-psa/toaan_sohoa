"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { deleteEntry } from "./actions";
import { EntryForm } from "./entry-form";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatNumber, pagesPerHour } from "@/lib/utils";

type DocType = { id: string; name: string };
type UserOpt = { id: string; name: string };
type Row = {
  id: string;
  userId: string;
  workDate: Date;
  docType: { id: string; name: string };
  user?: { id: string; name: string };
  numRecords: number;
  numPages: number;
  numUploaded: number;
  numErrors: number;
  hours: number;
  status: "DONE" | "IN_PROGRESS" | "REVIEW";
  note: string | null;
};

const STATUS_LABEL: Record<Row["status"], string> = {
  DONE: "Hoàn thành",
  IN_PROGRESS: "Đang làm",
  REVIEW: "Kiểm tra",
};

export function EntryRow({ row, docTypes, users }: { row: Row; docTypes: DocType[]; users: UserOpt[] }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const date = new Date(row.workDate);
  const dateStr = `${String(date.getUTCDate()).padStart(2, "0")}/${String(date.getUTCMonth() + 1).padStart(2, "0")}/${date.getUTCFullYear()}`;
  const isoDate = date.toISOString().slice(0, 10);

  function onDelete() {
    if (!confirm("Xoá bản ghi này?")) return;
    start(async () => {
      const res = await deleteEntry(row.id);
      if (res.ok) toast.success("Đã xoá");
      else toast.error(res.message ?? "Lỗi");
    });
  }

  return (
    <tr>
      <td>{dateStr}</td>
      <td className="font-medium">{row.user?.name ?? "—"}</td>
      <td>{row.docType.name}</td>
      <td className="text-right">{formatNumber(row.numRecords)}</td>
      <td className="text-right">{formatNumber(row.numPages)}</td>
      <td className="text-right">{formatNumber(row.numUploaded)}</td>
      <td className="text-right">{formatNumber(row.numErrors)}</td>
      <td className="text-right">{formatNumber(row.hours, 1)}</td>
      <td className="text-right">{formatNumber(pagesPerHour(row.numPages, row.hours))}</td>
      <td>{STATUS_LABEL[row.status]}</td>
      <td className="max-w-[160px] truncate">{row.note}</td>
      <td>
        <div className="flex gap-1">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="icon" variant="ghost" title="Sửa">
                <Pencil className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Cập nhật bản ghi</DialogTitle>
              </DialogHeader>
              <EntryForm
                docTypes={docTypes}
                users={users}
                initial={{
                  id: row.id,
                  userId: row.userId,
                  docTypeId: row.docType.id,
                  workDate: isoDate,
                  numRecords: row.numRecords,
                  numPages: row.numPages,
                  numUploaded: row.numUploaded,
                  numErrors: row.numErrors,
                  hours: row.hours,
                  status: row.status,
                  note: row.note,
                }}
                onSaved={() => setOpen(false)}
              />
            </DialogContent>
          </Dialog>
          <Button size="icon" variant="ghost" title="Xoá" onClick={onDelete} disabled={pending}>
            <Trash2 className="h-4 w-4 text-rose-600" />
          </Button>
        </div>
      </td>
    </tr>
  );
}
