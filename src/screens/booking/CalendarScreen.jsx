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
import Icon from 'react-native-vector-icons/MaterialIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { getMyEnrollments } from '@api/classesApi';

const STATUS_META = {
  active: { label: 'Sắp diễn ra', color: '#34d399' },
  completed: { label: 'Hoàn thành', color: '#60a5fa' },
  cancelled: { label: 'Đã hủy', color: '#f97316' },
};

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
    const startDate = new Date(start);
    const endDate = new Date(end);
    const fmt = d =>
      d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    return `${fmt(startDate)} - ${fmt(endDate)}`;
  } catch {
    return '--:--';
  }
};

const EnrollmentCard = ({ enrollment }) => {
  const info = enrollment.class || {};
  const meta = STATUS_META[enrollment.status] || STATUS_META.active;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.className}>{info.name || 'Lớp học GymXFit'}</Text>
        <View style={[styles.badge, { backgroundColor: meta.color }]}>
          <Text style={styles.badgeText}>{meta.label}</Text>
        </View>
      </View>

      <View style={styles.cardRow}>
        <Icon name="event" size={20} color="#30C451" />
        <Text style={styles.cardText}>{formatDateLabel(info.startTime)}</Text>
      </View>

      <View style={styles.cardRow}>
        <Icon name="schedule" size={20} color="#30C451" />
        <Text style={styles.cardText}>
          {formatTimeRange(info.startTime, info.endTime)}
        </Text>
      </View>

      {info.location && (
        <View style={styles.cardRow}>
          <Icon name="location-on" size={20} color="#30C451" />
          <Text style={styles.cardText}>{info.location}</Text>
        </View>
      )}

      {info.instructor?.name && (
        <View style={styles.cardRow}>
          <Icon name="person-outline" size={20} color="#30C451" />
          <Text style={styles.cardText}>{info.instructor.name}</Text>
        </View>
      )}

      <View style={styles.cardFooter}>
        <Text style={styles.capacityText}>
          {info.currentEnrollment}/{info.capacity} học viên
        </Text>
      </View>
    </View>
  );
};

const CalendarScreen = ({ navigation }) => {
  const [enrollments, setEnrollments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState('week'); // "week" | "month"

  const loadEnrollments = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getMyEnrollments({ limit: 100 });
      if (res?.success) {
        const data = [...(res.data || [])].sort((a, b) => {
          const t1 = new Date(a.class?.startTime).getTime();
          const t2 = new Date(b.class?.startTime).getTime();
          return t1 - t2;
        });
        setEnrollments(data);
      } else setEnrollments([]);
    } catch {
      setEnrollments([]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => loadEnrollments(), [loadEnrollments]));

  const handleRefresh = () => {
    setRefreshing(true);
    loadEnrollments();
  };

  const now = Date.now();
  const upcoming = enrollments.filter(
    e => new Date(e.class?.startTime).getTime() >= now,
  );
  const past = enrollments.filter(
    e => new Date(e.class?.startTime).getTime() < now,
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#30C451" barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lịch học của bạn</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#30C451']}
          />
        }
      >
        {/* Hero */}
        <View style={styles.heroContainer}>
          <Image
            source={require('@assets/images/headercalender.png')}
            style={styles.heroImage}
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.5)']}
            style={styles.heroOverlay}
          />
          <View style={styles.heroText}>
            <Text style={styles.heroTitle}>Theo dõi tiến trình tập luyện</Text>
            <Text style={styles.heroSubtitle}>
              Lịch học được đồng bộ giúp bạn chủ động thời gian tập luyện.
            </Text>
          </View>
        </View>

        {/* View Mode Switch */}
        <View style={styles.modeSwitch}>
          <TouchableOpacity
            style={[
              styles.modeButton,
              viewMode === 'week' && styles.modeButtonActive,
            ]}
            onPress={() => setViewMode('week')}
          >
            <Text
              style={[
                styles.modeButtonText,
                viewMode === 'week' && styles.modeButtonTextActive,
              ]}
            >
              Tuần
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.modeButton,
              viewMode === 'month' && styles.modeButtonActive,
            ]}
            onPress={() => setViewMode('month')}
          >
            <Text
              style={[
                styles.modeButtonText,
                viewMode === 'month' && styles.modeButtonTextActive,
              ]}
            >
              Tháng
            </Text>
          </TouchableOpacity>
        </View>

        {/* Sections */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lịch sắp tới</Text>
          {isLoading ? (
            <ActivityIndicator
              size="large"
              color="#30C451"
              style={{ marginTop: 20 }}
            />
          ) : upcoming.length === 0 ? (
            <Text style={styles.emptyText}>
              Bạn chưa có lịch học nào sắp diễn ra.
            </Text>
          ) : (
            upcoming.map(e => (
              <EnrollmentCard key={e.enrollmentId} enrollment={e} />
            ))
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lịch đã tham gia</Text>
          {isLoading ? (
            <ActivityIndicator
              size="large"
              color="#30C451"
              style={{ marginTop: 20 }}
            />
          ) : past.length === 0 ? (
            <Text style={styles.emptyText}>
              Bạn sẽ thấy lịch đã học tại đây.
            </Text>
          ) : (
            past.map(e => (
              <EnrollmentCard key={e.enrollmentId} enrollment={e} />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default CalendarScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#30C451',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  heroContainer: {
    position: 'relative',
    borderRadius: 20,
    overflow: 'hidden',
    margin: 16,
  },
  heroImage: {
    width: '100%',
    height: 180,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  heroText: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  heroSubtitle: {
    color: '#eee',
    fontSize: 14,
    marginTop: 4,
  },
  modeSwitch: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 30,
    marginHorizontal: 16,
    marginTop: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#d1fae5',
  },
  modeButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  modeButtonActive: {
    backgroundColor: '#30C451',
  },
  modeButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#30C451',
  },
  modeButtonTextActive: {
    color: '#fff',
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 16,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#102615',
  },
  emptyText: {
    textAlign: 'center',
    color: '#555',
    marginTop: 12,
    fontSize: 15,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    gap: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  className: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111',
    flex: 1,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardText: {
    fontSize: 15,
    color: '#222',
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 6,
  },
  capacityText: {
    fontSize: 14,
    color: '#555',
  },
});
