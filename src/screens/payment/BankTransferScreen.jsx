import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  StatusBar
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

// Reusing MD3 design tokens
const MD3_COLORS = {
  primary: '#1F8E4A',
  onPrimary: '#FFFFFF',
  surface: '#FFFFFF',
  background: '#F5F7F6',
  onSurface: '#191C19',
  textPrimary: '#10241A',
  textSecondary: '#47614F',
  outline: '#72796F',
  outlineVariant: '#C1C9BF',
  surfaceContainer: '#ECEEEB',
};

const BANK_INFO = {
  bankId: 'MB', // MBBank
  bankName: 'Ngân hàng Quân Đội (MBBank)',
  accountNo: '0333666999', // Example account
  accountName: 'GYM X FIT STUDIO',
  template: 'compact2'
};

const BankTransferScreen = ({ route, navigation }) => {
  const { plan } = route.params;
  const priceNumber = parseInt(plan.price.replace(/[^0-9]/g, ''), 10) || 0;
  const transferContent = `GYM ${plan.id.toUpperCase()} ${Date.now().toString().slice(-6)}`;
  
  // VietQR API URL
  const qrUrl = `https://img.vietqr.io/image/${BANK_INFO.bankId}-${BANK_INFO.accountNo}-${BANK_INFO.template}.png?amount=${priceNumber}&addInfo=${transferContent}&accountName=${encodeURIComponent(BANK_INFO.accountName)}`;

  const handleConfirm = () => {
    Alert.alert(
      'Xác nhận đã chuyển khoản',
      'Hệ thống sẽ kiểm tra giao dịch của bạn. Vui lòng chờ trong giây lát hoặc liên hệ CSKH nếu cần hỗ trợ ngay.',
      [
        {
          text: 'Đóng',
          onPress: () => navigation.navigate('Home'),
          style: 'default',
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={MD3_COLORS.surface} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={MD3_COLORS.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chuyển khoản ngân hàng</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.instructionText}>
            Vui lòng quét mã QR hoặc chuyển khoản theo thông tin bên dưới để thanh toán gói tập.
          </Text>

          {/* QR Code Section */}
          <View style={styles.qrContainer}>
            <Image 
              source={{ uri: qrUrl }} 
              style={styles.qrImage} 
              resizeMode="contain"
            />
            <Text style={styles.qrNote}>Quét mã để thanh toán nhanh</Text>
          </View>

          {/* Bank Details */}
          <View style={styles.detailsContainer}>
            <DetailRow label="Ngân hàng" value={BANK_INFO.bankName} />
            <DetailRow label="Số tài khoản" value={BANK_INFO.accountNo} isCopyable />
            <DetailRow label="Chủ tài khoản" value={BANK_INFO.accountName} />
            <DetailRow label="Số tiền" value={`${plan.price}`} highlight />
            <DetailRow label="Nội dung CK" value={transferContent} isCopyable />
          </View>

          <View style={styles.warningContainer}>
            <MaterialIcons name="info-outline" size={20} color="#F59E0B" />
            <Text style={styles.warningText}>
              Lưu ý: Vui lòng nhập chính xác nội dung chuyển khoản để hệ thống tự động kích hoạt gói tập.
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
          <Text style={styles.confirmButtonText}>Tôi đã chuyển khoản</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const DetailRow = ({ label, value, highlight, isCopyable }) => (
  <View style={styles.row}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.valueContainer}>
      <Text style={[
        styles.value, 
        highlight && styles.highlightValue
      ]}>{value}</Text>
      {isCopyable && (
        <TouchableOpacity onPress={() => Alert.alert('Đã sao chép', value)}>
          <MaterialCommunityIcons name="content-copy" size={20} color={MD3_COLORS.primary} style={{ marginLeft: 8 }} />
        </TouchableOpacity>
      )}
    </View>
  </View>
);

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
    borderBottomColor: MD3_COLORS.outlineVariant,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: MD3_COLORS.textPrimary,
  },
  content: {
    padding: 16,
  },
  card: {
    backgroundColor: MD3_COLORS.surface,
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  instructionText: {
    fontSize: 14,
    color: MD3_COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: MD3_COLORS.outlineVariant,
  },
  qrImage: {
    width: 200,
    height: 200,
  },
  qrNote: {
    marginTop: 8,
    fontSize: 12,
    color: MD3_COLORS.textSecondary,
  },
  detailsContainer: {
    gap: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: MD3_COLORS.surfaceContainer,
  },
  label: {
    fontSize: 14,
    color: MD3_COLORS.textSecondary,
    flex: 1,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 2,
    justifyContent: 'flex-end',
  },
  value: {
    fontSize: 14,
    fontWeight: '500',
    color: MD3_COLORS.textPrimary,
    textAlign: 'right',
  },
  highlightValue: {
    color: MD3_COLORS.primary,
    fontWeight: '700',
    fontSize: 16,
  },
  warningContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF8E1',
    padding: 12,
    borderRadius: 8,
    marginTop: 24,
    gap: 8,
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    color: '#B07200',
    lineHeight: 18,
  },
  footer: {
    padding: 16,
    backgroundColor: MD3_COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: MD3_COLORS.outlineVariant,
  },
  confirmButton: {
    backgroundColor: MD3_COLORS.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: MD3_COLORS.onPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default BankTransferScreen;
