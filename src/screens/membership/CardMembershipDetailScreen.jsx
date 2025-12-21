import React, { useMemo } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { getPlanById, MEMBERSHIP_CONTACT } from './membershipPlans';

// Material Design 3 Colors
const MD3_COLORS = {
  primary: '#1F8E4A',
  onPrimary: '#FFFFFF',
  primaryContainer: '#C2F0D4',
  onPrimaryContainer: '#00210A',
  surface: '#FFFFFF',
  surfaceContainerLow: '#F3F4F0',
  surfaceContainerHigh: '#E7EBE6',
  background: '#F5F7F6',
  onBackground: '#191C19',
  outline: '#72796F',
  outlineVariant: '#C1C9BF',
  textPrimary: '#10241A',
  textSecondary: '#47614F',
  error: '#BA1A1A',
  success: '#34D399',
  scrim: 'rgba(0, 0, 0, 0.32)',
};

const MD3_TYPE = {
  displaySmall: { fontSize: 36, lineHeight: 44, fontWeight: '600' },
  headlineLarge: { fontSize: 32, lineHeight: 40, fontWeight: '600' },
  headlineMedium: { fontSize: 28, lineHeight: 36, fontWeight: '600' },
  headlineSmall: { fontSize: 24, lineHeight: 32, fontWeight: '600' },
  titleLarge: { fontSize: 22, lineHeight: 28, fontWeight: '700' },
  titleMedium: { fontSize: 16, lineHeight: 24, fontWeight: '600' },
  bodyLarge: { fontSize: 16, lineHeight: 24, fontWeight: '400' },
  bodyMedium: { fontSize: 14, lineHeight: 20, fontWeight: '400' },
  labelLarge: { fontSize: 14, lineHeight: 20, fontWeight: '600' },
  labelMedium: { fontSize: 12, lineHeight: 16, fontWeight: '600' },
};

