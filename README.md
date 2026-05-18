# CuaHangVanPhongPham

OfficeStore là website bán văn phòng phẩm xây dựng bằng Next.js App Router, TypeScript, Tailwind CSS và Supabase.

## Công nghệ

- Frontend: Next.js App Router, React, TypeScript, Tailwind CSS
- Backend: Supabase Auth, Database, Storage policy, Realtime
- Container: Dockerfile, Docker Compose

## Chức năng chính

- Xem danh mục và sản phẩm văn phòng phẩm
- Đăng ký, đăng nhập email/password
- Đăng nhập Google/Facebook qua Supabase OAuth
- Giỏ hàng và đặt hàng
- Trang cá nhân và lịch sử đơn hàng
- Admin quản lý sản phẩm, đơn hàng
- Admin xuất dữ liệu sản phẩm/đơn hàng dạng CSV mở được bằng Excel
- Chat realtime giữa người mua và admin

## Tài khoản demo

Admin:

```text
Email: admin@gmail.com
Password: 123456
```

User:

```text
Email: user1@gmail.com
Password: 123456
```

## Cài đặt

```bash
npm install
cp .env.example .env
npm run dev
```

Cập nhật `.env` bằng Supabase URL và anon key thật:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## Supabase

Chạy các file SQL trong thư mục `supabase/migrations` theo thứ tự tên file.

Các phần chính:

- Schema sản phẩm, danh mục, giỏ hàng, đơn hàng
- RLS policy cho user/admin
- Seed tài khoản demo
- Storage buckets/policies
- Chat customer-admin với realtime và RPC

## Docker

Chạy bằng Docker Compose:

```bash
docker compose up --build
```

Ứng dụng chạy tại:

```text
http://localhost:3000
```

## Kiểm tra

```bash
npm run typecheck
npm run lint
npm run build
```

## Ghi chú nộp bài

- Không commit `.env`, `.next`, `node_modules`, `dist`
- File `.env.example` chỉ chứa mẫu biến môi trường
- Bằng chứng sử dụng AI nằm trong `AI_USAGE.md`
