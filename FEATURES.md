# Chức Năng Dự Án OfficeStore

## 1. Tổng Quan

**OfficeStore** là website bán văn phòng phẩm trực tuyến được xây dựng bằng **Next.js App Router**, **TypeScript**, **Tailwind CSS** và **Supabase**. Dự án hỗ trợ người dùng mua hàng, quản lý giỏ hàng, đặt hàng, theo dõi đơn hàng và trao đổi trực tiếp với admin. Phía quản trị viên có các chức năng quản lý sản phẩm, danh mục, đơn hàng, chat và xuất dữ liệu.

## 2. Công Nghệ Sử Dụng

- **Frontend:** Next.js App Router, React, TypeScript.
- **CSS/UI:** Tailwind CSS, lucide-react icons.
- **Backend:** Supabase Auth, PostgreSQL Database, Storage, Realtime.
- **Bảo mật:** Row Level Security cho từng nhóm user/admin.
- **Triển khai:** Dockerfile và Docker Compose.
- **Quản lý source:** Git/GitHub.

## 3. Chức Năng Người Dùng

### 3.1. Đăng Ký Và Đăng Nhập

- Đăng ký tài khoản bằng email và mật khẩu.
- Đăng nhập bằng email và mật khẩu.
- Đăng nhập bằng Google/Facebook thông qua Supabase OAuth.
- Tự động tạo profile sau khi đăng ký hoặc đăng nhập OAuth.
- Lưu thông tin phiên đăng nhập bằng Supabase Auth.

### 3.2. Xem Sản Phẩm

- Xem sản phẩm nổi bật ở trang chủ.
- Xem danh sách sản phẩm đang hoạt động.
- Lọc sản phẩm theo danh mục.
- Tìm kiếm sản phẩm theo tên.
- Xem điểm đánh giá trung bình và số lượt đánh giá.
- Xem chi tiết sản phẩm gồm:
  - Tên sản phẩm.
  - Mô tả.
  - Giá bán.
  - Tồn kho.
  - Ảnh sản phẩm.
  - Danh sách đánh giá.

### 3.3. Sản Phẩm Yêu Thích

- Người dùng có thể bấm tim để lưu sản phẩm yêu thích.
- Có trang riêng để xem danh sách sản phẩm yêu thích.
- Có thể bỏ lưu sản phẩm khỏi danh sách yêu thích.
- Có thể thêm sản phẩm yêu thích vào giỏ hàng.

### 3.4. Đánh Giá Sản Phẩm

- Người dùng xem đánh giá của các khách hàng khác.
- Hiển thị số sao trung bình của sản phẩm.
- Người dùng chỉ được đánh giá sản phẩm đã mua và đơn hàng đã giao thành công.
- Mỗi người dùng chỉ có một đánh giá cho mỗi sản phẩm.
- Người dùng có thể cập nhật lại đánh giá của mình.
- Admin có thể quản lý/ẩn đánh giá thông qua quyền RLS.

### 3.5. Giỏ Hàng

- Thêm sản phẩm vào giỏ hàng.
- Tăng/giảm số lượng sản phẩm.
- Không cho vượt quá số lượng tồn kho.
- Xóa sản phẩm khỏi giỏ hàng.
- Tính tổng tiền giỏ hàng.
- Cập nhật số lượng sản phẩm trên biểu tượng giỏ hàng.

### 3.6. Thanh Toán Và Đặt Hàng

- Nhập thông tin giao hàng:
  - Họ tên.
  - Số điện thoại.
  - Địa chỉ.
  - Ghi chú đơn hàng.
- Kiểm tra số điện thoại hợp lệ.
- Chọn phương thức thanh toán:
  - Thanh toán khi nhận hàng.
  - Chuyển khoản ngân hàng.
- Kiểm tra giỏ hàng rỗng trước khi đặt hàng.
- Kiểm tra tồn kho lần cuối trước khi tạo đơn.
- Tạo đơn hàng từ giỏ hàng bằng RPC `create_order_from_cart`.
- Tự động trừ tồn kho sau khi đặt hàng.
- Tự động xóa giỏ hàng sau khi đặt hàng thành công.
- Hiển thị mã đơn hàng sau khi đặt hàng thành công.

