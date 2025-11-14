# Thay đổi tính năng QR Scanner

## 📋 Tóm tắt

Đã thiết kế lại hoàn toàn giao diện và logic xử lý QR Scanner để đơn giản hóa trải nghiệm người dùng với 4 trạng thái rõ ràng.

## ✨ Những thay đổi chính

### 1. **Giao diện mới**

#### Trước:
- Hiển thị chi tiết dữ liệu QR (classId, token, generatedAt...)
- Có 2 nút: Check-in và Check-out
- UI phức tạp với nhiều thông tin kỹ thuật
- Người dùng phải chọn action sau khi quét

#### Sau:
- **Giao diện đơn giản, trực quan**
- Chỉ hiển thị kết quả quét với icon và message rõ ràng
- **Tự động xử lý** ngay khi quét, không cần chọn action
- UI theo Material Design 3 với màu sắc phân biệt trạng thái

### 2. **Logic xử lý mới**

#### 4 trạng thái được xử lý tự động:

| Trạng thái | Icon | Màu | Message | Action |
|------------|------|-----|---------|--------|
| ✅ **Thành công** | check-circle | Xanh lá | "Quét mã thành công" | Hoàn tất / Quét lại |
| ⏰ **Hết hạn** | clock-alert | Cam | "Mã QR đã hết hạn" | Quét lại |
| ❌ **Sai lớp** | alert-circle | Đỏ | "Quét sai lớp học - Bạn chưa đăng ký lớp này" | Quét lại |
| ⚠️ **Lỗi QR** | close-circle | Đỏ đậm | "Quét QR lỗi - Mã không hợp lệ" | Quét lại |

### 3. **Props thay đổi**

#### Props đã loại bỏ:
```jsx
onCheckIn          // ❌ Đã loại bỏ
onCheckOut         // ❌ Đã loại bỏ
disableActions     // ❌ Đã loại bỏ
onUnsupportedRole  // ❌ Đã loại bỏ
```

#### Props mới:
```jsx
onScanSuccess      // ✅ Callback duy nhất xử lý QR
```

### 4. **API callback mới**

```jsx
// Trước (cũ):
onCheckIn={(qrData) => {
  // Xử lý check-in
  return "Message thành công";
}}

onCheckOut={(qrData) => {
  // Xử lý check-out
  return "Message thành công";
}}

// Sau (mới):
onScanSuccess={async (qrData) => {
  // Validate và xử lý QR
  return {
    success: true,     // hoặc false
    message: "..."     // Message hiển thị
  };
}}
```

## 🎨 Cải thiện UX/UI

### Camera View
- ✅ Loading indicator khi đang xử lý QR
- ✅ Chặn quét trùng khi đang xử lý
- ✅ Feedback rung (vibration) khi quét
- ✅ Throttle 1500ms để tránh spam

### Result Card
- ✅ Icon lớn, rõ ràng theo từng trạng thái
- ✅ Màu sắc phân biệt (xanh, cam, đỏ)
- ✅ Message ngắn gọn, dễ hiểu
- ✅ Border và background theo màu trạng thái
- ✅ Animation mượt mà

### Buttons
- ✅ "Quét lại" - luôn hiển thị
- ✅ "Hoàn tất" - chỉ hiện khi thành công
- ✅ Icon + text để dễ hiểu

## 🔧 Thay đổi kỹ thuật

### State Management
```jsx
// Trước:
const [scannedResult, setScannedResult] = useState(null);
const [actionLoading, setActionLoading] = useState(null);
const [actionState, setActionState] = useState({ status, message, type });

// Sau:
const [scanStatus, setScanStatus] = useState('idle');
const [scanMessage, setScanMessage] = useState('');
const [isProcessing, setIsProcessing] = useState(false);
```

### Error Handling
Component tự động phân loại lỗi dựa trên message:
- Message chứa **"hết hạn"** hoặc **"expired"** → Trạng thái EXPIRED
- Message chứa **"không đăng ký"** hoặc **"not enrolled"** → Trạng thái WRONG_CLASS
- Message chứa **"không hợp lệ"** hoặc **"invalid"** → Trạng thái INVALID
- Các lỗi khác → Trạng thái INVALID mặc định

