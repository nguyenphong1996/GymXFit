import React, { useState, useEffect, useMemo, useRef, useContext } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  Linking,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { membershipPlans, MEMBERSHIP_CONTACT } from './membershipPlans';
import { formatCurrency, computeCyclePrice, cycleMultipliers } from '../../utils/membership';
import { getPermanentUpgradeQuote, getMembershipInfo, getUserMe, getProfile, getAllPackages } from '@api/membershipApi';
import { UserContext } from '@context/UserContext';
import { useToast } from '@context/ToastContext';
import SpecialUtilities from './SpecialUtilities';
import { normalizeMembership } from '../../utils/membership';

// --- (Existing MD3 Tokens and other constants) ---

const PlanCardSkeleton = () => (
  <View style={[styles.planCard, { backgroundColor: MD3_COLORS.surfaceContainer }]}>
    <View style={styles.planCardInner}>
      <View style={{ height: 20, width: '60%', backgroundColor: MD3_COLORS.surfaceContainerHigh, borderRadius: 8, marginBottom: 8 }} />
      <View style={{ height: 16, width: '40%', backgroundColor: MD3_COLORS.surfaceContainerHigh, borderRadius: 8, marginBottom: 16 }} />
      <View style={[styles.planImageWrapper, { backgroundColor: MD3_COLORS.surfaceContainerHigh }]} />
      <View style={{ height: 28, width: '50%', backgroundColor: MD3_COLORS.surfaceContainerHigh, borderRadius: 8, marginBottom: 16 }} />
      <View style={styles.divider} />
      <View style={{ height: 16, width: '80%', backgroundColor: MD3_COLORS.surfaceContainerHigh, borderRadius: 8, marginBottom: 8 }} />
      <View style={{ height: 16, width: '90%', backgroundColor: MD3_COLORS.surfaceContainerHigh, borderRadius: 8, marginBottom: 8 }} />
      <View style={{ height: 16, width: '70%', backgroundColor: MD3_COLORS.surfaceContainerHigh, borderRadius: 8, marginBottom: 20 }} />
      <View style={styles.planActions}>
        <View style={{ height: 48, flex: 1, backgroundColor: MD3_COLORS.surfaceContainerHigh, borderRadius: 20 }} />
        <View style={{ height: 48, flex: 1, backgroundColor: MD3_COLORS.surfaceContainerHigh, borderRadius: 20 }} />
      </View>
    </View>
  </View>
);

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
const MembershipCard = ({ plan, onShowDetails, onRegister, priceLabel, discountLabel, subLabel, saveLabel, disabled, isCurrent }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => Animated.spring(scaleAnim, { toValue: 0.98, useNativeDriver: true }).start();
  const handlePressOut = () => Animated.spring(scaleAnim, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }).start();

  const actualDisabled = disabled; // Disable if explicitly set

  return (
    <Animated.View
      pointerEvents={actualDisabled ? 'none' : 'auto'}
      style={[
        styles.planCard,
        { transform: [{ scale: scaleAnim }] },
        actualDisabled && styles.cardDisabled,
      ]}
    >
      <View style={[styles.planCardInner, actualDisabled && styles.cardInnerDisabled]}>
        {isCurrent && (
          <View style={[styles.planBadgeTop, { backgroundColor: MD3_COLORS.primary, right: 12 }]}>
            <MaterialCommunityIcons name="crown" size={14} color={MD3_COLORS.onPrimary} />
            <Text style={[styles.planBadgeTopText, { color: MD3_COLORS.onPrimary }]}>Gói hiện tại của bạn</Text>
          </View>
        )}
        {plan.id === 'plus' && !isCurrent && (
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
          <TouchableOpacity style={[styles.outlinedButton, actualDisabled && styles.buttonDisabled]} onPress={() => onShowDetails?.(plan)} activeOpacity={0.8}>
            <Text style={styles.outlinedButtonText}>Chi tiết</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filledButton, actualDisabled && styles.buttonDisabled]}
            onPress={() => !actualDisabled && onRegister?.(plan)}
            activeOpacity={0.9}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={actualDisabled}
          >
            <Text style={styles.filledButtonText}>{isCurrent ? 'Gia hạn' : 'Chọn gói này'}</Text>
            {!isCurrent && <MaterialIcons name="arrow-forward" size={18} color={MD3_COLORS.onPrimary} />}
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

const CardMembershipScreen = ({ navigation }) => {
  const { user } = useContext(UserContext); // Get user from Context
  const { showToast } = useToast(); // Get toast function
  const scrollViewRef = useRef(null);
  const [billingCycle, setBillingCycle] = useState('quarter'); // month | quarter | year
  const [currentMembership, setCurrentMembership] = useState(null);
  const [currentTier, setCurrentTier] = useState(null);
  const [displayedPlans, setDisplayedPlans] = useState([]);
  const [permanentQuotes, setPermanentQuotes] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [upgradeModalVisible, setUpgradeModalVisible] = useState(false);
  const [upgradeModalData, setUpgradeModalData] = useState(null);
  const [freeUpgradeConfirmVisible, setFreeUpgradeConfirmVisible] = useState(false);
  const [freeUpgradeConfirmData, setFreeUpgradeConfirmData] = useState(null);
  const cycleOptions = useMemo(
    () => [
      { id: 'month', label: 'Tháng', discount: 0 },
      { id: 'quarter', label: 'Quý', discount: 20 },
      { id: 'year', label: 'Năm', discount: 50 },
    ],
    [],
  );

  useEffect(() => {
    const fetchAndProcessData = async () => {
      setIsLoading(true);
      if (!user) {
        setCurrentTier(null);
        setCurrentMembership(null);
        setPermanentQuotes({});
        setIsLoading(false);
        return;
      }

      try {
        const packagesRes = await getAllPackages();
        console.log('[DEBUG] packagesRes structure:', {
          hasData: !!packagesRes?.data,
          hasSuccess: !!packagesRes?.data?.success,
          dataArray: Array.isArray(packagesRes?.data?.data),
          dataLength: packagesRes?.data?.data?.length,
          data: packagesRes?.data
        });
        
        // Fix: Extract correct data structure from backend response
        let backendPackages = [];
        if (packagesRes?.data?.success && Array.isArray(packagesRes?.data?.data)) {
          backendPackages = packagesRes.data.data;
        } else if (Array.isArray(packagesRes?.data)) {
          backendPackages = packagesRes.data;
        } else if (Array.isArray(packagesRes)) {
          backendPackages = packagesRes;
        } else {
          console.warn('[DEBUG] Unexpected packages response structure');
          backendPackages = [];
        }
        
        console.log('[DEBUG] Extracted backend packages count:', backendPackages.length);
        
        // Merge backend data with local static data
        console.log('[DEBUG] Backend packages names:', backendPackages.map(p => p.name));
        console.log('[DEBUG] Local plan names:', membershipPlans.map(p => p.name));
        
        // Debug each package individually
        backendPackages.forEach((pkg, index) => {
          console.log(`[DEBUG] Backend package ${index}:`, {
            name: pkg.name,
            type: typeof pkg.name,
            length: pkg.name?.length,
            _id: pkg._id,
            price: pkg.price
          });
        });
        
        // FALLBACK: If merge fails, use direct mapping approach
        let mergedPlans = [];
        
        try {
          mergedPlans = backendPackages
            .map(pkg => {
              console.log(`[DEBUG] Looking for local plan matching: '${pkg.name}'`);
              
              // More detailed matching logic
              const localPlan = membershipPlans.find(p => {
                const isMatch = p.name.toLowerCase() === (pkg.name || '').toLowerCase();
                console.log(`[DEBUG] Comparing: '${p.name}' (${p.name.length}) vs '${pkg.name}' (${pkg.name?.length}) = ${isMatch}`);
                return isMatch;
              });
              
              console.log(`[DEBUG] Found local plan:`, localPlan);
              if (!localPlan) {
                console.log(`[DEBUG] No local plan found for '${pkg.name}', returning null`);
                return null; // Ignore if no local counterpart
              }
              
              const merged = {
                ...localPlan, // static data: images, captions, summary
                ...pkg,       // backend data: price, durationDays, tier
                id: pkg._id,  // IMPORTANT: Overwrite id with backend _id
                localId: localPlan.id, // Keep local id for quotes mapping
              };
              console.log(`[DEBUG] Merged plan for '${pkg.name}':`, {
                id: merged.id,
                localId: merged.localId,
                name: merged.name,
                tier: merged.tier,
                price: merged.price
              });
              return merged;
            })
            .filter(Boolean); // Remove null entries
        } catch (error) {
          console.error('[DEBUG] Merge error:', error);
          // FALLBACK: Manual mapping if automated merge fails
          mergedPlans = backendPackages.map(pkg => {
            const localPlan = membershipPlans.find(p => p.name === pkg.name) || 
                             membershipPlans.find(p => p.name.toLowerCase() === pkg.name?.toLowerCase()) ||
                             membershipPlans[0]; // Fallback to first plan
            
            return {
              ...localPlan,
              ...pkg,
              id: pkg._id,
              localId: localPlan?.id || pkg.name.toLowerCase(),
            };
          });
        }
        
        console.log('[DEBUG] Final mergedPlans count:', mergedPlans.length);
        console.log('[DEBUG] Final mergedPlans:', mergedPlans.map(p => ({ name: p.name, id: p.id, localId: p.localId })));
        
        setDisplayedPlans(mergedPlans);

        const membershipData = user.membership || null;
        setCurrentMembership(membershipData);

        let tier = null;
        if (membershipData && membershipData.packageId && mergedPlans.length > 0) {
          const currentPackageDetails = mergedPlans.find(p => p.id === membershipData.packageId);
          tier = currentPackageDetails?.tier;
        }
        setCurrentTier(tier);

        console.log('[DEBUG] membershipData:', membershipData);
        console.log('[DEBUG] current tier:', tier);
        console.log('[DEBUG] mergedPlans:', mergedPlans);
        
        if (membershipData && tier != null) {
            const newPermanentQuotes = {};

            await Promise.all(
                mergedPlans.map(async (plan) => {
                    console.log(`[DEBUG] Checking plan ${plan.name} - tier: ${plan.tier}, currentTier: ${tier}`);
                    if (plan.tier <= tier) {
                        console.log(`[DEBUG] Skipping plan ${plan.name} (tier <= currentTier)`);
                        return;
                    }
                    console.log(`[DEBUG] Fetching quote for plan ${plan.name}`);
                    try {
                        const permResponse = await getPermanentUpgradeQuote({ packageId: plan.id, billingCycle });
                        console.log(`[DEBUG] Permanent quote response for ${plan.name}:`, permResponse);
                        console.log(`[DEBUG] Full response structure:`, JSON.stringify(permResponse, null, 2));
                        console.log(`[DEBUG] Checking conditions:`);
                        console.log(`  - permResponse exists:`, !!permResponse);
                        console.log(`  - permResponse.ok:`, permResponse?.ok);
                        console.log(`  - permResponse.quote exists:`, !!permResponse?.quote);
                        console.log(`  - permResponse.quote is object:`, typeof permResponse?.quote === 'object');
                        
                        // FIXED: Backend returns response directly, not wrapped in data
                        if (permResponse?.ok && permResponse?.quote) {
                            console.log(`[DEBUG] ✅ Saving permanent quote for ${plan.name}:`, permResponse.quote);
                            newPermanentQuotes[plan.id] = permResponse.quote;
                        } else {
                            console.log(`[DEBUG] ❌ No permanent quote for ${plan.name} - conditions failed`);
                        }
                    } catch (e) {
                        console.error(`Failed to get permanent quote for ${plan.name}:`, e);
                    }

                })
            );

            console.log('[DEBUG] Final permanent quotes:', newPermanentQuotes);

            setPermanentQuotes(newPermanentQuotes);
        } else {
             setPermanentQuotes({});
        }

      } catch (e) {
        showToast({
          type: 'error',
          title: 'Lỗi tải dữ liệu',
          message: 'Không thể tải dữ liệu gói thành viên. Vui lòng thử lại.',
        });
        console.error('Failed to fetch membership data:', e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAndProcessData();
  }, [user, billingCycle]);

  const handleContactPress = () => Linking.openURL(`tel:${CONTACT_PHONE}`).catch(() => undefined);

  const handleShowDetails = plan => navigation.navigate('CardMembershipDetail', { planId: plan?.id });

  const priceForPlan = (plan) => {
    const quote = permanentQuotes[plan.id];
    const cycleCfg = cycleMultipliers[billingCycle] || cycleMultipliers.month;

    console.log(`[DEBUG] priceForPlan for ${plan.id}, quote:`, quote);

    let priceNumber = computeCyclePrice(plan.basePrice, billingCycle);

    // Use quote if available
    let creditValue = quote?.creditValue || 0;
    if (quote && typeof quote.amountDue === 'number') {
      priceNumber = quote.amountDue;
      console.log(`[DEBUG] Using quoted price: ${priceNumber}`);
    } else {
      console.log(`[DEBUG] Using base price: ${priceNumber}`);
    }

    const perMonth = Math.round(priceNumber / cycleCfg.months);
    const originalFullPrice = plan.basePrice * cycleCfg.months;
    const savedAmount = originalFullPrice - priceNumber;

    // If quote has amountDue but no creditValue, calculate it
    if (quote && typeof quote.amountDue === 'number' && quote.amountDue < originalFullPrice && creditValue === 0) {
      creditValue = originalFullPrice - quote.amountDue;
      console.log(`[DEBUG] Calculated creditValue: ${creditValue}`);
    }

    const label = `${formatCurrency(priceNumber)}/${cycleCfg.months === 1 ? 'tháng' : `${cycleCfg.months} tháng`}`;
    const discount = cycleCfg.discount ? `-${cycleCfg.discount * 100}%` : null;
    const subLabel = `Bình quân: ${formatCurrency(perMonth)}/tháng`;

    let saveLabel = null;

    if (priceNumber === 0 && creditValue > 0) {
      saveLabel = 'Miễn phí nâng cấp (từ giá trị gói cũ)';
      console.log(`[DEBUG] Showing free upgrade: ${saveLabel}`);
    } else if (creditValue > 0) {
      saveLabel = `Đã trừ ${formatCurrency(creditValue)} từ gói cũ`;
      console.log(`[DEBUG] Showing credit deduction: ${saveLabel}`);
    } else if (savedAmount > 0) {
      saveLabel = `Tiết kiệm ${formatCurrency(savedAmount)}`;
      console.log(`[DEBUG] Showing cycle discount: ${saveLabel}`);
    }

    return {
      number: priceNumber,
      label,
      discount,
      perMonth,
      subLabel,
      saveLabel,
      creditValue: quote?.creditValue || 0,
      originalPrice: originalFullPrice, // Giá gốc chưa trừ credit
      amountDue: priceNumber, // Giá cần thanh toán sau khi trừ credit
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
    // Map plan với backend data để lấy _id
    const backendPlan = displayedPlans.find(p => p.localId === plan.id || p.name === plan.name);
    const enhancedPlan = backendPlan ? { ...plan, _id: backendPlan._id, id: backendPlan._id } : plan;
    
    console.log('[DEBUG] handleRegister - Original plan:', plan);
    console.log('[DEBUG] handleRegister - Backend plan:', backendPlan);
    console.log('[DEBUG] handleRegister - Enhanced plan:', enhancedPlan);
    
    const targetTier = getPlanTier(enhancedPlan);
    const remainingDays = getRemainingDays(currentMembership);
    const targetDurationDays = getDurationDays(billingCycle);
    const isDowngradeTier = currentTier != null && targetTier != null && targetTier < currentTier;
    
    if (isDowngradeTier) {
      showToast({
        type: 'warning',
        title: 'Không thể hạ gói',
        message: 'Bạn đang ở gói cao hơn. Vui lòng chọn gói ngang hoặc cao hơn.',
      });
      return;
    }

    // So sánh package ID - Support cả backend ID và local ID
    const currentPackageId = currentMembership?.packageId; // Backend ID từ API
    const isRenewal = currentMembership && (
      currentPackageId === enhancedPlan.id ||           // So sánh backend ID
      currentPackageId === enhancedPlan._id ||          // Backup so sánh _id
      currentTier === targetTier                         // Fallback: cùng tier = renewal
    );

    console.log('[DEBUG] Renewal check:', {
      currentPackageId,
      enhancedPlanId: enhancedPlan.id,
      enhancedPlan_Id: enhancedPlan._id,
      currentTier,
      targetTier,
      isRenewal
    });

    // Case: Renewal (cùng gói - cộng dồn thời gian)
    if (isRenewal) {
      console.log('[DEBUG] ✅ Renewal detected - Same tier/package:', { currentTier, targetTier, packageName: enhancedPlan.name });
      proceedToPayment(enhancedPlan, { 
        isUpgrade: false, 
        isTemporary: false, 
        isRenewal: true,  // Flag rõ ràng cho backend
        quoteType: 'permanent' 
      });
      return;
    }

    // Case: New purchase (no active membership or expired)
    if (!currentMembership || currentMembership.status !== 'active' || (currentMembership.endDate && new Date(currentMembership.endDate) < new Date())) {
      proceedToPayment(enhancedPlan, { isUpgrade: false, isTemporary: false, quoteType: 'permanent' });
      return;
    }

    // Case: Upgrade (active membership, higher tier)
    const isUpgrade = currentTier != null && targetTier > currentTier; // Explicitly an upgrade
    if (isUpgrade) {
      const permanentQuote = permanentQuotes[enhancedPlan.id];

      const permanentAmountDue = permanentQuote?.amountDue ?? computeCyclePrice(enhancedPlan.basePrice, billingCycle);
      const permanentCreditValue = permanentQuote?.creditValue || 0;

      const actions = [];

      // Option 1: Permanent Upgrade
      if (permanentQuote) {
        if (permanentAmountDue === 0 && permanentCreditValue > 0) {
          // Special case: Free upgrade due to high credit value
          actions.push({
            text: 'Nâng cấp miễn phí',
            onPress: () => {
              // Hiển thị modal xác nhận
              setFreeUpgradeConfirmData({
                plan: enhancedPlan,
                creditValue: permanentCreditValue,
                message: `Bạn đang có ${formatCurrency(permanentCreditValue)} từ gói Basic hiện tại. Nâng cấp lên gói ${enhancedPlan.name} sẽ miễn phí hoàn toàn!\n\n⚠️ Lưu ý: Gói hiện tại sẽ KHÔNG hoàn trả giá trị chênh lệch còn lại.`
              });
              setFreeUpgradeConfirmVisible(true);
            }
          });
        } else {
          actions.push({
            text: `Nâng cấp vĩnh viễn (+${targetDurationDays} ngày) - ${formatCurrency(permanentAmountDue)}`,
            onPress: () => proceedToPayment(enhancedPlan, { isUpgrade: true, isTemporary: false, quoteType: 'permanent' })
          });
        }
      }

      // Option 2: Temporary Upgrade - Tính chênh lệch giá 2 gói CÙNG CHU KỲ
      // Logic: Giá gói mới (theo cycle) - Giá gói cũ (theo cycle)
      const cycleCfg = cycleMultipliers[billingCycle] || cycleMultipliers.month;
      
      // Tính giá gói đích (có discount)
      const tempTargetPrice = Math.round(enhancedPlan.basePrice * cycleCfg.months * (1 - (cycleCfg.discount || 0)));
      
      // Tìm giá gói hiện tại từ membershipPlans (dùng basePrice local, không dùng backend price)
      const currentPlanLocal = membershipPlans.find(p => 
        p.id === currentMembership?.packageId || 
        p.name?.toLowerCase() === currentMembership?.packageName?.toLowerCase()
      );
      const currentBasePrice = currentPlanLocal?.basePrice || 490000; // Default Basic price
      const currentCyclePrice = Math.round(currentBasePrice * cycleCfg.months * (1 - (cycleCfg.discount || 0)));
      
      // Chênh lệch = Giá gói mới - Giá gói cũ (cùng chu kỳ)
      const tempAmountDue = Math.max(0, tempTargetPrice - currentCyclePrice);
      
      actions.push({
        text: `${billingCycle === 'month' ? 'Tháng' : billingCycle === 'quarter' ? 'Quý' : 'Năm'} - Chênh lệch ${formatCurrency(tempAmountDue)}`,
        onPress: () => proceedToPayment(enhancedPlan, { isUpgrade: true, isTemporary: true, quoteType: 'temporary' })
      });
      
      // Show upgrade options modal
      showUpgradeOptionsModal(enhancedPlan, actions, permanentAmountDue, permanentCreditValue, remainingDays, targetDurationDays);
    } else {
      // Fallback for unexpected cases, treat as permanent upgrade/new purchase
      proceedToPayment(enhancedPlan, { isUpgrade: true, isTemporary: false, quoteType: 'permanent' });
    }
  };

  const proceedToPayment = async (plan, { isUpgrade, isTemporary, isRenewal = false, quoteType }) => {
    console.log('[DEBUG] proceedToPayment - Original plan:', plan);
    console.log('[DEBUG] proceedToPayment - Flags:', { isUpgrade, isTemporary, isRenewal });
    const finalPackageId = plan._id || plan.id; // ALWAYS use backend _id
    console.log('[DEBUG] proceedToPayment - finalPackageId:', finalPackageId);

    let quote = null;
    let amountDue = 0;
    let creditValue = 0;

    if (isUpgrade) {
      if (isTemporary) {
        // Temporary upgrade: Tính chênh lệch giá 2 gói CÙNG CHU KỲ
        const remainingDays = getRemainingDays(currentMembership);
        const targetDurationDays = getDurationDays(billingCycle);
        
        // Tính giá gói đích (có discount)
        const cycleCfg = cycleMultipliers[billingCycle] || cycleMultipliers.month;
        const targetPrice = Math.round(plan.basePrice * cycleCfg.months * (1 - (cycleCfg.discount || 0)));
        
        // Tìm giá gói hiện tại từ membershipPlans (dùng basePrice local)
        const currentPlanLocal = membershipPlans.find(p => 
          p.id === currentMembership?.packageId || 
          p.name?.toLowerCase() === currentMembership?.packageName?.toLowerCase()
        );
        const currentBasePrice = currentPlanLocal?.basePrice || 490000;
        const currentCyclePrice = Math.round(currentBasePrice * cycleCfg.months * (1 - (cycleCfg.discount || 0)));
        
        // Chênh lệch = Giá gói mới - Giá gói cũ (cùng chu kỳ)
        const tempAmountDue = Math.max(0, targetPrice - currentCyclePrice);
        
        quote = {
          amountDue: tempAmountDue,
          creditValue: currentCyclePrice,
          targetPrice: targetPrice,
          currentCyclePrice: currentCyclePrice,
          billingCycle: billingCycle,
          discount: cycleCfg.discount || 0,
          remainingDays: remainingDays,
          durationDays: targetDurationDays,
          isTemporary: true
        };
        
        amountDue = quote.amountDue;
        creditValue = quote.creditValue;
      } else {
        // Permanent upgrade: Use stored quote
        quote = permanentQuotes[plan.id];
        if (quote) {
          amountDue = quote.amountDue;
          creditValue = quote.creditValue;
        } else {
          // Fallback if quote is missing
          const pricing = priceForPlan(plan);
          amountDue = pricing.number;
          creditValue = 0;
        }
      }
    } else {
      const pricing = priceForPlan(plan, quoteType);
      amountDue = pricing.number;
      creditValue = 0;
    }

    const planForNavigation = {
      ...plan,
      _id: finalPackageId, // Pass correct backend ID
      id: finalPackageId, // Keep id for compatibility if other parts use it
      billingCycle,
      amountDue,
      creditValue,
      isUpgrade,
      isTemporary,
      isRenewal,  // Flag rõ ràng: cùng gói → cộng dồn
      currentTier,  // Tier hiện tại (để backend validate)
      targetTier: plan.tier,  // Tier đích (để backend validate)
      priceLabel: formatCurrency(amountDue),
      // Ensure all required fields for PaymentMethodScreen
      localId: plan.localId || plan.id,
      name: plan.name,
      caption: plan.caption,
      badge: plan.badge,
      basePrice: plan.basePrice,
      tier: plan.tier,
      accent: plan.accent,
      accentText: plan.accentText,
      cardColor: plan.cardColor,
      image: plan.image,
      summary: plan.summary,
      quickCompare: plan.quickCompare,
      details: plan.details,
      perks: plan.perks,
      restrictions: plan.restrictions,
      price: plan.price
    };

    console.log('[DEBUG] proceedToPayment - Plan for navigation:', planForNavigation);

    try {
      navigation.navigate('PaymentMethod', {
        plan: planForNavigation,
        quote,
      });
    } catch (error) {
      const rawMessage = error?.response?.data?.message || error?.message || '';
      showToast({
        type: 'error',
        title: 'Không thể mua/nâng cấp',
        message: rawMessage || 'Vui lòng thử lại.',
      });
    }
  };

  const handleStatPress = (statType) => {
    const messages = {
      branches: '20+ chi nhánh GymXFit trải dài khắp cả nước:\n\n• Hà Nội: 8 chi nhánh\n• TP.HCM: 10 chi nhánh\n• Đà Nẵng: 3 chi nhánh\n• Các tỉnh khác: 5+ chi nhánh\n\nTất cả đều mở cửa 24/7!',
      trainers: '50+ lớp học đa dạng:\n\n• Yoga & Pilates\n• HIIT & Cardio\n• Dance Fitness\n• Strength Training\n• Spinning & Cycling\n\nLịch linh hoạt từ sáng đến tối!',
      freeze: 'Mở cửa 24/7 tại hầu hết chi nhánh:\n\n• Tự do lịch trình\n• Tập bất kỳ lúc nào\n• Thiết bị hiện đại\n• An toàn 24/7\n\nLiên hệ chi nhánh cụ thể để biết chi tiết!',
    };
    showToast({
      type: 'info',
      title: 'Chi tiết',
      message: messages[statType].replace(/\\n/g, '\n'),
    });
  };

  const showUpgradeOptionsModal = (plan, actions, permanentAmountDue, permanentCreditValue, remainingDays, targetDurationDays) => {
    setUpgradeModalData({
      plan,
      actions,
      permanentAmountDue,
      permanentCreditValue,
      remainingDays,
      targetDurationDays
    });
    setUpgradeModalVisible(true);
  };

  const UpgradeOptionsModal = () => {
    if (!upgradeModalVisible || !upgradeModalData) return null;

    const { plan, actions, permanentAmountDue, permanentCreditValue, remainingDays } = upgradeModalData;

    return (
      <Modal
        visible={upgradeModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setUpgradeModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Lựa chọn hình thức nâng cấp</Text>
              <TouchableOpacity 
                style={styles.modalClose}
                onPress={() => setUpgradeModalVisible(false)}
              >
                <MaterialIcons name="close" size={24} color={MD3_COLORS.onSurface} />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalSubtitle}>
              Gói hiện tại: {currentMembership?.packageName || 'Basic'} ({remainingDays} ngày còn lại) - <Text style={styles.priceHighlight}>{formatCurrency((currentMembership?.packagePrice || 690000) * remainingDays / 30)} VNĐ</Text>
            </Text>
            <Text style={styles.modalSubtitle}>
              Nâng cấp lên gói: {plan.name}
            </Text>

            <View style={styles.upgradeOptions}>
              {actions.map((action, index) => {
                let optionStyle = styles.upgradeOption;
                let optionTextStyle = styles.upgradeOptionText;
                
                if (action.text.includes('miễn phí')) {
                  optionStyle = [styles.upgradeOption, styles.freeUpgradeOption];
                  optionTextStyle = [styles.upgradeOptionText, styles.freeUpgradeText];
                } else if (action.text.includes('trải nghiệm')) {
                  optionStyle = [styles.upgradeOption, styles.trialUpgradeOption];
                  optionTextStyle = [styles.upgradeOptionText, styles.trialUpgradeText];
                }
                
                return (
                  <TouchableOpacity
                    key={index}
                    style={optionStyle}
                    onPress={() => {
                      setUpgradeModalVisible(false);
                      action.onPress();
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={optionTextStyle}>{action.text}</Text>
                    <MaterialIcons name="chevron-right" size={20} color={MD3_COLORS.onSurface} />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const FreeUpgradeConfirmModal = () => {
    if (!freeUpgradeConfirmVisible || !freeUpgradeConfirmData) return null;

    const { plan, creditValue, message } = freeUpgradeConfirmData;

    return (
      <Modal
        visible={freeUpgradeConfirmVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setFreeUpgradeConfirmVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxWidth: 420 }]}>
            <View style={styles.confirmHeader}>
              <View style={styles.confirmIcon}>
                <MaterialIcons name="info" size={32} color={MD3_COLORS.warning} />
              </View>
              <Text style={styles.confirmTitle}>Xác nhận nâng cấp miễn phí</Text>
              <TouchableOpacity 
                style={styles.modalClose}
                onPress={() => setFreeUpgradeConfirmVisible(false)}
              >
                <MaterialIcons name="close" size={24} color={MD3_COLORS.onSurface} />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.confirmMessage}>{message}</Text>
            
            <View style={styles.confirmActions}>
              <TouchableOpacity
                style={[styles.confirmButton, styles.cancelConfirmButton]}
                onPress={() => setFreeUpgradeConfirmVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelConfirmButtonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButton, styles.acceptConfirmButton]}
                onPress={() => {
                  setFreeUpgradeConfirmVisible(false);
                  showToast({
                    type: 'success',
                    title: 'Nâng cấp Miễn phí',
                    message: `Bạn đang có ${formatCurrency(creditValue)} từ gói Basic hiện tại. Nâng cấp lên gói ${plan.name} sẽ miễn phí hoàn toàn!`,
                  });
                  proceedToPayment(plan, { isUpgrade: true, isTemporary: false, quoteType: 'permanent' });
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.acceptConfirmButtonText}>Đồng ý nâng cấp</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={MD3_COLORS.surface} />
      
      <View style={styles.topAppBar}>
        <TouchableOpacity style={styles.appBarButton} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <MaterialIcons name="arrow-back" size={24} color={MD3_COLORS.onBackground} />
        </TouchableOpacity>
        <Text style={styles.appBarTitle}>GÓI DỊCH VỤ</Text>
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

        {isLoading ? (
          <>
            <PlanCardSkeleton />
            <PlanCardSkeleton />
            <PlanCardSkeleton />
          </>
        ) : (
          membershipPlans
            .filter(plan => {
              const targetTier = getPlanTier(plan);
              if (currentTier != null && targetTier != null && targetTier < currentTier) {
                return false; // hide lower tier packages
              }
              return true;
            })
            .map(plan => {
              const pricing = priceForPlan(plan);
              const isCurrentPlan = currentMembership?.packageId === plan.id;
              return (
                <MembershipCard
                  key={plan.id}
                  plan={plan}
                  priceLabel={pricing.label}
                  discountLabel={pricing.discount}
                  subLabel={pricing.subLabel}
                  saveLabel={pricing.saveLabel}
                  onShowDetails={handleShowDetails}
                  onRegister={handleRegister}
                  isCurrent={isCurrentPlan}
                />
              );
            })
        )}

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
      
      {/* Upgrade Options Modal */}
      <UpgradeOptionsModal />
      
      {/* Free Upgrade Confirmation Modal */}
      <FreeUpgradeConfirmModal />
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
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: MD3_COLORS.surface,
    borderRadius: 20,
    padding: 24,
    margin: 20,
    maxWidth: 400,
    width: '90%',
    ...MD3_ELEVATION.level3,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    ...MD3_TYPE.headlineSmall,
    color: MD3_COLORS.onSurface,
    flex: 1,
  },
  modalClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: MD3_COLORS.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSubtitle: {
    ...MD3_TYPE.bodyMedium,
    color: MD3_COLORS.textSecondary,
    marginBottom: 8,
  },
  upgradeOptions: {
    marginTop: 16,
  },
  upgradeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: MD3_COLORS.surfaceContainerHigh,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  upgradeOptionText: {
    ...MD3_TYPE.bodyLarge,
    color: MD3_COLORS.onSurface,
    fontWeight: '600',
    flex: 1,
  },
  freeUpgradeOption: {
    backgroundColor: MD3_COLORS.primaryContainer,
    borderWidth: 1,
    borderColor: MD3_COLORS.primary,
  },
  freeUpgradeText: {
    color: MD3_COLORS.onPrimaryContainer,
    fontWeight: '700',
  },
  trialUpgradeOption: {
    backgroundColor: MD3_COLORS.secondaryContainer,
    borderWidth: 1,
    borderColor: MD3_COLORS.secondary,
  },
  trialUpgradeText: {
    color: MD3_COLORS.onSecondaryContainer,
    fontWeight: '600',
  },
  cancelOption: {
    backgroundColor: MD3_COLORS.surfaceContainer,
    borderWidth: 1,
    borderColor: MD3_COLORS.outlineVariant,
  },
  cancelText: {
    color: MD3_COLORS.textSecondary,
    fontWeight: '500',
  },
  priceHighlight: {
    color: '#D32F2F',
    fontWeight: '700',
  },
  
  // Confirm Modal Styles
  confirmHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  confirmIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: MD3_COLORS.warning + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  confirmTitle: {
    ...MD3_TYPE.titleMedium,
    color: MD3_COLORS.onSurface,
    textAlign: 'center',
    fontWeight: '600',
    flex: 1,
  },
  confirmMessage: {
    ...MD3_TYPE.bodyMedium,
    color: MD3_COLORS.textSecondary,
    textAlign: 'left',
    lineHeight: 20,
    marginBottom: 20,
    flexWrap: 'wrap',
    flexShrink: 1,
    width: '100%',
  },
  confirmActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelConfirmButton: {
    backgroundColor: MD3_COLORS.surfaceContainer,
    borderWidth: 1,
    borderColor: MD3_COLORS.outlineVariant,
  },
  cancelConfirmButtonText: {
    ...MD3_TYPE.labelLarge,
    color: MD3_COLORS.textSecondary,
    fontWeight: '600',
  },
  acceptConfirmButton: {
    backgroundColor: MD3_COLORS.primary,
  },
  acceptConfirmButtonText: {
    ...MD3_TYPE.labelLarge,
    color: MD3_COLORS.onPrimary,
    fontWeight: '700',
  },
});
