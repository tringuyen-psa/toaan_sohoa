import { prisma } from "@/lib/prisma";
import { getActiveDocTypes, getActiveUsers } from "@/lib/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EntryForm } from "./entries/entry-form";
import { EntryRow } from "./entries/entry-row";
import { UserPicker } from "./entries/user-picker";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: { user?: string };
}) {
  const [docTypes, users] = await Promise.all([getActiveDocTypes(), getActiveUsers()]);

  const selectedUserId = searchParams.user && users.some((u) => u.id === searchParams.user)
    ? searchParams.user
    : undefined;

  // Workdays for the last 60 days — used to pre-fill hours in the form
  const recentSince = new Date();
  recentSince.setDate(recentSince.getDate() - 60);

  const [entries, recentWorkdays] = await Promise.all([
    prisma.productivityEntry.findMany({
      where: selectedUserId ? { userId: selectedUserId } : {},
      include: {
        docType: { select: { id: true, name: true } },
        user: { select: { id: true, name: true } },
      },
      orderBy: [{ workDate: "desc" }, { createdAt: "desc" }],
      take: 100,
    }),
    prisma.workday.findMany({
      where: { workDate: { gte: recentSince } },
      select: { userId: true, workDate: true, hours: true },
    }),
  ]);

  const workdaysForForm = recentWorkdays.map((w) => ({
    userId: w.userId,
    workDate: w.workDate,
    hours: w.hours,
  }));

  const selectedUser = users.find((u) => u.id === selectedUserId);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1e3a8a]">Nhập liệu năng suất</h1>
          <p className="text-sm text-slate-600">
            {selectedUser
              ? <>Đang nhập với tư cách <strong>{selectedUser.name}</strong>. Bấm sửa/xoá ngay trên bảng.</>
              : <>Chọn người thực hiện ở góc phải để xem danh sách, hoặc bắt đầu thêm bản ghi ngay phía dưới.</>}
          </p>
        </div>
        <UserPicker users={users} currentId={selectedUserId} />
      </div>

      <Card className="border-2 border-[#1e3a8a]/20 shadow-md ring-1 ring-[#1e3a8a]/5">
        <CardHeader className="bg-gradient-to-r from-[#1e3a8a]/10 via-blue-500/5 to-transparent border-b">
          <CardTitle className="text-lg font-bold text-[#1e3a8a] uppercase tracking-wide">
            Thêm bản ghi số hóa mới
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-5">
          <EntryForm
            docTypes={docTypes}
            users={users}
            workdays={workdaysForForm}
            defaultUserId={selectedUserId}
          />
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
                    <th className="text-center">Số HS</th>
                    <th className="text-center">Số trang</th>
                    <th className="text-center">Số trang đã upload</th>
                    <th className="text-center">Lỗi</th>
                    <th>Trạng thái</th>
                    <th>Ghi chú</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((row) => (
                    <EntryRow key={row.id} row={row} docTypes={docTypes} users={users} workdays={workdaysForForm} />
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
