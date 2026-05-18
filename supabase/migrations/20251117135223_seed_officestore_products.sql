-- Seed OfficeStore categories and products.
-- Run this in Supabase SQL Editor after schema and RLS migrations.

INSERT INTO public.categories (id, name, description, slug)
VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Bút viết', 'Bút bi, bút gel, bút dạ quang và bút lông bảng.', 'but-viet'),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'Sổ và giấy', 'Sổ tay, giấy in, giấy note và giấy ghi chú văn phòng.', 'so-va-giay'),
  ('aaaaaaaa-0000-0000-0000-000000000003', 'Bìa hồ sơ', 'Bìa còng, file tài liệu, túi hồ sơ và kẹp giấy tờ.', 'bia-ho-so'),
  ('aaaaaaaa-0000-0000-0000-000000000004', 'Dụng cụ bàn làm việc', 'Kéo, thước, bấm kim, gỡ kim và đồ dùng để bàn.', 'dung-cu-ban-lam-viec'),
  ('aaaaaaaa-0000-0000-0000-000000000005', 'Vật tư in ấn', 'Mực in, giấy in ảnh, decal và phụ kiện in ấn.', 'vat-tu-in-an'),
  ('aaaaaaaa-0000-0000-0000-000000000006', 'Thiết bị văn phòng', 'Máy tính, bàn phím, chuột và thiết bị hỗ trợ công việc.', 'thiet-bi-van-phong')
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  slug = EXCLUDED.slug;

