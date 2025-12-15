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
  Image,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';

const { width } = Dimensions.get('window');

// Material Design 3 Color Tokens
const MD3_COLORS = {
  primary: '#1F8E4A',
  onPrimary: '#FFFFFF',
  primaryContainer: '#C2F0D4',
  onPrimaryContainer: '#00210A',
  secondary: '#3A5B4C',
  onSecondary: '#FFFFFF',
  secondaryContainer: '#BDE1CD',
  onSecondaryContainer: '#002110',
  tertiary: '#2196F3',
  onTertiary: '#FFFFFF',
  tertiaryContainer: '#BBDEFB',
  surface: '#FFFFFF',
  surfaceDim: '#DDE3DD',
  surfaceBright: '#F9F9F9',
  surfaceContainerLowest: '#FFFFFF',
  surfaceContainerLow: '#F3F4F0',
  surfaceContainer: '#EDF1EC',
  surfaceContainerHigh: '#E7EBE6',
  surfaceContainerHighest: '#E1E5E0',
  background: '#F5F7F6',
  onBackground: '#191C19',
  outline: '#72796F',
  outlineVariant: '#C1C9BF',
  textPrimary: '#10241A',
  textSecondary: '#47614F',
  textTertiary: '#6B7B73',
  onSurfaceVariant: '#404943',
  error: '#BA1A1A',
  onError: '#FFFFFF',
  errorContainer: '#FFDAD6',
  success: '#34D399',
  warning: '#F59E0B',
  scrim: 'rgba(0, 0, 0, 0.32)',
  // Payment specific colors based on design
  paymentGreen: '#00C853',
  paymentLightGreen: '#E8F5E8',
  paymentGray: '#F5F5F5',
};

