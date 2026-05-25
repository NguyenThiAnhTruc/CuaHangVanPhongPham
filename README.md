# Cửa Hàng Văn Phòng Phẩm - OfficeStore

OfficeStore là website bán văn phòng phẩm trực tuyến được xây dựng bằng **Next.js App Router**, **TypeScript**, **Tailwind CSS** và **Supabase**. Dự án hỗ trợ khách hàng xem sản phẩm, thêm vào giỏ hàng, đặt hàng, theo dõi đơn hàng, chat với admin, lưu sản phẩm yêu thích và đánh giá sản phẩm sau khi mua. Admin có thể quản lý sản phẩm, danh mục, đơn hàng, chat và xuất dữ liệu.

Dự án cũng hỗ trợ upload ảnh sản phẩm, ảnh đại diện user/admin, đăng nhập Google/Facebook, Docker Compose và triển khai demo bằng Vercel hoặc VPS.

## Công Nghệ Sử Dụng

- **Frontend:** Next.js App Router, React, TypeScript
- **UI:** Tailwind CSS, lucide-react
- **Backend:** Supabase Auth, PostgreSQL Database, Storage, Realtime
- **Bảo mật:** Supabase Row Level Security
- **Container:** Dockerfile, Docker Compose
- **Quản lý mã nguồn:** Git/GitHub

## Chức Năng Chính

### Người Dùng

- Đăng ký, đăng nhập bằng email/password.
- Đăng nhập bằng Google/Facebook qua Supabase OAuth.
- Xem danh sách sản phẩm và lọc theo danh mục.
- Tìm kiếm sản phẩm theo tên.
- Xem chi tiết sản phẩm, tồn kho, giá bán và đánh giá.
- Thêm sản phẩm vào giỏ hàng.
- Tăng/giảm số lượng trong giỏ hàng.
- Đặt hàng với thông tin giao hàng.
- Chọn phương thức thanh toán:
  - Thanh toán khi nhận hàng.
  - Chuyển khoản ngân hàng.
- Xem lịch sử đơn hàng.
- Hủy đơn hàng khi đơn còn trạng thái chờ xác nhận.
- Lưu sản phẩm yêu thích.
- Đánh giá sản phẩm sau khi đơn hàng đã giao thành công.
- Chat trực tiếp với admin.
- Cập nhật hồ sơ cá nhân và ảnh đại diện.

### Admin

- Dashboard thống kê sản phẩm, đơn hàng, doanh thu và tồn kho.
- Quản lý sản phẩm:
  - Thêm sản phẩm.
  - Sửa sản phẩm.
  - Xóa sản phẩm.
  - Upload ảnh sản phẩm lên Supabase Storage.
  - Tối ưu ảnh trước khi upload để giảm dung lượng.
  - Ẩn/hiện sản phẩm.
  - Xuất danh sách sản phẩm dạng CSV mở được bằng Excel.
- Quản lý danh mục:
  - Thêm danh mục.
  - Sửa danh mục.
  - Xóa danh mục.
  - Tự tạo slug.
- Quản lý đơn hàng:
  - Xem đơn hàng.
  - Xem chi tiết sản phẩm trong đơn.
  - Cập nhật trạng thái đơn hàng.
  - Xuất đơn hàng dạng CSV.
- Quản lý chat:
  - Xem danh sách hội thoại.
  - Trả lời tin nhắn khách hàng.
  - Theo dõi tin nhắn đã đọc/chưa đọc.

## Tài Khoản Demo

### Admin

```text
Email: admin@gmail.com
Password: 123456
```

### User

```text
Email: user1@gmail.com
Password: 123456
```

## Cài Đặt Dự Án

### 1. Clone source code

```bash
git clone https://github.com/NguyenThiAnhTruc/CuaHangVanPhongPham.git
cd CuaHangVanPhongPham
```

### 2. Cài dependencies

```bash
npm install
```

### 3. Tạo file môi trường

Tạo file `.env` từ `.env.example`:

```bash
cp .env.example .env
```

Cấu hình:

```text
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 4. Chạy dự án

```bash
npm run dev
```

Ứng dụng chạy mặc định tại:

```text
http://localhost:3000
```

## Cấu Hình Supabase

### 1. Chạy migrations

Vào Supabase SQL Editor và chạy các file trong thư mục:

```text
supabase/migrations
```

Chạy theo đúng thứ tự tên file từ nhỏ đến lớn, ví dụ:

```text
20251117135220_create_officestore_schema.sql
20251117135221_seed_officestore_auth_users.sql
...
20251117135232_create_wishlist_and_reviews.sql
```

Các migration chính bao gồm:

- Schema sản phẩm, danh mục, giỏ hàng, đơn hàng.
- RLS policy cho user/admin.
- Tài khoản demo admin/user.
- Storage bucket cho ảnh sản phẩm, ảnh danh mục, avatar.
- Chat giữa user và admin.
- RPC tạo đơn hàng từ giỏ hàng.
- RPC hủy đơn hàng đang chờ xác nhận.
- Wishlist và đánh giá sản phẩm.
- Avatar user/admin và policy Storage cho bucket `user-avatars`.

### 2. Storage Buckets

Dự án sử dụng các bucket:

- `product-images`
- `category-images`
- `user-avatars`

Admin có quyền upload ảnh sản phẩm và danh mục.
User và admin có thể upload ảnh đại diện của chính mình vào `user-avatars`.

### 3. OAuth Google/Facebook

Nếu dùng đăng nhập Google/Facebook, cần cấu hình trong Supabase:

- Authentication -> Providers -> Google/Facebook.
- Điền Client ID và Client Secret.
- Cấu hình redirect URL trong Google/Facebook Developer Console.
- Khi deploy lên domain thật, cần thêm domain deploy vào redirect URLs.

## Docker

Chạy bằng Docker Compose:

```bash
docker compose up --build
```

Ứng dụng chạy tại:

```text
http://localhost:3000
```

Production deployment với VPS, domain và SSL được mô tả trong:

```text
DEPLOYMENT.md
```

Các file triển khai production:

- `Dockerfile`
- `docker-compose.prod.yml`
- `Caddyfile`

## Kiểm Tra Dự Án

```bash
npm run typecheck
npm run lint
npm run build
```

Ý nghĩa:

- `typecheck`: kiểm tra TypeScript.
- `lint`: kiểm tra quy tắc code.
- `build`: build production bằng Next.js.

## Cấu Trúc Thư Mục

```text
project
├── src
│   ├── app
│   ├── components
│   ├── contexts
│   ├── hooks
│   ├── lib
│   └── views
├── supabase
│   └── migrations
├── Dockerfile
├── docker-compose.yml
├── README.md
├── FEATURES.md
└── AI_USAGE.md
```
## Trạng Thái Kiểm Tra Gần Nhất

Dự án đã được kiểm tra bằng:

```bash
npm run typecheck
npm run lint
npm run build
```
