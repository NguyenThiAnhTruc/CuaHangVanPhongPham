export function Footer() {
  return (
    <footer className="bg-slate-900 text-white mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">OfficeStore</h3>
            <p className="text-slate-300">
              Cung cấp văn phòng phẩm chất lượng cao với giá cả phải chăng.
            </p>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4">Liên hệ</h4>
            <ul className="space-y-2 text-slate-300">
              <li>Email: truc@officestore.vn</li>
              <li>Hotline: 1900-xxxx</li>
              <li>Địa chỉ: 123 Đường ABC, TP.HCM</li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4">Chính sách</h4>
            <ul className="space-y-2 text-slate-300">
              <li>Chính sách đổi trả</li>
              <li>Chính sách bảo mật</li>
              <li>Điều khoản sử dụng</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-700 mt-8 pt-8 text-center text-slate-400">
          <p>&copy; 2026 OfficeStore. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
