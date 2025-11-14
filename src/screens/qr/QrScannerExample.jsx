/**
 * Ví dụ cách sử dụng QrScannerModal với Toast Notification
 * 
 * Component này mô phỏng cách tích hợp QR Scanner vào ứng dụng
 * với logic xử lý 4 trạng thái và hiển thị thông báo toast:
 * - ✅ Quét mã thành công (Toast màu xanh)
 * - ⏰ Mã QR hết hạn (Toast màu cam)
 * - ❌ Quét sai lớp học (Toast màu đỏ)
 * - ⚠️ Quét QR lỗi (Toast màu đỏ đậm)
 * 
 * Toast sẽ tự động ẩn sau 2.5 giây và cho phép quét tiếp
 */

import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import QrScannerModal from './QrScannerModal';
import { checkInToClass } from '@api/classesApi';

const QrScannerExample = () => {
  const [showScanner, setShowScanner] = useState(false);

  /**
   * Hàm xử lý khi quét QR code thành công
   * @param {Object} qrData - Dữ liệu từ QR code đã được parse
   * @returns {Object} - { success: boolean, message: string }
   */
  const handleScanSuccess = async (qrData) => {
    try {
      console.log('QR Data received:', qrData);

      // Kiểm tra QR code có hợp lệ không
      if (!qrData.classId || !qrData.token) {
        return {
          success: false,
          message: 'Mã QR không hợp lệ - Thiếu thông tin cần thiết',
        };
      }

      // Kiểm tra QR code đã hết hạn chưa
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

      // Gọi API để check-in
      const response = await checkInToClass({
        classId: qrData.classId,
        qrValue: JSON.stringify(qrData),
        role: 'customer',
      });

      // Kiểm tra response từ API
      if (response.success) {
        return {
          success: true,
          message: response.message || 'Quét mã thành công! Bạn đã check-in vào lớp học.',
        };
      } else {
        // Xử lý các lỗi từ API
        const errorMessage = response.message || response.error || '';
        
        // Kiểm tra loại lỗi
        if (errorMessage.includes('not enrolled') || 
            errorMessage.includes('không đăng ký') ||
            errorMessage.includes('Enrollment not found')) {
          return {
            success: false,
            message: 'Quét sai lớp học - Bạn chưa đăng ký lớp này',
          };
        }
        
        if (errorMessage.includes('expired') || 
            errorMessage.includes('hết hạn')) {
          return {
            success: false,
            message: 'Mã QR đã hết hạn',
          };
        }
        
        if (errorMessage.includes('invalid') || 
            errorMessage.includes('không hợp lệ')) {
          return {
            success: false,
            message: 'Quét QR lỗi - Mã không hợp lệ',
          };
        }

        // Lỗi khác
        return {
          success: false,
          message: errorMessage || 'Quét QR lỗi',
        };
      }
    } catch (error) {
      console.error('Error handling QR scan:', error);
      
      // Xử lý lỗi từ exception
      const errorMessage = error?.message || '';
      
      if (errorMessage.includes('not enrolled') || 
          errorMessage.includes('không đăng ký')) {
        return {
          success: false,
          message: 'Quét sai lớp học - Bạn chưa đăng ký lớp này',
        };
      }
      
      if (errorMessage.includes('expired') || 
          errorMessage.includes('hết hạn')) {
        return {
          success: false,
          message: 'Mã QR đã hết hạn',
        };
      }
      
      return {
        success: false,
        message: 'Quét QR lỗi - ' + (errorMessage || 'Không thể xử lý mã QR'),
      };
    }
  };

  const handleCloseScanner = () => {
    setShowScanner(false);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.button}
        onPress={() => setShowScanner(true)}
      >
        <Text style={styles.buttonText}>Mở QR Scanner</Text>
      </TouchableOpacity>

      <QrScannerModal
        visible={showScanner}
        onClose={handleCloseScanner}
        onScanSuccess={handleScanSuccess}
        helperTitle="Quét mã QR để điểm danh vào lớp học"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#05130B',
  },
  button: {
    backgroundColor: '#30C451',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#30C451',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default QrScannerExample;
