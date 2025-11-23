import React, { useState, useEffect, useContext } from 'react';
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
import { createVnpayPaymentUrl, checkVnpayPaymentStatus } from '../../api/paymentApi';
import { UserContext } from '@context/UserContext';

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

        const priceNumber = parseInt(plan.price.replace(/[^0-9]/g, ''), 10) || 0;
        const paymentDetails = {
          amount: priceNumber,
          userId: userId,
          packageId: plan.id,
          orderInfo: `Thanh toan goi ${plan.name}`,
        };

        const response = await createVnpayPaymentUrl(paymentDetails);
        if (response && response.vnpUrl) {
          if (isMounted) {
            setPaymentUrl(response.vnpUrl);
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
  
  const handleNavigationStateChange = async (navState) => {
    const returnUrlPattern = new RegExp(`^https://be.phongnguyen.software/api/v1/payment/vnpay-return`);
    if (navState.url.match(returnUrlPattern)) {
      navigation.goBack(); // Close this screen immediately
      Alert.alert('Thông báo', 'Đang xác nhận kết quả giao dịch...');

      try {
        const url = new URL(navState.url);
        const queryParams = Object.fromEntries(url.searchParams.entries());

        const result = await checkVnpayPaymentStatus(queryParams);

        if (result.code === '00') {
          Alert.alert('Thành công', 'Thanh toán VNPAY thành công!');
          // navigation.navigate('PaymentSuccessScreen', { plan });
        } else {
          Alert.alert('Thất bại', `Thanh toán không thành công: ${result.message}`);
          // navigation.navigate('PaymentFailureScreen', { plan, message: result.message });
        }
      } catch (error) {
        Alert.alert('Lỗi', 'Không thể xác nhận trạng thái thanh toán.');
      }
    }
  };


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
      
      {/* WebView or Loader */}
      {paymentUrl ? (
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
  fullScreenLoader: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default PaymentScreen;
