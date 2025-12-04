import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Dimensions,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';

const { width } = Dimensions.get('window');

const THEME = {
  primary: '#1F8E4A',
  primaryGradient: ['#1F8E4A', '#15723A'],
  success: '#1F8E4A',
  error: '#BA1A1A',
  background: '#F5F7F6',
  surface: '#FFFFFF',
  textPrimary: '#10241A',
  textSecondary: '#47614F',
  border: '#E5E7EB',
};

const PaymentResultScreen = ({ route, navigation }) => {
  const {
    status,
    message,
    amount,
    txnRef,
    method,
    planName,
    paidAt,
    bankCode,
    bankName,
    cardType,
    cardMask,
    cardHolderName,
    cardExpiry,
  } = route.params || {};

  const isSuccess = status === '00';
  const iconName = isSuccess ? 'check-circle' : 'error';
  const iconColor = isSuccess ? THEME.success : THEME.error;
  const title = isSuccess ? 'Giao dịch thành công' : 'Giao dịch thất bại';

  const getCardTypeLabel = (type) => {
    if (!type) return '';
    switch (type) {
      case '01':
        return 'Thẻ nội địa (ATM)';
      case '02':
        return 'Thẻ quốc tế';
      case 'ATM':
        return 'Thẻ ATM';
      case 'VISA':
        return 'Visa';
      case 'MASTER':
      case 'MASTERCARD':
        return 'MasterCard';
      case 'JCB':
        return 'JCB';
      case 'AMEX':
        return 'American Express';
      default:
        return type;
    }
  };

  const methodIcon =
    method === 'token'
      ? 'credit-card'
      : method === 'card'
        ? 'public'
        : bankCode === 'VNPAYQR'
          ? 'qr-code'
          : 'payments';

  const cardTypeLabel = getCardTypeLabel(cardType);
  const bankLabel = bankName || bankCode || '';

  const getMethodLabel = () => {
    if (method === 'token') return 'Thẻ đã lưu';
    if (method === 'card') return 'Thẻ quốc tế';
    if (method === 'vnpay') {
      if (bankCode === 'VNPAYQR') return 'VNPAY QR';
      return 'Cổng VNPAY';
    }
    return method || 'Thanh toán';
  };

  const getServiceColor = (name) => {
    const n = name?.toLowerCase() || '';
    if (n.includes('premium')) return ['#DA22FF', '#9733EE']; // Purple
    if (n.includes('plus')) return ['#00C6FF', '#0072FF']; // Blue
    if (n.includes('basic')) return ['#FFB75E', '#ED8F03']; // Orange/Gold
    return THEME.primaryGradient; // Default Green
  };

  const handleGoHome = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Home' }],
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={THEME.primary}
      />
      
      {/* Header Background */}
      <LinearGradient
        colors={THEME.primaryGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.headerBackground}
      />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.content} 
          showsVerticalScrollIndicator={false}
        >
          
          {/* Result Card */}
          <View style={styles.resultCard}>
            <View style={styles.iconContainer}>
              <MaterialIcons name={iconName} size={64} color={iconColor} />
            </View>
            
            <Text style={[styles.title, { color: iconColor }]}>{title}</Text>
            <Text style={styles.amount}>
              {typeof amount === 'number' 
                ? `${amount.toLocaleString('vi-VN')} VND` 
                : amount || '0 VND'}
            </Text>
            <Text style={styles.message}>{message}</Text>

            <View style={styles.dashedDivider}>
              <View style={styles.halfCircleLeft} />
              <View style={styles.dashedLine} />
              <View style={styles.halfCircleRight} />
            </View>

            {/* Details */}
            <View style={styles.detailsContainer}>
              <View style={[styles.row, { alignItems: 'center' }]}>
                <Text style={styles.label}>Dịch vụ</Text>
                <LinearGradient
                  colors={getServiceColor(planName)}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.serviceBadge}
                >
                  <Text style={styles.serviceText}>{planName || 'Thanh toán GymXFit'}</Text>
                </LinearGradient>
              </View>
              
              <View style={styles.row}>
                <Text style={styles.label}>Mã giao dịch</Text>
                <Text style={styles.value}>{txnRef || '—'}</Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.label}>Thời gian</Text>
                <Text style={styles.value}>{paidAt || new Date().toLocaleString('vi-VN')}</Text>
              </View>

              <View style={[styles.row, { alignItems: 'center' }]}>
                <Text style={styles.label}>Phương thức</Text>
                <View style={[styles.methodChip, { marginBottom: 0 }]}>
                  <MaterialIcons name={methodIcon} size={16} color={THEME.success} />
                  <Text style={styles.methodChipText}>{getMethodLabel()}</Text>
                </View>
              </View>

              {bankLabel ? (
                <View style={styles.row}>
                  <Text style={styles.label}>Ngân hàng</Text>
                  <Text style={styles.value}>{bankLabel}</Text>
                </View>
              ) : null}

              {cardTypeLabel ? (
                <View style={styles.row}>
                  <Text style={styles.label}>Loại thẻ</Text>
                  <Text style={styles.value}>{cardTypeLabel}</Text>
                </View>
              ) : null}

              {cardMask ? (
                <View style={styles.row}>
                  <Text style={styles.label}>Số thẻ</Text>
                  <Text style={styles.value}>{cardMask}</Text>
                </View>
              ) : null}

              {cardHolderName ? (
                <View style={styles.row}>
                  <Text style={styles.label}>Chủ thẻ</Text>
                  <Text style={styles.value}>{cardHolderName}</Text>
                </View>
              ) : null}
            </View>
          </View>

        </ScrollView>

        {/* Footer Buttons */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleGoHome}
          >
            <LinearGradient
            colors={THEME.primaryGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientButton}
          >
              <Text style={styles.primaryButtonText}>Về trang chủ</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.background,
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingTop: 24,
    paddingBottom: 20,
    alignItems: 'center',
  },
  resultCard: {
    backgroundColor: THEME.surface,
    borderRadius: 16,
    width: '100%',
    paddingVertical: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    marginBottom: 20,
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  amount: {
    fontSize: 28,
    fontWeight: '700',
    color: THEME.textPrimary,
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: THEME.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  dashedDivider: {
    width: '100%',
    height: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  dashedLine: {
    flex: 1,
    height: 1,
    borderWidth: 1,
    borderColor: THEME.border,
    borderStyle: 'dashed',
    marginHorizontal: 10,
  },
  halfCircleLeft: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: THEME.background,
    position: 'absolute',
    left: -10,
  },
  halfCircleRight: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: THEME.background,
    position: 'absolute',
    right: -10,
  },
  detailsContainer: {
    width: '100%',
    paddingHorizontal: 24,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: THEME.textSecondary,
    flex: 1,
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.textPrimary,
    flex: 2,
    textAlign: 'right',
  },
  methodRow: {
    alignItems: 'flex-start',
  },
  methodValueContainer: {
    flex: 2,
    alignItems: 'flex-end',
  },
  methodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    backgroundColor: '#E8F3EC',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 8,
  },
  methodChipText: {
    marginLeft: 6,
    fontSize: 13,
    fontWeight: '700',
    color: THEME.textPrimary,
  },
  methodMeta: {
    alignItems: 'flex-end',
  },
  methodMetaText: {
    fontSize: 12,
    color: THEME.textSecondary,
    marginBottom: 4,
    textAlign: 'right',
    includeFontPadding: false,
  },
  methodMetaValue: {
    color: THEME.textPrimary,
    fontWeight: '700',
    fontSize: 12,
    textAlign: 'right',
    fontFamily: 'monospace',
    letterSpacing: 0.5,
  },
  footer: {
    padding: 16,
    backgroundColor: THEME.background,
    marginBottom: 10,
  },
  primaryButton: {
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12,
  },
  gradientButton: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: THEME.border,
  },
  secondaryButtonText: {
    color: THEME.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  serviceBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  serviceText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default PaymentResultScreen;
