import { requireAdmin } from "@/lib/rbac";
import { getAllDocTypes } from "@/lib/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DocTypeManager } from "./doc-type-manager";

export const dynamic = "force-dynamic";

export default async function AdminDocTypesPage() {
  await requireAdmin();
  const items = await getAllDocTypes();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#1e3a8a]">Danh mục loại hồ sơ</h1>
      <Card>
        <CardHeader>
          <CardTitle>Danh sách ({items.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <DocTypeManager items={items} />
        </CardContent>
      </Card>
    </div>
  );
}