// Material Design 3 Elevation Tokens
const MD3_ELEVATION = {
  level0: { shadowColor: 'transparent', shadowOpacity: 0, shadowRadius: 0, shadowOffset: { width: 0, height: 0 }, elevation: 0 },
  level1: { shadowColor: MD3_COLORS.scrim, shadowOpacity: 0.15, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  level2: { shadowColor: MD3_COLORS.scrim, shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
  level3: { shadowColor: MD3_COLORS.scrim, shadowOpacity: 0.18, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
};

// MD3 Typography Scale
const MD3_TYPE = {
  displayLarge: { fontSize: 57, lineHeight: 64, fontWeight: '400' },
  displayMedium: { fontSize: 45, lineHeight: 52, fontWeight: '400' },
  displaySmall: { fontSize: 36, lineHeight: 44, fontWeight: '400' },
  headlineLarge: { fontSize: 32, lineHeight: 40, fontWeight: '600' },
  headlineMedium: { fontSize: 28, lineHeight: 36, fontWeight: '600' },
  headlineSmall: { fontSize: 24, lineHeight: 32, fontWeight: '600' },
  titleLarge: { fontSize: 22, lineHeight: 28, fontWeight: '700' },
  titleMedium: { fontSize: 16, lineHeight: 24, fontWeight: '600' },
  titleSmall: { fontSize: 14, lineHeight: 20, fontWeight: '600' },
  bodyLarge: { fontSize: 16, lineHeight: 24, fontWeight: '400' },
  bodyMedium: { fontSize: 14, lineHeight: 20, fontWeight: '400' },
  bodySmall: { fontSize: 12, lineHeight: 16, fontWeight: '400' },
  labelLarge: { fontSize: 14, lineHeight: 20, fontWeight: '600' },
  labelMedium: { fontSize: 12, lineHeight: 16, fontWeight: '600' },
  labelSmall: { fontSize: 11, lineHeight: 16, fontWeight: '600' },
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
  const iconColor = isSuccess ? MD3_COLORS.success : MD3_COLORS.error;
  const title = isSuccess ? 'Thanh toán thành công!' : 'Thanh toán thất bại!';

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

  // Function đọc số tiền thành chữ tiếng Việt
  const convertNumberToWords = (number) => {
    if (!number || isNaN(number)) return 'Không đồng';
    
    const units = ['', 'nghìn', 'triệu', 'tỷ', 'nghìn tỷ', 'triệu tỷ'];
    const numbers = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
    
    const readThreeDigits = (num) => {
      let result = '';
      const hundred = Math.floor(num / 100);
      const ten = Math.floor((num % 100) / 10);
      const unit = num % 10;
      
      if (hundred > 0) {
        result += numbers[hundred] + ' trăm';
        if (ten === 0 && unit > 0) {
          result += ' lẻ';
        }
      }
      
      if (ten > 0) {
        if (ten === 1) {
          result += (hundred > 0 ? ' mười' : ' mười');
        } else {
          result += (hundred > 0 ? ' ' : '') + numbers[ten] + ' mươi';
        }
      }
      
      if (unit > 0) {
        if (ten === 0) {
          result += (hundred > 0 ? ' lẻ ' : '') + numbers[unit];
        } else if (unit === 1) {
          result += ' mốt';
        } else if (unit === 5) {
          result += ' lăm';
        } else {
          result += ' ' + numbers[unit];
        }
      }
      
      return result.trim();
    };
    
    let num = Math.floor(Math.abs(number));
    if (num === 0) return 'Không đồng';
    
    let result = '';
    let unitIndex = 0;
    
    while (num > 0) {
      const threeDigits = num % 1000;
      if (threeDigits > 0) {
        const threeDigitsText = readThreeDigits(threeDigits);
        result = threeDigitsText + (units[unitIndex] ? ' ' + units[unitIndex] : '') + (result ? ' ' + result : '');
      }
      num = Math.floor(num / 1000);
      unitIndex++;
    }
    
    return result + ' đồng';
  };

  const formatAmountWithWords = (amount) => {
    if (!amount || isNaN(amount)) {
      return {
        formatted: '0 VNĐ',
        words: 'Không đồng'
      };
    }
    
    // Format số với khoảng trắng phân cách hàng nghìn
    // Ví dụ: 49000 -> 49 000 VNĐ
    const formattedAmount = amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' VNĐ';
    const wordsAmount = convertNumberToWords(amount);
    
    return {
      formatted: formattedAmount,
      words: wordsAmount
    };
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
    if (n.includes('premium')) return ['#8B5CF6', '#7C3AED']; // Purple
    if (n.includes('plus')) return ['#3B82F6', '#2563EB']; // Blue
    if (n.includes('basic')) return ['#F59E0B', '#D97706']; // Orange/Gold
    return [MD3_COLORS.primary, '#15723A']; // Default Green
  };

  const handleGoHome = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Main' }],
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={MD3_COLORS.surface}
      />
      
      {/* Header Background */}
      <LinearGradient
        colors={[MD3_COLORS.paymentGreen, '#00A344']}
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
          
          {/* Success Card - Theo thiết kế mẫu */}
          <View style={styles.successCard}>
            {/* Success Icon */}
            <View style={styles.successIconContainer}>
              <LinearGradient
                colors={[MD3_COLORS.paymentLightGreen, '#D4EDDA']}
                style={styles.successIconBackground}
              >
                <MaterialIcons name="check-circle" size={64} color={MD3_COLORS.paymentGreen} />
              </LinearGradient>
            </View>
            
            {/* Title */}
            <Text style={styles.successTitle}>Thanh toán thành công!</Text>
            
            {/* Amount Display */}
            <View style={styles.amountSection}>
              <Text style={styles.amountLabel}>Số tiền</Text>
              <Text style={styles.amountValue}>
                {formatAmountWithWords(amount).formatted.replace(' VNĐ', '')}
                <Text style={styles.currencyText}> VNĐ</Text>
              </Text>
              <Text style={styles.amountWords}>
                {formatAmountWithWords(amount).words}
              </Text>
            </View>

            {/* Transaction Details */}
            <View style={styles.detailsSection}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Mã giao dịch</Text>
                <Text style={styles.detailValue}>{txnRef || '—'}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Thời gian</Text>
                <Text style={styles.detailValue}>{paidAt || new Date().toLocaleString('vi-VN')}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Phương thức</Text>
                <View style={styles.methodContainer}>
                  <MaterialIcons name={methodIcon} size={16} color={MD3_COLORS.paymentGreen} style={styles.methodIcon} />
                  <Text style={styles.methodText}>{getMethodLabel()}</Text>
                </View>
              </View>

              {bankLabel && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Ngân hàng</Text>
                  <Text style={styles.detailValue}>{bankLabel}</Text>
                </View>
              )}

              {cardTypeLabel && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Loại thẻ</Text>
                  <Text style={styles.detailValue}>{cardTypeLabel}</Text>
                </View>
              )}

              {cardMask && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Số thẻ</Text>
                  <Text style={styles.detailValue}>{cardMask}</Text>
                </View>
              )}
            </View>
          </View>

        </ScrollView>

        {/* Footer Action Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleGoHome}
          >
            <LinearGradient
              colors={[MD3_COLORS.paymentGreen, '#00A344']}
              style={styles.actionButtonGradient}
            >
              <Text style={styles.actionButtonText}>Về trang chủ</Text>
              <MaterialIcons name="arrow-forward" size={20} color={MD3_COLORS.onPrimary} />
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
    backgroundColor: MD3_COLORS.paymentGray,
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingTop: 20,
    paddingBottom: 20,
  },
  successCard: {
    backgroundColor: MD3_COLORS.surface,
    borderRadius: 24,
    width: '100%',
    padding: 24,
    ...MD3_ELEVATION.level2,
    marginBottom: 20,
  },
  successIconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  successIconBackground: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    ...MD3_TYPE.headlineMedium,
    fontWeight: '700',
    color: MD3_COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 24,
  },
  amountSection: {
    backgroundColor: MD3_COLORS.paymentLightGreen,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
  },
  amountLabel: {
    ...MD3_TYPE.bodyMedium,
    color: MD3_COLORS.textSecondary,
    marginBottom: 8,
  },
  amountValue: {
    ...MD3_TYPE.displaySmall,
    fontWeight: '700',
    color: MD3_COLORS.textPrimary,
    marginBottom: 4,
  },
  currencyText: {
    ...MD3_TYPE.bodyLarge,
    fontWeight: '500',
    color: MD3_COLORS.textPrimary,
  },
  amountWords: {
    ...MD3_TYPE.bodySmall,
    color: MD3_COLORS.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  detailsSection: {
    width: '100%',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: MD3_COLORS.outlineVariant,
  },
  detailLabel: {
    ...MD3_TYPE.bodyMedium,
    color: MD3_COLORS.textSecondary,
    flex: 0.8,
  },
  detailValue: {
    ...MD3_TYPE.bodyMedium,
    fontWeight: '600',
    color: MD3_COLORS.textPrimary,
    flex: 1.2,
    textAlign: 'right',
  },
  methodContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    justifyContent: 'flex-end',
  },
  methodIcon: {
    marginRight: 4,
  },
  methodText: {
    ...MD3_TYPE.bodyMedium,
    fontWeight: '600',
    color: MD3_COLORS.textPrimary,
    textAlign: 'right',
  },
  footer: {
    padding: 16,
    paddingBottom: 32,
  },
  actionButton: {
    borderRadius: 20,
    overflow: 'hidden',
    ...MD3_ELEVATION.level1,
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
  },
  actionButtonText: {
    color: MD3_COLORS.onPrimary,
    ...MD3_TYPE.labelLarge,
    fontWeight: '600',
  },
});

export default PaymentResultScreen;
