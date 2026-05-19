"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createUser, type ActionState } from "./actions";
import { toast } from "sonner";

function SubmitBtn() {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending}>{pending ? "Đang tạo..." : "Tạo người dùng"}</Button>;
}

const INIT: ActionState = { ok: false };

export function CreateUserForm() {
  const [state, action] = useFormState(createUser, INIT);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) {
      toast.success(state.message ?? "Đã tạo");
      ref.current?.reset();
    } else if (state.message) {
      toast.error(state.message);
    }
  }, [state]);

  return (
    <form ref={ref} action={action} className="grid grid-cols-1 md:grid-cols-4 gap-3">
      <div className="space-y-1">
        <Label className="text-xs">Họ tên</Label>
        <Input name="name" required />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Tên đăng nhập</Label>
        <Input name="username" required placeholder="vd: nguyen.van.a" />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Mật khẩu</Label>
        <Input name="password" type="text" required placeholder="≥ 6 ký tự" />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Quyền</Label>
        <select
          name="role"
          defaultValue="USER"
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
        >
          <option value="USER">USER</option>
          <option value="ADMIN">ADMIN</option>
        </select>
      </div>
      <div className="md:col-span-4 flex justify-end">
        <SubmitBtn />
      </div>
    </form>
  );
}
