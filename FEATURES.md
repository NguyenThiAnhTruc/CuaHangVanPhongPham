# OfficeStore - Hệ thống Bán hàng Văn phòng Phẩm

## Tổng quan

OfficeStore là một nền tảng e-commerce hiện đại cho phép khách hàng mua bán văn phòng phẩm trực tuyến. Hệ thống tích hợp đầy đủ các tính năng quản lý sản phẩm, đơn hàng, giỏ hàng và tài khoản người dùng.

## Kiến trúc Công nghệ

- **Frontend**: Next.js + React 18 + TypeScript + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Real-time)
- **Package Manager**: npm
- **Build Tool**: Next.js

## Cơ Sở Dữ Liệu

### Bảng chính

1. **profiles** - Thông tin người dùng
   - id (uuid, PK)
   - email (text, unique)
   - full_name (text)
   - phone (text)
   - address (text)
   - is_admin (boolean)
   - created_at, updated_at (timestamptz)

2. **categories** - Danh mục sản phẩm
   - id (uuid, PK)
   - name (text)
   - description (text)
   - slug (text, unique)
   - created_at (timestamptz)

3. **products** - Sản phẩm
   - id (uuid, PK)
   - category_id (uuid, FK)
   - name (text)
   - description (text)
   - price (numeric)
   - stock (integer)
   - image_url (text)
   - is_active (boolean)
   - created_at, updated_at (timestamptz)

4. **cart_items** - Giỏ hàng
   - id (uuid, PK)
   - user_id (uuid, FK)
   - product_id (uuid, FK)
   - quantity (integer)
   - created_at, updated_at (timestamptz)

5. **orders** - Đơn hàng
   - id (uuid, PK)
   - user_id (uuid, FK)
   - total_amount (numeric)
   - status (text): pending, confirmed, shipping, delivered, cancelled
   - customer_name (text)
   - customer_phone (text)
   - customer_address (text)
   - notes (text)
   - created_at, updated_at (timestamptz)

6. **order_items** - Chi tiết đơn hàng
   - id (uuid, PK)
   - order_id (uuid, FK)
   - product_id (uuid, FK)
   - product_name (text)
   - quantity (integer)
   - price (numeric)
   - created_at (timestamptz)

## Tính năng chính

### Cho Khách hàng (Guest/Customer)

#### Đăng ký & Đăng nhập

- Tạo tài khoản với email và mật khẩu
- Đăng nhập an toàn bằng Supabase Auth
- Quản lý phiên làm việc tự động
- Xác thực lỗi chi tiết

#### Xem sản phẩm

- Trang chủ hiển thị sản phẩm nổi bật
- Danh sách đầy đủ sản phẩm với lọc theo danh mục
- Tìm kiếm sản phẩm theo tên
- Xem chi tiết sản phẩm (mô tả, giá, tồn kho)
- Hiển thị hình ảnh từ Pexels

#### Giỏ hàng

- Thêm sản phẩm vào giỏ (kiểm tra tồn kho)
- Cập nhật số lượng sản phẩm
- Xóa sản phẩm khỏi giỏ
- Hiển thị tổng giá
- Kiểm tra tồn kho trước khi mua

#### Đặt hàng

- Nhập thông tin giao hàng
- Thêm ghi chú đơn hàng tùy chọn
- Kiểm tra tồn kho cuối cùng trước khi thanh toán
- Xác nhận đơn hàng thành công
- Tự động xóa giỏ hàng sau khi đặt

#### Quản lý đơn hàng (Khách hàng)

- Xem danh sách đơn hàng của mình
- Xem chi tiết mỗi đơn hàng (sản phẩm, số lượng, giá)
- Theo dõi trạng thái đơn hàng
- Xem thông tin giao hàng

#### Quản lý tài khoản

- Cập nhật họ và tên
- Cập nhật số điện thoại
- Cập nhật địa chỉ mặc định
- Thông tin được dùng làm mặc định khi đặt hàng

### Cho Quản trị viên (Admin)

