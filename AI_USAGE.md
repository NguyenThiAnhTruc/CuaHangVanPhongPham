# Minh Chứng Sử Dụng Công Cụ AI

## 1. Mục Đích Sử Dụng

Trong quá trình xây dựng dự án **Cửa Hàng Văn Phòng Phẩm - OfficeStore**, nhóm có sử dụng công cụ AI như một trợ lý hỗ trợ lập trình, phân tích lỗi và hoàn thiện tài liệu. AI không thay thế việc kiểm tra của người phát triển, mà được dùng để tăng tốc quá trình triển khai và rà soát chất lượng.

## 2. Công Cụ AI Đã Sử Dụng

- ChatGPT/Codex trong môi trường lập trình.
- AI được dùng để gợi ý giải pháp, sửa lỗi, viết code, kiểm tra luồng Supabase và hỗ trợ viết tài liệu.

## 3. Các Phần Đã Được AI Hỗ Trợ

### Phân tích yêu cầu dự án

- Đối chiếu yêu cầu bắt buộc của đề tài với dự án thực tế.
- Kiểm tra các tiêu chí: Next.js App Router, TypeScript, Tailwind CSS, Supabase, Docker, GitHub, AI usage.
- Gợi ý các chức năng nên bổ sung để dự án đầy đủ hơn.

### Thiết kế và sửa Supabase

- Hỗ trợ thiết kế schema cho:
  - `profiles`
  - `categories`
  - `products`
  - `cart_items`
  - `orders`
  - `order_items`
  - `conversations`
  - `messages`
- Hỗ trợ viết và sửa Row Level Security policy cho user/admin.
- Sửa lỗi RLS bị đệ quy khi kiểm tra quyền admin bằng hàm `public.is_admin()`.
- Viết RPC tạo đơn hàng từ giỏ hàng bằng `create_order_from_cart`.
- Viết RPC hủy đơn đang chờ xác nhận bằng `cancel_pending_order`.
- Hỗ trợ cấu hình Supabase Storage cho ảnh sản phẩm, ảnh danh mục và avatar.

### Xác thực và đăng nhập

- Sửa luồng đăng nhập email/password cho tài khoản demo.
- Đổi email admin demo thành `admin@gmail.com`.
- Hỗ trợ cấu hình đăng nhập Google/Facebook qua Supabase OAuth.
- Sửa hàm tạo profile tự động cho tài khoản OAuth.

### Chức năng người dùng

- Hoàn thiện luồng xem sản phẩm, giỏ hàng và đặt hàng.
- Thêm chức năng sản phẩm yêu thích cho người dùng.
- Thêm chức năng đánh giá sản phẩm, chỉ cho phép đánh giá khi đã mua và nhận hàng.
- Thêm chức năng ảnh đại diện cho user/admin, bao gồm crop ảnh, nén ảnh và lưu URL vào `profiles.avatar_url`.
- Cải thiện trang thanh toán:
  - Kiểm tra họ tên, số điện thoại, địa chỉ.
  - Chọn phương thức thanh toán.
  - Xử lý lỗi hết hàng, giỏ hàng trống, hết phiên đăng nhập.
  - Hiển thị mã đơn hàng sau khi đặt thành công.
- Thêm chức năng hủy đơn hàng khi đơn còn trạng thái chờ xác nhận.

### Chức năng quản trị

- Cải thiện dashboard admin.
- Hoàn thiện quản lý sản phẩm:
  - Thêm, sửa, xóa sản phẩm.
  - Upload ảnh sản phẩm lên Supabase Storage.
  - Tối ưu ảnh sản phẩm trước khi upload để giảm dung lượng và hạn chế lỗi timeout.
  - Xuất danh sách sản phẩm dạng CSV mở được bằng Excel.
  - Thay thông báo mặc định của trình duyệt bằng hộp thoại trong ứng dụng.
- Hoàn thiện quản lý danh mục:
  - Thêm, sửa, xóa danh mục.
  - Tự tạo slug từ tên danh mục.
  - Dùng hộp thoại xác nhận xóa thay cho `confirm`.
- Hoàn thiện quản lý đơn hàng:
  - Xem danh sách đơn hàng.
  - Xem chi tiết sản phẩm trong đơn.
  - Cập nhật trạng thái đơn hàng.
  - Xuất đơn hàng dạng CSV.

### Chat giữa người dùng và admin

- Thiết kế bảng `conversations` và `messages`.
- Thiết kế bảng `wishlist_items` và `product_reviews`.
- Viết RPC gửi tin nhắn từ người dùng và admin.
- Viết RPC đọc danh sách hội thoại cho admin.
- Thêm trạng thái đã đọc/chưa đọc.
- Tích hợp Realtime để hỗ trợ cập nhật tin nhắn.

### Docker và tài liệu

- Tạo `Dockerfile`.
- Tạo `docker-compose.yml`.
- Tạo `docker-compose.prod.yml` và `Caddyfile` cho phương án VPS + domain + SSL.
- Viết `.env.example`.
- Viết `README.md`, `FEATURES.md`, `AI_USAGE.md`, `DEPLOYMENT.md`.
- Hướng dẫn triển khai demo bằng Vercel và subdomain `officestore.truc0209.id.vn`.
- Kiểm tra các lệnh:
  - `npm run typecheck`
  - `npm run lint`
  - `npm run build`

## 4. Một Số Prompt Tiêu Biểu Đã Sử Dụng

1. "Bạn hãy xem cho tôi bài dự án này."
2. "Bạn hãy sửa lại tất cả cho tôi phù hợp với dự án này."
3. "Đăng nhập bằng Google và Facebook chưa sử dụng được."
4. "Admin có thể xuất file Excel cho phần quản trị của mình."
5. "Thêm chức năng chat giữa người mua hàng và admin."
6. "Kiểm tra lại dự án này còn lỗi nào không kể cả Supabase."
7. "Bạn hãy xem lại luồng thêm, xóa, sửa sản phẩm của admin."
8. "Thông báo bằng hộp thoại không thông báo bằng localhost."
9. "Bạn hãy xem giúp tôi phần thanh toán."
10. "Dựa vào dự án hãy viết lại AI_USAGE.md và FEATURES.md."
11. "Có thể thêm hình ảnh đại diện vào thông tin cá nhân của user và admin không."
12. "Tạo subdomain trên VinaHost cho bài này như nào."

## 5. Kết Quả Sau Khi Sử Dụng AI

- Dự án có đầy đủ chức năng chính của website bán văn phòng phẩm.
- Supabase có schema, RLS, Storage, Auth, OAuth, Realtime và RPC.
- Giao diện người dùng và admin được cải thiện rõ ràng hơn.
- Các lỗi đăng nhập, RLS, timeout, upload ảnh và chat được phân tích và sửa.
- Hồ sơ cá nhân có ảnh đại diện cho cả user và admin.
- Dự án có tài liệu triển khai Docker/VPS và phương án demo bằng Vercel với domain riêng.
- Dự án có thể kiểm tra bằng TypeScript, ESLint và build production.

## 6. Cam Kết Kiểm Tra Lại

Các gợi ý và đoạn code do AI hỗ trợ đều được kiểm tra lại bằng cách:

- Chạy thử trên trình duyệt.
- Kiểm tra Supabase SQL Editor.
- Chạy `npm run typecheck`.
- Chạy `npm run lint`.
- Chạy `npm run build`.
- Commit và push source code lên GitHub.

AI được sử dụng như một công cụ hỗ trợ phát triển phần mềm, còn việc lựa chọn giải pháp, kiểm thử và hoàn thiện cuối cùng vẫn do người phát triển thực hiện.
