import { requireAdmin } from "@/lib/rbac";
import { getActiveDocTypes, getActiveUsers } from "@/lib/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExportForm } from "./export-form";

export const dynamic = "force-dynamic";

export default async function ExportPage() {
  await requireAdmin();
  const [users, docTypes] = await Promise.all([getActiveUsers(), getActiveDocTypes()]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1e3a8a]">Xuất file Excel</h1>
        <p className="text-sm text-slate-600">
          Chọn khoảng thời gian, bộ lọc và chế độ xuất. File trả về định dạng <code>.xlsx</code>.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tuỳ chọn xuất</CardTitle>
        </CardHeader>
        <CardContent>
          <ExportForm users={users} docTypes={docTypes} />
        </CardContent>
      </Card>
    </div>
  );
}
