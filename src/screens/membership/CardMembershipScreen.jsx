import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  Linking,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { membershipPlans, MEMBERSHIP_CONTACT } from './membershipPlans';
import { formatCurrency, computeCyclePrice, cycleMultipliers } from '../../utils/membership';
import { getMembershipUpgradeQuote } from '@api/userApi';
import SpecialUtilities from './SpecialUtilities';
import { getMembershipInfo, getUserMe, getProfile, getAllPackages } from '@api/userApi';
import { normalizeMembership } from '../../utils/membership';

// Material Design 3 Color Tokens
const MD3_COLORS = {
  primary: '#1F8E4A',
  onPrimary: '#FFFFFF',
  primaryContainer: '#C2F0D4',
  onPrimaryContainer: '#00210A',
  secondary: '#3A5B4C',
  onSecondary: '#FFFFFF',
  secondaryContainer: '#BDE1CD',
  onSecondaryContainer: '#002110',
  tertiary: '#2196F3',
  onTertiary: '#FFFFFF',
  tertiaryContainer: '#BBDEFB',
  surface: '#FFFFFF',
  surfaceDim: '#DDE3DD',
  surfaceBright: '#F9F9F9',
  surfaceContainerLowest: '#FFFFFF',
  surfaceContainerLow: '#F3F4F0',
  surfaceContainer: '#EDF1EC',
  surfaceContainerHigh: '#E7EBE6',
  surfaceContainerHighest: '#E1E5E0',
  background: '#F5F7F6',
  onBackground: '#191C19',
  outline: '#72796F',
  outlineVariant: '#C1C9BF',
  textPrimary: '#10241A',
  textSecondary: '#47614F',
  textTertiary: '#6B7B73',
  onSurfaceVariant: '#404943',
  error: '#BA1A1A',
  onError: '#FFFFFF',
  errorContainer: '#FFDAD6',
  success: '#34D399',
  warning: '#F59E0B',
  scrim: 'rgba(0, 0, 0, 0.32)',
};

const CONTACT_PHONE = MEMBERSHIP_CONTACT;

