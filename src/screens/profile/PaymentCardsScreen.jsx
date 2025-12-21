import React, { useEffect, useState, useContext, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  StatusBar,
  Alert,
  Animated,
  Dimensions
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import { Swipeable } from 'react-native-gesture-handler';
import { useIsFocused } from '@react-navigation/native';
import { UserContext } from '@context/UserContext';
import { getVnpayTokens, deleteVnpayToken } from '../../api/paymentApi';
import { useToast } from '@context/ToastContext';

const { width } = Dimensions.get('window');

const MD3_COLORS = {
  // Primary colors
  primary: '#1F8E4A',
  onPrimary: '#FFFFFF',
  primaryContainer: '#E8F5E8',
  onPrimaryContainer: '#002D16',
  
  // Secondary colors
  secondary: '#47614F',
  onSecondary: '#FFFFFF',
  secondaryContainer: '#DCE4DD',
  onSecondaryContainer: '#243628',
  
  // Surface colors
  surface: '#FFFFFF',
  onSurface: '#1A1C1A',
  surfaceVariant: '#F5F7F6',
  onSurfaceVariant: '#44483E',
  
  // Error colors
  error: '#D32F2F',
  onError: '#FFFFFF',
  
  // Neutral colors
  outline: '#C8D0C8',
  outlineVariant: '#BBC4BB',
  background: '#F5F7F6',
  scrim: 'rgba(0, 0, 0, 0.32)',
  
  // Text colors
  textPrimary: '#1A1C1A',
  textSecondary: '#44483E',
  textTertiary: '#73756F',
  
  // State layers
  hoverOpacity: 0.08,
  focusOpacity: 0.12,
  pressedOpacity: 0.12,
  disabledOpacity: 0.38,
};

const PaymentCardsScreen = ({ navigation }) => {
  const { user } = useContext(UserContext);
  const { showToast } = useToast();
  const isFocused = useIsFocused();
  const [isLoading, setIsLoading] = useState(true);
  const [tokens, setTokens] = useState([]);

  const fetchTokens = async (showLoading = true) => {
    try {
      if (!user?.id && !user?._id) {
        setTokens([]);
        return;
      }
      if (showLoading) {
        setIsLoading(true);
      }
      const userId = user.id || user._id || user.userId;
      const res = await getVnpayTokens(userId);
      setTokens(res || []);
    } catch (error) {
      console.warn('Không lấy được danh sách thẻ:', error?.message);
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    if (isFocused) {
      fetchTokens();
    }
  }, [isFocused]);

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
    navigation.navigate('PaymentStack', {
      screen: 'PaymentTokenScreen',
      params: {
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
      },
    });
  };

  const handleDelete = (item) => {
    Alert.alert(
      'Xóa thẻ',
      `Bạn có chắc chắn muốn xóa thẻ ${item.bankCode || 'này'} đuôi ${item.cardMask?.slice(-4) || '...'} không?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              await deleteVnpayToken(item._id);
              await fetchTokens(); // Refresh list
              
              // Success toast
              showToast({
                type: 'success',
                title: 'Thành công',
                message: `Đã xóa thẻ ${item.bankCode || ''} thành công`,
              });
            } catch (error) {
              Alert.alert('Lỗi', 'Không thể xóa thẻ. Vui lòng thử lại.');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const renderRightActions = (progress, dragX, item) => {
    const scale = dragX.interpolate({
      inputRange: [-100, -16, 0],
      outputRange: [1, 0.9, 0],
      extrapolate: 'clamp',
    });

    return (
      <TouchableOpacity
        style={styles.deleteAction}
        onPress={() => handleDelete(item)}
      >
        <Animated.View style={{ 
          transform: [{ scale }],
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <View style={styles.deleteIconContainer}>
            <MaterialIcons name="delete" size={24} color={MD3_COLORS.onError} />
          </View>
          <Text style={styles.deleteText}>Xóa</Text>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  const renderItem = ({ item }) => {
    const typeLabel = buildCardTypeLabel(item.cardType);
    const expiryLabel = buildExpiry(item);
    
    return (
      <Swipeable
        renderRightActions={(progress, dragX) => renderRightActions(progress, dragX, item)}
        containerStyle={styles.swipeContainer}
      >
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
      </Swipeable>
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
          onPress={() => navigation.navigate('PaymentStack', { screen: 'PaymentTokenization', params: { fromProfile: true } })}
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
  backButton: { 
    width: 40, 
    height: 40, 
    alignItems: 'center', 
    justifyContent: 'center',
    borderRadius: 20,
  },
  headerTitle: { 
    fontSize: 18, 
    fontWeight: '600', 
    color: MD3_COLORS.onSurface,
    letterSpacing: 0.1,
  },
  loaderContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 24,
  },
  loaderText: { 
    fontSize: 14, 
    color: MD3_COLORS.textSecondary, 
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 12,
  },
  card: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 1,
    shadowColor: MD3_COLORS.textPrimary,
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    backgroundColor: MD3_COLORS.surface,
    borderWidth: 1,
    borderColor: MD3_COLORS.outline,
  },
  swipeContainer: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  deleteAction: {
    backgroundColor: MD3_COLORS.error,
    justifyContent: 'center',
    alignItems: 'center',
    width: 96,
    height: '100%',
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
  deleteIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  deleteText: {
    color: MD3_COLORS.onError,
    fontWeight: '500',
    fontSize: 12,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  cardGradient: { 
    padding: 16,
    backgroundColor: 'linear-gradient(135deg, #7A2E2A 0%, #FF6633 100%)',
  },
  cardHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  bankBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  cardTitle: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: '#FFFFFF',
    letterSpacing: 0.1,
  },
  cardMask: { 
    fontSize: 20, 
    fontWeight: '700', 
    color: '#FFFFFF', 
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  cardMetaRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
  },
  metaItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6,
  },
  cardMetaText: { 
    fontSize: 12, 
    color: '#FFE8E0', 
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  footer: { 
    padding: 16, 
    backgroundColor: MD3_COLORS.surface, 
    borderTopWidth: 1, 
    borderTopColor: MD3_COLORS.outline,
  },
  addButton: { 
    backgroundColor: MD3_COLORS.primary, 
    paddingVertical: 14, 
    borderRadius: 20, 
    alignItems: 'center',
    elevation: 2,
    shadowColor: MD3_COLORS.primary,
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  addButtonText: { 
    color: MD3_COLORS.onPrimary, 
    fontSize: 16, 
    fontWeight: '600',
    letterSpacing: 0.1,
  },
});

export default PaymentCardsScreen;
