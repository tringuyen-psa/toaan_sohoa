"use client";

import { useTransition, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { toggleActive, resetPassword, updateRole, updateUser, deleteUser } from "./actions";
import { toast } from "sonner";
import { Role } from "@prisma/client";
import { KeyRound, ShieldCheck, ShieldOff, Pencil, Trash2, Eye, EyeOff, Copy } from "lucide-react";

type U = {
  id: string;
  username: string;
  name: string;
  role: Role;
  active: boolean;
  passwordPlain: string | null;
  createdAt: Date;
};

export function UserTable({ users }: { users: U[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="dashboard-table">
        <thead>
          <tr>
            <th>Họ tên</th>
            <th>Tên đăng nhập</th>
            <th>Mật khẩu</th>
            <th>Quyền</th>
            <th>Trạng thái</th>
            <th>Ngày tạo</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <UserRow key={u.id} user={u} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function UserRow({ user: u }: { user: U }) {
  const [pending, start] = useTransition();

  function onToggle() {
    start(async () => {
      const r = await toggleActive(u.id);
      if (r.ok) toast.success(u.active ? "Đã khoá" : "Đã kích hoạt");
    });
  }

  function onRoleChange(role: Role) {
    if (u.role === role) return;
    start(async () => {
      await updateRole(u.id, role);
      toast.success("Đã đổi quyền");
    });
  }

  function onDelete() {
    start(async () => {
      const r = await deleteUser(u.id);
      if (r.ok) toast.success(r.message ?? "Đã xoá");
      else toast.error(r.message ?? "Lỗi");
    });
  }

  return (
    <tr>
      <td className="font-medium">{u.name}</td>
      <td><code className="text-xs">{u.username}</code></td>
      <td><PasswordCell value={u.passwordPlain} /></td>
      <td>
        <ConfirmDialog
          title="Đổi quyền user?"
          description={<>Đổi quyền của <strong>{u.name}</strong> từ <code>{u.role}</code> sang <code>{u.role === "ADMIN" ? "USER" : "ADMIN"}</code>.</>}
          variant="default"
          confirmLabel="Đổi quyền"
          onConfirm={() => onRoleChange(u.role === "ADMIN" ? "USER" : "ADMIN")}
          trigger={
            <button className="h-7 rounded border border-input bg-background px-2 text-xs font-medium hover:bg-slate-50">
              {u.role}
            </button>
          }
        />
      </td>
      <td>
        {u.active
          ? <Badge variant="success">Hoạt động</Badge>
          : <Badge variant="destructive">Khoá</Badge>}
      </td>
      <td className="text-xs text-slate-500 whitespace-nowrap">
        {new Date(u.createdAt).toLocaleDateString("vi-VN")}
      </td>
      <td>
        <div className="action-bar">
          <EditUserButton user={u} />
          <ResetPasswordButton userId={u.id} name={u.name} />
          <ConfirmDialog
            title={u.active ? "Khoá tài khoản?" : "Kích hoạt tài khoản?"}
            description={
              u.active
                ? <>User <strong>{u.name}</strong> sẽ không đăng nhập được cho đến khi được kích hoạt lại.</>
                : <>User <strong>{u.name}</strong> sẽ đăng nhập lại được.</>
            }
            variant={u.active ? "destructive" : "default"}
            confirmLabel={u.active ? "Khoá" : "Kích hoạt"}
            onConfirm={onToggle}
            trigger={
              <button disabled={pending} type="button">
                {u.active
                  ? <><ShieldOff className="h-3.5 w-3.5" /> Khoá</>
                  : <><ShieldCheck className="h-3.5 w-3.5" /> Bật</>}
              </button>
            }
          />
          <ConfirmDialog
            title="Xoá user?"
            description={<>Xoá user <strong>{u.name}</strong> ({u.username}). Chỉ xoá được nếu user chưa có bản ghi nào — nếu có sẵn bản ghi, hãy khoá thay vì xoá.</>}
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

function PasswordCell({ value }: { value: string | null }) {
  const [shown, setShown] = useState(false);
  if (!value) return <span className="text-xs text-slate-400 italic">không lưu</span>;

  function copy() {
    navigator.clipboard.writeText(value!).then(
      () => toast.success("Đã copy"),
      () => toast.error("Không copy được")
    );
  }

  return (
    <div className="flex items-center gap-1">
      <code className="text-xs px-1.5 py-0.5 bg-slate-100 rounded min-w-[80px] inline-block">
        {shown ? value : "••••••••"}
      </code>
      <button
        type="button"
        onClick={() => setShown((s) => !s)}
        className="text-slate-500 hover:text-slate-900"
        title={shown ? "Ẩn" : "Hiện"}
      >
        {shown ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
      </button>
      <button
        type="button"
        onClick={copy}
        className="text-slate-500 hover:text-slate-900"
        title="Copy"
      >
        <Copy className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function EditUserButton({ user }: { user: U }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(user.name);
  const [username, setUsername] = useState(user.username);
  const [pending, start] = useTransition();

  function submit() {
    if (name.trim().length === 0) {
      toast.error("Họ tên không được trống");
      return;
    }
    start(async () => {
      const r = await updateUser(user.id, { name: name.trim(), username: username.trim() });
      if (r.ok) {
        toast.success(r.message ?? "Đã cập nhật");
        setOpen(false);
      } else {
        toast.error(r.message ?? "Lỗi");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button type="button">
          <Pencil className="h-3.5 w-3.5" /> Sửa
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sửa thông tin user</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-medium">Họ tên</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">Tên đăng nhập</label>
            <Input value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Huỷ</Button>
          <Button onClick={submit} disabled={pending}>Lưu</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ResetPasswordButton({ userId, name }: { userId: string; name: string }) {
  const [open, setOpen] = useState(false);
  const [pwd, setPwd] = useState("");
  const [pending, start] = useTransition();

  function submit() {
    if (pwd.length < 6) {
      toast.error("Tối thiểu 6 ký tự");
      return;
    }
    start(async () => {
      const r = await resetPassword(userId, pwd);
      if (r.ok) {
        toast.success("Đã đổi mật khẩu");
        setOpen(false);
        setPwd("");
      } else {
        toast.error(r.message ?? "Lỗi");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button type="button">
          <KeyRound className="h-3.5 w-3.5" /> MK
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Đặt lại mật khẩu cho {name}</DialogTitle>
        </DialogHeader>
        <Input
          type="text"
          placeholder="Mật khẩu mới (≥ 6 ký tự)"
          value={pwd}
          onChange={(e) => setPwd(e.target.value)}
          autoFocus
        />
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Huỷ</Button>
          <Button onClick={submit} disabled={pending}>Lưu</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