## 📁 Files đã thay đổi

### Modified:
1. **`/src/screens/qr/QrScannerModal.jsx`**
   - Thiết kế lại hoàn toàn component
   - Logic mới với 4 trạng thái
   - UI/UX cải thiện

2. **`/android/app/src/main/AndroidManifest.xml`**
   - Thêm quyền `VIBRATE`

### Created:
3. **`/src/screens/qr/QrScannerExample.jsx`**
   - Ví dụ cách sử dụng component mới
   - Demo xử lý các trường hợp lỗi

4. **`/src/screens/qr/README.md`**
   - Documentation chi tiết
   - Hướng dẫn sử dụng
   - API reference

## 🚀 Cách migrate code cũ sang mới

### Ví dụ cách chuyển đổi:

#### Code cũ:
```jsx
<QrScannerModal
  visible={show}
  onClose={handleClose}
  onCheckIn={async (qrData) => {
    await checkInToClass({
      classId: qrData.classId,
      qrValue: qrData.value,
    });
    return "Check-in thành công";
  }}
  onCheckOut={async (qrData) => {
    await checkOutFromClass({
      classId: qrData.classId,
      qrValue: qrData.value,
    });
    return "Check-out thành công";
  }}
  disableActions={false}
/>
```

#### Code mới:
```jsx
<QrScannerModal
  visible={show}
  onClose={handleClose}
  onScanSuccess={async (qrData) => {
    try {
      // Validate QR
      if (!qrData.classId || !qrData.token) {
        return {
          success: false,
          message: 'Mã QR không hợp lệ',
        };
      }

      // Check expiry
      if (qrData.expiresAt && new Date(qrData.expiresAt) < new Date()) {
        return {
          success: false,
          message: 'Mã QR đã hết hạn',
        };
      }

      // Call API
      const response = await checkInToClass({
        classId: qrData.classId,
        qrValue: JSON.stringify(qrData),
      });

      if (response.success) {
        return {
          success: true,
          message: 'Quét mã thành công!',
        };
      }

      // Handle errors
      const errorMsg = response.message || '';
      if (errorMsg.includes('not enrolled')) {
        return {
          success: false,
          message: 'Quét sai lớp học - Bạn chưa đăng ký lớp này',
        };
      }

      return {
        success: false,
        message: 'Quét QR lỗi',
      };
    } catch (error) {
      return {
        success: false,
        message: 'Quét QR lỗi - ' + error.message,
      };
    }
  }}
/>
```

## ✅ Testing checklist

- [ ] Quét QR hợp lệ → Hiển thị "Quét mã thành công"
- [ ] Quét QR hết hạn → Hiển thị "Mã QR đã hết hạn"
- [ ] Quét QR lớp chưa đăng ký → Hiển thị "Quét sai lớp học"
- [ ] Quét QR không hợp lệ → Hiển thị "Quét QR lỗi"
- [ ] Nhấn "Quét lại" → Reset về trạng thái ban đầu
- [ ] Nhấn "Hoàn tất" khi thành công → Đóng modal
- [ ] Bật/tắt đèn flash → Hoạt động đúng
- [ ] Camera permission → Xử lý đúng các trường hợp

## 📝 Notes

1. **Breaking Changes**: API props đã thay đổi hoàn toàn, cần update tất cả các nơi sử dụng QrScannerModal
2. **Backward Compatibility**: Không tương thích ngược với version cũ
3. **Migration Required**: Cần migrate toàn bộ code sử dụng QR Scanner
4. **Performance**: Tối ưu hơn với ít state hơn và logic đơn giản hơn

## 🎯 Lợi ích

✅ **Đơn giản hơn** - Chỉ 1 callback thay vì 2-4 callbacks
✅ **Rõ ràng hơn** - UI phân biệt rõ các trạng thái
✅ **Dễ maintain** - Code ngắn gọn, logic tập trung
✅ **UX tốt hơn** - Người dùng hiểu ngay kết quả quét
✅ **Flexible** - Dễ customize thông báo lỗi