const MD3_ELEVATION = {
  level0: { shadowColor: 'transparent', shadowOpacity: 0, shadowRadius: 0, elevation: 0 },
  level1: { shadowColor: MD3_COLORS.scrim, shadowOpacity: 0.15, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  level2: { shadowColor: MD3_COLORS.scrim, shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
};

const Section = ({ icon, title, items, iconColor }) => {
  if (!items || !items.length) return null;
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={[styles.sectionIconContainer, { backgroundColor: iconColor + '20' }]}>
          <MaterialCommunityIcons name={icon} size={24} color={iconColor || MD3_COLORS.primary} />
        </View>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <View style={styles.sectionContent}>
        {items.map((item, index) => (
          <View key={index} style={styles.sectionRow}>
            <View style={styles.checkIconContainer}>
              <MaterialIcons name="check-circle" size={20} color={MD3_COLORS.primary} />
            </View>
            <Text style={styles.sectionText}>{item}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const CardMembershipDetailScreen = ({ navigation, route }) => {
  const planId = route?.params?.planId || 'basic';
  const plan = useMemo(() => getPlanById(planId) || getPlanById('basic'), [planId]);

  const handleContact = () => {
    Linking.openURL(`tel:${MEMBERSHIP_CONTACT}`).catch(() => undefined);
  };
  
  const handleRegister = () => {
    // Navigate qua PaymentStack để có context đầy đủ
    navigation.navigate('PaymentStack', {
      screen: 'PaymentMethod',
      params: {
        plan: {
          ...plan,
          id: plan.id || plan.localId, // Đảm bảo có id
          billingCycle: 'quarter', // Mặc định quarter cho detail screen
          amountDue: plan.basePrice * 3, // Tạm tính 3 tháng
          priceLabel: `${(plan.basePrice * 3).toLocaleString()}đ/3 tháng`,
          isUpgrade: false,
          isTemporary: false,
          creditValue: 0
        }
      }
    });
  };

  // Ghép details + perks thành "Bao gồm gì?"
  const allIncludes = useMemo(() => {
    const combined = [...(plan.details || [])];
    if (plan.perks && plan.perks.length > 0) {
      combined.push(...plan.perks);
    }
    return combined;
  }, [plan]);

  if (!plan) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={MD3_COLORS.surface} />
      
      {/* Top App Bar */}
      <View style={styles.topAppBar}>
        <TouchableOpacity 
          style={styles.appBarButton} 
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <MaterialIcons name="arrow-back" size={24} color={MD3_COLORS.onBackground} />
        </TouchableOpacity>
        <Text style={styles.appBarTitle}>{plan.name} Pass</Text>
        <View style={styles.appBarButton} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.content} 
        showsVerticalScrollIndicator={false}
      >
        {/* Badge (separate from the card image) */}
        {plan.id === 'plus' && (
          <View style={styles.badgeRow}>
            <View pointerEvents="none" style={[styles.heroBadgeInline, { backgroundColor: plan.accent }]}> 
              <MaterialIcons name="star" size={16} color={plan.accentText} />
              <Text style={[styles.heroBadgeText, { color: plan.accentText }]}>{plan.badge}</Text>
            </View>
          </View>
        )}

        {/* Hero Image */}
        <View style={styles.heroSection}>
          <Image source={plan.image} style={styles.heroImage} resizeMode="cover" />
        </View>

        {/* Price & Caption */}
        <View style={styles.priceSection}>
          <Text style={styles.planPrice}>{plan.price}</Text>
          <Text style={styles.planCaption}>{plan.caption}</Text>
        </View>

        {/* Summary Highlights */}
        <View style={styles.highlightsCard}>
          <Text style={styles.highlightsTitle}>✨ Điểm nổi bật</Text>
          {plan.summary.map((item, index) => (
            <View key={index} style={styles.highlightRow}>
              <MaterialCommunityIcons name="check-decagram" size={20} color={MD3_COLORS.success} />
              <Text style={styles.highlightText}>{item}</Text>
            </View>
          ))}
        </View>

        {/* Bao gồm gì? */}
        <Section 
          icon="gift" 
          title="Bao gồm gì?" 
          items={allIncludes}
          iconColor={MD3_COLORS.primary}
        />

        {/* Restrictions */}
        {plan.restrictions && plan.restrictions.length > 0 && (
          <Section 
            icon="alert-circle-outline" 
            title="Điều kiện & Hạn chế" 
            items={plan.restrictions}
            iconColor={MD3_COLORS.error}
          />
        )}

        {/* Phù hợp với ai? */}
        <View style={styles.suitableCard}>
          <View style={styles.suitableHeader}>
            <MaterialCommunityIcons name="account-check" size={24} color={MD3_COLORS.primary} />
            <Text style={styles.suitableTitle}>Phù hợp với ai?</Text>
          </View>
          <Text style={styles.suitableText}>
            {plan.id === 'basic' && 'Người mới bắt đầu, chỉ cần dùng thiết bị tự do mà không tham gia lớp nhóm.'}
            {plan.id === 'plus' && 'Hội viên thường xuyên muốn tham gia lớp nhóm, có nhu cầu tập đa dạng và linh hoạt.'}
            {plan.id === 'premium' && 'Những người yêu cầu cao về trải nghiệm, muốn dịch vụ VIP và ưu đãi PT đặc biệt.'}
          </Text>
        </View>

        {/* CTA bar placed at the end of content (not sticky) */}
        <View style={{ height: 16 }} />
        <View style={styles.bottomBar}>
          <TouchableOpacity 
            style={styles.bottomButtonOutlined} 
            onPress={handleContact}
            activeOpacity={0.8}
          >
            <MaterialIcons name="phone" size={20} color={MD3_COLORS.primary} />
            <Text style={styles.bottomButtonOutlinedText}>Gọi tư vấn</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.bottomButtonFilled} 
            onPress={handleRegister}
            activeOpacity={0.9}
          >
            <Text style={styles.bottomButtonFilledText}>Chọn gói này</Text>
            <MaterialIcons name="arrow-forward" size={20} color={MD3_COLORS.onPrimary} />
          </TouchableOpacity>
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default CardMembershipDetailScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MD3_COLORS.background,
  },

  // Top App Bar
  topAppBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: MD3_COLORS.surface,
    paddingHorizontal: 4,
    paddingVertical: 8,
    height: 64,
    ...MD3_ELEVATION.level0,
  },
  appBarButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appBarTitle: {
    ...MD3_TYPE.titleLarge,
    color: MD3_COLORS.onBackground,
    flex: 1,
    textAlign: 'center',
  },

  content: {
    paddingBottom: 24,
  },

  // Hero Section
  heroSection: {
    width: '100%',
    height: 240,
    position: 'relative',
  },
  heroBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    zIndex: 10,
    ...MD3_ELEVATION.level2,
  },
  heroBadgeText: {
    ...MD3_TYPE.labelMedium,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },

  // Inline badge (separate from the image)
  badgeRow: {
    paddingHorizontal: 24,
    marginTop: 36,
    alignItems: 'flex-end',
  },
  heroBadgeInline: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    ...MD3_ELEVATION.level2,
  },

  // Price Section
  priceSection: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    alignItems: 'center',
    backgroundColor: MD3_COLORS.surface,
    marginBottom: 8,
  },
  planPrice: {
    ...MD3_TYPE.displaySmall,
    color: MD3_COLORS.primary,
    marginBottom: 8,
  },
  planCaption: {
    ...MD3_TYPE.bodyLarge,
    color: MD3_COLORS.textSecondary,
    textAlign: 'center',
  },

  // Highlights Card
  highlightsCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: MD3_COLORS.primaryContainer,
    borderRadius: 16,
    padding: 20,
  },
  highlightsTitle: {
    ...MD3_TYPE.titleMedium,
    color: MD3_COLORS.onPrimaryContainer,
    marginBottom: 16,
  },
  highlightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  highlightText: {
    ...MD3_TYPE.bodyMedium,
    color: MD3_COLORS.onPrimaryContainer,
    flex: 1,
    lineHeight: 22,
  },

  // Section
  section: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: MD3_COLORS.surface,
    borderRadius: 16,
    padding: 20,
    ...MD3_ELEVATION.level1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  sectionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    ...MD3_TYPE.titleLarge,
    color: MD3_COLORS.onBackground,
    flex: 1,
  },
  sectionContent: {
    gap: 12,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  checkIconContainer: {
    marginTop: 2,
  },
  sectionText: {
    ...MD3_TYPE.bodyMedium,
    color: MD3_COLORS.textSecondary,
    flex: 1,
    lineHeight: 22,
  },

  // Suitable Card
  suitableCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: MD3_COLORS.surfaceContainerHigh,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: MD3_COLORS.outlineVariant,
  },
  suitableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  suitableTitle: {
    ...MD3_TYPE.titleMedium,
    color: MD3_COLORS.onBackground,
  },
  suitableText: {
    ...MD3_TYPE.bodyMedium,
    color: MD3_COLORS.textSecondary,
    lineHeight: 22,
  },

  // Bottom Bar - placed at end of content (not sticky)
  bottomBar: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: MD3_COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: MD3_COLORS.outlineVariant,
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    ...MD3_ELEVATION.level2,
  },
  bottomButtonOutlined: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: MD3_COLORS.outline,
    borderRadius: 20,
    paddingVertical: 14,
    backgroundColor: MD3_COLORS.surface,
  },
  bottomButtonOutlinedText: {
    ...MD3_TYPE.labelLarge,
    color: MD3_COLORS.primary,
  },
  bottomButtonFilled: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: MD3_COLORS.primary,
    borderRadius: 20,
    paddingVertical: 14,
  },
  bottomButtonFilledText: {
    ...MD3_TYPE.labelLarge,
    color: MD3_COLORS.onPrimary,
  },
});
