# Hướng Dẫn Docker Và VPS Deployment

Tài liệu này dùng cho tiêu chí **Dockerfile + Docker Compose** và **VPS Deployment với Domain + SSL (HTTPS)**.

Ngoài phương án VPS, dự án cũng có thể deploy demo bằng **Vercel** vì đây là ứng dụng Next.js. Khi báo cáo, có thể trình bày:

- Docker/Docker Compose: dùng để chứng minh ứng dụng đã được container hóa.
- Vercel: dùng để có URL demo thực tế nhanh, ổn định và dễ trình bày.
- VPS + Caddy: là phương án production tự quản lý server, có domain và SSL.

## 1. Docker Local

Chạy ứng dụng bằng Docker Compose ở máy local:

```bash
docker compose up --build
```

Trước khi chạy, cần có file `.env` ở thư mục dự án. Docker dùng các biến
`NEXT_PUBLIC_SUPABASE_URL` và `NEXT_PUBLIC_SUPABASE_ANON_KEY` trong lúc build
Next.js, nên nếu thiếu `.env` quá trình build sẽ lỗi.

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

## 8. Deploy Demo Bằng Vercel Và Subdomain

Nếu dùng Vercel để demo, thực hiện:

1. Import GitHub repository vào Vercel.
2. Thêm Environment Variables:

```text
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

3. Vào Vercel `Settings -> Domains`, thêm domain:

```text
officestore.truc0209.id.vn
```

4. Trong DNS VinaHost của `truc0209.id.vn`, thêm record:

```text
Type: CNAME
Name: officestore
Value: cname.vercel-dns.com
```

5. Trong Supabase `Authentication -> URL Configuration`, thêm:

```text
Site URL:
https://officestore.truc0209.id.vn

Redirect URLs:
https://officestore.truc0209.id.vn/**
http://localhost:3000/**
```

Nếu vẫn giữ URL Vercel mặc định để test, thêm cả:

```text
https://your-vercel-domain.vercel.app/**
```

## 9. Cập Nhật Source Trên VPS

Khi có code mới:

```bash
git pull origin main
docker compose -f docker-compose.prod.yml up --build -d
```

## 10. Dừng Ứng Dụng

```bash
docker compose -f docker-compose.prod.yml down
```

Nếu muốn xóa cả volume SSL của Caddy:

```bash
docker compose -f docker-compose.prod.yml down -v
```

## 11. Ghi Chú Khi Nộp Bài

- `Dockerfile` đã dùng multi-stage build.
- `docker-compose.yml` dùng để chạy local.
- `docker-compose.prod.yml` dùng để chạy production trên VPS.
- `Caddyfile` dùng làm reverse proxy và tự cấp SSL HTTPS.
- Khi demo deploy, cần chụp lại:
  - Domain HTTPS đang chạy.
  - Docker containers đang running.
  - Supabase project đang kết nối.
  - Vercel deployment nếu dùng Vercel để demo thực tế.