#### Quản lý sản phẩm

- Xem danh sách tất cả sản phẩm
- Thêm sản phẩm mới
- Chỉnh sửa sản phẩm
- Xóa sản phẩm
- Cập nhật giá
- Cập nhật tồn kho
- Hiển thị/ẩn sản phẩm

#### Quản lý đơn hàng

- Xem danh sách tất cả đơn hàng
- Cập nhật trạng thái đơn hàng (pending → confirmed → shipping → delivered)
- Hủy đơn hàng
- Xem chi tiết sản phẩm trong đơn hàng
- Xem thông tin giao hàng khách hàng

## Bảo mật (RLS - Row Level Security)

### Policies

**Profiles:**

- Người dùng có thể xem profile của mình
- Người dùng có thể cập nhật profile của mình
- Admin có thể xem tất cả profiles

**Products:**

- Ai cũng có thể xem sản phẩm hoạt động (is_active=true)
- Admin có thể xem tất cả sản phẩm
- Chỉ Admin có thể thêm/sửa/xóa sản phẩm

**Cart Items:**

- Người dùng chỉ có thể quản lý giỏ của mình

**Orders:**

- Người dùng chỉ có thể xem đơn hàng của mình
- Admin có thể xem/cập nhật tất cả đơn hàng

**Order Items:**

- Người dùng có thể xem chi tiết đơn hàng của mình
- Admin có thể xem tất cả chi tiết đơn hàng

## Thông báo (Toast)

Hệ thống thông báo ngữ cảnh:

- **Success**: Thêm vào giỏ hàng thành công
- **Error**: Lỗi khi thêm vào giỏ, không đủ tồn kho
- **Info**: Thông tin chung

## Xác thực lỗi

### Đăng ký

- Kiểm tra email trống/hợp lệ
- Kiểm tra mật khẩu ≥ 6 ký tự
- Kiểm tra mật khẩu xác nhận khớp
- Kiểm tra họ và tên ≥ 3 ký tự
- Kiểm tra email đã đăng ký

### Đăng nhập

- Kiểm tra email/mật khẩu trống
- Thông báo sai thông tin
- Kiểm tra email xác nhận

### Giỏ hàng và Thanh toán

- Kiểm tra tồn kho trước thêm
- Kiểm tra tồn kho khi cập nhật số lượng
- Ngăn vượt quá tồn kho

### Thanh toán

- Kiểm tra thông tin giao hàng đầy đủ
- Kiểm tra tồn kho cuối cùng
- Kiểm tra tính toán giá đúng

## Hướng dẫn sử dụng

### Bắt đầu

1. Truy cập trang chủ
2. Xem sản phẩm nổi bật hoặc lọc theo danh mục
3. Đăng ký tài khoản mới (hoặc đăng nhập)
4. Thêm sản phẩm vào giỏ hàng
5. Xem giỏ hàng và tiến hành thanh toán
6. Nhập thông tin giao hàng
7. Xác nhận đơn hàng
8. Theo dõi đơn hàng trong "Đơn hàng của tôi"

### Cho Admin

1. Đăng nhập với tài khoản admin
2. Truy cập "Quản trị" từ navigation
3. Quản lý sản phẩm hoặc đơn hàng
4. Cập nhật trạng thái đơn hàng khi cần

## Môi trường

```sql
NEXT_PUBLIC_SUPABASE_URL=<your_supabase_url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your_anon_key>
```

## Chạy ứng dụng

```bash
# Phát triển
npm run dev

# Build
npm run build

# Xem trước
npm run preview
```

## Dữ liệu mẫu

Hệ thống được tải sẵn với:

- 5 danh mục sản phẩm
- 12 sản phẩm mẫu với hình ảnh

## Tính năng trong tương lai

- Thanh toán trực tuyến (Stripe)
- Đánh giá sản phẩm
- Yêu thích sản phẩm
- Email thông báo
- Theo dõi đơn hàng real-time
- Báo cáo thống kê cho admin
- Chat hỗ trợ khách hàng
