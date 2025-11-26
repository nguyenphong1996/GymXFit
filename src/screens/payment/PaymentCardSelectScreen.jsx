import React, { useEffect, useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Alert,
  StatusBar
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { UserContext } from '@context/UserContext';
import { getVnpayTokens, deleteVnpayToken } from '../../api/paymentApi';

const MD3_COLORS = {
  primary: '#1F8E4A',
  onPrimary: '#FFFFFF',
  surface: '#FFFFFF',
  background: '#F5F7F6',
  onSurface: '#191C19',
  textPrimary: '#10241A',
  textSecondary: '#47614F',
  outline: '#C1C9BF',
};

const PaymentCardSelectScreen = ({ navigation, route }) => {
  const { plan } = route.params || {};
  const { user } = useContext(UserContext);
  const [isLoading, setIsLoading] = useState(true);
  const [tokens, setTokens] = useState([]);

  const buildExpiry = (token) => {
    const monthRaw = token.expMonth || token.expiryMonth || token.cardExpMonth || token.expireMonth;
    const yearRaw = token.expYear || token.expiryYear || token.cardExpYear || token.expireYear;
    const month = monthRaw ? String(monthRaw).padStart(2, '0') : null;
    let year = yearRaw ? String(yearRaw) : null;
    if (year && year.length === 4) {
      year = year.slice(2);
    }
    if (month && year) return `${month}/${year}`;
    return token.cardExpiry || token.cardExpiration || token.expiry || token.expireDate || token.expDate || token.expiration || token.expirationDate;
  };

  const fetchTokens = async () => {
    try {
      if (!user?.id && !user?._id) {
        setTokens([]);
        return;
      }
      setIsLoading(true);
      const userId = user.id || user._id || user.userId;
      const res = await getVnpayTokens(userId);
      console.log('VNPAY tokens response:', res);
      setTokens(res || []);
    } catch (error) {
      console.warn('Không lấy được danh sách thẻ:', error?.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTokens();
  }, []);

  const handleUseToken = (token) => {
    navigation.navigate('PaymentTokenScreen', {
      plan,
      token: token.token,
      tokenMeta: {
        bankCode: token.bankCode || token.bankShortName || token.bank || token.bankName,
        bankName: token.bankName || token.bank || token.bankShortName || token.bankCode,
        cardMask: token.cardMask || token.mask || token.number,
        cardType: token.cardType,
        cardHolderName: token.cardHolderName || token.cardHolder || token.holderName || token.ownerName || token.nameOnCard,
        cardExpiry: buildExpiry(token),
      },
    });
  };

  const handleDelete = (id) => {
    Alert.alert('Xác nhận', 'Xóa thẻ này khỏi danh sách?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteVnpayToken(id);
            fetchTokens();
          } catch (err) {
            Alert.alert('Lỗi', 'Không xóa được thẻ.');
          }
        }
      }
    ]);
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => handleUseToken(item)} activeOpacity={0.8}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View>
          <Text style={styles.cardTitle}>{item.bankCode || 'Thẻ đã lưu'}</Text>
          <Text style={styles.cardMask}>{item.cardMask || '****'}</Text>
          <Text style={styles.cardType}>Loại thẻ: {item.cardType === '01' ? 'Nội địa' : item.cardType === '02' ? 'Quốc tế' : 'Khác'}</Text>
        </View>
        <TouchableOpacity onPress={() => handleDelete(item._id)} style={styles.deleteButton}>
          <MaterialIcons name="delete-outline" size={20} color="#BA1A1A" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={MD3_COLORS.surface} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={MD3_COLORS.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chọn thẻ VNPAY</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.summaryContainer}>
        <Text style={styles.summaryText}>Gói: <Text style={styles.summaryValue}>{plan?.name}</Text></Text>
        <Text style={styles.summaryText}>Số tiền: <Text style={styles.summaryValue}>{plan?.price}</Text></Text>
      </View>

      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={MD3_COLORS.primary} />
          <Text style={styles.loaderText}>Đang tải thẻ đã lưu...</Text>
        </View>
      ) : (
        <FlatList
          data={tokens}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          ListEmptyComponent={
            <View style={styles.loaderContainer}>
              <Text style={styles.loaderText}>Chưa có thẻ nào. Thêm thẻ để thanh toán nhanh.</Text>
            </View>
          }
          contentContainerStyle={{ padding: 16 }}
        />
      )}

      <View style={styles.footer}>
        <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('PaymentTokenScreen', { plan })}>
          <Text style={styles.addButtonText}>Thêm thẻ mới</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: MD3_COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 56,
    backgroundColor: MD3_COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: MD3_COLORS.outline,
  },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: MD3_COLORS.onSurface },
  summaryContainer: { padding: 16, backgroundColor: MD3_COLORS.surface, borderBottomWidth: 1, borderBottomColor: MD3_COLORS.outline },
  summaryText: { fontSize: 14, color: MD3_COLORS.textSecondary, marginBottom: 4 },
  summaryValue: { fontSize: 15, fontWeight: '700', color: MD3_COLORS.textPrimary },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  loaderText: { fontSize: 14, color: MD3_COLORS.textSecondary, textAlign: 'center' },
  card: {
    backgroundColor: MD3_COLORS.surface,
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  cardTitle: { fontSize: 16, fontWeight: '600', color: MD3_COLORS.textPrimary },
  cardMask: { marginTop: 4, fontSize: 14, color: MD3_COLORS.textSecondary },
  cardType: { marginTop: 2, fontSize: 12, color: MD3_COLORS.textSecondary },
  deleteButton: { padding: 8 },
  footer: { padding: 16, backgroundColor: MD3_COLORS.surface, borderTopWidth: 1, borderTopColor: '#e5e5e5' },
  addButton: { backgroundColor: MD3_COLORS.primary, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  addButtonText: { color: MD3_COLORS.onPrimary, fontSize: 16, fontWeight: '600' },
});

export default PaymentCardSelectScreen;
