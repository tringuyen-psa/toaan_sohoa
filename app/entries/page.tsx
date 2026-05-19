import { prisma } from "@/lib/prisma";
import { getActiveDocTypes, getActiveUsers } from "@/lib/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EntryForm } from "./entry-form";
import { EntryRow } from "./entry-row";
import { UserPicker } from "./user-picker";

export const dynamic = "force-dynamic";

export default async function EntriesPage({
  searchParams,
}: {
  searchParams: { user?: string };
}) {
  const [docTypes, users] = await Promise.all([getActiveDocTypes(), getActiveUsers()]);

  const selectedUserId = searchParams.user && users.some((u) => u.id === searchParams.user)
    ? searchParams.user
    : undefined;

  const entries = await prisma.productivityEntry.findMany({
    where: selectedUserId ? { userId: selectedUserId } : {},
    include: {
      docType: { select: { id: true, name: true } },
      user: { select: { id: true, name: true } },
    },
    orderBy: [{ workDate: "desc" }, { createdAt: "desc" }],
    take: 100,
  });

  const selectedUser = users.find((u) => u.id === selectedUserId);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1e3a8a]">Nhập liệu năng suất</h1>
          <p className="text-sm text-slate-600">
            {selectedUser
              ? <>Đang nhập với tư cách <strong>{selectedUser.name}</strong>. Bấm sửa/xoá ngay trên bảng.</>
              : <>Chọn người thực hiện trước khi nhập liệu, hoặc xem toàn bộ bản ghi gần đây.</>}
          </p>
        </div>
        <UserPicker users={users} currentId={selectedUserId} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thêm bản ghi mới</CardTitle>
        </CardHeader>
        <CardContent>
          <EntryForm docTypes={docTypes} users={users} defaultUserId={selectedUserId} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {selectedUser
              ? `Bản ghi của ${selectedUser.name} (${entries.length})`
              : `Bản ghi gần đây — toàn bộ (${entries.length})`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <p className="text-sm text-slate-500 italic">Chưa có bản ghi nào.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Ngày</th>
                    <th>Người</th>
                    <th>Loại hồ sơ</th>
                    <th className="text-right">Số HS</th>
                    <th className="text-right">Số trang</th>
                    <th className="text-right">Upload</th>
                    <th className="text-right">Lỗi</th>
                    <th className="text-right">Giờ</th>
                    <th className="text-right">Trang/giờ</th>
                    <th>Trạng thái</th>
                    <th>Ghi chú</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((row) => (
                    <EntryRow key={row.id} row={row} docTypes={docTypes} users={users} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
