# OfficeStore - Cua Hang Van Phong Pham

OfficeStore la website ban van phong pham truc tuyen duoc xay dung bang **Next.js App Router**, **React**, **TypeScript**, **Tailwind CSS** va **Supabase**.

He thong ho tro khach hang xem san pham, tim kiem, loc theo danh muc, them vao gio hang, dat hang, theo doi don hang, huy don khi con cho xac nhan, luu san pham yeu thich, danh gia san pham sau khi mua va chat voi admin.

Phia admin co cac chuc nang quan ly san pham, danh muc, don hang, tin nhan khach hang, dashboard thong ke va xuat du lieu CSV.

## Cong Nghe Su Dung

- **Frontend:** Next.js App Router, React, TypeScript
- **UI:** Tailwind CSS, lucide-react
- **Backend:** Supabase Auth, PostgreSQL Database, Storage, Realtime
- **Bao mat:** Supabase Row Level Security
- **Container:** Dockerfile, Docker Compose
- **Quan ly ma nguon:** Git/GitHub

## Chuc Nang Chinh

### Khach Hang

- Dang ky, dang nhap bang email/password.
- Dang nhap bang Google/Facebook thong qua Supabase OAuth.
- Xem danh sach san pham va loc theo danh muc.
- Tim kiem san pham theo ten.
- Xem chi tiet san pham, gia ban, ton kho va danh gia.
- Them san pham vao gio hang.
- Tang/giam so luong san pham trong gio hang.
- Dat hang voi thong tin giao hang.
- Chon phuong thuc thanh toan:
  - Thanh toan khi nhan hang.
  - Chuyen khoan ngan hang.
- Xem lich su don hang.
- Huy don hang khi don con trang thai cho xac nhan.
- Luu san pham yeu thich.
- Danh gia san pham sau khi don hang da giao thanh cong.
- Chat truc tiep voi admin.
- Cap nhat ho so ca nhan va anh dai dien.

### Admin

- Xem dashboard thong ke san pham, don hang, doanh thu va ton kho.
- Quan ly san pham:
  - Them san pham.
  - Sua san pham.
  - Xoa san pham.
  - An/hien san pham.
  - Upload anh san pham len Supabase Storage.
  - Xuat danh sach san pham dang CSV.
- Quan ly danh muc:
  - Them danh muc.
  - Sua danh muc.
  - Xoa danh muc.
  - Tu tao slug.
- Quan ly don hang:
  - Xem danh sach don hang.
  - Xem chi tiet san pham trong don.
  - Cap nhat trang thai don hang.
  - Xuat don hang dang CSV.
- Quan ly chat:
  - Xem danh sach hoi thoai.
  - Tra loi tin nhan khach hang.
  - Theo doi tin nhan da doc/chua doc.

## Tai Khoan Demo

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

## Cai Dat Du An

### 1. Clone source code

```bash
git clone https://github.com/NguyenThiAnhTruc/CuaHangVanPhongPham.git
cd CuaHangVanPhongPham
```

### 2. Cai dependencies

```bash
npm install
```

### 3. Tao file moi truong

Tao file `.env` tu `.env.example`:

```bash
cp .env.example .env
```

Cau hinh cac bien moi truong:

```text
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 4. Cau hinh Supabase

Du an su dung Supabase cho Auth, Database, Storage va Realtime. Database Supabase can duoc tao bang cac SQL script rieng cua du an.

Luu y: cac script tao bang, RLS, RPC, Storage policy va du lieu mau khong duoc dua truc tiep len GitHub. Khi nop bai, cac script nay duoc nen rieng thanh file zip theo yeu cau.

### 5. Chay du an local

```bash
npm run dev
```

Ung dung chay mac dinh tai:

```text
http://localhost:3000
```

## Docker

Chay bang Docker Compose:

```bash
docker compose up --build
```

Ung dung chay tai:

```text
http://localhost:3000
```

Production co the trien khai bang Docker Compose ket hop:

- `Dockerfile`
- `docker-compose.prod.yml`
- `Caddyfile`

Neu chua co VPS, du an co the deploy bang Vercel vi day la ung dung Next.js.

## Kiem Tra Du An

```bash
npm run typecheck
npm run lint
npm run build
```

Y nghia:

- `typecheck`: kiem tra TypeScript.
- `lint`: kiem tra quy tac code.
- `build`: build production bang Next.js.

## Cau Truc Thu Muc

```text
project
├── public
├── src
│   ├── app
│   ├── components
│   ├── contexts
│   ├── hooks
│   ├── lib
│   └── views
├── Dockerfile
├── docker-compose.yml
├── docker-compose.prod.yml
├── Caddyfile
├── README.md
├── package.json
├── next.config.js
├── tailwind.config.js
└── tsconfig.json
```

## Ghi Chu

- Khong commit file `.env`.
- Khong commit `node_modules`.
- Khong commit `.next`, `dist` hoac file build/cache.
- Khong commit script Supabase neu da nop rieng bang file zip.
- Can cau hinh bien moi truong tren Vercel neu deploy len Vercel.
- Can cap nhat Supabase Authentication URL va Redirect URLs theo domain deploy.
