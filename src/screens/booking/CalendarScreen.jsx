import React, { useState, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { getMyEnrollments } from '@api/classesApi';

// ⚙️ Trạng thái buổi học
const STATUS_META = {
  active: { label: 'Sắp diễn ra', style: 'badgeActive', icon: 'clock-outline' },
  completed: {
    label: 'Hoàn thành',
    style: 'badgeCompleted',
    icon: 'check-circle-outline',
  },
  cancelled: {
    label: 'Đã hủy',
    style: 'badgeCancelled',
    icon: 'close-circle-outline',
  },
};

// 🔢 Tên tháng tiếng Việt
const VI_MONTHS = [
  'Tháng 1',
  'Tháng 2',
  'Tháng 3',
  'Tháng 4',
  'Tháng 5',
  'Tháng 6',
  'Tháng 7',
  'Tháng 8',
  'Tháng 9',
  'Tháng 10',
  'Tháng 11',
  'Tháng 12',
];

const formatDateLabel = value => {
  try {
    return new Date(value).toLocaleDateString('vi-VN', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
    });
  } catch {
    return '--/--';
  }
};

const formatTimeRange = (start, end) => {
  try {
    const s = new Date(start);
    const e = new Date(end);
    const f = d =>
      d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    return `${f(s)} - ${f(e)}`;
  } catch {
    return '--:--';
  }
};

// 🧩 Thẻ lớp học
const EnrollmentCard = ({ enrollment }) => {
  const classInfo = enrollment.class || {};
  const statusMeta = STATUS_META[enrollment.status] || STATUS_META.active;

  return (
    <View style={styles.classCard}>
      <View style={styles.cardHeader}>
        <View style={styles.rowCenter}>
          <Icon name="dumbbell" size={22} color="#30C451" />
          <Text style={styles.classTitle}>
            {classInfo.name || 'Lớp học GymXFit'}
          </Text>
        </View>
        <View style={[styles.statusBadge, styles[statusMeta.style]]}>
          <Icon name={statusMeta.icon} size={14} color="#fff" />
          <Text style={styles.statusText}>{statusMeta.label}</Text>
        </View>
      </View>

      <View style={styles.cardRow}>
        <Icon name="calendar-month" size={18} color="#30C451" />
        <Text style={styles.cardText}>
          {formatDateLabel(classInfo.startTime)}
        </Text>
      </View>

      <View style={styles.cardRow}>
        <Icon name="clock-outline" size={18} color="#30C451" />
        <Text style={styles.cardText}>
          {formatTimeRange(classInfo.startTime, classInfo.endTime)}
        </Text>
      </View>

      {classInfo.location && (
        <View style={styles.cardRow}>
          <Icon name="map-marker-outline" size={18} color="#30C451" />
          <Text style={styles.cardText}>{classInfo.location}</Text>
        </View>
      )}

      {classInfo.instructor?.name && (
        <View style={styles.cardRow}>
          <Icon name="account-outline" size={18} color="#30C451" />
          <Text style={styles.cardText}>HLV: {classInfo.instructor.name}</Text>
        </View>
      )}

      <View style={styles.cardFooter}>
        <Icon name="account-group" size={16} color="#30C451" />
        <Text style={styles.capacityText}>
          {'  '}
          {classInfo.currentEnrollment}/{classInfo.capacity} học viên
        </Text>
      </View>
    </View>
  );
};

