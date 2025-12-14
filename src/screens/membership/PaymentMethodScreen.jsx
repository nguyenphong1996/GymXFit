import React, { useState, useEffect, useContext } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  Linking,
  ActivityIndicator,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { createPaymentUrl } from '@api/membershipApi';
import { UserContext } from '@context/UserContext';
import { launchVnpaySdk } from '../../utils/vnpaySdk';

const MD3_COLORS = {
  primary: '#1F8E4A',
  onPrimary: '#FFFFFF',
  surface: '#FFFFFF',
  background: '#F5F7F6',
  onSurface: '#191C19',
  onSurfaceVariant: '#404943',
  textSecondary: '#47614F',
  outlineVariant: '#C1C9BF',
  error: '#BA1A1A',
  success: '#34D399',
  warning: '#F59E0B',
  tertiary: '#2196F3',
};

const MD3_ELEVATION = {
  level1: {
    shadowColor: 'rgba(0, 0, 0, 0.32)',
    shadowOpacity: 0.15,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
};

const PaymentMethodScreen = ({ navigation, route }) => {
  const { plan } = route.params || {};
  const { user, refreshUser } = useContext(UserContext);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const handleDeepLink = async (event) => {
      if (event.url) {
        const url = new URL(event.url);
        if (url.protocol === 'gymxfit:' && url.hostname === 'payment-result') {
          const params = new URLSearchParams(url.search);
          const vnp_ResponseCode = params.get('code');
          const vnp_Message = params.get('message');
          const vnp_TxnRef = params.get('orderId');
          
          setIsLoading(false);
          if (vnp_ResponseCode === '00') {
            Alert.alert('Thành công', `Thanh toán gói ${plan.name} thành công! Mã giao dịch: ${vnp_TxnRef}`);
            if (refreshUser) {
              await refreshUser();
            }
            navigation.goBack();
          } else {
            Alert.alert('Thất bại', `Thanh toán gói ${plan.name} thất bại: ${vnp_Message || 'Có lỗi xảy ra.'}`);
          }
        }
      }
    };

    Linking.addEventListener('url', handleDeepLink);

    return () => {
      Linking.removeEventListener('url', handleDeepLink);
    };
  }, [navigation, plan.name, refreshUser]);

  const paymentMethods = [
    {
      id: 'banking',
      icon: 'bank',
      title: 'Chuyển khoản ngân hàng',
      description: 'Chuyển tiền trực tiếp qua ngân hàng của bạn',
      color: MD3_COLORS.tertiary,
      iconLib: 'MaterialCommunityIcons',
    },
    {
      id: 'vnpay_token',
      icon: 'credit-card-check',
      title: 'Thanh toán thẻ VNPAY',
      description: 'Lưu thẻ, chọn thẻ và thanh toán OTP',
      color: MD3_COLORS.primary,
      iconLib: 'MaterialCommunityIcons',
    },
    {
      id: 'counter',
      icon: 'local-atm',
      title: 'Thanh toán tại quầy',
      description: 'Tới chi nhánh gần nhất để thanh toán',
      color: MD3_COLORS.warning,
      iconLib: 'MaterialIcons',
    },
  ];

  const handlePaymentMethodSelect = async (method) => {
    if (isLoading) return;

    if (!user || !user.id) {
      Alert.alert('Lỗi', 'Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.');
      return;
    }

    setIsLoading(true);

    try {
      if (method.id === 'vnpay_token') {
        const paymentDetails = {
          amount: plan.amountDue,
          orderInfo: `Thanh toan goi ${plan.name} (${plan.billingCycle})`,
          packageId: plan._id || plan.id,
          billingCycle: plan.billingCycle,
          isUpgrade: plan.isUpgrade || false,
          isTemporary: plan.isTemporary || false,
          userId: user.id,
        };

        const response = await createPaymentUrl(paymentDetails);
        if (response?.vnpUrl) {
          const vnpUrl = response.vnpUrl;
          const urlObj = new URL(vnpUrl);
          const tmnCode = urlObj.searchParams.get('vnp_TmnCode') || process.env.EXPO_PUBLIC_VNP_TMNCODE || '';
          
          if (!tmnCode) {
              Alert.alert('Lỗi', 'Thiếu thông tin Terminal Code (vnp_TmnCode) để mở SDK.');
              setIsLoading(false);
              return;
          }

          launchVnpaySdk({
              paymentUrl: vnpUrl,
              scheme: 'gymxfit',
              tmnCode: tmnCode,
              isSandbox: true,
              title: 'Thanh toán GymXFit'
          });
        } else {
          Alert.alert('Lỗi', 'Không thể tạo URL thanh toán VNPAY. Vui lòng thử lại.');
          setIsLoading(false);
        }
        return;
      }

      if (method.id === 'banking') {
        setIsLoading(false);
        navigation.navigate('BankTransferScreen', { plan });
        return;
      }

      const messages = {
        counter: 'Vui lòng mang CMND/CCCD đến chi nhánh gần nhất. Nhân viên sẽ hỗ trợ hoàn tất thủ tục trong 10 phút.',
      };

      Alert.alert(
        'Xác nhận',
        `Phương thức: ${method.title}\n\n${messages[method.id] || ''}`,
        [
          {
            text: 'Hủy',
            onPress: () => setIsLoading(false),
            style: 'cancel',
          },
          {
            text: 'Xác nhận',
            onPress: () => {
              Alert.alert('Thành công', `Đã chọn phương thức: ${method.title}`);
              setTimeout(() => {
                setIsLoading(false);
                navigation.goBack();
              }, 1500);
            },
          },
        ]
      );
    } catch (error) {
      setIsLoading(false);
      const errorMessage = error?.response?.data?.message || error?.message || 'Đã xảy ra lỗi không xác định.';
      Alert.alert('Lỗi thanh toán', errorMessage);
      console.error('Payment error:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={MD3_COLORS.surface} />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <MaterialIcons name="arrow-back" size={24} color={MD3_COLORS.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chọn hình thức thanh toán</Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {plan && (
          <View style={styles.planCard}>
            <View style={styles.planCardContent}>
              <Text style={styles.planCardTitle}>{plan.name} {plan.isUpgrade && plan.creditValue > 0 ? ' (Nâng cấp)' : ''}</Text>
              {plan.isUpgrade && plan.creditValue > 0 && (
                <Text style={styles.planCardSubText}>Đã khấu trừ từ gói cũ: {plan.priceLabel || '0đ'}</Text>
              )}
              <Text style={styles.planCardPrice}>Tổng tiền: {plan.priceLabel || '0đ'}</Text>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chọn phương thức thanh toán</Text>
          <View style={styles.methodsGrid}>
            {paymentMethods.map(method => (
              <TouchableOpacity
                key={method.id}
                style={styles.methodCard}
                onPress={() => handlePaymentMethodSelect(method)}
                activeOpacity={0.85}
              >
                <View
                  style={[ 
                    styles.methodIconContainer,
                    { backgroundColor: method.color + '15' },
                  ]}
                >
                  {method.iconLib === 'MaterialCommunityIcons' ? (
                    <MaterialCommunityIcons
                      name={method.icon}
                      size={28}
                      color={method.color}
                    />
                  ) : (
                    <MaterialIcons name={method.icon} size={28} color={method.color} />
                  )}
                </View>
                <Text style={styles.methodTitle}>{method.title}</Text>
                <Text style={styles.methodDescription}>{method.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.infoBox}>
          <MaterialIcons
            name="info-outline"
            size={20}
            color={MD3_COLORS.primary}
            style={{ marginRight: 8 }}
          />
          <Text style={styles.infoText}>
            Hóa đơn sẽ được gửi đến email của bạn sau khi thanh toán thành công.
          </Text>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={MD3_COLORS.primary} />
          <Text style={styles.loadingText}>Đang xử lý thanh toán...</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

export default PaymentMethodScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MD3_COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: MD3_COLORS.surface,
    paddingHorizontal: 4,
    paddingVertical: 8,
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: MD3_COLORS.outlineVariant,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: MD3_COLORS.onSurface,
    flex: 1,
    textAlign: 'center',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  planCard: {
    backgroundColor: MD3_COLORS.primary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    ...MD3_ELEVATION.level1,
  },
  planCardContent: {
    gap: 8,
  },
  planCardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: MD3_COLORS.onPrimary,
  },
  planCardSubText: {
    fontSize: 14,
    fontWeight: '400',
    color: MD3_COLORS.onPrimary,
    opacity: 0.8,
  },
  planCardPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: MD3_COLORS.onPrimary,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: MD3_COLORS.onSurface,
    marginBottom: 16,
  },
  methodsGrid: {
    gap: 12,
  },
  methodCard: {
    backgroundColor: MD3_COLORS.surface,
    borderRadius: 12,
    padding: 16,
    gap: 12,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: MD3_COLORS.outlineVariant,
    ...MD3_ELEVATION.level1,
  },
  methodIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: MD3_COLORS.onSurface,
  },
  methodDescription: {
    fontSize: 14,
    color: MD3_COLORS.textSecondary,
    lineHeight: 20,
  },
  infoBox: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoText: {
    fontSize: 13,
    color: '#2E7D32',
    lineHeight: 18,
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: MD3_COLORS.onSurface,
  },
});