### 3.7. Quản Lý Đơn Hàng Cá Nhân

- Xem danh sách đơn hàng của tài khoản đang đăng nhập.
- Xem trạng thái đơn hàng:
  - Chờ xác nhận.
  - Đã xác nhận.
  - Đang giao hàng.
  - Đã giao hàng.
  - Đã hủy.
- Xem thông tin người nhận và địa chỉ giao hàng.
- Xem ghi chú và phương thức thanh toán trong đơn hàng.
- Xem chi tiết sản phẩm trong đơn.
- Hủy đơn hàng khi đơn còn trạng thái chờ xác nhận.
- Khi hủy đơn, hệ thống cộng lại tồn kho bằng RPC `cancel_pending_order`.

### 3.8. Hồ Sơ Cá Nhân

- Xem thông tin tài khoản.
- Cập nhật họ tên.
- Cập nhật số điện thoại.
- Cập nhật địa chỉ mặc định.
- Thông tin profile được dùng mặc định ở trang thanh toán.

### 3.9. Chat Với Admin

- Người dùng mở cửa sổ chat để trao đổi với admin.
- Gửi tin nhắn hỏi về sản phẩm, giá bán, tồn kho, thanh toán, giao hàng hoặc đơn hàng.
- Xem lại lịch sử tin nhắn.
- Tin nhắn được lưu vào Supabase Database.
- Hỗ trợ Realtime để cập nhật hội thoại.

## 4. Chức Năng Admin

### 4.1. Dashboard Quản Trị

- Xem tổng số sản phẩm.
- Xem số đơn hàng.
- Xem doanh thu.
- Xem đơn đang chờ xử lý.
- Xem sản phẩm tồn kho thấp.
- Truy cập nhanh đến quản lý sản phẩm, danh mục, đơn hàng và chat.

### 4.2. Quản Lý Sản Phẩm

- Xem toàn bộ sản phẩm, bao gồm sản phẩm đang ẩn.
- Thêm sản phẩm mới.
- Sửa thông tin sản phẩm.
- Xóa sản phẩm.
- Cập nhật:
  - Danh mục.
  - Tên sản phẩm.
  - Mô tả.
  - Giá bán.
  - Tồn kho.
  - Ảnh sản phẩm.
  - Trạng thái hiển thị.
- Upload ảnh sản phẩm lên Supabase Storage.
- Lưu URL ảnh công khai vào bảng `products`.
- Xuất danh sách sản phẩm dạng CSV mở được bằng Excel.
- Dùng hộp thoại trong ứng dụng để báo lỗi/thành công, không dùng hộp thoại mặc định của trình duyệt.

### 4.3. Quản Lý Danh Mục

- Xem danh sách danh mục sản phẩm.
- Thêm danh mục mới.
- Sửa danh mục.
- Xóa danh mục.
- Tự động tạo slug từ tên danh mục.
- Dùng modal xác nhận xóa danh mục.

### 4.4. Quản Lý Đơn Hàng

- Xem tất cả đơn hàng của người dùng.
- Xem thông tin khách hàng.
- Xem địa chỉ giao hàng.
- Xem ghi chú và phương thức thanh toán.
- Xem chi tiết sản phẩm trong từng đơn hàng.
- Cập nhật trạng thái đơn hàng:
  - Chờ xác nhận.
  - Đã xác nhận.
  - Đang giao hàng.
  - Đã giao hàng.
  - Đã hủy.
- Xuất dữ liệu đơn hàng dạng CSV.

### 4.5. Quản Lý Chat

- Xem danh sách cuộc trò chuyện với khách hàng.
- Xem tin nhắn mới nhất.
- Xem số tin nhắn chưa đọc.
- Đọc nội dung hội thoại.
- Trả lời tin nhắn của từng khách hàng.
- Đánh dấu tin nhắn đã đọc.
- Đóng/mở trạng thái cuộc trò chuyện.

