import { requireAdmin } from "@/lib/rbac";
import { getAllUsers } from "@/lib/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateUserForm } from "./create-user-form";
import { UserTable } from "./user-table";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  await requireAdmin();
  const users = await getAllUsers();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#1e3a8a]">Quản lý người dùng</h1>

      <Card>
        <CardHeader>
          <CardTitle>Thêm người dùng mới</CardTitle>
        </CardHeader>
        <CardContent>
          <CreateUserForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <UserTable users={users} />
        </CardContent>
      </Card>
    </div>
  );
}