// Material Design 3 Elevation Tokens
const MD3_ELEVATION = {
  level0: { shadowColor: 'transparent', shadowOpacity: 0, shadowRadius: 0, shadowOffset: { width: 0, height: 0 }, elevation: 0 },
  level1: { shadowColor: MD3_COLORS.scrim, shadowOpacity: 0.15, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  level2: { shadowColor: MD3_COLORS.scrim, shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
  level3: { shadowColor: MD3_COLORS.scrim, shadowOpacity: 0.18, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
};

// MD3 Typography Scale
const MD3_TYPE = {
  displayLarge: { fontSize: 57, lineHeight: 64, fontWeight: '400' },
  displayMedium: { fontSize: 45, lineHeight: 52, fontWeight: '400' },
  displaySmall: { fontSize: 36, lineHeight: 44, fontWeight: '400' },
  headlineLarge: { fontSize: 32, lineHeight: 40, fontWeight: '600' },
  headlineMedium: { fontSize: 28, lineHeight: 36, fontWeight: '600' },
  headlineSmall: { fontSize: 24, lineHeight: 32, fontWeight: '600' },
  titleLarge: { fontSize: 22, lineHeight: 28, fontWeight: '700' },
  titleMedium: { fontSize: 16, lineHeight: 24, fontWeight: '600' },
  titleSmall: { fontSize: 14, lineHeight: 20, fontWeight: '600' },
  bodyLarge: { fontSize: 16, lineHeight: 24, fontWeight: '400' },
  bodyMedium: { fontSize: 14, lineHeight: 20, fontWeight: '400' },
  bodySmall: { fontSize: 12, lineHeight: 16, fontWeight: '400' },
  labelLarge: { fontSize: 14, lineHeight: 20, fontWeight: '600' },
  labelMedium: { fontSize: 12, lineHeight: 16, fontWeight: '600' },
  labelSmall: { fontSize: 11, lineHeight: 16, fontWeight: '600' },
};

const serviceHighlights = [
  { icon: 'fitness-center', label: '24/7 Gym', color: MD3_COLORS.primary },
  { icon: 'person', label: 'PT 1-1', color: MD3_COLORS.tertiary },
  { icon: 'monitor-heart', label: 'InBody', color: MD3_COLORS.success },
  { icon: 'spa', label: 'Sauna', color: MD3_COLORS.warning },
  { icon: 'calendar-today', label: '7d Trial', color: MD3_COLORS.secondary },
  { icon: 'ondemand-video', label: 'Video workout', color: MD3_COLORS.tertiary },
];

// Membership Card Component
const MembershipCard = ({ plan, onShowDetails, onRegister, priceLabel, discountLabel, subLabel, saveLabel, disabled }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => Animated.spring(scaleAnim, { toValue: 0.98, useNativeDriver: true }).start();
  const handlePressOut = () => Animated.spring(scaleAnim, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }).start();

  return (
    <Animated.View
      pointerEvents={disabled ? 'none' : 'auto'}
      style={[
        styles.planCard,
        { transform: [{ scale: scaleAnim }] },
        disabled && styles.cardDisabled,
      ]}
    >
      <View style={[styles.planCardInner, disabled && styles.cardInnerDisabled]}>
        {plan.id === 'plus' && (
          <View style={[styles.planBadgeTop, { backgroundColor: plan.accent }]}>
            <MaterialIcons name="star" size={14} color={plan.accentText} />
            <Text style={[styles.planBadgeTopText, { color: plan.accentText }]}>{plan.badge}</Text>
          </View>
        )}
        <View style={styles.planHeader}>
          <Text style={styles.planName}>{plan.name}</Text>
          <Text style={styles.planCaption}>{plan.caption}</Text>
        </View>
        <View style={styles.planImageWrapper}>
          <Image source={plan.image} style={styles.planImage} resizeMode="cover" />
        </View>
        <View style={styles.priceContainer}>
          <Text style={styles.planPrice}>{priceLabel || plan.price}</Text>
          {discountLabel ? (
            <View style={styles.discountPillRow}>
              <View style={styles.discountPill}>
                <MaterialCommunityIcons name="tag-outline" size={14} color={MD3_COLORS.primary} />
                <Text style={styles.discountText}>{discountLabel}</Text>
              </View>
            </View>
          ) : null}
          {subLabel ? (
            <View style={styles.subRow}>
              <Text style={styles.priceSub}>{subLabel}</Text>
            </View>
          ) : null}
          {saveLabel ? (
            <View style={styles.subRow}>
              <Text style={styles.priceSave}>{saveLabel}</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.divider} />
        <View style={styles.featureList}>
          {plan.summary.map((feature, index) => (
            <View key={index} style={styles.featureRow}>
              <View style={styles.featureIcon}>
                <MaterialCommunityIcons name="check-circle" size={20} color={MD3_COLORS.primary} />
              </View>
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>
        <View style={styles.planActions}>
          <TouchableOpacity style={[styles.outlinedButton, disabled && styles.buttonDisabled]} onPress={() => onShowDetails?.(plan)} activeOpacity={0.8}>
            <Text style={styles.outlinedButtonText}>Chi tiết</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filledButton, disabled && styles.buttonDisabled]}
            onPress={() => !disabled && onRegister?.(plan)}
            activeOpacity={0.9}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={disabled}
          >
            <Text style={styles.filledButtonText}>Chọn gói này</Text>
            <MaterialIcons name="arrow-forward" size={18} color={MD3_COLORS.onPrimary} />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

const CardMembershipScreen = ({ navigation }) => {
  const scrollViewRef = useRef(null);
  const [billingCycle, setBillingCycle] = useState('quarter'); // month | quarter | year
  const [currentMembership, setCurrentMembership] = useState(null);
  const [currentPlanPrice, setCurrentPlanPrice] = useState(0);
  const [currentTier, setCurrentTier] = useState(null);
  const [quotes, setQuotes] = useState({});
  const [planIdMap, setPlanIdMap] = useState({});
  const cycleOptions = useMemo(
    () => [
      { id: 'month', label: 'Tháng', discount: 0 },
      { id: 'quarter', label: 'Quý', discount: 20 },
      { id: 'year', label: 'Năm', discount: 50 },
    ],
    [],
  );

  useEffect(() => {
    const fetchMembership = async () => {
      try {
        // Fetch backend packages to map IDs
        const packagesRes = await getAllPackages().catch(() => []);
        const packages = packagesRes?.data || packagesRes || [];
        const newMap = {};
        if (Array.isArray(packages)) {
          packages.forEach(pkg => {
            const localPlan = membershipPlans.find(
              p => p.id === pkg.slug || p.id === pkg.id || p.name.toLowerCase() === (pkg.name || '').toLowerCase(),
            );
            if (localPlan) {
              newMap[localPlan.id] = pkg._id || pkg.id;
            }
          });
          setPlanIdMap(newMap);
        }

        // Ưu tiên endpoint membership
        let res = await getMembershipInfo().catch(() => null);
        let normalized = normalizeMembership(res?.membership || res?.data || res);

        if (!normalized) {
          res = await getUserMe().catch(() => null);
          normalized = normalizeMembership(res?.user || res?.data || res);
        }

        if (!normalized) {
          res = await getProfile().catch(() => null);
          normalized = normalizeMembership(res?.user || res?.data || res);
        }

        setCurrentMembership(normalized);
        if (normalized) {
          const resolvedPlan =
            membershipPlans.find(p => p.id === normalized.packageId) ||
            membershipPlans.find(
              p => p.name?.toLowerCase() === (normalized.packageName || '').toLowerCase(),
            );
          setCurrentPlanPrice(resolvedPlan?.basePrice || 0);
          setCurrentTier(
            normalized?.packageTier ||
              normalized?.roleTier ||
              resolvedPlan?.tier ||
              null,
          );
        } else {
          setCurrentPlanPrice(0);
          setCurrentTier(null);
        }
      } catch (e) {
        setCurrentMembership(null);
        setCurrentPlanPrice(0);
        setCurrentTier(null);
      }
    };

    fetchMembership();
  }, []);
  useEffect(() => {
    let isMounted = true;

    const fetchQuotes = async () => {
      if (!currentMembership) {
        if (isMounted) setQuotes({});
        return;
      }

      const newQuotes = {};
      await Promise.all(
        membershipPlans.map(async plan => {
          // Skip fetching quote for lower tiers (downgrade) to avoid 400 error
          if (currentTier != null && plan.tier < currentTier) {
            return;
          }

          try {
            const realId = planIdMap[plan.id] || plan.id;
            const quote = await getMembershipUpgradeQuote({
              packageId: realId,
              billingCycle,
            });
            if (quote) {
              newQuotes[plan.id] = quote;
            }
          } catch (e) {
            // Ignore errors
          }
        }),
      );
      
      if (isMounted) {
        setQuotes(newQuotes);
      }
    };

    fetchQuotes();

    return () => {
      isMounted = false;
    };
  }, [currentMembership, billingCycle, currentTier, planIdMap]);

  const handleContactPress = () => Linking.openURL(`tel:${CONTACT_PHONE}`).catch(() => undefined);

  const handleShowDetails = plan => navigation.navigate('CardMembershipDetail', { planId: plan?.id });

  const priceForPlan = plan => {
    const quote = quotes[plan.id];
    const cycleCfg = cycleMultipliers[billingCycle] || cycleMultipliers.month;
    
    let priceNumber = computeCyclePrice(plan.basePrice, billingCycle);
    
    // Use quote if available
    if (quote && typeof quote.amountDue === 'number') {
      priceNumber = quote.amountDue;
    }

    const perMonth = Math.round(priceNumber / cycleCfg.months);
    const saved = plan.basePrice * cycleCfg.months - priceNumber;
    const label = `${formatCurrency(priceNumber)}/${cycleCfg.months === 1 ? 'tháng' : `${cycleCfg.months} tháng`}`;
    const discount = cycleCfg.discount ? `-${cycleCfg.discount * 100}%` : null;
    const subLabel = `Bình quân: ${formatCurrency(perMonth)}/tháng`;
    
    let saveLabel = saved > 0 ? `Tiết kiệm ${formatCurrency(saved)}` : null;
    if (quote && quote.creditValue > 0) {
      saveLabel = `Đã trừ ${formatCurrency(quote.creditValue)} từ gói cũ`;
    }

    return {
      number: priceNumber,
      label,
      discount,
      perMonth,
      subLabel,
      saveLabel,
    };
  };

  const getPlanTier = plan => plan?.tier || null;

  const getRemainingDays = (membership) => {
    if (!membership?.endDate) return 0;
    const end = new Date(membership.endDate);
    const now = new Date();
    if (end < now) return 0;
    const diffTime = end - now;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getDurationDays = (cycle) => {
    if (cycle === 'year') return 365;
    if (cycle === 'quarter') return 90;
    return 30;
  };

  const handleRegister = async (plan) => {
    const targetTier = getPlanTier(plan);
    const isDowngradeTier =
      currentTier != null && targetTier != null && targetTier < currentTier;
    
    if (isDowngradeTier) {
      Alert.alert('Không thể hạ gói', 'Bạn đang ở gói cao hơn. Vui lòng chọn gói ngang hoặc cao hơn.');
      return;
    }

    // Identify Case
    const currentPlanId = membershipPlans.find(p => p.id === currentMembership?.packageId || p.name.toLowerCase() === (currentMembership?.packageName || '').toLowerCase())?.id;
    const isRenewal = currentMembership && currentPlanId === plan.id;

    if (isRenewal) {
      // Case A: Renewal
      proceedToPayment(plan, { isUpgrade: false, isTemporary: false });
      return;
    }

    // Case B & C: Upgrade
    const remainingDays = getRemainingDays(currentMembership);
    const targetDays = getDurationDays(billingCycle);

    // Check for Temporary Trial condition: Target Duration < Current Remaining Days
    // And must be an upgrade tier (implied by !isRenewal and !isDowngradeTier, but good to check)
    if (remainingDays > targetDays && targetTier > (currentTier || 0)) {
      Alert.alert(
        'Lựa chọn nâng cấp',
        `Bạn đang còn ${remainingDays} ngày gói hiện tại. Bạn muốn nâng cấp vĩnh viễn hay chỉ mua trải nghiệm ${targetDays} ngày gói ${plan.name}?`,
        [
          {
            text: 'Mua trải nghiệm',
            onPress: () => proceedToPayment(plan, { isUpgrade: true, isTemporary: true })
          },
          {
            text: 'Nâng cấp vĩnh viễn',
            onPress: () => proceedToPayment(plan, { isUpgrade: true, isTemporary: false })
          }
        ]
      );
    } else {
      // Case B: Permanent Upgrade (or new purchase)
      proceedToPayment(plan, { isUpgrade: true, isTemporary: false });
    }
  };

  const proceedToPayment = async (plan, { isUpgrade, isTemporary }) => {
    const pricing = priceForPlan(plan);
    try {
      const realId = planIdMap[plan.id] || plan.id;
      let quote = null;
      
      // Only fetch quote if it's an upgrade or new purchase to get credit value
      // For renewal, we might just use base price, but fetching quote is safer if backend supports it
      try {
        quote = await getMembershipUpgradeQuote({
          packageId: realId,
          billingCycle,
        });
      } catch (e) {
        console.warn('Failed to fetch quote in proceedToPayment', e);
      }

      // Extract real ObjectId from quote if available to avoid CastError on backend
      const finalPackageId = quote?.packageId || quote?.package?._id || quote?.id || realId;

      let amountDue = quote?.amountDue ?? pricing.number;
      let creditValue = quote?.creditValue ?? 0;

      // For Renewal, force credit to 0 if backend returns weird data (optional safety)
      if (!isUpgrade && !isTemporary) {
        // amountDue should be the full price for renewal
        // creditValue should be 0
        // But let's trust the quote if it exists, otherwise fallback
      }

      navigation.navigate('PaymentMethod', {
        plan: {
          ...plan,
          id: finalPackageId,
          billingCycle,
          amountDue,
          creditValue,
          isUpgrade,
          isTemporary,
          priceLabel: pricing.label,
        },
        quote,
      });
    } catch (error) {
      const rawMessage = error?.response?.data?.message || error?.message || '';
      Alert.alert('Không thể mua/nâng cấp', rawMessage || 'Vui lòng thử lại.');
    }
  };

  const handleStatPress = (statType) => {
    const messages = {
      branches: '20+ chi nhánh GymXFit trải dài khắp cả nước:\n\n• Hà Nội: 8 chi nhánh\n• TP.HCM: 10 chi nhánh\n• Đà Nẵng: 3 chi nhánh\n• Các tỉnh khác: 5+ chi nhánh\n\nTất cả đều mở cửa 24/7!',
      trainers: '50+ lớp học đa dạng:\n\n• Yoga & Pilates\n• HIIT & Cardio\n• Dance Fitness\n• Strength Training\n• Spinning & Cycling\n\nLịch linh hoạt từ sáng đến tối!',
      freeze: 'Mở cửa 24/7 tại hầu hết chi nhánh:\n\n• Tự do lịch trình\n• Tập bất kỳ lúc nào\n• Thiết bị hiện đại\n• An toàn 24/7\n\nLiên hệ chi nhánh cụ thể để biết chi tiết!',
    };
    Alert.alert('Chi tiết', messages[statType]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={MD3_COLORS.surface} />
      
      <View style={styles.topAppBar}>
        <TouchableOpacity style={styles.appBarButton} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <MaterialIcons name="arrow-back" size={24} color={MD3_COLORS.onBackground} />
        </TouchableOpacity>
        <Text style={styles.appBarTitle}>Gói dịch vụ</Text>
        <TouchableOpacity style={styles.appBarButton} onPress={() => navigation.navigate('MembershipFAQ')} activeOpacity={0.7}>
          <MaterialIcons name="info-outline" size={24} color={MD3_COLORS.onBackground} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        ref={scrollViewRef}
        contentContainerStyle={styles.content} 
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        <View style={styles.heroSection}>
          <View style={styles.heroCard}>
            <View style={styles.heroContent}>
              <View style={styles.heroLabel}>
                <MaterialCommunityIcons name="star-circle" size={16} color={MD3_COLORS.onPrimary} />
                <Text style={styles.heroLabelText}>GYMXFIT PASS</Text>
              </View>
              <Text style={styles.heroTitle}>Chọn gói phù hợp với bạn</Text>
              <Text style={styles.heroSubtitle}>Tập không giới hạn tại 20+ chi nhánh toàn quốc</Text>
            </View>
            <View style={styles.statsGrid}>
              <TouchableOpacity style={styles.statCard} onPress={() => handleStatPress('branches')} activeOpacity={0.7}>
                <MaterialIcons name="place" size={20} color={MD3_COLORS.onPrimaryContainer} />
                <Text style={styles.statValue}>20+</Text>
                <Text style={styles.statLabel}>Chi nhánh</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.statCard} onPress={() => handleStatPress('trainers')} activeOpacity={0.7}>
                <MaterialCommunityIcons name="arm-flex" size={20} color={MD3_COLORS.onPrimaryContainer} />
                <Text style={styles.statValue}>50+</Text>
                <Text style={styles.statLabel}>Lớp học</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.statCard} onPress={() => handleStatPress('freeze')} activeOpacity={0.7}>
                <MaterialIcons name="access-time" size={20} color={MD3_COLORS.onPrimaryContainer} />
                <Text style={styles.statValue}>24/7</Text>
                <Text style={styles.statLabel}>Mở cửa</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tiện ích đặc biệt</Text>
          <SpecialUtilities items={serviceHighlights} />
        </View>

        <View style={styles.plansHeader}>
          <View>
            <Text style={styles.sectionTitle}>Gói thành viên</Text>
            <Text style={styles.sectionDescription}>So sánh và chọn gói phù hợp với mục tiêu</Text>
          </View>
        </View>

        <View style={styles.cycleSelector}>
          {cycleOptions.map(option => {
            const active = option.id === billingCycle;
            return (
              <TouchableOpacity
                key={option.id}
                style={[styles.cycleChip, active && styles.cycleChipActive]}
                onPress={() => setBillingCycle(option.id)}
                activeOpacity={0.85}
              >
                <Text style={[styles.cycleChipText, active && styles.cycleChipTextActive]}>
                  {option.label}
                </Text>
                {option.discount ? (
                  <View style={styles.cycleBadge}>
                    <Text style={styles.cycleBadgeText}>-{option.discount}%</Text>
                  </View>
                ) : null}
              </TouchableOpacity>
            );
          })}
        </View>

        {membershipPlans
          .filter(plan => {
            const targetTier = getPlanTier(plan);
            if (currentTier != null && targetTier != null && targetTier < currentTier) {
              return false; // ẩn gói tier thấp hơn
            }
            return true;
          })
          .map(plan => (
            <MembershipCard
              key={plan.id}
              plan={plan}
              priceLabel={priceForPlan(plan).label}
              discountLabel={priceForPlan(plan).discount ? priceForPlan(plan).discount : null}
              subLabel={priceForPlan(plan).subLabel}
              saveLabel={priceForPlan(plan).saveLabel}
              onShowDetails={handleShowDetails}
              onRegister={handleRegister}
            />
          ))}

        <View style={styles.supportCard}>
          <View style={styles.supportIcon}>
            <MaterialCommunityIcons name="headset" size={32} color={MD3_COLORS.primary} />
          </View>
          <View style={styles.supportContent}>
            <Text style={styles.supportTitle}>Cần tư vấn chi tiết?</Text>
            <Text style={styles.supportDescription}>Đội ngũ chuyên gia sẵn sàng hỗ trợ bạn chọn gói phù hợp nhất</Text>
          </View>
          <TouchableOpacity style={styles.filledTonalButton} onPress={handleContactPress} activeOpacity={0.9}>
            <MaterialIcons name="phone" size={18} color={MD3_COLORS.onSecondaryContainer} />
            <Text style={styles.filledTonalButtonText}>Liên hệ ngay</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default CardMembershipScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: MD3_COLORS.background },
  topAppBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: MD3_COLORS.surface, paddingHorizontal: 4, paddingVertical: 8, height: 64, ...MD3_ELEVATION.level0 },
  appBarButton: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  appBarTitle: { ...MD3_TYPE.titleLarge, color: MD3_COLORS.onBackground, flex: 1, textAlign: 'center' },
  content: { paddingBottom: 24 },
  heroSection: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  heroCard: { backgroundColor: MD3_COLORS.primary, borderRadius: 28, padding: 24, ...MD3_ELEVATION.level1 },
  heroContent: { marginBottom: 20 },
  heroLabel: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  heroLabelText: { ...MD3_TYPE.labelMedium, color: MD3_COLORS.onPrimary, letterSpacing: 1.2 },
  heroTitle: { ...MD3_TYPE.headlineMedium, color: MD3_COLORS.onPrimary, marginBottom: 8 },
  heroSubtitle: { ...MD3_TYPE.bodyMedium, color: MD3_COLORS.onPrimary, opacity: 0.9 },
  statsGrid: { flexDirection: 'row', gap: 12 },
  statCard: { flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.15)', borderRadius: 16, padding: 12, alignItems: 'center', gap: 4 },
  statValue: { ...MD3_TYPE.titleLarge, color: MD3_COLORS.onPrimary },
  statLabel: { ...MD3_TYPE.bodySmall, color: MD3_COLORS.onPrimary, opacity: 0.8, marginTop: 4, textAlign: 'center' },
  section: { paddingHorizontal: 16, paddingTop: 24 },
  sectionTitle: { ...MD3_TYPE.titleLarge, color: MD3_COLORS.onBackground, marginBottom: 4 },
  sectionDescription: { ...MD3_TYPE.bodyMedium, color: MD3_COLORS.textSecondary },
  cycleSelector: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 8 },
  cycleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: MD3_COLORS.outlineVariant,
    backgroundColor: MD3_COLORS.surface,
    gap: 8,
  },
  cycleChipActive: { borderColor: MD3_COLORS.primary, backgroundColor: MD3_COLORS.primary + '15' },
  cycleChipText: { ...MD3_TYPE.labelLarge, color: MD3_COLORS.onSurface },
  cycleChipTextActive: { color: MD3_COLORS.primary, fontWeight: '700' },
  cycleBadge: { backgroundColor: '#FFECE5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  cycleBadgeText: { color: '#C2410C', fontWeight: '800', fontSize: 12 },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 16 },
  chip: { flexDirection: 'row', alignItems: 'center', backgroundColor: MD3_COLORS.surfaceContainerHigh, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12, gap: 8 },
  chipPressed: { backgroundColor: MD3_COLORS.surfaceContainerHighest },
  chipIconContainer: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  chipText: { ...MD3_TYPE.labelMedium, color: MD3_COLORS.onSurfaceVariant },
  plansHeader: { paddingHorizontal: 16, paddingTop: 32, paddingBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  planCard: { marginHorizontal: 16, marginVertical: 12 },
  planCardInner: { backgroundColor: MD3_COLORS.surface, borderRadius: 20, padding: 20, ...MD3_ELEVATION.level2 },
  cardDisabled: { opacity: 0.4 },
  cardInnerDisabled: { backgroundColor: MD3_COLORS.surfaceContainer, borderWidth: 1, borderColor: MD3_COLORS.outlineVariant },
  planBadge: { alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, marginBottom: 16 },
  planBadgeText: { ...MD3_TYPE.labelSmall, letterSpacing: 0.5, textTransform: 'uppercase' },
  planBadgeTop: { position: 'absolute', top: 12, right: 12, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 4, zIndex: 10, ...MD3_ELEVATION.level1 },
  planBadgeTopText: { ...MD3_TYPE.labelSmall, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
  planHeader: { marginBottom: 16 },
  planName: { ...MD3_TYPE.headlineSmall, color: MD3_COLORS.onSurface, marginBottom: 4 },
  planCaption: { ...MD3_TYPE.bodyMedium, color: MD3_COLORS.textSecondary },
  planImageWrapper: { width: '100%', height: 180, borderRadius: 16, overflow: 'hidden', marginBottom: 16 },
  planImage: { width: '100%', height: '100%' },
 priceContainer: { marginBottom: 16 },
  planPrice: { ...MD3_TYPE.headlineMedium, color: MD3_COLORS.primary },
  subRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  priceSub: { ...MD3_TYPE.bodySmall, color: '#0EA5E9', fontWeight: '700' },
  priceSave: { ...MD3_TYPE.bodySmall, color: '#C2410C', fontWeight: '800' },
  discountPillRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  discountPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#E6F9ED',
    borderWidth: 1,
    borderColor: MD3_COLORS.primary + '55',
  },
  discountText: { color: MD3_COLORS.primary, fontWeight: '800', fontSize: 12 },
  compareSection: { backgroundColor: MD3_COLORS.surfaceContainerLow, borderRadius: 12, padding: 12, marginBottom: 12 },
  compareTitle: { ...MD3_TYPE.labelMedium, color: MD3_COLORS.textPrimary, marginBottom: 8, fontWeight: '600' },
  compareGrid: { flexDirection: 'row', gap: 8 },
  compareItem: { flex: 1, backgroundColor: MD3_COLORS.surface, borderRadius: 8, padding: 8, alignItems: 'center', gap: 4 },
  compareLabel: { ...MD3_TYPE.labelSmall, color: MD3_COLORS.textSecondary, fontSize: 10, textAlign: 'center' },
  compareValue: { ...MD3_TYPE.labelSmall, color: MD3_COLORS.primary, fontSize: 10, fontWeight: '600', textAlign: 'center' },
  divider: { height: 1, backgroundColor: MD3_COLORS.outlineVariant, marginVertical: 16 },
  featureList: { gap: 12, marginBottom: 20 },
  featureRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  featureIcon: { marginTop: 2 },
  featureText: { ...MD3_TYPE.bodyMedium, color: MD3_COLORS.onSurface, flex: 1, lineHeight: 22 },
  planActions: { flexDirection: 'row', gap: 12 },
  filledButton: { flex: 1, backgroundColor: MD3_COLORS.primary, borderRadius: 20, paddingVertical: 14, paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, ...MD3_ELEVATION.level1 },
  filledButtonText: { ...MD3_TYPE.labelLarge, color: MD3_COLORS.onPrimary },
  outlinedButton: { flex: 1, backgroundColor: 'transparent', borderWidth: 1, borderColor: MD3_COLORS.outline, borderRadius: 20, paddingVertical: 14, paddingHorizontal: 24, alignItems: 'center', justifyContent: 'center' },
  buttonDisabled: { opacity: 0.5 },
  outlinedButtonText: { ...MD3_TYPE.labelLarge, color: MD3_COLORS.primary },
  filledTonalButton: { backgroundColor: MD3_COLORS.secondaryContainer, borderRadius: 20, paddingVertical: 14, paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  filledTonalButtonText: { ...MD3_TYPE.labelLarge, color: MD3_COLORS.onSecondaryContainer },
  supportCard: { marginHorizontal: 16, marginTop: 24, backgroundColor: MD3_COLORS.surface, borderRadius: 20, borderWidth: 1, borderColor: MD3_COLORS.outlineVariant, padding: 20, gap: 16, alignItems: 'center' },
  supportIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: MD3_COLORS.primaryContainer, alignItems: 'center', justifyContent: 'center' },
  supportContent: { alignItems: 'center', gap: 8 },
  supportTitle: { ...MD3_TYPE.titleLarge, color: MD3_COLORS.onSurface, textAlign: 'center' },
  supportDescription: { ...MD3_TYPE.bodyMedium, color: MD3_COLORS.textSecondary, textAlign: 'center', lineHeight: 22 },
});
