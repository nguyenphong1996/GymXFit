import React, { useContext, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Image,
  ScrollView
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { UserContext } from '@context/UserContext';
import { useToast } from '@context/ToastContext';
import { createPtBooking } from '@api/ptBookingApi';
import { createVnpayPaymentUrl, getVnpayTokens, createVnpayTokenPayUrl } from '@api/paymentApi';
import { launchVnpaySdk } from '@utils/vnpaySdk';

// Assume a price for a single PT session if not defined elsewhere
const SINGLE_SESSION_PRICE = 200000; 

const BookingConfirmationScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { showToast } = useToast();
  const { user, membership, fetchMembership } = useContext(UserContext);
  const { staff, slot, date } = route.params;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tokens, setTokens] = useState([]);
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);

  const hasFreeSessions = (membership?.remainingSessions ?? 0) > 0;

  // Kiểm tra token đã lưu khi component mount
  React.useEffect(() => {
    const checkTokens = async () => {
      if (!hasFreeSessions) {
        try {
          const userId = user.id || user._id;
          const tokenResponse = await getVnpayTokens(userId);
          setTokens(tokenResponse || []);
        } catch (error) {
          console.warn('Không thể lấy danh sách token:', error);
        }
      }
    };
    checkTokens();
  }, [user, hasFreeSessions]);

  const handleFreeBooking = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        staffId: staff.id,
        date: date,
        slotKey: slot.key,
        note: 'Đặt lịch từ ứng dụng GymXFit',
      };
      const response = await createPtBooking(payload);
      
      // API trả về { success: true, message, data }
      if (response?.success) {
        showToast({
          type: 'success',
          title: 'Thành công',
          message: 'Bạn đã đặt lịch PT thành công!',
        });
        await fetchMembership(); // Refresh membership info
        navigation.navigate('MyBookingsScreen');
      } else {
        throw new Error(response?.message || 'Không thể đặt lịch.');
      }
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Lỗi',
        message: error.message || 'Đặt lịch thất bại, vui lòng thử lại.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaidBooking = async () => {
    setIsSubmitting(true);
    try {
      // 1. Store pending booking details
      const pendingBooking = {
        staffId: staff.id,
        date: date,
        slotKey: slot.key,
      };
      await AsyncStorage.setItem('pendingBooking', JSON.stringify(pendingBooking));
      
      // 2. Create payment URL from our backend
      const paymentDetails = {
        amount: SINGLE_SESSION_PRICE,
        userId: user._id,
        orderInfo: `Thanh toan 1 buoi tap PT voi ${staff.name}`,
      };
      const response = await createVnpayPaymentUrl(paymentDetails);

      if (response && response.vnpUrl) {
        // 3. Launch VNPAY SDK
        const urlObj = new URL(response.vnpUrl);
        const tmnCode = urlObj.searchParams.get('vnp_TmnCode');
        
        if (!tmnCode) throw new Error('Thiếu TmnCode từ URL thanh toán.');

        launchVnpaySdk({
          scheme: 'com.gymxfit',
          paymentUrl: response.vnpUrl,
          tmnCode: tmnCode,
        });
      } else {
        throw new Error('Không thể tạo URL thanh toán.');
      }
    } catch (error) {
      console.error("Paid booking error:", error);
      await AsyncStorage.removeItem('pendingBooking'); // Clean up on error
      showToast({
        type: 'error',
        title: 'Lỗi thanh toán',
        message: error.message || 'Không thể khởi tạo thanh toán.',
      });
    } finally {
      // We don't set isSubmitting to false here because the deep link handler will take over
    }
  };

  const handleTokenBooking = async (token) => {
    setIsSubmitting(true);
    try {
      // 1. Store pending booking details
      const pendingBooking = {
        staffId: staff.id,
        date: date,
        slotKey: slot.key,
      };
      await AsyncStorage.setItem('pendingBooking', JSON.stringify(pendingBooking));
      
      // 2. Navigate to PaymentTokenScreen with token
      navigation.navigate('PaymentStack', {
        screen: 'PaymentTokenScreen',
        params: {
          plan: {
            name: `PT Session with ${staff.name}`,
            amountDue: SINGLE_SESSION_PRICE,
            priceLabel: `${SINGLE_SESSION_PRICE.toLocaleString('vi-VN')} VNĐ`,
            type: 'pt_session',
            staffId: staff.id,
            staffName: staff.name,
            date: date,
            slotKey: slot.key,
            orderInfo: `Thanh toan 1 buoi tap PT voi ${staff.name}`,
          },
          token: token.token,
          tokenMeta: {
            bankCode: token.bankCode || token.bankName,
            bankName: token.bankName || token.bankCode,
            cardMask: token.cardMask,
            cardType: token.cardType,
            cardHolderName: token.cardHolderName,
            cardExpiry: token.cardExpiry,
          }
        }
      });
    } catch (error) {
      console.error("Token booking error:", error);
      await AsyncStorage.removeItem('pendingBooking'); // Clean up on error
      showToast({
        type: 'error',
        title: 'Lỗi thanh toán',
        message: error.message || 'Không thể khởi tạo thanh toán.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChoosePayment = () => {
    if (tokens.length > 0) {
      setShowPaymentOptions(true);
    } else {
      // Navigate to card selection
      navigation.navigate('PaymentCardSelectScreen', {
        plan: {
          name: `PT Session with ${staff.name}`,
          amountDue: SINGLE_SESSION_PRICE,
          priceLabel: `${SINGLE_SESSION_PRICE.toLocaleString('vi-VN')} VNĐ`,
          type: 'pt_session'
        }
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="#10241A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Xác nhận đặt lịch</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
            <Text style={styles.cardTitle}>Thông tin buổi tập</Text>

            <View style={styles.infoRow}>
                <MaterialIcons name="person" size={24} color="#47614F" />
                <Text style={styles.infoText}>PT: <Text style={styles.infoValue}>{staff.name}</Text></Text>
            </View>
            <View style={styles.infoRow}>
                <MaterialIcons name="calendar-today" size={24} color="#47614F" />
                <Text style={styles.infoText}>Ngày: <Text style={styles.infoValue}>{new Date(date).toLocaleDateString('vi-VN')}</Text></Text>
            </View>
            <View style={styles.infoRow}>
                <MaterialIcons name="access-time" size={24} color="#47614F" />
                <Text style={styles.infoText}>Thời gian: <Text style={styles.infoValue}>{slot.key}</Text></Text>
            </View>
        </View>

        <View style={styles.card}>
            <Text style={styles.cardTitle}>Thông tin quyền lợi</Text>
            {hasFreeSessions ? (
                <Text style={styles.benefitText}>
                    Bạn còn <Text style={styles.highlight}>{membership.remainingSessions}</Text> buổi tập miễn phí.
                </Text>
            ) : (
                <Text style={styles.benefitText}>
                    Bạn đã hết buổi tập miễn phí. Buổi tập này sẽ được tính phí <Text style={styles.highlight}>{SINGLE_SESSION_PRICE.toLocaleString('vi-VN')} VNĐ</Text>.
                </Text>
            )}
        </View>

      </ScrollView>
      
      {!hasFreeSessions && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.button, isSubmitting && styles.buttonDisabled]}
            onPress={() => {
              if (tokens.length > 0) {
                handleTokenBooking(tokens[0]);
              } else {
                handlePaidBooking();
              }
            }}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Thanh toán {SINGLE_SESSION_PRICE.toLocaleString('vi-VN')} VNĐ</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {hasFreeSessions && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.button, isSubmitting && styles.buttonDisabled]}
            onPress={handleFreeBooking}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Xác nhận đặt lịch (Miễn phí)</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7F6' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#E0E0E0', backgroundColor: '#FFFFFF' },
  backButton: { marginRight: 16 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#10241A' },
  content: { padding: 16 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10241A',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 16,
    color: '#47614F',
    marginLeft: 16,
  },
  infoValue: {
    fontWeight: 'bold',
    color: '#10241A',
  },
  benefitText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#47614F',
  },
  highlight: {
    fontWeight: 'bold',
    color: '#1F8E4A',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },
  button: {
    backgroundColor: '#1F8E4A',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#A5D6A7',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default BookingConfirmationScreen;
