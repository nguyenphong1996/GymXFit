import React, { useEffect, useMemo, useState, useContext, useRef } from 'react';
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
  Dimensions,
  Linking,
} from 'react-native';
import { WebView } from 'react-native-webview';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import { UserContext } from '@context/UserContext';
import { createVnpayTokenInitUrl, createVnpayTokenPayUrl, checkVnpayPaymentStatus, getVnpayTransactionStatus } from '../../api/paymentApi';
import { isVnpaySdkAvailable, launchVnpaySdk } from '../../utils/vnpaySdk';

const { width } = Dimensions.get('window');

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
  const { user, isLoading: isUserLoading } = useContext(UserContext);
  
  const [isLoading, setIsLoading] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState('');
  const [returnUrl, setReturnUrl] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [txnRef, setTxnRef] = useState('');
  const [usingSdk, setUsingSdk] = useState(false);
  const webViewRef = useRef(null);
  const initialCardType = (route.params && route.params.cardType) || tokenMeta?.cardType || (token && token.cardType) || '01';
  const [cardType, setCardType] = useState(initialCardType); // 01: Nội địa, 02: Quốc tế

  const pollTimer = useRef(null);

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

      const priceNumber = plan?.price ? (parseInt(plan.price.replace(/[^0-9]/g, ''), 10) || 0) : 0;
      const basePayload = {
        amount: priceNumber,
        userId,
        packageId: plan?.id,
        orderInfo: plan ? `Thanh toan goi ${plan.name}` : 'Luu the VNPAY',
        cardType,
      };

      const apiCall = token ? createVnpayTokenPayUrl : createVnpayTokenInitUrl;
      const response = await apiCall(
        token
          ? { ...basePayload, token }
          : { ...basePayload, mode: fromProfile ? 'token_create' : 'pay_and_create' }
      );

      if (response && response.vnpUrl) {
        console.log('VNPAY SDK - vnpUrl:', response.vnpUrl);
        setPaymentUrl(response.vnpUrl);
        setReturnUrl(extractReturnUrl(response.vnpUrl));
        if (response.txnRef) {
          setTxnRef(response.txnRef);
        }

        // Ưu tiên SDK nếu khả dụng
        if (isVnpaySdkAvailable) {
          try {
            setUsingSdk(true);
            const tmnFromEnv = process.env.EXPO_PUBLIC_VNP_TMNCODE || process.env.VNP_TMNCODE;
            const tmnFromUrl = extractTmnCode(response.vnpUrl);
            const tmnCode = tmnFromEnv || tmnFromUrl || '';
            
            launchVnpaySdk({
              scheme: 'com.gymxfit',
              paymentUrl: response.vnpUrl,
              tmnCode,
              isSandbox: true,
              title: 'Thanh toán VNPAY',
            });
            if (response.txnRef) {
              pollStatus(response.txnRef, 0);
            }
          } catch (sdkError) {
            console.warn('Không mở được VNPAY SDK, sẽ fallback WebView:', sdkError?.message);
            setUsingSdk(false);
          }
        }
      } else {
        Alert.alert('Lỗi', 'Không thể tạo URL thanh toán thẻ VNPAY.');
      }
    } catch (error) {
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
      if (result?.status === 'paid') {
        navigation.navigate('PaymentResult', {
          status: '00',
          message: 'Giao dịch thành công',
          amount: plan?.price,
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
          status: '99',
          message: 'Giao dịch thất bại',
          amount: plan?.price,
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
    } catch (err) {
      console.warn('Poll trạng thái giao dịch VNPAY lỗi:', err?.message);
    }

    if (attempt < 8) {
      pollTimer.current = setTimeout(() => pollStatus(ref, attempt + 1), 2000);
    }
  };

  useEffect(() => {
    const handleDeepLink = (event) => {
        if (event.url && (event.url.includes('vnpay-return') || event.url.includes('vnp_ResponseCode'))) {
             if (pollTimer.current) clearTimeout(pollTimer.current);
             verifyPaymentFromUrl(event.url);
        }
    };
    const sub = Linking.addEventListener('url', handleDeepLink);
    return () => sub.remove();
  }, []);

  useEffect(() => {
    return () => {
      if (pollTimer.current) clearTimeout(pollTimer.current);
    };
  }, []);

  const handleNavigationStateChange = async (navState) => {
    const url = navState.url;
    if (!url) return;
    
    if (url.includes('vnpay-return') || url.includes('vnp_ResponseCode')) {
      await verifyPaymentFromUrl(url);
      return;
    }
    
    if (isVerifying) return;
  };


  const verifyPaymentFromUrl = async (urlString) => {
    if (isVerifying) return;
    setIsVerifying(true);

    try {
      const url = new URL(urlString);
      const queryParams = Object.fromEntries(url.searchParams.entries());
      
      if (!queryParams.vnp_ResponseCode) {
         setIsVerifying(false);
         return;
      }

      const result = await checkVnpayPaymentStatus(queryParams);

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
          amount: plan?.price,
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
          amount: plan?.price,
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

  // Render WebView for Payment
  if (paymentUrl && !usingSdk) {
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
        {!isVerifying ? (
        <WebView
          ref={webViewRef}
          source={{ uri: paymentUrl }}
          style={{ flex: 1 }}
          injectedJavaScript={`
            (function() {
              if (window.location.href.includes('vnp_ResponseCode') || window.location.href.includes('vnpay-return')) {
                document.body.style.display = 'none';
              }
            })();
          `}
          onLoadStart={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            setIsLoading(true);
            if (nativeEvent.url && (nativeEvent.url.includes('vnpay-return') || nativeEvent.url.includes('vnp_ResponseCode'))) {
              webViewRef.current?.stopLoading();
              verifyPaymentFromUrl(nativeEvent.url);
            }
          }}
          onLoadEnd={() => setIsLoading(false)}
          onNavigationStateChange={handleNavigationStateChange}
          onShouldStartLoadWithRequest={request => {
            if (request.url && (request.url.includes('vnpay-return') || request.url.includes('vnp_ResponseCode'))) {
              verifyPaymentFromUrl(request.url);
              return false;
            }
            return true;
          }}
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
              <Text style={styles.loaderText}>Đang xác nhận kết quả...</Text>
            </View>
        )}
      </SafeAreaView>
    );
  }

  // Render SDK Loading
  if (usingSdk) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={MD3_COLORS.primary} />
        <Text style={styles.loaderText}>Đang mở ứng dụng thanh toán...</Text>
        <TouchableOpacity 
            style={{ marginTop: 20, padding: 10 }}
            onPress={() => {
                setUsingSdk(false);
                setIsLoading(false);
            }}
        >
            <Text style={{ color: MD3_COLORS.primary, fontWeight: '600' }}>Hủy bỏ</Text>
        </TouchableOpacity>
      </View>
    );
  }

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
        <View style={styles.cardPreviewContainer}>
          <LinearGradient
            colors={['rgba(122, 46, 42, 0.95)', 'rgba(255, 102, 51, 0.95)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardBackground}
          >
            <View style={styles.cardContent}>
              <View style={styles.cardTopRow}>
                <MaterialIcons name="memory" size={40} color="#E0E0E0" />
                <Text style={styles.cardBrand}>
                  {tokenMeta?.bankName || tokenMeta?.bankCode || 'VNPAY'}
                </Text>
              </View>
              
              <View style={styles.cardNumberContainer}>
                <Text style={styles.cardNumber}>
                  {tokenMeta?.cardMask || token?.cardMask || '•••• •••• •••• ••••'}
                </Text>
              </View>

              <View style={styles.cardBottomRow}>
                <View>
                  <Text style={styles.cardLabel}>CHỦ THẺ</Text>
                  <Text style={styles.cardHolderName}>
                    {(tokenMeta?.cardHolderName || 'NGUYEN VAN A').toUpperCase()}
                  </Text>
                </View>
                <View>
                  <Text style={styles.cardLabel}>NGÀY HẾT HẠN</Text>
                  <Text style={styles.cardExpiry}>{tokenMeta?.cardExpiry || '07/15'}</Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </View>

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
              <Text style={styles.priceValue}>{plan.price}</Text>
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

      {/* Bottom Button */}
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
              {fromProfile ? 'Liên kết thẻ ngay' : `Thanh toán ${plan?.price || ''}`}
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
  cardPreviewContainer: {
    width: '100%',
    aspectRatio: 669 / 373, // Match NCB asset ratio to avoid letterboxing
    borderRadius: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  marginBottom: 24,
  overflow: 'hidden',
  backgroundColor: '#dfe7e2',
  },
  cardBackground: {
    flex: 1,
  },
  cardContent: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardBrand: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    fontStyle: 'italic',
  },
  cardNumberContainer: {
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  cardNumber: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '600',
    color: '#FFF',
    letterSpacing: 1,
    fontFamily: 'monospace',
    width: '100%',
    flexWrap: 'nowrap',
    textAlign: 'left',
    includeFontPadding: false,
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  cardLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 4,
    fontWeight: '600',
  },
  cardHolderName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    letterSpacing: 1,
  },
  cardExpiry: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
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
  errorText: {
    color: MD3_COLORS.error,
    textAlign: 'center',
    marginTop: 16,
    paddingHorizontal: 16,
  },
});

export default PaymentTokenScreen;
