# AI Tool Usage

Dự án có sử dụng AI assistant trong quá trình phát triển để hỗ trợ:

1. Phân tích yêu cầu dự án Next.js, Supabase, Docker và triển khai.
2. Thiết kế schema Supabase cho sản phẩm, đơn hàng, giỏ hàng, profile và chat.
3. Gợi ý và chỉnh sửa RLS policy cho admin/user.
4. Tạo chức năng chat realtime giữa người mua và admin.
5. Kiểm tra lỗi TypeScript, lint, build và đề xuất cách sửa.
6. Hỗ trợ viết tài liệu README, Dockerfile và Docker Compose.

Các prompt tiêu biểu:

- "Kiểm tra lại dự án này còn lỗi nào không kể cả Supabase"
- "Thêm chức năng chat giữa người mua hàng và admin"
- "Admin có thể xuất file Excel cho phần quản trị"
- "Đăng nhập bằng Google và Facebook chưa sử dụng được"
- "Đối chiếu dự án với yêu cầu bắt buộc của giảng viên"

AI được dùng như công cụ hỗ trợ lập trình; người phát triển vẫn kiểm tra lại bằng `npm run typecheck`, `npm run lint`, `npm run build` và chạy thử với Supabase.
