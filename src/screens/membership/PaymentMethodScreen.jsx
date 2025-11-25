import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

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

  const handlePaymentMethodSelect = (method) => {
    if (method.id === 'vnpay_token') {
      navigation.navigate('PaymentCardSelect', { plan });
      return;
    }

    if (method.id === 'banking') {
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
          onPress: () => {},
          style: 'cancel',
        },
        {
          text: 'Xác nhận',
          onPress: () => {
            Alert.alert('Thành công', `Đã chọn phương thức: ${method.title}`);
            // Sau khi xác nhận, quay lại hoặc chuyển sang màn hình confirm
            setTimeout(() => {
              navigation.goBack();
            }, 1500);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={MD3_COLORS.surface} />

      {/* Header */}
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
        {/* Plan Info Card */}
        {plan && (
          <View style={styles.planCard}>
            <View style={styles.planCardContent}>
              <Text style={styles.planCardTitle}>{plan.name}</Text>
              <Text style={styles.planCardPrice}>{plan.price}</Text>
            </View>
          </View>
        )}

        {/* Payment Methods */}
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

        {/* Info Box */}
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
    </SafeAreaView>
  );
};

export default PaymentMethodScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MD3_COLORS.background,
  },

  // Header
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

  // Content
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },

  // Plan Card
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
  planCardPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: MD3_COLORS.onPrimary,
  },

  // Section
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: MD3_COLORS.onSurface,
    marginBottom: 16,
  },

  // Payment Methods Grid
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

  // Info Box
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
});