const CalendarScreen = ({ navigation }) => {
  const [enrollments, setEnrollments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [error, setError] = useState(null);

  const loadEnrollments = useCallback(async (refresh = false) => {
    try {
      if (refresh) setRefreshing(true);
      else setIsLoading(true);

      const response = await getMyEnrollments({ limit: 100 });
      if (response?.success) {
        const sorted = [...(response.data || [])].sort((a, b) => {
          return new Date(a.class?.startTime) - new Date(b.class?.startTime);
        });
        setEnrollments(sorted);
      } else {
        setError(response?.message || 'Không thể tải dữ liệu.');
        setEnrollments([]);
      }
    } catch (err) {
      setError(err.message);
      setEnrollments([]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadEnrollments(false);
    }, [loadEnrollments]),
  );
  const handleRefresh = () => loadEnrollments(true);

  // 🔹 Lọc lịch theo tháng
  const filtered = useMemo(() => {
    return enrollments.filter(item => {
      const d = new Date(item.class?.startTime);
      return d.getMonth() === selectedMonth;
    });
  }, [enrollments, selectedMonth]);

  const monthName = VI_MONTHS[selectedMonth];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar hidden={true} />

      {/* 🔹 Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerLeft}
        >
          <Icon name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lịch tập luyện theo năm</Text>
        <View style={styles.headerRight} />
      </View>

      {/* 🔹 Nội dung */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#30C451']}
          />
        }
      >
        {/* Banner */}
        <View style={styles.bannerContainer}>
          <Image
            source={require('@assets/images/headercalender.png')}
            style={styles.bannerImage}
            resizeMode="cover"
          />
          <View style={styles.bannerOverlay}>
            <Text style={styles.bannerTitle}>
              Theo dõi lịch tập luyện trong năm
            </Text>
            <Text style={styles.bannerSubtitle}>
              Chọn tháng để xem chi tiết lịch học.
            </Text>
          </View>
        </View>

        {/* Tháng */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.monthScroll}
        >
          {VI_MONTHS.map((m, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => setSelectedMonth(i)}
              style={[
                styles.monthButton,
                selectedMonth === i && styles.monthButtonActive,
              ]}
            >
              <Text
                style={[
                  styles.monthText,
                  selectedMonth === i && styles.monthTextActive,
                ]}
              >
                {m}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Danh sách lớp */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {monthName} ({filtered.length})
          </Text>

          {isLoading ? (
            <View style={styles.stateContainer}>
              <ActivityIndicator size="large" color="#30C451" />
              <Text style={styles.stateText}>Đang tải dữ liệu...</Text>
            </View>
          ) : error ? (
            <View style={styles.stateContainer}>
              <Text style={styles.stateText}>{error}</Text>
            </View>
          ) : filtered.length === 0 ? (
            <View style={styles.stateContainer}>
              <Icon name="calendar-remove-outline" size={28} color="#bbb" />
              <Text style={styles.stateText}>
                Không có buổi học nào trong {monthName}.
              </Text>
            </View>
          ) : (
            filtered.map(item => (
              <EnrollmentCard key={item.enrollmentId} enrollment={item} />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default CalendarScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FA' },
  header: {
    backgroundColor: '#30C451',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerLeft: { padding: 4 },
  headerRight: { width: 24 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  scrollView: { flex: 1 },
  bannerContainer: {
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  bannerImage: { width: '100%', height: 180 },
  bannerOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.25)',
    padding: 16,
    justifyContent: 'flex-end',
  },
  bannerTitle: { color: '#fff', fontSize: 20, fontWeight: '700' },
  bannerSubtitle: { color: '#f0f0f0', fontSize: 14, marginTop: 6 },
  monthScroll: { paddingHorizontal: 16, marginTop: 12 },
  monthButton: {
    backgroundColor: '#E7F8EC',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
  },
  monthButtonActive: { backgroundColor: '#30C451' },
  monthText: { color: '#30C451', fontWeight: '500' },
  monthTextActive: { color: '#fff' },
  section: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 40 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#102615',
    marginBottom: 10,
  },
  stateContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  stateText: { fontSize: 15, color: '#555', textAlign: 'center', marginTop: 6 },
  classCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  classTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#102615',
    marginLeft: 6,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  statusText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  badgeActive: { backgroundColor: '#34d399' },
  badgeCompleted: { backgroundColor: '#60a5fa' },
  badgeCancelled: { backgroundColor: '#f97316' },
  cardRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 2 },
  cardText: { fontSize: 14, color: '#333', marginLeft: 8 },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eef6f0',
    paddingTop: 8,
    marginTop: 6,
  },
  capacityText: { fontSize: 13, color: '#555' },
  rowCenter: { flexDirection: 'row', alignItems: 'center' },
});
