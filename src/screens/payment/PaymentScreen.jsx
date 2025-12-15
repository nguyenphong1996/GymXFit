import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StatusBar,

} from 'react-native';
import { WebView } from 'react-native-webview';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { createVnpayPaymentUrl, checkVnpayPaymentStatus } from '../../api/paymentApi';
import { UserContext } from '@context/UserContext';
import { launchVnpaySdk } from '../../utils/vnpaySdk';
import { computeCyclePrice } from '../../utils/membership';

// Reusing MD3 design tokens for consistency
const MD3_COLORS = {
  primary: '#1F8E4A',
  onPrimary: '#FFFFFF',
  surface: '#FFFFFF',
  background: '#F5F7F6',
  onSurface: '#191C19',
  textPrimary: '#10241A',
  textSecondary: '#47614F',
};

const MD3_TYPE = {
  titleLarge: { fontSize: 22, lineHeight: 28, fontWeight: '700' },
  bodyLarge: { fontSize: 16, lineHeight: 24, fontWeight: '400' },
  labelLarge: { fontSize: 14, lineHeight: 20, fontWeight: '600' },
};

const resolveUserId = (user) => {
  if (!user) {
    return null;
  }

  return (
    user.id ||
    user._id ||
    user.userId ||
    user.user_id ||
    user.customerId ||
    user.customer_id ||
    null
  );
};

const PaymentScreen = ({ route, navigation }) => {
  const { plan } = route.params;
  const { user, isLoading: isUserLoading } = useContext(UserContext);
  const [isLoading, setIsLoading] = useState(true);
  const [paymentUrl, setPaymentUrl] = useState('');
  const webViewRef = React.useRef(null);
  const resolveAmountNumber = () => {
    if (typeof plan?.amountDue === 'number') return plan.amountDue;
    if (plan?.price && typeof plan.price === 'string') {
      const parsed = parseInt(plan.price.replace(/[^0-9]/g, ''), 10);
      if (!Number.isNaN(parsed)) return parsed;
    }
    if (plan?.basePrice) return computeCyclePrice(plan.basePrice, plan?.billingCycle || 'month');
    return 0;
  };

  const defaultApiBaseUrl = React.useMemo(() => {
    const base =
      process.env.EXPO_PUBLIC_API_BASE_URL ||
      process.env.API_BASE_URL ||
      'https://be.vnchack.com/';

    return base.replace(/\/+$/, '');
  }, []);





  const openVnpaySdk = (url) => {
      try {
          const urlObj = new URL(url);
          const tmnCode = urlObj.searchParams.get('vnp_TmnCode') || process.env.EXPO_PUBLIC_VNP_TMNCODE || process.env.VNP_TMNCODE || '';
          
          if (!tmnCode) {
              Alert.alert('Lỗi', 'Thiếu thông tin Terminal Code (vnp_TmnCode).');
              return;
          }

          launchVnpaySdk({
              scheme: 'com.gymxfit',
              paymentUrl: url,
              tmnCode: tmnCode,
              isSandbox: true, 
              title: 'Thanh toán GymXFit'
          });
      } catch (e) {
          console.error('SDK Error:', e);
          Alert.alert('Lỗi', 'Không thể mở ứng dụng thanh toán.');
      }
  };

  useEffect(() => {
    let isMounted = true;

    const getPaymentUrl = async () => {
      if (isUserLoading) {
        return;
      }

      setIsLoading(true);

      try {
        const userId = resolveUserId(user);
        if (!userId) {
          Alert.alert('Lỗi', 'Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.', [
            { text: 'OK', onPress: () => navigation.goBack() }
          ]);
          return;
        }

        const priceNumber =
          typeof plan?.amountDue === 'number'
            ? plan.amountDue
            : computeCyclePrice(plan?.basePrice, plan?.billingCycle || 'month');
        const paymentDetails = {
          amount: priceNumber,
          userId: userId,
          packageId: plan.id,
          orderInfo: `Thanh toan goi ${plan.name}`,
          billingCycle: plan?.billingCycle || 'month',
          isUpgrade: plan?.isUpgrade || false,
          isTemporary: plan?.isTemporary || false,
        };

        const response = await createVnpayPaymentUrl(paymentDetails);
        if (response && response.vnpUrl) {
          if (isMounted) {
            setPaymentUrl(response.vnpUrl);
            openVnpaySdk(response.vnpUrl);
          }
        } else {
          Alert.alert('Lỗi', 'Không thể tạo URL thanh toán.', [
            { text: 'OK', onPress: () => navigation.goBack() }
          ]);
        }
      } catch (error) {
        console.error('Lỗi khi tạo URL thanh toán:', error);
        Alert.alert('Lỗi', 'Đã có lỗi xảy ra khi chuẩn bị thanh toán.', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    getPaymentUrl();
    return () => {
      isMounted = false;
    };
  }, [plan, navigation, user, isUserLoading]);
  

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={MD3_COLORS.surface} />
      {/* App Bar */}
      <View style={styles.topAppBar}>
        <TouchableOpacity style={styles.appBarButton} onPress={() => navigation.goBack()}>
          <MaterialIcons name="close" size={24} color={MD3_COLORS.onSurface} />
        </TouchableOpacity>
        <Text style={styles.appBarTitle}>Thanh toán an toàn</Text>
        <View style={styles.appBarButton} />
      </View>

      {/* Order Summary */}
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryText}>Gói dịch vụ: <Text style={styles.summaryValue}>{plan.name}</Text></Text>
        <Text style={styles.summaryText}>Số tiền: <Text style={styles.summaryValue}>{plan.price}</Text></Text>
      </View>
      
      <View style={styles.loaderContainer}>
          
             <>
                <ActivityIndicator size="large" color={MD3_COLORS.primary} />
                <Text style={styles.loaderText}>Đang mở cổng thanh toán VNPAY...</Text>
                
                <TouchableOpacity 
                    style={{ marginTop: 20, padding: 10, backgroundColor: MD3_COLORS.primary, borderRadius: 8 }}
                    onPress={() => openVnpaySdk(paymentUrl)}
                >
                    <Text style={{ color: '#FFF', fontWeight: '600' }}>Mở lại cổng thanh toán</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={{ marginTop: 10, padding: 10 }}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={{ color: MD3_COLORS.textSecondary, fontWeight: '600' }}>Hủy bỏ</Text>
                </TouchableOpacity>
             </>
          
      </View>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MD3_COLORS.background,
  },
  topAppBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: MD3_COLORS.surface,
    paddingHorizontal: 4,
    height: 64,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0'
  },
  appBarButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appBarTitle: {
    ...MD3_TYPE.titleLarge,
    color: MD3_COLORS.onSurface,
    textAlign: 'center',
  },
  summaryContainer: {
    padding: 16,
    backgroundColor: MD3_COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0'
  },
  summaryText: {
    ...MD3_TYPE.bodyLarge,
    color: MD3_COLORS.textSecondary,
    marginBottom: 4,
  },
  summaryValue: {
    ...MD3_TYPE.labelLarge,
    color: MD3_COLORS.textPrimary,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: MD3_COLORS.background
  },
  loaderText: {
    marginTop: 10,
    ...MD3_TYPE.bodyLarge,
    color: MD3_COLORS.textSecondary
  },
  fullScreenLoader: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default PaymentScreen;
