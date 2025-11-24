import React, { useEffect, useMemo, useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StatusBar
} from 'react-native';
import { WebView } from 'react-native-webview';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { UserContext } from '@context/UserContext';
import { createVnpayTokenInitUrl, createVnpayTokenPayUrl, checkVnpayPaymentStatus } from '../../api/paymentApi';

// MD3 tokens reuse
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
  if (!user) return null;
  return user.id || user._id || user.userId || user.user_id || user.customerId || user.customer_id || null;
};

const PaymentTokenScreen = ({ route, navigation }) => {
  const { plan, token } = route.params || {};
  const { user, isLoading: isUserLoading } = useContext(UserContext);
  const [isLoading, setIsLoading] = useState(true);
  const [paymentUrl, setPaymentUrl] = useState('');
  const [returnUrl, setReturnUrl] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const defaultApiBaseUrl = useMemo(() => {
    const base = process.env.EXPO_PUBLIC_API_BASE_URL || process.env.API_BASE_URL || 'https://be.vnchack.com/';
    return base.replace(/\/+$/, '');
  }, []);

  const extractReturnUrl = (fullPaymentUrl) => {
    if (!fullPaymentUrl) {
      return `${defaultApiBaseUrl}/api/v1/payment/vnpay-return`;
    }
    try {
      const parsed = new URL(fullPaymentUrl);
      const encodedReturn = parsed.searchParams.get('vnp_return_url');
      if (encodedReturn) {
        return decodeURIComponent(encodedReturn);
      }
    } catch (error) {
      console.log('Không thể trích xuất returnUrl từ paymentUrl', error);
    }
    return `${defaultApiBaseUrl}/api/v1/payment/vnpay-return`;
  };

  useEffect(() => {
    let isMounted = true;

    const initPayment = async () => {
      if (isUserLoading) return;
      setIsLoading(true);

      try {
        const userId = resolveUserId(user);
        if (!userId) {
          Alert.alert('Lỗi', 'Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.', [
            { text: 'OK', onPress: () => navigation.goBack() }
          ]);
          return;
        }

        const priceNumber = parseInt(plan.price.replace(/[^0-9]/g, ''), 10) || 0;
        const basePayload = {
          amount: priceNumber,
          userId,
          packageId: plan.id,
          orderInfo: `Thanh toan goi ${plan.name}`,
        };

        const apiCall = token ? createVnpayTokenPayUrl : createVnpayTokenInitUrl;
        const response = await apiCall(
          token
            ? { ...basePayload, token }
            : { ...basePayload, mode: 'pay_and_create' }
        );

        if (response && response.vnpUrl) {
          if (isMounted) {
            setPaymentUrl(response.vnpUrl);
            setReturnUrl(extractReturnUrl(response.vnpUrl));
          }
        } else {
          Alert.alert('Lỗi', 'Không thể tạo URL thanh toán thẻ VNPAY.', [
            { text: 'OK', onPress: () => navigation.goBack() }
          ]);
        }
      } catch (error) {
        const respMessage = error?.response?.data?.message;
        const message =
          respMessage ||
          error?.message ||
          'Đã có lỗi xảy ra khi chuẩn bị thanh toán.';
        setErrorMessage(message);
        // console.warn để tránh RedBox khi dev
        console.warn('Lỗi khi tạo URL thanh toán thẻ VNPAY:', message);
        Alert.alert('Lỗi', message, [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initPayment();
    return () => { isMounted = false; };
  }, [plan, navigation, user, isUserLoading, token]);

  const handleNavigationStateChange = async (navState) => {
    if (!returnUrl) return;

    const normalizedReturnUrl = returnUrl.replace(/\/+$/, '');
    const normalizedNavUrl = navState.url?.replace(/\/+$/, '');
    if (!normalizedNavUrl || !normalizedNavUrl.startsWith(normalizedReturnUrl)) return;

    if (navState.loading || isVerifying) return;

    setIsVerifying(true);
    Alert.alert('Thông báo', 'Đang xác nhận kết quả giao dịch...');

    try {
      const url = new URL(navState.url);
      const queryParams = Object.fromEntries(url.searchParams.entries());
      const result = await checkVnpayPaymentStatus(queryParams);

      if (result.code === '00') {
        Alert.alert('Thành công', 'Thanh toán VNPAY thành công!');
      } else {
        Alert.alert('Thất bại', `Thanh toán không thành công: ${result.message || 'Vui lòng thử lại.'}`);
      }
    } catch (error) {
      console.error('Lỗi khi xác nhận thanh toán VNPAY:', error);
      Alert.alert('Lỗi', 'Không thể xác nhận trạng thái thanh toán.');
    } finally {
      setIsVerifying(false);
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={MD3_COLORS.surface} />
      <View style={styles.topAppBar}>
        <TouchableOpacity style={styles.appBarButton} onPress={() => navigation.goBack()}>
          <MaterialIcons name="close" size={24} color={MD3_COLORS.onSurface} />
        </TouchableOpacity>
        <Text style={styles.appBarTitle}>Thanh toán thẻ VNPAY</Text>
        <View style={styles.appBarButton} />
      </View>

      <View style={styles.summaryContainer}>
        <Text style={styles.summaryText}>Gói dịch vụ: <Text style={styles.summaryValue}>{plan.name}</Text></Text>
        <Text style={styles.summaryText}>Số tiền: <Text style={styles.summaryValue}>{plan.price}</Text></Text>
      </View>

      {errorMessage ? (
        <View style={styles.loaderContainer}>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      ) : paymentUrl ? (
        <WebView
          source={{ uri: paymentUrl }}
          style={{ flex: 1 }}
          onLoadStart={() => setIsLoading(true)}
          onLoadEnd={() => setIsLoading(false)}
          onNavigationStateChange={handleNavigationStateChange}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color={MD3_COLORS.primary} />
              <Text style={styles.loaderText}>Đang tải trang thanh toán...</Text>
            </View>
          )}
        />
      ) : (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={MD3_COLORS.primary} />
          <Text style={styles.loaderText}>Đang tạo giao dịch, vui lòng chờ...</Text>
        </View>
      )}

      {isLoading && !paymentUrl && (
        <View style={styles.fullScreenLoader}>
          <ActivityIndicator size="large" color={MD3_COLORS.onPrimary} />
        </View>
      )}
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
    borderBottomColor: '#eee'
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
    borderBottomColor: '#eee'
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
  errorText: {
    ...MD3_TYPE.bodyLarge,
    color: '#BA1A1A',
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  fullScreenLoader: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default PaymentTokenScreen;
