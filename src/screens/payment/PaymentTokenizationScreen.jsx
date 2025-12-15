import React, { useEffect, useState, useContext, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StatusBar,
  ScrollView,
  Linking,
  DeviceEventEmitter,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { UserContext } from '@context/UserContext';
import { createVnpayTokenInitUrl } from '../../api/paymentApi';
import { isVnpaySdkAvailable, launchVnpaySdk } from '../../utils/vnpaySdk';
import PaymentTokenCard from './components/PaymentTokenCard';

const MD3_COLORS = {
  primary: '#1F8E4A', // GymXFit green
  onPrimary: '#FFFFFF',
  surface: '#FFFFFF',
  background: '#F5F7F6',
  onSurface: '#191C19',
  textPrimary: '#10241A',
  textSecondary: '#47614F',
  outline: '#C1C9BF',
  error: '#BA1A1A',
};

const resolveUserId = (user) => {
  if (!user) return null;
  return user.id || user._id || user.userId || user.user_id || user.customerId || user.customer_id || null;
};

const PaymentTokenizationScreen = ({ route, navigation }) => {
  const { fromProfile } = route.params || {};
  console.log('PaymentTokenizationScreen params:', { fromProfile });
  const { user, isLoading: isUserLoading } = useContext(UserContext);
  
  const [isLoading, setIsLoading] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [txnRef, setTxnRef] = useState('');
  const [usingSdk, setUsingSdk] = useState(false);
  const [cardType, setCardType] = useState('01'); // 01: Nội địa, 02: Quốc tế

  useEffect(() => {
    const handlePaymentBack = (e) => {
      console.log('PaymentBack event on TokenizationScreen:', e);
      // resultCode: 97 (Success), 98 (Fail), 99 (Web Cancel), -1 (App Cancel)
      if (e && e.resultCode) {
        if (e.resultCode === 97) {
          Alert.alert('Thành công', 'Đã thêm thẻ mới thành công!');
          navigation.goBack();
        } else if (e.resultCode === 98) {
          Alert.alert('Thất bại', 'Không thể thêm thẻ. Vui lòng thử lại.');
        } else if (e.resultCode === 99 || e.resultCode === -1) {
          // User cancelled
          console.log('User cancelled tokenization.');
        }
      }
    };

    const paymentBackListener = DeviceEventEmitter.addListener('PaymentBack', handlePaymentBack);

    return () => {
      paymentBackListener.remove();
    };
  }, [navigation]);

  const extractTmnCode = (fullPaymentUrl) => {
    if (!fullPaymentUrl) return null;
    try {
      const parsed = new URL(fullPaymentUrl);
      return parsed.searchParams.get('vnp_tmn_code') || parsed.searchParams.get('vnp_TmnCode');
    } catch (err) {
      console.warn('Không đọc được vnp_tmn_code từ paymentUrl:', err?.message);
      return null;
    }
  };

  const handleTokenization = async () => {
    if (isUserLoading) return;
    setIsLoading(true);
    setErrorMessage('');

    try {
      const userId = resolveUserId(user);
      if (!userId) {
        Alert.alert('Lỗi', 'Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.', [
          { text: 'OK', onPress: () => navigation.goback() }
        ]);
        return;
      }

      const basePayload = {
        userId,
        orderInfo: 'Luu the VNPAY',
        cardType,
      };
      
      console.log('VNPAY token payload:', {
        ...basePayload,
        mode: 'token_create',
      });

      const response = await createVnpayTokenInitUrl({ ...basePayload, mode: 'token_create' });
      console.log('VNPAY token api response:', response);

      if (response && response.vnpUrl) {
        console.log('VNPAY SDK - vnpUrl:', response.vnpUrl);
        setPaymentUrl(response.vnpUrl);
        if (response.txnRef) {
          setTxnRef(response.txnRef);
        }

        openVnpaySdkSession(response.vnpUrl, response.txnRef);
      } else {
        Alert.alert('Lỗi', 'Không thể tạo URL thanh toán thẻ VNPAY.');
      }
    } catch (error) {
      console.error('handleTokenization error:', error?.response?.data || error);
      const respMessage = error?.response?.data?.message;
      const message = respMessage || error?.message || 'Đã có lỗi xảy ra khi chuẩn bị thanh toán.';
      setErrorMessage(message);
      Alert.alert('Lỗi', message);
    } finally {
      setIsLoading(false);
    }
  };
  
  const openVnpaySdkSession = (vnpUrl, refFromApi) => {
    if (!vnpUrl) {
      Alert.alert('Lỗi', 'Không tìm thấy đường dẫn thanh toán VNPAY.');
      return;
    }

    if (!isVnpaySdkAvailable) {
      setErrorMessage('VNPAY SDK chưa sẵn sàng trên thiết bị.');
      Alert.alert('Lỗi', 'Ứng dụng thanh toán VNPAY chưa sẵn sàng trên thiết bị.');
      return;
    }

    try {
      setUsingSdk(true);
      setErrorMessage('');
      const tmnFromEnv = process.env.EXPO_PUBLIC_VNP_TMNCODE || process.env.VNP_TMNCODE;
      const tmnFromUrl = extractTmnCode(vnpUrl);
      const tmnCode = tmnFromEnv || tmnFromUrl || '';
      console.log('Launching VNPAY SDK with:', {
        tmnCode,
        isSandbox: true,
        paymentUrl: vnpUrl,
        txnRef: refFromApi,
      });
      launchVnpaySdk({
        scheme: 'com.gymxfit',
        paymentUrl: vnpUrl,
        tmnCode,
        isSandbox: true,
        title: 'Thanh toán VNPAY',
      });
    } catch (sdkError) {
      console.warn('Không mở được VNPAY SDK:', sdkError?.message);
      setUsingSdk(false);
      setErrorMessage('Không thể mở ứng dụng thanh toán, vui lòng thử lại.');
      Alert.alert('Lỗi', 'Không thể mở ứng dụng thanh toán.');
    }
  };

  // Render SDK flow (loading + re-open)
  if (paymentUrl && (usingSdk || isVerifying)) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={MD3_COLORS.surface} />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialIcons name="close" size={24} color={MD3_COLORS.onSurface} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Cổng thanh toán VNPAY</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={MD3_COLORS.primary} />
          <Text style={styles.loaderText}>
            {isVerifying ? 'Đang xác nhận kết quả...' : 'Đang mở ứng dụng thanh toán...'}
          </Text>
          {!isVerifying && (
            <>
              <TouchableOpacity
                style={styles.reopenButton}
                onPress={() => openVnpaySdkSession(paymentUrl, txnRef)}
              >
                <Text style={styles.reopenButtonText}>Mở lại ứng dụng thanh toán</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.cancelButtonText}>Hủy bỏ</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </SafeAreaView>
    );
  }

  const confirmLabel = 'Liên kết thẻ ngay';

  // Render Card Design UI
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={MD3_COLORS.primary} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={MD3_COLORS.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thêm thẻ mới</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Card Preview */}
        <PaymentTokenCard />

        {/* Card Type Selection */}
        <View style={styles.selectionContainer}>
          <Text style={styles.sectionTitle}>Chọn loại thẻ</Text>
          
          <TouchableOpacity 
            style={[styles.optionCard, cardType === '01' && styles.optionCardSelected]}
            onPress={() => setCardType('01')}
          >
            <View style={styles.optionIconContainer}>
              <MaterialIcons name="credit-card" size={24} color={cardType === '01' ? MD3_COLORS.primary : '#666'} />
            </View>
            <View style={styles.optionTextContainer}>
              <Text style={[styles.optionTitle, cardType === '01' && styles.optionTitleSelected]}>
                Thẻ ATM / Tài khoản ngân hàng
              </Text>
              <Text style={styles.optionSubtitle}>Thẻ nội địa Napas</Text>
            </View>
            <View style={styles.radioButton}>
              {cardType === '01' && <View style={styles.radioButtonInner} />}
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.optionCard, cardType === '02' && styles.optionCardSelected]}
            onPress={() => setCardType('02')}
          >
            <View style={styles.optionIconContainer}>
              <MaterialIcons name="public" size={24} color={cardType === '02' ? MD3_COLORS.primary : '#666'} />
            </View>
            <View style={styles.optionTextContainer}>
              <Text style={[styles.optionTitle, cardType === '02' && styles.optionTitleSelected]}>
                Thẻ thanh toán quốc tế
              </Text>
              <Text style={styles.optionSubtitle}>Visa, MasterCard, JCB</Text>
            </View>
            <View style={styles.radioButton}>
              {cardType === '02' && <View style={styles.radioButtonInner} />}
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.infoBox}>
          <MaterialIcons
            name="security"
            size={20}
            color={MD3_COLORS.primary}
            style={{ marginRight: 8 }}
          />
          <Text style={styles.infoText}>
            Thẻ của bạn sẽ được VNPAY lưu trữ an toàn để thanh toán nhanh chóng và tiện lợi hơn cho các lần sau.
          </Text>
        </View>

        {/* Error Message */}
        {errorMessage ? (
          <Text style={styles.errorText}>{errorMessage}</Text>
        ) : null}

      </ScrollView>

      {/* Bottom Button */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.confirmButton}
          onPress={handleTokenization}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.confirmButtonText}>
              {confirmLabel}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MD3_COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 56,
    backgroundColor: MD3_COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: MD3_COLORS.onSurface,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  selectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: MD3_COLORS.textPrimary,
    marginBottom: 12,
    marginLeft: 4,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  optionCardSelected: {
    borderColor: MD3_COLORS.primary,
    backgroundColor: '#E7F4EC',
  },
  optionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: MD3_COLORS.textPrimary,
  },
  optionTitleSelected: {
    color: MD3_COLORS.primary,
  },
  optionSubtitle: {
    fontSize: 13,
    color: MD3_COLORS.textSecondary,
    marginTop: 2,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#C1C9BF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: MD3_COLORS.primary,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  confirmButton: {
    backgroundColor: MD3_COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  confirmButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: MD3_COLORS.background,
  },
  loaderText: {
    marginTop: 16,
    fontSize: 14,
    color: MD3_COLORS.textSecondary,
  },
  reopenButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: MD3_COLORS.primary,
    borderRadius: 12,
  },
  reopenButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  cancelButton: {
    marginTop: 10,
    paddingVertical: 10,
  },
  cancelButtonText: {
    color: MD3_COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  errorText: {
    color: MD3_COLORS.error,
    textAlign: 'center',
    marginTop: 16,
    paddingHorizontal: 16,
  },
  infoBox: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 16,
  },
  infoText: {
    fontSize: 13,
    color: '#2E7D32',
    lineHeight: 18,
    flex: 1,
  },
});

export default PaymentTokenizationScreen;