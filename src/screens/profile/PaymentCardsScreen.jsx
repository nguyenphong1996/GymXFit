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
    <View style={styles.card}>
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
    </View>
  );

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

export default PaymentCardsScreen;
