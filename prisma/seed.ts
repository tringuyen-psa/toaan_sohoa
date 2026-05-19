import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DOC_TYPES = [
  "Hồ sơ xử lý đơn",
  "Hồ sơ thụ lý",
  "Công văn đến",
  "Công văn đi - tố tụng",
  "Sổ kết quả - quyết định",
  "HNGĐ",
  "Dân sự",
  "KDTM",
  "Hành chính",
  "Phá sản",
  "Lao động",
];

async function main() {
  const adminPwd = await bcrypt.hash("admin123", 10);
  await prisma.user.upsert({
    where: { username: "admin" },
    update: { passwordPlain: "admin123" },
    create: {
      username: "admin",
      name: "Quản trị viên",
      passwordHash: adminPwd,
      passwordPlain: "admin123",
      role: Role.ADMIN,
      active: true,
    },
  });

  const demoPwd = await bcrypt.hash("user123", 10);
  for (const name of ["Nguyễn Văn A", "Trần Thị B", "Lê Văn C", "Phạm Thị D"]) {
    const username = name
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/đ/gi, "d")
      .toLowerCase()
      .replace(/\s+/g, ".");
    await prisma.user.upsert({
      where: { username },
      update: { passwordPlain: "user123" },
      create: {
        username,
        name,
        passwordHash: demoPwd,
        passwordPlain: "user123",
        role: Role.USER,
        active: true,
      },
    });
  }

  for (const name of DOC_TYPES) {
    await prisma.documentType.upsert({
      where: { name },
      update: {},
      create: { name, active: true },
    });
  }

  console.log("✅ Seeded admin (admin/admin123), 4 demo users (user123) và", DOC_TYPES.length, "loại hồ sơ");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
