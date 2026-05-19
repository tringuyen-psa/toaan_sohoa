"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { UserRound } from "lucide-react";

type U = { id: string; name: string; username: string };

export function UserPicker({ users, currentId }: { users: U[]; currentId?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();

  function pick(id: string) {
    const params = new URLSearchParams(Array.from(search.entries()));
    if (id) params.set("user", id);
    else params.delete("user");
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <UserRound className="h-4 w-4 text-slate-500" />
      <span className="text-sm text-slate-700 font-medium">Người thực hiện:</span>
      <select
        value={currentId ?? ""}
        onChange={(e) => pick(e.target.value)}
        className="h-9 rounded-md border border-input bg-background px-3 text-sm font-medium min-w-[180px]"
      >
        <option value="">— chọn người —</option>
        {users.map((u) => (
          <option key={u.id} value={u.id}>{u.name}</option>
        ))}
      </select>
    </div>
  );
}