INSERT INTO public.products (
  id,
  category_id,
  name,
  description,
  price,
  stock,
  image_url,
  is_active
)
VALUES
  (
    'bbbbbbbb-0000-0000-0000-000000000001',
    'aaaaaaaa-0000-0000-0000-000000000001',
    'Bút bi Thiên Long TL-027',
    'Bút bi mực xanh, nét viết êm, phù hợp ghi chép hằng ngày tại văn phòng và trường học.',
    4500,
    180,
    'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=900&q=80',
    true
  ),
  (
    'bbbbbbbb-0000-0000-0000-000000000002',
    'aaaaaaaa-0000-0000-0000-000000000001',
    'Bút gel mực đen 0.5mm',
    'Bút gel nét nhỏ, mực đều, thích hợp ký giấy tờ và ghi chú chuyên nghiệp.',
    8500,
    120,
    'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=900&q=80',
    true
  ),
  (
    'bbbbbbbb-0000-0000-0000-000000000003',
    'aaaaaaaa-0000-0000-0000-000000000001',
    'Bút dạ quang 5 màu',
    'Bộ bút dạ quang nhiều màu, dùng đánh dấu tài liệu, sách vở và kế hoạch công việc.',
    32000,
    75,
    'https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=900&q=80',
    true
  ),
  (
    'bbbbbbbb-0000-0000-0000-000000000004',
    'aaaaaaaa-0000-0000-0000-000000000001',
    'Bút lông bảng mực xanh',
    'Bút lông bảng dễ lau, màu rõ, phù hợp phòng họp và lớp học.',
    12000,
    90,
    'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80',
    true
  ),
  (
    'bbbbbbbb-0000-0000-0000-000000000005',
    'aaaaaaaa-0000-0000-0000-000000000002',
    'Giấy in Double A A4 80gsm',
    'Ram giấy A4 chất lượng cao, bề mặt mịn, phù hợp in hợp đồng và tài liệu văn phòng.',
    89000,
    65,
    'https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&w=900&q=80',
    true
  ),
  (
    'bbbbbbbb-0000-0000-0000-000000000006',
    'aaaaaaaa-0000-0000-0000-000000000002',
    'Sổ tay bìa cứng A5',
    'Sổ tay 160 trang, giấy dày, bìa cứng bền đẹp cho ghi chú cuộc họp.',
    39000,
    100,
    'https://images.unsplash.com/photo-1531346878377-a5be20888e57?auto=format&fit=crop&w=900&q=80',
    true
  ),
  (
    'bbbbbbbb-0000-0000-0000-000000000007',
    'aaaaaaaa-0000-0000-0000-000000000002',
    'Giấy note vàng 3x3 inch',
    'Tập giấy note keo dán nhẹ, tiện ghi nhắc việc và đánh dấu tài liệu.',
    18000,
    140,
    'https://images.unsplash.com/photo-1512314889357-e157c22f938d?auto=format&fit=crop&w=900&q=80',
    true
  ),
  (
    'bbbbbbbb-0000-0000-0000-000000000008',
    'aaaaaaaa-0000-0000-0000-000000000002',
    'Tập giấy kiểm tra kẻ ngang',
    'Giấy kẻ ngang khổ A4, đóng tập gọn gàng, phù hợp ghi bài và làm bài kiểm tra.',
    22000,
    85,
    'https://images.unsplash.com/photo-1517971071642-34a2d3ecc9cd?auto=format&fit=crop&w=900&q=80',
    true
  ),
  (
    'bbbbbbbb-0000-0000-0000-000000000009',
    'aaaaaaaa-0000-0000-0000-000000000003',
    'Bìa còng A4 7cm',
    'Bìa còng lưu trữ hồ sơ khổ A4, gáy 7cm, phù hợp lưu chứng từ số lượng lớn.',
    45000,
    55,
    'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=900&q=80',
    true
  ),
  (
    'bbbbbbbb-0000-0000-0000-000000000010',
    'aaaaaaaa-0000-0000-0000-000000000003',
    'File lá A4 100 chiếc',
    'Túi file lá trong suốt, bảo vệ tài liệu khỏi bụi bẩn và nhàu gấp.',
    68000,
    70,
    'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=900&q=80',
    true
  ),
  (
    'bbbbbbbb-0000-0000-0000-000000000011',
    'aaaaaaaa-0000-0000-0000-000000000003',
    'Kẹp tài liệu 32mm hộp 12 cái',
    'Kẹp bướm kim loại chắc chắn, dùng gom tài liệu, hóa đơn và phiếu thu.',
    26000,
    95,
    'https://images.unsplash.com/photo-1526285759904-71d1170ed2ac?auto=format&fit=crop&w=900&q=80',
    true
  ),
  (
    'bbbbbbbb-0000-0000-0000-000000000012',
    'aaaaaaaa-0000-0000-0000-000000000003',
    'Túi hồ sơ nút bấm A4',
    'Túi hồ sơ nhựa trong, có nút bấm, tiện mang theo tài liệu cá nhân.',
    9000,
    130,
    'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=900&q=80',
    true
  ),
  (
    'bbbbbbbb-0000-0000-0000-000000000013',
    'aaaaaaaa-0000-0000-0000-000000000004',
    'Bấm kim số 10 Deli',
    'Bấm kim nhỏ gọn, thao tác nhẹ, phù hợp sử dụng thường xuyên trên bàn làm việc.',
    35000,
    60,
    'https://images.unsplash.com/photo-1604187351574-c75ca79f5807?auto=format&fit=crop&w=900&q=80',
    true
  ),
  (
    'bbbbbbbb-0000-0000-0000-000000000014',
    'aaaaaaaa-0000-0000-0000-000000000004',
    'Kim bấm số 10 hộp 1000 viên',
    'Kim bấm tiêu chuẩn, dùng kèm bấm kim số 10 cho tài liệu văn phòng.',
    7000,
    200,
    'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=900&q=80',
    true
  ),
  (
    'bbbbbbbb-0000-0000-0000-000000000015',
    'aaaaaaaa-0000-0000-0000-000000000004',
    'Kéo văn phòng 21cm',
    'Kéo lưỡi thép sắc, tay cầm chắc chắn, dùng cắt giấy, bìa và vật liệu nhẹ.',
    28000,
    80,
    'https://images.unsplash.com/photo-1587135991058-8816b028691f?auto=format&fit=crop&w=900&q=80',
    true
  ),
  (
    'bbbbbbbb-0000-0000-0000-000000000016',
    'aaaaaaaa-0000-0000-0000-000000000004',
    'Thước nhựa 30cm',
    'Thước trong suốt, vạch chia rõ, phù hợp học tập và đo tài liệu văn phòng.',
    6000,
    160,
    'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=900&q=80',
    true
  ),
  (
    'bbbbbbbb-0000-0000-0000-000000000017',
    'aaaaaaaa-0000-0000-0000-000000000005',
    'Mực in Canon 2900 tương thích',
    'Hộp mực laser tương thích Canon 2900, bản in rõ nét, phù hợp văn phòng nhỏ.',
    185000,
    35,
    'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?auto=format&fit=crop&w=900&q=80',
    true
  ),
  (
    'bbbbbbbb-0000-0000-0000-000000000018',
    'aaaaaaaa-0000-0000-0000-000000000005',
    'Giấy in ảnh A4 bóng',
    'Giấy in ảnh bề mặt bóng, lên màu tốt, dùng cho in hình ảnh và tài liệu màu.',
    62000,
    45,
    'https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?auto=format&fit=crop&w=900&q=80',
    true
  ),
  (
    'bbbbbbbb-0000-0000-0000-000000000019',
    'aaaaaaaa-0000-0000-0000-000000000005',
    'Nhãn decal A4 100 tờ',
    'Decal giấy khổ A4, dùng in nhãn sản phẩm, mã hàng và tem văn phòng.',
    79000,
    50,
    'https://images.unsplash.com/photo-1586953208448-b95a79798f07?auto=format&fit=crop&w=900&q=80',
    true
  ),
  (
    'bbbbbbbb-0000-0000-0000-000000000020',
    'aaaaaaaa-0000-0000-0000-000000000005',
    'Băng keo trong 5cm',
    'Băng keo trong độ bám tốt, dùng đóng gói hàng hóa và dán thùng carton.',
    15000,
    110,
    'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?auto=format&fit=crop&w=900&q=80',
    true
  ),
  (
    'bbbbbbbb-0000-0000-0000-000000000021',
    'aaaaaaaa-0000-0000-0000-000000000006',
    'Máy tính Casio MS-20UC',
    'Máy tính để bàn 12 số, phím bấm êm, phù hợp kế toán và thu ngân.',
    245000,
    40,
    'https://images.unsplash.com/photo-1587145820266-a5951ee6f620?auto=format&fit=crop&w=900&q=80',
    true
  ),
  (
    'bbbbbbbb-0000-0000-0000-000000000022',
    'aaaaaaaa-0000-0000-0000-000000000006',
    'Bàn phím văn phòng Logitech K120',
    'Bàn phím full-size, gõ êm, kết nối USB ổn định cho máy tính văn phòng.',
    165000,
    30,
    'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=900&q=80',
    true
  ),
  (
    'bbbbbbbb-0000-0000-0000-000000000023',
    'aaaaaaaa-0000-0000-0000-000000000006',
    'Chuột không dây Logitech M185',
    'Chuột không dây nhỏ gọn, pin bền, phù hợp laptop và máy tính văn phòng.',
    185000,
    42,
    'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=900&q=80',
    true
  ),
  (
    'bbbbbbbb-0000-0000-0000-000000000024',
    'aaaaaaaa-0000-0000-0000-000000000006',
    'Đèn bàn LED chống cận',
    'Đèn bàn LED nhiều mức sáng, ánh sáng dịu, hỗ trợ làm việc và học tập lâu dài.',
    215000,
    28,
    'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=900&q=80',
    true
  )
ON CONFLICT (id) DO UPDATE
SET
  category_id = EXCLUDED.category_id,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock,
  image_url = EXCLUDED.image_url,
  is_active = EXCLUDED.is_active,
  updated_at = now();