## 5. Chức Năng Supabase

### 5.1. Auth

- Đăng ký và đăng nhập email/password.
- OAuth Google/Facebook.
- Tự tạo profile khi có user mới.
- Phân quyền admin bằng trường `is_admin`.

### 5.2. Database

Các bảng chính:

- `profiles`
- `categories`
- `products`
- `cart_items`
- `orders`
- `order_items`
- `product_images`
- `category_images`
- `profile_avatars`
- `conversations`
- `messages`
- `wishlist_items`
- `product_reviews`

### 5.3. Row Level Security

- Người dùng chỉ xem và sửa profile của chính mình.
- Người dùng chỉ quản lý giỏ hàng của chính mình.
- Người dùng chỉ xem đơn hàng của chính mình.
- Admin có quyền quản lý sản phẩm, danh mục và đơn hàng.
- Admin có quyền xem và trả lời chat của khách hàng.
- Public có thể xem danh mục và sản phẩm đang hoạt động.

### 5.4. RPC

- `create_order_from_cart`: tạo đơn từ giỏ hàng, kiểm tra tồn kho, trừ tồn kho và xóa giỏ hàng.
- `cancel_pending_order`: cho phép khách hủy đơn đang chờ xác nhận và cộng lại tồn kho.
- `send_customer_message`: khách gửi tin nhắn cho admin.
- `send_admin_message`: admin trả lời tin nhắn.
- `get_admin_conversations`: admin lấy danh sách hội thoại.
- `get_conversation_messages`: lấy tin nhắn trong một hội thoại.
- `mark_conversation_messages_read`: đánh dấu tin nhắn đã đọc.
- `has_user_purchased_product`: kiểm tra người dùng đã mua và nhận sản phẩm để được đánh giá.

### 5.5. Storage

- Bucket `product-images` cho ảnh sản phẩm.
- Bucket `category-images` cho ảnh danh mục.
- Bucket `user-avatars` cho ảnh đại diện.
- Policy upload ảnh sản phẩm/danh mục chỉ dành cho admin.

### 5.6. Realtime

- Bật realtime cho bảng chat.
- Hỗ trợ cập nhật hội thoại và tin nhắn giữa user/admin.

## 6. Bảo Mật Và Kiểm Tra Dữ Liệu

- Không lưu service role key ở frontend.
- Không commit file `.env`.
- Dùng `.env.example` để hướng dẫn cấu hình biến môi trường.
- Kiểm tra quyền admin bằng hàm `public.is_admin()`.
- Dùng RPC `SECURITY DEFINER` cho các thao tác cần bảo vệ như tạo đơn, hủy đơn và chat.
- Kiểm tra tồn kho ở cả frontend và database.
- Không cho user tự ý cập nhật đơn hàng trực tiếp.

## 7. Docker Và Triển Khai

- Có `Dockerfile` để build ứng dụng Next.js.
- Có `docker-compose.yml` để chạy container.
- App chạy mặc định ở cổng `3000`.
- Có thể triển khai lên VPS với domain và SSL.
- Khi deploy cần cấu hình:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - URL redirect OAuth trong Supabase.

## 8. Tài Khoản Demo

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

## 9. Kiểm Tra Dự Án

Các lệnh kiểm tra:

```bash
npm run typecheck
npm run lint
npm run build
```

Các chức năng cần test thủ công:

- Đăng nhập admin.
- Đăng nhập user.
- Xem sản phẩm.
- Thêm sản phẩm vào giỏ.
- Đặt hàng.
- Hủy đơn khi đơn còn chờ xác nhận.
- Admin cập nhật trạng thái đơn.
- Admin thêm/sửa/xóa sản phẩm.
- Admin upload ảnh sản phẩm.
- Admin thêm/sửa/xóa danh mục.
- Chat user với admin.
- Xuất file CSV sản phẩm và đơn hàng.
