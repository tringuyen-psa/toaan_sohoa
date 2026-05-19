# QuanTri_NangSuat_SoHoa

Hệ thống quản trị năng suất số hóa hồ sơ — Next.js 14 + Prisma + Neon Postgres + NextAuth + Tailwind/shadcn.

## Tính năng

- **Dashboard công khai** (`/`) — bảng năng suất theo tuần (giống mẫu Excel) + biểu đồ + KPI cards. Ai cũng xem được, không cần đăng nhập.
- **Đăng nhập** (`/login`) — credentials (username + password).
- **Nhập liệu** (`/entries`) — user nhập số HS, số trang, upload, lỗi, giờ làm. Chỉ sửa/xoá bản ghi của chính mình.
- **Admin** (`/admin/*`):
  - `users` — tạo user, đặt mật khẩu, đổi quyền (USER/ADMIN), khoá/mở tài khoản.
  - `document-types` — quản lý danh mục loại hồ sơ (HNGĐ, KDTM, Dân sự, ...).
  - `reports` — báo cáo tổng hợp theo tháng, theo người, theo loại hồ sơ.

## Bắt đầu

```bash
# 1. Cài dependencies
npm install

# 2. Tạo .env (đã có sẵn) hoặc copy từ .env.example
cp .env.example .env       # chỉnh DATABASE_URL và NEXTAUTH_SECRET

# 3. Push schema lên Neon
npm run db:push

# 4. Seed dữ liệu mẫu (admin + 4 user + 11 loại hồ sơ)
npm run db:seed

# 5. Chạy dev server
npm run dev
```

Mở http://localhost:3000

### Tài khoản mặc định

| Username | Password | Quyền |
|---|---|---|
| `admin` | `admin123` | ADMIN |
| `nguyen.van.a` | `user123` | USER |
| `tran.thi.b` | `user123` | USER |
| `le.van.c` | `user123` | USER |
| `pham.thi.d` | `user123` | USER |

> **Đổi ngay mật khẩu admin sau lần đăng nhập đầu tiên** (vào `/admin/users` → nút "MK").

## Scripts

| Lệnh | Tác dụng |
|---|---|
| `npm run dev` | Dev server (http://localhost:3000) |
| `npm run build` | Build production |
| `npm run start` | Chạy production |
| `npm run db:push` | Đồng bộ schema Prisma → DB (không tạo migration file) |
| `npm run db:migrate` | Tạo migration file |
| `npm run db:seed` | Chạy seed script |
| `npm run db:studio` | Mở Prisma Studio |

## Cấu trúc thư mục

```
app/
  page.tsx                      # Dashboard (public)
  login/page.tsx
  entries/                      # User nhập liệu
  admin/
    users/
    document-types/
    reports/
  api/auth/[...nextauth]/route.ts
components/
  ui/                           # shadcn primitives
  dashboard/                    # weekly table, charts, kpi cards, week picker
  header.tsx
  providers.tsx
lib/
  prisma.ts                     # singleton Prisma client
  auth.ts                       # NextAuth config
  rbac.ts                       # requireUser / requireAdmin
  queries.ts
  utils.ts                      # formatNumber, pagesPerHour, ...
  week.ts                       # ISO week helpers
prisma/
  schema.prisma
  seed.ts
middleware.ts                   # protect /entries và /admin/*
```

## Database schema

```
User              { id, username, name, passwordHash, role[ADMIN|USER], active, createdAt }
DocumentType      { id, name, note, active }
ProductivityEntry { id, userId, docTypeId, workDate, numRecords, numPages,
                    numUploaded, numErrors, hours, status, note, ... }
```

`trangPerGio` được tính khi render (không lưu) — tránh lệch khi user sửa.

## Deploy

Project chuẩn Next.js, deploy được lên Vercel / Railway / Render / VPS.

Biến môi trường cần thiết:

- `DATABASE_URL` — Neon Postgres
- `NEXTAUTH_SECRET` — chuỗi ngẫu nhiên 32+ ký tự (`openssl rand -base64 32`)
- `NEXTAUTH_URL` — URL public của site (ở prod)

Khi deploy lần đầu trên Vercel:
1. Set 3 env vars ở trên trong Project Settings.
2. Sau lần build đầu, chạy `npm run db:push` và `npm run db:seed` (local hoặc trong shell tạm).
3. Đổi mật khẩu admin.
