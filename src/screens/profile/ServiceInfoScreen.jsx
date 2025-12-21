import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { getUserMe, getProfile } from '@api/userApi';
import createAxiosInstance from '@api/axiosInstance'; // Import axios to try direct calls
import {
  normalizeMembership,
  estimateClassPricing,
  estimatePtPricing,
  calculateDaysLeft,
  formatCurrency,
} from '../../utils/membership';
import { membershipPlans } from '../../screens/membership/membershipPlans';

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
};

const formatDate = value => {
  if (!value) return '—';
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '—';
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${dd}/${mm}/${d.getFullYear()}`;
  } catch {
    return '—';
  }
};

const normalizeFacilityAccess = access => {
  if (!access) return [];
  if (Array.isArray(access)) return access.filter(Boolean);
  if (typeof access === 'string') {
    return access
      .split(',')
      .map(item => item.trim())
      .filter(Boolean);
  }
  return [];
};

const ServiceInfoScreen = ({ navigation }) => {
  const [membership, setMembership] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const classPricing = useMemo(() => estimateClassPricing(membership), [membership]);
  const ptPricing = useMemo(() => estimatePtPricing(membership), [membership]);
  const daysLeft = useMemo(() => calculateDaysLeft(membership), [membership]);
  const facilityAccess = useMemo(
    () => normalizeFacilityAccess(membership?.facilityAccess),
    [membership],
  );

  const fetchMembership = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const axios = createAxiosInstance();
      
      // 1. Try getProfile (Backend updated to include membership here)
      const profileRes = await getProfile().catch(e => ({ error: e.message }));
      
      // 2. Try explicit /api/user/membership (New endpoint)
      const membershipRes = await axios.get('/api/user/membership').catch(e => ({ error: e.message }));

      // Prioritize the explicit membership endpoint if available
      let normalized = null;
      
      if (membershipRes?.data) {
         normalized = normalizeMembership(membershipRes.data);
      }

      // Fallback to profile if membership endpoint failed or returned nothing useful
      if (!normalized && (profileRes?.user || profileRes?.data)) {
         normalized = normalizeMembership(profileRes?.user || profileRes?.data || profileRes);
      }

      setMembership(normalized);
    } catch (err) {
      setMembership(null);
      setError(err?.message || 'Không thể tải thông tin dịch vụ.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMembership();
  }, [fetchMembership]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMembership();
    setRefreshing(false);
  };

  const statusLabel = membership?.status || 'Chưa kích hoạt';
  const statusColor =
    statusLabel.toLowerCase().includes('active') || statusLabel.toLowerCase().includes('đang')
      ? COLORS.success
      : COLORS.warning;

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
        <Text style={styles.headerTitle}>Thông tin dịch vụ</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
      >
        {/* Membership Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardLabel}>Gói thành viên hiện tại</Text>
              <Text style={styles.packageName}>
                {membership?.packageName || 'Chưa có gói'}
              </Text>
            </View>
            <View style={[styles.statusPill, { backgroundColor: `${statusColor}20` }]}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.metaBlock}>
              <Text style={styles.metaLabel}>Ngày bắt đầu</Text>
              <Text style={styles.metaValue}>{formatDate(membership?.startDate)}</Text>
            </View>
            <View style={styles.metaDivider} />
            <View style={styles.metaBlock}>
              <Text style={styles.metaLabel}>Ngày kết thúc</Text>
              <Text style={styles.metaValue}>{formatDate(membership?.endDate)}</Text>
            </View>
            <View style={styles.metaDivider} />
            <View style={styles.metaBlock}>
              <Text style={styles.metaLabel}>Còn lại</Text>
              <Text style={styles.metaValue}>{daysLeft != null ? `${daysLeft} ngày` : '—'}</Text>
            </View>
          </View>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconTitle}>
              <Icon name="ticket-percent" size={22} color={COLORS.primary} />
              <Text style={styles.cardTitle}>Ưu đãi còn lại</Text>
            </View>
          </View>
          <View style={styles.benefitRow}>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitLabel}>Lượt lớp</Text>
              <Text style={styles.benefitValue}>
                {classPricing.remainingCredits === Infinity
                  ? 'Không giới hạn'
                  : classPricing.remainingCredits ?? membership?.remainingClassCredits ?? '—'}
              </Text>
              <Text style={styles.benefitNote}>{classPricing.note}</Text>
            </View>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitLabel}>Buổi PT</Text>
              <Text style={styles.benefitValue}>{ptPricing.remainingSessions ?? '—'}</Text>
              <Text style={styles.benefitNote}>{ptPricing.note}</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconTitle}>
              <Icon name="cash-multiple" size={22} color={COLORS.primary} />
              <Text style={styles.cardTitle}>Ước tính phí hiện tại</Text>
            </View>
          </View>
          <View style={styles.priceRow}>
            <View style={styles.priceBox}>
              <Text style={styles.priceLabel}>Lớp nhóm</Text>
              <Text style={styles.priceValue}>{formatCurrency(classPricing.price)}</Text>
              <Text style={styles.priceNote}>{classPricing.note}</Text>
            </View>
            <View style={styles.priceBox}>
              <Text style={styles.priceLabel}>PT 1-1</Text>
              <Text style={styles.priceValue}>{formatCurrency(ptPricing.price)}</Text>
              <Text style={styles.priceNote}>{ptPricing.note}</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconTitle}>
              <Icon name="door-open" size={22} color={COLORS.primary} />
              <Text style={styles.cardTitle}>Quyền truy cập</Text>
            </View>
          </View>
          {facilityAccess.length ? (
            facilityAccess.map((item, idx) => (
              <View key={`${item}-${idx}`} style={styles.listRow}>
                <Icon name="check-circle" size={18} color={COLORS.primary} />
                <Text style={styles.listText}>{item}</Text>
              </View>
            ))
          ) : (
            <View style={styles.listRow}>
              <Icon name="information-outline" size={18} color={COLORS.textSecondary} />
              <Text style={styles.listText}>Tất cả chi nhánh GymXFit (nếu gói đang hoạt động)</Text>
            </View>
          )}
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconTitle}>
              <Icon name="gift-outline" size={22} color={COLORS.primary} />
              <Text style={styles.cardTitle}>Dịch vụ đi kèm</Text>
            </View>
          </View>
          {[
            '24/7 Gym & phòng tắm',
            'Sauna / phòng xông hơi (chi nhánh hỗ trợ)',
            'Đo InBody mỗi tháng',
            'Video workout & coaching online',
          ].map((perk, idx) => (
            <View key={perk} style={[styles.listRow, idx > 0 && { marginTop: 10 }]}>
              <Icon name="checkbox-marked-circle-outline" size={18} color={COLORS.primary} />
              <Text style={styles.listText}>{perk}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

export default ServiceInfoScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: 14,
    paddingBottom: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: COLORS.onPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
    gap: 12,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.outline,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardLabel: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '600' },
  cardTitle: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '800' },
  iconTitle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  packageName: { color: COLORS.textPrimary, fontSize: 18, fontWeight: '800', marginTop: 4 },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    gap: 6,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 12, fontWeight: '700' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metaBlock: { flex: 1 },
  metaLabel: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '600' },
  metaValue: { color: COLORS.textPrimary, fontSize: 15, fontWeight: '800', marginTop: 4 },
  metaDivider: { width: 1, height: 30, backgroundColor: COLORS.outline },
  errorText: { marginTop: 8, color: COLORS.error, fontSize: 12 },
  benefitRow: { flexDirection: 'row', gap: 12 },
  benefitItem: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.outline,
    backgroundColor: '#F7FAF8',
  },
  benefitLabel: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '700' },
  benefitValue: { color: COLORS.textPrimary, fontSize: 20, fontWeight: '800', marginTop: 6 },
  benefitNote: { color: COLORS.textSecondary, fontSize: 12, marginTop: 6, lineHeight: 18 },
  priceRow: { flexDirection: 'row', gap: 12 },
  priceBox: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.outline,
    backgroundColor: '#F4F7F5',
  },
  priceLabel: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '700' },
  priceValue: { color: COLORS.textPrimary, fontSize: 18, fontWeight: '800', marginTop: 6 },
  priceNote: { color: COLORS.textSecondary, fontSize: 12, marginTop: 4, lineHeight: 18 },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 },
  listText: { color: COLORS.textPrimary, fontSize: 14, flex: 1 },
  loadingBox: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.outline,
    gap: 12,
  },
  loadingText: { color: COLORS.textSecondary, fontSize: 14 },
  // Membership Plans Styles
  planCard: {
    borderWidth: 1,
    borderColor: COLORS.outline,
    borderRadius: 12,
    padding: 16,
    backgroundColor: COLORS.surface,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  planBadge: {
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary,
  },
  planPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  planName: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  planCaption: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  planFeatures: {
    marginBottom: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  featureText: {
    fontSize: 13,
    color: COLORS.textPrimary,
    flex: 1,
  },
  selectPlanButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  selectPlanText: {
    color: COLORS.onPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
});
