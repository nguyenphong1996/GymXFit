import React, { useEffect, useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  StatusBar
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import { UserContext } from '@context/UserContext';
import { getVnpayTokens } from '../../api/paymentApi';

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

const PaymentCardsScreen = ({ navigation }) => {
  const { user } = useContext(UserContext);
  const [isLoading, setIsLoading] = useState(true);
  const [tokens, setTokens] = useState([]);

  const fetchTokens = async () => {
    try {
      if (!user?.id && !user?._id) {
        setTokens([]);
        return;
      }
      setIsLoading(true);
      const userId = user.id || user._id || user.userId;
      const res = await getVnpayTokens(userId);
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

  const buildCardTypeLabel = (type) => {
    if (type === '01') return 'Thẻ nội địa (ATM)';
    if (type === '02') return 'Thẻ quốc tế';
    return 'Thẻ khác';
  };

  const buildExpiry = (token) => {
    const monthRaw = token.expMonth || token.expiryMonth || token.cardExpMonth || token.expireMonth;
    const yearRaw = token.expYear || token.expiryYear || token.cardExpYear || token.expireYear;
    const month = monthRaw ? String(monthRaw).padStart(2, '0') : null;
    let year = yearRaw ? String(yearRaw) : null;
    if (year && year.length === 4) year = year.slice(2);
    if (month && year) return `${month}/${year}`;
    return token.cardExpiry || token.cardExpiration || token.expiry || token.expireDate || token.expDate || token.expiration || token.expirationDate;
  };

  const handleSelect = (item) => {
    navigation.navigate('PaymentTokenScreen', {
      fromProfile: true,
      token: item.token,
      tokenMeta: {
        bankCode: item.bankCode || item.bankShortName || item.bank || item.bankName,
        bankName: item.bankName || item.bank || item.bankShortName || item.bankCode,
        cardMask: item.cardMask || item.mask || item.number,
        cardType: item.cardType,
        cardHolderName: item.cardHolderName || item.cardHolder || item.holderName || item.ownerName || item.nameOnCard,
        cardExpiry: buildExpiry(item),
      },
    });
  };

  const renderItem = ({ item }) => {
    const typeLabel = buildCardTypeLabel(item.cardType);
    const expiryLabel = buildExpiry(item);
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.9}
        onPress={() => handleSelect(item)}
      >
        <LinearGradient
          colors={['rgba(122, 46, 42, 0.95)', 'rgba(255, 102, 51, 0.95)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardGradient}
        >
          <View style={styles.cardHeader}>
            <View style={styles.bankBadge}>
              <MaterialIcons name="account-balance" size={16} color="#fff" />
              <Text style={styles.cardTitle}>{item.bankName || item.bankCode || 'Thẻ đã lưu'}</Text>
            </View>
            <MaterialIcons name="chevron-right" size={22} color="#ffe8e0" />
          </View>

          <Text style={styles.cardMask}>{item.cardMask || '•••• •••• •••• ••••'}</Text>

          <View style={styles.cardMetaRow}>
            <View style={styles.metaItem}>
              <MaterialIcons name="credit-card" size={16} color="#ffe8e0" />
              <Text style={styles.cardMetaText}>{typeLabel}</Text>
            </View>
            {expiryLabel ? (
              <View style={styles.metaItem}>
                <MaterialIcons name="schedule" size={16} color="#ffe8e0" />
                <Text style={styles.cardMetaText}>{expiryLabel}</Text>
              </View>
            ) : null}
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={MD3_COLORS.surface} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={MD3_COLORS.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thông tin thẻ</Text>
        <View style={{ width: 40 }} />
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
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={
            <View style={styles.loaderContainer}>
              <Text style={styles.loaderText}>Chưa có thẻ. Thêm thẻ mới để thanh toán nhanh.</Text>
            </View>
          }
        />
      )}

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('PaymentTokenScreen', { fromProfile: true })}
        >
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
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  loaderText: { fontSize: 14, color: MD3_COLORS.textSecondary, textAlign: 'center' },
  card: {
    borderRadius: 14,
    marginBottom: 14,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  cardGradient: { padding: 16 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bankBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#fff', letterSpacing: 0.3 },
  cardMask: { marginTop: 14, fontSize: 18, fontWeight: '700', color: '#fff', letterSpacing: 0.6 },
  cardMetaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardMetaText: { fontSize: 13, color: '#ffe8e0', fontWeight: '600' },
  footer: { padding: 16, backgroundColor: MD3_COLORS.surface, borderTopWidth: 1, borderTopColor: '#e5e5e5' },
  addButton: { backgroundColor: MD3_COLORS.primary, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  addButtonText: { color: MD3_COLORS.onPrimary, fontSize: 16, fontWeight: '600' },
});

export default PaymentCardsScreen;
