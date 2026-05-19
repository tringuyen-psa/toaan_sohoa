import { requireUser } from "@/lib/rbac";
import { getActiveDocTypes, getMyEntries } from "@/lib/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EntryForm } from "./entry-form";
import { EntryRow } from "./entry-row";

export const dynamic = "force-dynamic";

export default async function EntriesPage() {
  const session = await requireUser();
  const [docTypes, entries] = await Promise.all([
    getActiveDocTypes(),
    getMyEntries(session.user.id, 200),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1e3a8a]">Nhập liệu năng suất</h1>
        <p className="text-sm text-slate-600">
          Xin chào, <strong>{session.user.name}</strong>. Bạn chỉ có thể chỉnh sửa/xoá bản ghi của chính mình.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thêm bản ghi mới</CardTitle>
        </CardHeader>
        <CardContent>
          <EntryForm docTypes={docTypes} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bản ghi gần đây của tôi ({entries.length})</CardTitle>
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
                    <EntryRow key={row.id} row={row} docTypes={docTypes} />
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
