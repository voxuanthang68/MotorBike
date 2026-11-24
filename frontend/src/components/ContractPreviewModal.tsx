'use client';

interface ContractPreviewModalProps {
  onClose: () => void;
}

export default function ContractPreviewModal({ onClose }: ContractPreviewModalProps) {
  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{ zIndex: 9999 }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: '18px',
          width: '100%',
          maxWidth: '800px',
          maxHeight: '92vh',
          overflowY: 'auto',
          boxShadow: '0 28px 70px rgba(15,23,42,.22)',
          margin: '20px auto',
        }}
      >
        {/* Modal Header – red bar mimicking a PDF viewer */}
        <div style={{
          background: '#c8102e',
          borderRadius: '18px 18px 0 0',
          padding: '14px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 1,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ display: 'flex', gap: '5px' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'rgba(255,255,255,0.35)' }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'rgba(255,255,255,0.35)' }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'rgba(255,255,255,0.35)' }} />
            </div>
            <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: '13px', fontWeight: 700 }}>
              MAU-HOP-DONG-THUE-XE-MAY.pdf
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: 'none',
              color: '#fff',
              width: 30,
              height: 30,
              borderRadius: '50%',
              cursor: 'pointer',
              fontSize: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >&times;</button>
        </div>

        {/* Contract Document Body */}
        <div style={{
          padding: '40px 48px',
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontSize: '13.5px',
          color: '#1a1a2e',
          lineHeight: 1.9,
        }}>

          {/* National Header */}
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{ fontWeight: 700, fontSize: '13px', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
              Cộng Hòa Xã Hội Chủ Nghĩa Việt Nam
            </div>
            <div style={{ fontSize: '13px', fontStyle: 'italic', color: '#475569' }}>Độc lập – Tự do – Hạnh phúc</div>
            <div style={{ width: '180px', height: '2px', background: '#1a1a2e', margin: '8px auto 18px' }} />
            <div style={{ fontSize: '20px', fontWeight: 900, letterSpacing: '1px', textTransform: 'uppercase' }}>
              Hợp Đồng Cho Thuê Xe Máy
            </div>
            <div style={{ fontSize: '12.5px', color: '#64748b', marginTop: '4px' }}>Số: …… – ……./HĐTX</div>
          </div>

          {/* Legal Basis */}
          <div style={{
            fontSize: '13px',
            color: '#64748b',
            fontStyle: 'italic',
            paddingLeft: 16,
            borderLeft: '3px solid #e2e8f0',
            marginBottom: 16,
            lineHeight: 1.7,
          }}>
            - Căn cứ Bộ Luật Dân sự 2015;<br />
            - Căn cứ Luật Thương mại 2005;<br />
            - Căn cứ vào nhu cầu và khả năng cung ứng của các bên dưới đây.
          </div>

          <p style={{ margin: '0 0 20px' }}>
            Hôm nay, ngày …. tháng …. năm ……, tại ……………………………………………., chúng tôi gồm:
          </p>

          {/* Party A */}
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '14px 18px', marginBottom: 12 }}>
            <div style={{ fontWeight: 800, fontSize: '12.5px', color: '#15803d', marginBottom: 8, textTransform: 'uppercase' }}>
              Bên Cho Thuê (Sau đây gọi là Bên A):
            </div>
            <div>Cửa hàng: <strong>XTBike – Cho Thuê Xe Máy Tự Lái Đà Nẵng</strong></div>
            <div>Địa chỉ trụ sở: 128 Bạch Đằng, Phường Hải Châu 1, Quận Hải Châu, TP. Đà Nẵng</div>
            <div>Số điện thoại: <strong style={{ color: '#00bfa5' }}>0905 123 456</strong></div>
          </div>

          {/* Party B */}
          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '14px 18px', marginBottom: 20 }}>
            <div style={{ fontWeight: 800, fontSize: '12.5px', color: '#1d4ed8', marginBottom: 8, textTransform: 'uppercase' }}>
              Bên Thuê (Sau đây gọi tắt là Bên B):
            </div>
            <div>Ông/Bà: <strong>………………………………………</strong> &nbsp; Sinh năm: <strong>……………</strong></div>
            <div>CCCD/Hộ chiếu số: <strong>………………………</strong> &nbsp; Cấp ngày: ……………… &nbsp; Nơi cấp: ………</div>
            <div>Địa chỉ thường trú: …………………………………………………………………………</div>
            <div>Địa chỉ tạm trú (nếu có): ……………………………………………………………</div>
            <div>Số điện thoại: ……………………………………</div>
          </div>

          <p style={{ margin: '0 0 20px', fontStyle: 'italic' }}>
            Hai bên đã thỏa thuận và thống nhất ký kết Hợp đồng cho thuê xe máy với những điều khoản cụ thể như sau:
          </p>

          {/* Article 1 */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontWeight: 800, fontSize: 14, color: '#0f172a', marginBottom: 8 }}>Điều 1. ĐẶC ĐIỂM VÀ THỎA THUẬN THUÊ XE</div>
            <p style={{ margin: '0 0 8px' }}>Bên A đồng ý cho Bên B thuê và Bên B đồng ý thuê 01 (một) xe máy có đặc điểm sau đây:</p>
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: '10px 16px', fontSize: 13, marginBottom: 8 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '4px 12px' }}>
                <span style={{ color: '#64748b' }}>Nhãn hiệu:</span><strong>………………………………………</strong>
                <span style={{ color: '#64748b' }}>Loại xe / Màu sơn:</span><strong>………………………… / ………………</strong>
                <span style={{ color: '#64748b' }}>Số máy:</span><strong>……………………</strong>
                <span style={{ color: '#64748b' }}>Số khung:</span><strong>……………………</strong>
                <span style={{ color: '#64748b' }}>Biển kiểm soát:</span><strong>………………………………</strong>
              </div>
            </div>
            <p style={{ margin: 0, fontSize: 13 }}>
              Bên B cam đoan được cấp Giấy phép lái xe Hạng …… số …………………, còn hiệu lực đến ngày …………
            </p>
          </div>

          {/* Article 2 */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontWeight: 800, fontSize: 14, color: '#0f172a', marginBottom: 6 }}>Điều 2. THỜI HẠN THUÊ XE MÁY</div>
            <p style={{ margin: 0 }}>
              Thời hạn thuê là …… tháng/ngày kể từ ngày <strong>………/………/………</strong> đến hết ngày <strong>………/………/………</strong>.
            </p>
          </div>

          {/* Article 3 */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontWeight: 800, fontSize: 14, color: '#0f172a', marginBottom: 6 }}>Điều 3. MỤC ĐÍCH THUÊ</div>
            <p style={{ margin: 0 }}>Bên B sử dụng tài sản thuê nêu trên vào mục đích di chuyển, tham quan du lịch tại Đà Nẵng và các vùng lân cận.</p>
          </div>

          {/* Article 4 */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontWeight: 800, fontSize: 14, color: '#0f172a', marginBottom: 6 }}>Điều 4. GIÁ THUÊ VÀ PHƯƠNG THỨC THANH TOÁN</div>
            <div style={{ fontSize: 13 }}>
              <p style={{ margin: '0 0 4px' }}>1. Giá thuê tài sản: <strong>………………………… VNĐ</strong> (Bằng chữ: ……………………………………)</p>
              <p style={{ margin: '0 0 4px' }}>2. Phương thức thanh toán: Chuyển khoản hoặc tiền mặt. Bên B thanh toán trước khi nhận xe.</p>
              <p style={{ margin: 0 }}>3. Tiền cọc đảm bảo: <strong>………………………… VNĐ</strong> — hoàn trả đầy đủ sau khi đối soát xe nguyên vẹn.</p>
            </div>
          </div>

          {/* Article 5 */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontWeight: 800, fontSize: 14, color: '#0f172a', marginBottom: 6 }}>Điều 5. PHƯƠNG THỨC GIAO, TRẢ LẠI TÀI SẢN THUÊ</div>
            <p style={{ margin: 0 }}>Hết thời hạn thuê, Bên B phải giao trả xe máy cho Bên A tại địa điểm thỏa thuận, kèm đầy đủ giấy tờ liên quan trong tình trạng nguyên vẹn như khi nhận.</p>
          </div>

          {/* Article 6 */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontWeight: 800, fontSize: 14, color: '#0f172a', marginBottom: 6 }}>Điều 6. TRÁCH NHIỆM VÀ QUYỀN HẠN CỦA CÁC BÊN</div>
            <div style={{ fontSize: 13 }}>
              <p style={{ margin: '0 0 6px', fontWeight: 700 }}>1. Trách nhiệm, quyền hạn của Bên A:</p>
              <ul style={{ margin: '0 0 10px', paddingLeft: 20, lineHeight: 1.8 }}>
                <li>Giao xe và toàn bộ giấy tờ liên quan (Giấy đăng ký xe, Giấy bảo hiểm xe) ngay sau khi ký hợp đồng và Bên B thanh toán.</li>
                <li>Chịu trách nhiệm pháp lý về nguồn gốc và quyền sở hữu của xe.</li>
                <li>Có quyền đơn phương đình chỉ hợp đồng và yêu cầu bồi thường nếu Bên B vi phạm.</li>
              </ul>
              <p style={{ margin: '0 0 6px', fontWeight: 700 }}>2. Trách nhiệm, quyền hạn của Bên B:</p>
              <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
                <li>Thanh toán tiền thuê đúng hạn; chịu toàn bộ chi phí xăng dầu và bảo dưỡng định kỳ.</li>
                <li>Không cho thuê lại; không tự ý sửa chữa hoặc thay đổi kết cấu xe.</li>
                <li>Chịu trách nhiệm bồi thường thiệt hại do tai nạn, vi phạm giao thông, hư hỏng hoặc mất mát xe.</li>
              </ul>
            </div>
          </div>

          {/* Article 7 */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontWeight: 800, fontSize: 14, color: '#0f172a', marginBottom: 6 }}>Điều 7. HIỆU LỰC HỢP ĐỒNG</div>
            <p style={{ margin: 0 }}>
              Hợp đồng có giá trị kể từ ngày <strong>………/………/………</strong> đến hết ngày <strong>………/………/………</strong>.
              Bên nào muốn chấm dứt sớm phải thông báo trước ít nhất <strong>24 giờ</strong> bằng văn bản hoặc tin nhắn điện tử.
            </p>
          </div>

          {/* Article 8 */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontWeight: 800, fontSize: 14, color: '#0f172a', marginBottom: 6 }}>Điều 8. ĐIỀU KHOẢN CHUNG</div>
            <p style={{ margin: 0 }}>
              Hai bên cam kết thi hành đúng các điều khoản. Mọi sửa đổi phải được lập thành văn bản có chữ ký cả hai bên.
              Tranh chấp (nếu có) được giải quyết tại <strong>Tòa án nhân dân TP. Đà Nẵng</strong>.
              Hợp đồng lập thành <strong>02 bản</strong> có giá trị pháp lý như nhau, mỗi bên giữ 01 bản.
            </p>
          </div>

          {/* Signature Block */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 40,
            textAlign: 'center',
            paddingTop: 20,
            borderTop: '1px dashed #cbd5e1',
            fontSize: 13,
          }}>
            <div>
              <div style={{ fontWeight: 800, textTransform: 'uppercase' }}>Đại Diện Bên A</div>
              <div style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: 12, marginBottom: 48 }}>(ký và ghi rõ họ tên)</div>
              <div style={{ fontWeight: 700 }}>XTBike – Đà Nẵng</div>
            </div>
            <div>
              <div style={{ fontWeight: 800, textTransform: 'uppercase' }}>Đại Diện Bên B</div>
              <div style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: 12, marginBottom: 48 }}>(ký và ghi rõ họ tên)</div>
              <div style={{ fontWeight: 700, color: '#94a3b8' }}>……………………………</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px 24px',
          display: 'flex',
          gap: 12,
          justifyContent: 'flex-end',
          borderTop: '1px solid #f1f5f9',
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 22px',
              borderRadius: 10,
              border: '1px solid #e2e8f0',
              background: '#fff',
              color: '#64748b',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            Đóng
          </button>
          <a
            href="#danh-sach-xe"
            onClick={onClose}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '10px 22px',
              borderRadius: 10,
              background: '#00bfa5',
              color: '#fff',
              fontWeight: 800,
              fontSize: 14,
              textDecoration: 'none',
              cursor: 'pointer',
            }}
          >
            Chọn xe &amp; tạo hợp đồng ngay
          </a>
        </div>
      </div>
    </div>
  );
}
