import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getUserActivityLogs } from '@api/userApi';

const COLORS = {
  primary: '#1F8E4A',
  onPrimary: '#FFFFFF',
  surface: '#FFFFFF',
  background: '#F5F7F6',
  outline: '#D7E5DB',
  textPrimary: '#10241A',
  textSecondary: '#47614F',
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
};

const LOG_TYPE_CONFIG = {
  booking_pt: {
    icon: 'fitness-center',
    iconFamily: 'MaterialIcons',
    color: COLORS.info,
    label: 'Đặt lịch PT',
  },
  booking_class: {
    icon: 'calendar-plus',
    iconFamily: 'MaterialCommunityIcons',
    color: COLORS.success,
    label: 'Đăng ký lớp',
  },
  checkin: {
    icon: 'login',
    iconFamily: 'MaterialCommunityIcons',
    color: COLORS.success,
    label: 'Check-in',
  },
  checkout: {
    icon: 'logout',
    iconFamily: 'MaterialCommunityIcons',
    color: COLORS.textSecondary,
    label: 'Check-out',
  },
  membership_upgrade: {
    icon: 'card-membership',
    iconFamily: 'MaterialIcons',
    color: COLORS.warning,
    label: 'Nâng cấp gói',
  },
  membership_activate: {
    icon: 'check-circle',
    iconFamily: 'MaterialIcons',
    color: COLORS.success,
    label: 'Kích hoạt gói',
  },
  favorite_add: {
    icon: 'favorite',
    iconFamily: 'MaterialIcons',
    color: COLORS.error,
    label: 'Thêm yêu thích',
  },
  favorite_remove: {
    icon: 'favorite-border',
    iconFamily: 'MaterialIcons',
    color: COLORS.textSecondary,
    label: 'Bỏ yêu thích',
  },
  profile_update: {
    icon: 'account-edit',
    iconFamily: 'MaterialCommunityIcons',
    color: COLORS.info,
    label: 'Cập nhật thông tin',
  },
  login: {
    icon: 'login-variant',
    iconFamily: 'MaterialCommunityIcons',
    color: COLORS.success,
    label: 'Đăng nhập',
  },
  logout: {
    icon: 'logout-variant',
    iconFamily: 'MaterialCommunityIcons',
    color: COLORS.textSecondary,
    label: 'Đăng xuất',
  },
};

const formatDate = (isoString) => {
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
};

const formatTime = (isoString) => {
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
};

const formatCurrency = (value) => {
  if (!value || isNaN(value)) return '—';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(value);
};

const ActivityLogsScreen = ({ navigation }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getUserActivityLogs({ limit: 50, skip: 0 });
      setLogs(response.data?.data || []);
    } catch (err) {
      setError(err?.message || 'Không thể tải lịch sử hoạt động.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchLogs();
    setRefreshing(false);
  };

  const renderLogDetail = (log) => {
    const { type, data } = log;

    switch (type) {
      case 'booking_pt':
        return (
          <Text style={styles.logDetail}>
            Huấn luyện viên: {data.trainerName} • {data.sessionTime}
          </Text>
        );
      case 'booking_class':
        return (
          <Text style={styles.logDetail}>
            Lớp: {data.className} • {data.classTime}
          </Text>
        );
      case 'membership_upgrade':
      case 'membership_activate':
        return (
          <Text style={styles.logDetail}>
            {data.packageName} - {data.billingCycle} • {formatCurrency(data.price)}
          </Text>
        );
      case 'checkin':
      case 'checkout':
        return (
          <Text style={styles.logDetail}>
            {data.location || 'Chi nhánh GymXFit'}
          </Text>
        );
      case 'favorite_add':
      case 'favorite_remove':
        return (
          <Text style={styles.logDetail}>
            {data.videoTitle || 'Video tập luyện'}
          </Text>
        );
      case 'profile_update':
        return (
          <Text style={styles.logDetail}>
            {data.fields?.join(', ') || 'Thông tin cá nhân'}
          </Text>
        );
      case 'login':
      case 'logout':
        return (
          <Text style={styles.logDetail}>
            {data.device || 'Thiết bị di động'}
          </Text>
        );
      default:
        return null;
    }
  };

  const renderLogItem = ({ item }) => {
    const config = LOG_TYPE_CONFIG[item.type] || {
      icon: 'info',
      iconFamily: 'MaterialIcons',
      color: COLORS.textSecondary,
      label: 'Hoạt động',
    };

    return (
      <View style={styles.logCard}>
        <View style={styles.logContent}>
          <View style={styles.logHeader}>
            <Text style={styles.logLabel}>{config.label}</Text>
            <Text style={styles.logTime}>{formatTime(item.timestamp)}</Text>
          </View>
          {renderLogDetail(item)}
          <Text style={styles.logDate}>{formatDate(item.timestamp)}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color={COLORS.onPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lịch sử hoạt động</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <MaterialIcons name="error-outline" size={48} color={COLORS.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchLogs}>
            <Text style={styles.retryText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : logs.length === 0 ? (
        <View style={styles.centerContainer}>
          <MaterialCommunityIcons name="history" size={48} color={COLORS.textSecondary} />
          <Text style={styles.emptyText}>Chưa có hoạt động nào</Text>
        </View>
      ) : (
        <FlatList
          data={logs}
          keyExtractor={(item) => item._id || item.id}
          renderItem={renderLogItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
            />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.primary,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.onPrimary,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.error,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
  },
  retryText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.onPrimary,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  listContent: {
    padding: 16,
  },
  logCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  logIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  logContent: {
    flex: 1,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  logLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  logTime: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  logDetail: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  logDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
});

export default ActivityLogsScreen;
