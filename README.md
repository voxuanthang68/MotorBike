# 🏍️ Hệ Thống Quản Lý Cho Thuê Xe Moto - Hải Châu, Đà Nẵng

Hệ thống quản lý dịch vụ cho thuê xe máy chuyên nghiệp tại **Quận Hải Châu, TP. Đà Nẵng**, tích hợp đầy đủ quy trình số hóa từ đặt xe, kiểm định an toàn kỹ thuật, hợp đồng điện tử pháp lý, thanh toán VietQR đến cứu hộ khẩn cấp 24/7.

---

## 🌟 Tính Năng Nổi Bật Theo Vai Trò (7 Roles - RBAC)

1. **Khách Hàng (Customer - `/` & `/portal`):**
   - Đặt xe trực tuyến theo ngày & địa điểm nhận xe (Sân bay Quốc tế Đà Nẵng, Cầu Rồng, Khách sạn trung tâm Hải Châu, Bãi biển Mỹ Khê).
   - Xem thông tin xe đang thuê thời gian thực.
   - **Ký hợp đồng điện tử online:** Ký trực tiếp trên màn hình (Canvas Signature) không cần photo giấy tờ.
   - Yêu cầu cứu hộ khẩn cấp 24/7 trên đường và nhắn tin trực tiếp với nhân viên hỗ trợ.

2. **Quản Trị Hệ Thống (Admin - `/dashboard/users`):**
   - Quản trị tài khoản nhân viên, phân quyền RBAC chặt chẽ (Chủ, Admin, Kỹ thuật, Lễ tân, Kế toán, Hỗ trợ, Khách hàng).
   - Thêm nhân viên mới, khóa/mở khóa tài khoản.

3. **Chủ Cửa Hàng (Owner - `/dashboard` & `/dashboard/settings`):**
   - Bảng điều khiển KPI kinh doanh theo thời gian thực (doanh thu, tỷ lệ lấp đầy dàn xe, đơn thuê mới).
   - Thiết lập cấu hình pháp lý cửa hàng, tài khoản ngân hàng nhận cọc, chính sách phụ phí trễ giờ/xăng dầu.

4. **Nhân Viên Kỹ Thuật (Technician - `/dashboard/maintenance`):**
   - **Checklist 8 tiêu chuẩn an toàn kỹ thuật:** Động cơ, phanh trước/sau, gai lốp & áp suất, đèn/xi-nhan, còi, gương, nhớt máy, khóa smartkey.
   - **Ký số điện tử kỹ thuật viên:** Ký xác nhận chịu trách nhiệm xe đạt chuẩn an toàn trước khi lăn bánh.
   - Ghi chú và lưu ảnh hiện trạng xe 4 góc, vết trầy xước cũ/mới để đối chiếu minh bạch.

5. **Lễ Tân (Receptionist - `/dashboard/bookings` & `/dashboard/contracts`):**
   - Tiếp nhận, duyệt đơn đặt xe online/offline.
   - **Bàn giao Check-in:** Ghi nhận số km (odometer), tình trạng xe, mũ bảo hiểm, khách hàng ký nhận bàn giao.
   - **Thu hồi Check-out:** Ghi nhận số km lúc trả, tự động tính phụ phí phạt trễ/xăng dầu/hư hại, chữ ký thu hồi xe.
   - Khởi tạo hợp đồng thuê xe điện tử pháp lý tự động.

6. **Kế Toán (Accountant - `/dashboard/payments` & `/dashboard/reports`):**
   - Quản lý dòng tiền: Tiền thuê xe, tiền cọc giữ hộ, hoàn cọc sau check-out, phụ phí bồi thường.
   - Tự động tạo mã **VietQR** (Ngân hàng Quân Đội MBBank) theo từng giao dịch để khách quét chuyển khoản tức thì.
   - Báo cáo phân tích doanh thu & lợi nhuận bằng biểu đồ trực quan, hỗ trợ xuất file Excel (CSV).

7. **Nhân Viên Hỗ Trợ (Support - `/dashboard/tickets`):**
   - Tiếp nhận sự cố cứu hộ lưu động 24/7 (thủng lốp, chết máy, đổi xe khẩn cấp tại Đèo Hải Vân, Bán đảo Sơn Trà, Quận Hải Châu).
   - Khung chat trao đổi trực tiếp hai chiều theo từng sự cố.

---

## 🛠️ Công Nghệ Sử Dụng (Tech Stack)

- **Frontend:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Zustand, TanStack React Query, Recharts, Canvas Digital Signature.
- **Backend:** Node.js, Express.js, MongoDB + Mongoose ODM, JWT Authentication (Access + Refresh Token), Bcrypt, Multer.
- **Tích Hợp:** VietQR API, Digital Signature Canvas, Print PDF Contract.

---

github.com/voxuanthang68/MotorBike](https://github.com/voxuanthang68/MotorBike)

