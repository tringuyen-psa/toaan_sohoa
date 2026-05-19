import { prisma } from "@/lib/prisma";
import { getActiveDocTypes, getActiveUsers } from "@/lib/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EntryForm } from "./entries/entry-form";
import { EntryRow } from "./entries/entry-row";
import { UserPicker } from "./entries/user-picker";
import { WorkdayWidget } from "./entries/workday-widget";

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

  const today = new Date();
  const todayKey = today.toISOString().slice(0, 10);
  const todayStart = new Date(todayKey + "T00:00:00.000Z");
  const todayEnd = new Date(todayKey + "T23:59:59.999Z");

  const [entries, todayWorkday, todayPagesAgg] = await Promise.all([
    prisma.productivityEntry.findMany({
      where: selectedUserId ? { userId: selectedUserId } : {},
      include: {
        docType: { select: { id: true, name: true } },
        user: { select: { id: true, name: true } },
      },
      orderBy: [{ workDate: "desc" }, { createdAt: "desc" }],
      take: 100,
    }),
    selectedUserId
      ? prisma.workday.findUnique({
          where: { userId_workDate: { userId: selectedUserId, workDate: todayStart } },
        })
      : Promise.resolve(null),
    selectedUserId
      ? prisma.productivityEntry.aggregate({
          _sum: { numPages: true },
          where: { userId: selectedUserId, workDate: { gte: todayStart, lte: todayEnd } },
        })
      : Promise.resolve(null),
  ]);

  const selectedUser = users.find((u) => u.id === selectedUserId);
  const pagesToday = todayPagesAgg?._sum.numPages ?? 0;
  const hoursToday = todayWorkday?.hours ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1e3a8a]">Nhập liệu năng suất</h1>
          <p className="text-sm text-slate-600">
            {selectedUser
              ? <>Đang nhập với tư cách <strong>{selectedUser.name}</strong>. Set giờ làm ngày 1 lần, rồi thêm các bộ hồ sơ phía dưới.</>
              : <>Chọn người thực hiện ở góc phải để bắt đầu nhập.</>}
          </p>
        </div>
        <UserPicker users={users} currentId={selectedUserId} />
      </div>

      <WorkdayWidget
        users={users}
        currentUserId={selectedUserId}
        currentDate={todayKey}
        currentHours={hoursToday}
        pagesToday={pagesToday}
      />

      <Card>
        <CardHeader>
          <CardTitle>Thêm bản ghi số hóa mới</CardTitle>
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
