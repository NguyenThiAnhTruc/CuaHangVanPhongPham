# Hướng Dẫn Docker Và VPS Deployment

Tài liệu này dùng cho tiêu chí **Dockerfile + Docker Compose** và **VPS Deployment với Domain + SSL (HTTPS)**.

## 1. Docker Local

Chạy ứng dụng bằng Docker Compose ở máy local:

```bash
docker compose up --build
```

Ứng dụng chạy tại:

```text
http://localhost:3000
```

## 2. Production Docker Build

Dự án dùng Docker multi-stage build:

1. `deps`: cài dependencies bằng `npm ci`.
2. `builder`: build ứng dụng Next.js.
3. `runner`: chỉ copy bản build standalone để chạy production nhẹ hơn.

File liên quan:

- `Dockerfile`
- `docker-compose.yml`
- `docker-compose.prod.yml`
- `Caddyfile`

## 3. Chuẩn Bị VPS

Trên VPS Ubuntu, cài Docker:

```bash
sudo apt update
sudo apt install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

Kiểm tra:

```bash
docker --version
docker compose version
```

## 4. Trỏ Domain Về VPS

Trong trang quản lý DNS của domain:

- Tạo bản ghi `A`
- Host: `@` hoặc subdomain như `www`, `shop`, `officestore`
- Value: IP public của VPS
- Bật proxy Cloudflare nếu dùng Cloudflare

Ví dụ:

```text
officestore.example.com -> 123.123.123.123
```

## 5. Cấu Hình Biến Môi Trường

Trên VPS, tạo file `.env`:

```bash
cp .env.example .env
nano .env
```

Nội dung mẫu:

```text
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
DOMAIN=officestore.example.com
```

`DOMAIN` là domain thật đã trỏ về VPS. Caddy sẽ dùng domain này để tự cấp SSL.

## 6. Deploy Với HTTPS

Chạy production compose:

```bash
docker compose -f docker-compose.prod.yml up --build -d
```

Kiểm tra container:

```bash
docker ps
```

Xem log:

```bash
docker logs officestore-web
docker logs officestore-proxy
```

Sau khi Caddy cấp SSL xong, truy cập:

```text
https://officestore.example.com
```

## 7. Cấu Hình Supabase Sau Khi Deploy

Trong Supabase Dashboard:

### Authentication URL

Vào:

```text
Authentication -> URL Configuration
```

Cập nhật:

```text
Site URL: https://officestore.example.com
Redirect URLs:
https://officestore.example.com
https://officestore.example.com/**
```

### OAuth Google/Facebook

Trong Google Cloud hoặc Facebook Developer Console, thêm redirect URL của Supabase:

```text
https://<your-supabase-project>.supabase.co/auth/v1/callback
```

Nếu frontend dùng domain mới, nhớ thêm domain vào phần allowed origins/authorized domains.

## 8. Cập Nhật Source Trên VPS

Khi có code mới:

```bash
git pull origin main
docker compose -f docker-compose.prod.yml up --build -d
```

## 9. Dừng Ứng Dụng

```bash
docker compose -f docker-compose.prod.yml down
```

Nếu muốn xóa cả volume SSL của Caddy:

```bash
docker compose -f docker-compose.prod.yml down -v
```

## 10. Ghi Chú Khi Nộp Bài

- `Dockerfile` đã dùng multi-stage build.
- `docker-compose.yml` dùng để chạy local.
- `docker-compose.prod.yml` dùng để chạy production trên VPS.
- `Caddyfile` dùng làm reverse proxy và tự cấp SSL HTTPS.
- Khi demo deploy, cần chụp lại:
  - Domain HTTPS đang chạy.
  - Docker containers đang running.
  - Supabase project đang kết nối.
