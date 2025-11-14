# QR Scanner - Hướng dẫn sử dụng

## Tổng quan

Component **QrScannerModal** đã được thiết kế với giao diện tối giản - chỉ hiển thị **Toast notification** khi quét QR, không có card kết quả hay nút bấm. Toast sẽ tự động ẩn sau 2.5 giây.

### 4 Loại Toast Notification:

1. **✅ Quét mã thành công**
   - Màu: Xanh lá (#30C451)
   - Icon: check-circle
   - Message: "Quét mã thành công!"
   - Rung: Pattern thành công (2 lần ngắn)

2. **⏰ Mã QR đã hết hạn**
   - Màu: Cam (#FFA726)
   - Icon: clock-alert-outline
   - Message: "Mã QR đã hết hạn"
   - Rung: Pattern lỗi (2 lần dài)

3. **❌ Quét sai lớp học**
   - Màu: Đỏ (#FF5252)
   - Icon: alert-circle-outline
   - Message: "Quét sai lớp học - Bạn chưa đăng ký lớp này"
   - Rung: Pattern lỗi (2 lần dài)

4. **⚠️ Quét QR lỗi**
   - Màu: Đỏ đậm (#FD5D5D)
   - Icon: close-circle-outline
   - Message: "Quét QR lỗi - Mã không hợp lệ"
   - Rung: Pattern lỗi (2 lần dài)

## Đặc điểm

- ✅ **Không có nút bấm** - Toast hiển thị và tự động ẩn
- ✅ **Tự động reset** - Có thể quét tiếp sau 2.5 giây
- ✅ **Feedback rõ ràng** - Màu sắc và icon khác nhau
- ✅ **Vibration pattern** - Rung khác nhau cho thành công/lỗi
- ✅ **Liên tục quét** - Không cần nhấn nút "Quét lại"

## Cách sử dụng

### 1. Import component

```jsx
import QrScannerModal from '@screens/qr/QrScannerModal';
```

### 2. Sử dụng trong component

```jsx
const MyComponent = () => {
  const [showScanner, setShowScanner] = useState(false);

  const handleScanSuccess = async (qrData) => {
    try {
      // Validate QR code structure
      if (!qrData.classId || !qrData.token) {
        return {
          success: false,
          message: 'Mã QR không hợp lệ',
        };
      }

      // Check expiration
      if (qrData.expiresAt) {
        const expiryTime = new Date(qrData.expiresAt).getTime();
        const currentTime = new Date().getTime();
        
        if (currentTime > expiryTime) {
          return {
            success: false,
            message: 'Mã QR đã hết hạn',
          };
        }
      }

      // Call API to check-in
      const response = await checkInToClass({
        classId: qrData.classId,
        qrValue: JSON.stringify(qrData),
      });

      if (response.success) {
        return {
          success: true,
          message: 'Quét mã thành công!',
        };
      } else {
        // Handle API errors
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
      }
    } catch (error) {
      return {
        success: false,
        message: 'Quét QR lỗi - ' + error.message,
      };
    }
  };

  return (
    <View>
      <Button 
        title="Quét QR" 
        onPress={() => setShowScanner(true)} 
      />

      <QrScannerModal
        visible={showScanner}
        onClose={() => setShowScanner(false)}
        onScanSuccess={handleScanSuccess}
        helperTitle="Quét mã QR để điểm danh"
      />
    </View>
  );
};
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `visible` | boolean | Yes | Hiển thị/ẩn modal |
| `onClose` | function | Yes | Callback khi đóng modal |
| `onScanSuccess` | function | Yes | Callback xử lý khi quét QR thành công |
| `helperTitle` | string | No | Text hướng dẫn (mặc định: "Giữ thiết bị ổn định, đưa QR vào khung để quét mã") |

## Callback onScanSuccess

Hàm `onScanSuccess` nhận vào QR data đã được parse và phải trả về một object với cấu trúc:

```javascript
{
  success: boolean,  // true = thành công, false = lỗi
  message: string    // Thông báo hiển thị cho user
}
```

### Xử lý các trường hợp lỗi:

Component sẽ tự động phân loại lỗi dựa trên `message`:

- **Hết hạn**: Message chứa "hết hạn" hoặc "expired"
- **Sai lớp**: Message chứa "không đăng ký", "not enrolled", hoặc "wrong class"
- **Không hợp lệ**: Message chứa "không hợp lệ" hoặc "invalid"
- **Lỗi khác**: Các message còn lại

## Ví dụ QR Code format

```json
{
  "classId": "class_123456",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "generatedAt": "2025-11-09T10:30:00.000Z",
  "expiresAt": "2025-11-09T11:30:00.000Z"
}
```

## Tính năng

- ✅ Giao diện đẹp với animation
- ✅ Xử lý quyền camera tự động
- ✅ Hỗ trợ bật/tắt đèn flash
- ✅ Hiển thị rõ ràng các trạng thái khác nhau
- ✅ Feedback bằng rung khi quét thành công
- ✅ Xử lý lỗi tự động và phân loại
- ✅ UI/UX thân thiện với người dùng
- ✅ Chống quét trùng trong khi đang xử lý

## Lưu ý

1. **Permission**: Component tự động xử lý quyền camera
2. **Vibration**: Đã thêm quyền VIBRATE vào AndroidManifest.xml
3. **Throttle**: Camera có throttle 1500ms để tránh quét nhiều lần
4. **Processing**: Chặn quét mới khi đang xử lý QR code hiện tại

## Màu sắc theo trạng thái

- **Success**: Xanh lá (#30C451) - Border và background nhạt
- **Expired**: Cam (#FFA726) - Border và background nhạt
- **Wrong Class**: Đỏ (#FF5252) - Border và background nhạt
- **Invalid**: Đỏ đậm (#FD5D5D) - Border và background nhạt

## File liên quan

- `/src/screens/qr/QrScannerModal.jsx` - Component chính
- `/src/screens/qr/QrScannerExample.jsx` - Ví dụ sử dụng
- `/src/api/classesApi.js` - API calls
- `/android/app/src/main/AndroidManifest.xml` - Android permissions
