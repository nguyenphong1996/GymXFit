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
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserContext } from '@context/UserContext';
import { createVnpayTokenInitUrl, createVnpayTokenPayUrl, checkVnpayPaymentStatus, getVnpayTransactionStatus } from '../../api/paymentApi';
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

const PaymentTokenScreen = ({ route, navigation }) => {
  const { plan, token, fromProfile, tokenMeta } = route.params || {};
  console.log('PaymentTokenScreen params:', { tokenMeta, token, plan });
  console.log('PaymentTokenScreen - amountDue:', plan?.amountDue, 'billingCycle:', plan?.billingCycle);
  const { user, isLoading: isUserLoading } = useContext(UserContext);
  
  const [isLoading, setIsLoading] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [txnRef, setTxnRef] = useState('');
  const [usingSdk, setUsingSdk] = useState(false);
  const [forceNewToken, setForceNewToken] = useState(false); // Cho phép chuyển sang luồng tạo token mới nếu token cũ lỗi
  const initialCardType = (route.params && route.params.cardType) || tokenMeta?.cardType || (token && token.cardType) || '01';
  const [cardType, setCardType] = useState(initialCardType); // 01: Nội địa, 02: Quốc tế

  const pollTimer = useRef(null);

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

  const handlePayment = async () => {
    if (isUserLoading) return;
    setIsLoading(true);
    setErrorMessage('');

    try {
      const userId = resolveUserId(user);
      if (!userId) {
        Alert.alert('Lỗi', 'Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
        return;
      }

      const priceNumber = plan?.amountDue || (plan?.price ? (parseInt(plan.price.replace(/[^0-9]/g, ''), 10) || 0) : 0);
      
      // Map plan name to backend package ID
      const getPackageId = (planName) => {
        const packageMap = {
          'Basic': '69316923fcbc342ddf4e86a2',
          'Plus': '69316923fcbc342ddf4e86a3', 
          'Premium': '69316923fcbc342ddf4e86a4'
        };
        return packageMap[planName] || plan?.id;
      };
      
      const packageId = getPackageId(plan?.name);
      
      const basePayload = {
        amount: priceNumber,
        userId,
        orderInfo: plan ? `Thanh toan ${plan.name}` : 'Luu the VNPAY',
        cardType,
        billingCycle: plan?.billingCycle || 'month',
        creditValue: plan?.creditValue || 0,
        isUpgrade: plan?.isUpgrade || false,
        isTemporary: plan?.isTemporary || false,
      };
      
      // Xử lý khác nhau cho membership và PT session
      if (plan?.type === 'pt_session') {
        // PT session không có packageId, chỉ có amount và orderInfo
        basePayload.orderInfo = plan.orderInfo || `Thanh toan ${plan.name}`;
        // Không gửi packageId cho PT session
      } else {
        // Membership packages
        const packageId = getPackageId(plan?.name);
        basePayload.packageId = packageId;
      }
      const isTokenPay = Boolean(token) && !forceNewToken;
      console.log('VNPAY token payload:', {
        ...basePayload,
        mode: isTokenPay ? 'pay' : (fromProfile ? 'token_create' : 'pay_and_create'),
        hasToken: !!token,
        forceNewToken,
        resolvedPackageId: packageId, // Add for debugging
      });

      const apiCall = isTokenPay ? createVnpayTokenPayUrl : createVnpayTokenInitUrl;
      const response = await apiCall(
        isTokenPay
          ? { ...basePayload, token }
          : { ...basePayload, mode: fromProfile ? 'token_create' : 'pay_and_create' }
      );
      console.log('VNPAY token api response:', response);

      if (response && response.vnpUrl) {
        console.log('VNPAY SDK - vnpUrl:', response.vnpUrl);
        setPaymentUrl(response.vnpUrl);
        if (response.txnRef) {
          setTxnRef(response.txnRef);
        }

        // LƯU PENDING DATA VÀO ASYNC STORAGE
        if (plan) {
          if (plan.type === 'pt_session') {
            // PT session - lưu pending booking
            const pendingBooking = {
              staffId: plan.staffId,
              date: plan.date,
              slotKey: plan.slotKey,
              txnRef: response.txnRef,
              paymentMethod: 'vnpay_token',
              amount: priceNumber,
              userId,
              createdAt: new Date().toISOString()
            };
            await AsyncStorage.setItem('pendingBooking', JSON.stringify(pendingBooking));
            console.log('Saved pendingBooking:', pendingBooking);
          } else {
            // Membership - lưu pending membership
            const packageId = getPackageId(plan?.name);
            if (packageId) {
              const pendingMembership = {
                packageId: packageId,
                packageName: plan.name,
                amount: priceNumber,
                txnRef: response.txnRef,
                paymentMethod: 'vnpay_token',
                userId,
                createdAt: new Date().toISOString()
              };
              await AsyncStorage.setItem('pendingMembership', JSON.stringify(pendingMembership));
              console.log('Saved pendingMembership:', pendingMembership);
            }
          }
        }

        openVnpaySdkSession(response.vnpUrl, response.txnRef);
      } else {
        Alert.alert('Lỗi', 'Không thể tạo URL thanh toán thẻ VNPAY.');
      }
    } catch (error) {
      console.error('handlePayment error:', error?.response?.data || error);
      const respMessage = error?.response?.data?.message;
      const message = respMessage || error?.message || 'Đã có lỗi xảy ra khi chuẩn bị thanh toán.';
      setErrorMessage(message);
      Alert.alert('Lỗi', message);
    } finally {
      setIsLoading(false);
    }
  };

  const pollStatus = async (ref, attempt = 0) => {
    if (!ref) return;
    if (pollTimer.current) clearTimeout(pollTimer.current);
    
    try {
      const result = await getVnpayTransactionStatus(ref);
      console.log('pollStatus result:', { attempt, ref, result });
      if (result?.status === 'paid') {
        navigation.navigate('PaymentResult', {
          status: '00',
          message: 'Giao dịch thành công',
          amount: plan?.amountDue || plan?.price,
          txnRef: ref,
          method: 'token',
          bankCode: tokenMeta?.bankCode,
          bankName: tokenMeta?.bankName,
          cardMask: tokenMeta?.cardMask,
          cardType: cardType,
          cardHolderName: tokenMeta?.cardHolderName,
          cardExpiry: tokenMeta?.cardExpiry,
          planName: plan?.name,
          paidAt: new Date().toLocaleString('vi-VN')
        });
        return;
      }
      if (result?.status === 'failed') {
        navigation.navigate('PaymentResult', {
          status: result.code || '99',
          message: result.message || 'Giao dịch thất bại',
          amount: plan?.amountDue || plan?.price,
          txnRef: queryParams.vnp_TxnRef || txnRef,
          method: 'token',
          bankCode: tokenMeta?.bankCode,
          bankName: tokenMeta?.bankName,
          cardMask: tokenMeta?.cardMask,
          cardType: cardType,
          cardHolderName: tokenMeta?.cardHolderName,
          cardExpiry: tokenMeta?.cardExpiry,
          planName: plan?.name,
          paidAt: new Date().toLocaleString('vi-VN')
        });
        return;
      }
    } catch (err) {
      console.warn('Poll trạng thái giao dịch VNPAY lỗi:', err?.message);
    }

    // Tăng thời gian chờ: thử lại tối đa 20 lần, 3 giây/lần (~1 phút)
    if (attempt < 20) {
      pollTimer.current = setTimeout(() => pollStatus(ref, attempt + 1), 3000);
    } else {
      setUsingSdk(false);
      Alert.alert(
        'Đang chờ xác nhận',
        'Chưa nhận được trạng thái thanh toán từ VNPAY. Bạn có thể thử kiểm tra lại.',
        [
          { text: 'Đóng' },
          {
            text: 'Kiểm tra lại',
            onPress: () => pollStatus(ref, 0),
          },
        ],
      );
    }
  };

  useEffect(() => {
    const handleDeepLink = (event) => {
        if (event.url) {
             if (event.url.includes('payment-result')) {
                 if (pollTimer.current) clearTimeout(pollTimer.current);
                 handleBackendRedirect(event.url);
             } else if (event.url.includes('vnpay-return') || event.url.includes('vnp_ResponseCode')) {
                 if (pollTimer.current) clearTimeout(pollTimer.current);
                 verifyPaymentFromUrl(event.url);
             }
        }
    };
    const sub = Linking.addEventListener('url', handleDeepLink);
    return () => sub.remove();
  }, []);

  const handleBackendRedirect = (url) => {
    try {
      const urlObj = new URL(url);
      const params = Object.fromEntries(urlObj.searchParams.entries());
      
      // gymxfit://payment-result?code=00&message=Success&orderId=...&amount=...
      
      if (params.code === '00') {
        navigation.navigate('PaymentResult', {
          status: '00',
          message: decodeURIComponent(params.message || 'Giao dịch thành công'),
          amount: plan?.amountDue || params.amount || plan?.price,
          txnRef: params.orderId,
          method: 'token',
          bankCode: tokenMeta?.bankCode,
          bankName: tokenMeta?.bankName,
          cardMask: tokenMeta?.cardMask,
          cardType: cardType,
          cardHolderName: tokenMeta?.cardHolderName,
          cardExpiry: tokenMeta?.cardExpiry,
          planName: plan?.name,
          paidAt: new Date().toLocaleString('vi-VN')
        });
      } else {
        navigation.navigate('PaymentResult', {
          status: params.code || '99',
          message: decodeURIComponent(params.message || 'Giao dịch thất bại'),
          amount: plan?.amountDue || params.amount || plan?.price,
          txnRef: params.orderId,
          method: 'token',
          bankCode: tokenMeta?.bankCode,
          bankName: tokenMeta?.bankName,
          cardMask: tokenMeta?.cardMask,
          cardType: cardType,
          cardHolderName: tokenMeta?.cardHolderName,
          cardExpiry: tokenMeta?.cardExpiry,
          planName: plan?.name,
          paidAt: new Date().toLocaleString('vi-VN')
        });
      }
    } catch (e) {
      console.error('Error parsing backend redirect:', e);
    }
  };

  useEffect(() => {
    return () => {
      if (pollTimer.current) clearTimeout(pollTimer.current);
    };
  }, []);

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
      if (refFromApi) {
        pollStatus(refFromApi, 0);
      }
    } catch (sdkError) {
      console.warn('Không mở được VNPAY SDK:', sdkError?.message);
      setUsingSdk(false);
      setErrorMessage('Không thể mở ứng dụng thanh toán, vui lòng thử lại.');
      Alert.alert('Lỗi', 'Không thể mở ứng dụng thanh toán.');
    }
  };

  const verifyPaymentFromUrl = async (urlString) => {
    if (isVerifying) return;
    setIsVerifying(true);

    try {
      const url = new URL(urlString);
      const queryParams = Object.fromEntries(url.searchParams.entries());
      console.log('verifyPaymentFromUrl params:', queryParams);
      
      if (!queryParams.vnp_ResponseCode) {
         setIsVerifying(false);
         return;
      }

      const result = await checkVnpayPaymentStatus(queryParams);
      console.log('checkVnpayPaymentStatus result:', result);

      const resolvedBankCode = queryParams.vnp_BankCode || tokenMeta?.bankCode;
      const resolvedBankName = tokenMeta?.bankName || tokenMeta?.bankCode;
      const resolvedCardType = queryParams.vnp_CardType || tokenMeta?.cardType || cardType;
      const resolvedCardMask = tokenMeta?.cardMask;
      const resolvedCardHolder = tokenMeta?.cardHolderName || user?.name;
      const resolvedCardExpiry = tokenMeta?.cardExpiry;

      if (result.code === '00') {
        navigation.navigate('PaymentResult', {
          status: '00',
          message: 'Giao dịch thành công',
          amount: plan?.amountDue || plan?.price,
          txnRef: queryParams.vnp_TxnRef || txnRef,
          method: 'token',
          bankCode: resolvedBankCode,
          bankName: resolvedBankName,
          cardMask: resolvedCardMask,
          cardType: resolvedCardType,
          cardHolderName: resolvedCardHolder,
          cardExpiry: resolvedCardExpiry,
          planName: plan?.name,
          paidAt: new Date().toLocaleString('vi-VN')
        });
      } else {
        navigation.navigate('PaymentResult', {
          status: result.code || '99',
          message: result.message || 'Giao dịch thất bại',
          amount: plan?.amountDue || plan?.price,
          txnRef: queryParams.vnp_TxnRef || txnRef,
          method: 'token',
          bankCode: resolvedBankCode,
          bankName: resolvedBankName,
          cardMask: resolvedCardMask,
          cardType: resolvedCardType,
          cardHolderName: resolvedCardHolder,
          cardExpiry: resolvedCardExpiry,
          planName: plan?.name,
          paidAt: new Date().toLocaleString('vi-VN')
        });
      }
    } catch (error) {
      console.error('Lỗi khi xác nhận thanh toán VNPAY:', error);
      Alert.alert('Lỗi', 'Không thể xác nhận trạng thái thanh toán.');
      navigation.goBack();
    } finally {
      // Keep verifying state until navigation happens
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
                style={styles.reopenButton}
                onPress={() => pollStatus(txnRef)}
              >
                <Text style={styles.reopenButtonText}>Kiểm tra trạng thái</Text>
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

  const showConfirmButton = Boolean(plan) || !token;
  const confirmLabel = forceNewToken
    ? 'Thanh toán & tạo token mới'
    : fromProfile
      ? 'Liên kết thẻ ngay'
      : `Thanh toán ${plan?.priceLabel || plan?.amountDue?.toLocaleString() || plan?.price || ''}`;

  // Render Card Design UI
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={MD3_COLORS.primary} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={MD3_COLORS.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{fromProfile ? 'Thêm thẻ mới' : 'Thanh toán'}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Card Preview */}
        <PaymentTokenCard
          bankName={tokenMeta?.bankName}
          bankCode={tokenMeta?.bankCode}
          cardMask={tokenMeta?.cardMask || token?.cardMask}
          cardHolderName={tokenMeta?.cardHolderName}
          cardExpiry={tokenMeta?.cardExpiry}
        />

        {/* Transaction Info */}
        {plan && (
          <View style={styles.infoContainer}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Dịch vụ</Text>
              <Text style={styles.infoValue}>{plan.name}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Số tiền</Text>
              <Text style={styles.priceValue}>{plan.priceLabel || plan.amountDue?.toLocaleString() || plan.price}</Text>
            </View>
          </View>
        )}

        {/* Token Details */}
        {tokenMeta && (
          <View style={styles.infoContainer}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Ngân hàng</Text>
              <Text style={styles.infoValue}>{tokenMeta.bankName || tokenMeta.bankCode}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Loại thẻ</Text>
              <Text style={styles.infoValue}>
                {tokenMeta.cardType === '01' ? 'Thẻ nội địa (ATM)' : 
                 tokenMeta.cardType === '02' ? 'Thẻ quốc tế' : 
                 tokenMeta.cardType || '—'}
              </Text>
            </View>
            {tokenMeta.cardHolderName ? (
              <>
                <View style={styles.divider} />
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Chủ thẻ</Text>
                  <Text style={styles.infoValue}>{tokenMeta.cardHolderName}</Text>
                </View>
              </>
            ) : null}
          </View>
        )}

        {/* Card Type Selection (Only if not using existing token) */}
        {!token && (
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
        )}

        {/* Error Message */}
        {errorMessage ? (
          <Text style={styles.errorText}>{errorMessage}</Text>
        ) : null}

      </ScrollView>

      {token && !fromProfile ? (
        <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
          <TouchableOpacity
            style={[styles.outlineButton, forceNewToken && styles.outlineButtonActive]}
            onPress={() => setForceNewToken((prev) => !prev)}
          >
            <Text style={styles.outlineButtonText}>
              {forceNewToken ? 'Đang dùng luồng tạo token mới' : 'Gặp lỗi? Thử tạo token mới'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Bottom Button */}
      {showConfirmButton ? (
        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.confirmButton}
            onPress={handlePayment}
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
      ) : null}
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
  infoContainer: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: MD3_COLORS.textSecondary,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: MD3_COLORS.textPrimary,
  },
  priceValue: {
    fontSize: 18,
    fontWeight: '700',
    color: MD3_COLORS.primary,
  },
  debugBox: {
    backgroundColor: '#F0F4F2',
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  debugTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: MD3_COLORS.textSecondary,
    marginBottom: 6,
  },
  debugLine: {
    fontSize: 12,
    color: MD3_COLORS.textSecondary,
    marginBottom: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 8,
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
  outlineButton: {
    borderWidth: 1,
    borderColor: MD3_COLORS.primary,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  outlineButtonActive: {
    backgroundColor: '#E7F4EC',
  },
  outlineButtonText: {
    color: MD3_COLORS.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  errorText: {
    color: MD3_COLORS.error,
    textAlign: 'center',
    marginTop: 16,
    paddingHorizontal: 16,
  },
});

export default PaymentTokenScreen;
