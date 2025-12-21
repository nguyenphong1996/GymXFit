import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Image,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { listActiveStaff } from '@api/ptBookingApi';
import { useToast } from '@context/ToastContext';
import { useDebounce } from '../../hooks/useDebounce';

const PtListScreen = ({ navigation: propNavigation, hideHeader = false }) => {
  const navigation = useNavigation();
  const { showToast } = useToast();
  
  const [staff, setStaff] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadMore, setIsLoadMore] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Effect for handling initial load and search term changes
  useEffect(() => {
    // This function is defined inside useEffect to capture the correct scope
    // and avoid dependency array complexities with useCallback.
    const performSearch = async () => {
      // Don't set loading to true here, as the component's isLoading state
      // should be managed by the caller or the initial state. We'll set it manually
      // only when needed for subsequent actions.
      setPage(1);
      setHasMore(true);
      
      try {
        console.log('🔍 PtListScreen: Fetching staff with params:', { page: 1, limit: 15, search: debouncedSearchTerm });
        const response = await listActiveStaff({
          page: 1,
          limit: 15,
          search: debouncedSearchTerm,
        });

        // Kiểm tra response structure từ API
        console.log('🔍 PtListScreen: Full response type:', typeof response);
        console.log('🔍 PtListScreen: Is array:', Array.isArray(response));
        console.log('🔍 PtListScreen: Has success:', response?.success);
        console.log('🔍 PtListScreen: Has data:', response?.data);
        
        let staffData = [];
        
        // Nếu response là array trực tiếp
        if (Array.isArray(response)) {
          staffData = response;
          console.log('🏃 PtListScreen: Response is direct array');
        }
        // Nếu response có cấu trúc { success, data, pagination }
        else if (response && response.success && Array.isArray(response.data)) {
          staffData = response.data;
          console.log('🏃 PtListScreen: Response has success wrapper');
        }
        
        console.log('🏃 PtListScreen: Setting staff data:', staffData);
        setStaff(staffData);
        setHasMore(false); // Chỉ có 1 trang
        console.log('🎉 PtListScreen: Staff data set successfully');
      } catch (error) {
        showToast({ type: 'error', title: 'Lỗi', message: 'Không thể tải danh sách huấn luyện viên.' });
        setStaff([]);
        setHasMore(false);
      } finally {
        setIsLoading(false);
      }
    };

    setIsLoading(true); // Set loading true right before the search
    performSearch();
  }, [debouncedSearchTerm]);

  const handleLoadMore = async () => {
    if (isLoading || isLoadMore || !hasMore) return;

    setIsLoadMore(true);
    try {
      const response = await listActiveStaff({
        page: page,
        limit: 15,
        search: debouncedSearchTerm,
      });

      if (response?.success && response.data.length > 0) {
        setStaff(prev => [...prev, ...response.data]);
        setHasMore(response.pagination.page < response.pagination.pages);
        setPage(prev => prev + 1);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      showToast({ type: 'error', title: 'Lỗi', message: 'Không thể tải thêm.' });
    } finally {
      setIsLoadMore(false);
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.ptCard}
      onPress={() => navigation.navigate('BookingCalendarScreen', { staff: item })}
    >
      <Image
        source={item.avatar ? { uri: item.avatar } : require('@assets/images/avt.png')}
        style={styles.avatar}
      />
      <View style={styles.ptInfo}>
        <Text style={styles.ptName}>{item.name}</Text>
        <Text style={styles.ptPhone}>{item.phone}</Text>
        {item.skills && item.skills.length > 0 && (
          <View style={styles.skillsContainer}>
            {item.skills.map((skill, index) => (
              <View key={index} style={styles.skillTag}>
                <Text style={styles.skillText}>{skill}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
      <MaterialIcons name="chevron-right" size={24} color="#C1C9BF" />
    </TouchableOpacity>
  );
  
  const renderFooter = () => {
    if (!isLoadMore) return null;
    return <ActivityIndicator style={{ marginVertical: 20 }} size="large" />;
  };

  return (
    <SafeAreaView style={styles.container}>
      {!hideHeader && (
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Đặt lịch với PT</Text>
        </View>
      )}
      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={24} color="#888" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm PT theo tên, kỹ năng..."
          value={searchTerm}
          onChangeText={setSearchTerm}
          placeholderTextColor="#888"
        />
      </View>
      
      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 50 }} size="large" />
      ) : (
        <FlatList
          data={staff}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Không tìm thấy huấn luyện viên nào.</Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7F6' },
  header: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#10241A' },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    margin: 16,
    paddingHorizontal: 10,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, height: 50, fontSize: 16 },
  listContainer: { paddingHorizontal: 16 },
  ptCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  avatar: { width: 60, height: 60, borderRadius: 30, marginRight: 16 },
  ptInfo: { flex: 1 },
  ptName: { fontSize: 18, fontWeight: 'bold', color: '#10241A' },
  ptPhone: { fontSize: 14, color: '#47614F', marginTop: 4 },
  skillsContainer: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 },
  skillTag: {
    backgroundColor: '#E8F5E8',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginRight: 6,
    marginBottom: 6,
  },
  skillText: { fontSize: 12, color: '#1F8E4A', fontWeight: '500' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 },
  emptyText: { fontSize: 16, color: '#888' },
});

export default PtListScreen;
