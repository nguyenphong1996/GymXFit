import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Alert,
  Image,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { listPtBookings, cancelPtBooking } from '@api/ptBookingApi';
import { useToast } from '@context/ToastContext';

const MyBookingsScreen = ({ hideHeader = false }) => {
  const navigation = useNavigation();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('upcoming');
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchBookings = useCallback(async (isInitial = false) => {
    if (isLoading || (!hasMore && !isInitial)) return;

    setIsLoading(true);
    try {
      const currentPage = isInitial ? 1 : page;
      const response = await listPtBookings({
        status: activeTab,
        page: currentPage,
        limit: 15,
      });

      if (response?.success) {
        const bookingsData = Array.isArray(response.data) ? response.data : [];
        setBookings(prev => (isInitial ? bookingsData : [...prev, ...bookingsData]));
        
        if (response.pagination) {
          const { page: currentResponsePage, pages } = response.pagination;
          setHasMore(currentResponsePage < pages);
          setPage(currentResponsePage + 1);
        } else {
          setHasMore(false);
          setPage(currentPage + 1);
        }
      }
    } catch (error) {
      showToast({ type: 'error', title: 'Lỗi', message: 'Không thể tải danh sách lịch hẹn.' });
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, page, hasMore, showToast]);

  useFocusEffect(
    useCallback(() => {
      fetchBookings(true);
    }, [activeTab])
  );

  const handleCancelBooking = (bookingId) => {
    Alert.alert(
      'Xác nhận hủy lịch',
      'Bạn có chắc chắn muốn hủy buổi tập này không?',
      [
        { text: 'Không', style: 'cancel' },
        {
          text: 'Hủy lịch',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelPtBooking(bookingId);
              showToast({ type: 'success', title: 'Thành công', message: 'Đã hủy lịch tập.' });
              fetchBookings(true); // Refresh the list
            } catch (error) {
              showToast({ type: 'error', title: 'Lỗi', message: error.message || 'Không thể hủy lịch.' });
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }) => (
    <View style={styles.bookingCard}>
        <View style={styles.cardHeader}>
            <Image 
                source={item.staff?.avatar ? { uri: item.staff.avatar } : require('@assets/images/avt.png')} 
                style={styles.avatar}
            />
            <View style={styles.headerText}>
                <Text style={styles.ptName}>PT: {item.staff?.name || 'N/A'}</Text>
                <Text style={styles.bookingStatus} >{new Date(item.startTime).toLocaleDateString('vi-VN')}</Text>
            </View>
        </View>
        <View style={styles.cardBody}>
            <View style={styles.timeInfo}>
                <MaterialIcons name="schedule" size={20} color="#1F8E4A" />
                <Text style={styles.timeText}>{item.slotKey}</Text>
            </View>
        </View>
      {activeTab === 'upcoming' && (
        <TouchableOpacity 
          style={styles.cancelButton}
          onPress={() => handleCancelBooking(item._id)}
        >
          <Text style={styles.cancelButtonText}>Hủy lịch</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {!hideHeader && (
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <MaterialIcons name="arrow-back" size={24} color="#10241A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Lịch tập của tôi</Text>
        </View>
      )}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'upcoming' && styles.activeTab]}
          onPress={() => setActiveTab('upcoming')}
        >
          <Text style={[styles.tabText, activeTab === 'upcoming' && styles.activeTabText]}>Sắp tới</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && styles.activeTab]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>Lịch sử</Text>
        </TouchableOpacity>
      </View>
      {isLoading && page === 1 ? (
        <ActivityIndicator style={{ flex: 1 }} size="large" />
      ) : (
        <FlatList
          data={bookings}
          renderItem={renderItem}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.listContainer}
          onRefresh={() => fetchBookings(true)}
          refreshing={isLoading}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Không có lịch hẹn nào.</Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F7F6' },
    header: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
    backButton: { marginRight: 16 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#10241A' },
    tabContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: '#FFFFFF',
        paddingVertical: 8,
    },
    tab: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 20,
    },
    activeTab: {
        backgroundColor: '#1F8E4A',
    },
    tabText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#47614F',
    },
    activeTabText: {
        color: '#FFFFFF',
    },
    listContainer: { padding: 16 },
    bookingCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#EFEFEF',
        paddingBottom: 12,
    },
    avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
    headerText: { flex: 1 },
    ptName: { fontSize: 16, fontWeight: 'bold', color: '#10241A' },
    bookingStatus: { fontSize: 14, color: '#47614F' },
    cardBody: {
        paddingVertical: 12,
    },
    timeInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    timeText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#10241A',
    },
    cancelButton: {
        marginTop: 12,
        backgroundColor: '#FFEBEE',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    cancelButtonText: {
        color: '#D32F2F',
        fontWeight: 'bold',
    },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 },
    emptyText: { fontSize: 16, color: '#888' },
});

export default MyBookingsScreen;
