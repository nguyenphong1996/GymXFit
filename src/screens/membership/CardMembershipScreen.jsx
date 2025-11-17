import React from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const PALETTE = {
  primary: '#1F8E4A',
  onPrimary: '#FFFFFF',
  secondary: '#2D4E3B',
  background: '#F6F7F5',
  surface: '#FFFFFF',
  surfaceVariant: '#E3F2E6',
  outline: '#D6E7DA',
  textPrimary: '#10241A',
  textSecondary: '#4A5F52',
  accent: '#30C451',
};

const serviceHighlights = [
  { icon: 'flash-on', label: '24/7 mở cửa' },
  { icon: 'favorite-border', label: 'PT 1-1' },
  { icon: 'monitor-heart', label: 'InBody miễn phí' },
  { icon: 'spa', label: 'Phòng xông hơi' },
];

const membershipPlans = [
  {
    id: 'classic',
    name: 'Classic',
    caption: 'Tập tại 1 CLB yêu thích',
    badge: 'Phổ biến',
    price: '690.000đ/tháng',
    accent: '#FFE4D5',
    accentText: '#C2571A',
    cardColor: '#FDFBF8',
    image: require('@assets/images/cardmemberclassic.png'),
    features: [
      'Không giới hạn buổi tập',
      '01 buổi PT định hướng',
      'Locker cá nhân',
      'Booking lớp nhóm trên app',
    ],
  },
  {
    id: 'classic_plus',
    name: 'Classic Plus',
    caption: 'Truy cập toàn bộ CLB cơ bản',
    badge: 'Ưa chuộng',
    price: '890.000đ/tháng',
    accent: '#E8F4FF',
    accentText: '#0D6EFD',
    cardColor: '#FBFEFF',
    image: require('@assets/images/cardmemberplus.png'),
    features: [
      'Không giới hạn phòng tập',
      '02 buổi PT cá nhân',
      'Xông hơi & khăn tắm',
      'Ưu đãi mua gói PT 10%',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    caption: 'Full access + Privilege Lounge',
    badge: 'VIP',
    price: '1.290.000đ/tháng',
    accent: '#FCE7FF',
    accentText: '#A629C3',
    cardColor: '#FDF8FF',
    image: require('@assets/images/cardmembervip.png'),
    features: [
      'Không giới hạn tất cả CLB',
      '04 buổi PT chuyên sâu',
      'Phòng lounge & dịch vụ đồ uống',
      'Ưu tiên đặt lịch, tặng 1 khách đi kèm',
    ],
  },
];

const ServiceChip = ({ icon, label }) => (
  <View style={styles.chip}>
    <MaterialIcons name={icon} size={18} color={PALETTE.primary} />
    <Text style={styles.chipText}>{label}</Text>
  </View>
);

const MembershipCard = ({ plan }) => (
  <View style={[styles.planCard, { backgroundColor: plan.cardColor }]}>
    <View style={[styles.planBadge, { backgroundColor: plan.accent }]}>
      <Text style={[styles.planBadgeText, { color: plan.accentText }]}>{plan.badge}</Text>
    </View>
    <View style={styles.planHeader}>
      <View>
        <Text style={styles.planName}>{plan.name}</Text>
        <Text style={styles.planCaption}>{plan.caption}</Text>
      </View>
      <Image source={plan.image} style={styles.planImage} resizeMode="contain" />
    </View>
    <Text style={styles.planPrice}>{plan.price}</Text>
    <View style={styles.divider} />
    <View style={styles.featureList}>
      {plan.features.map(feature => (
        <View key={feature} style={styles.featureRow}>
          <MaterialCommunityIcons name="check-circle" size={20} color={PALETTE.primary} />
          <Text style={styles.featureText}>{feature}</Text>
        </View>
      ))}
    </View>
    <View style={styles.planActions}>
      <TouchableOpacity style={styles.secondaryButton}>
        <Text style={styles.secondaryButtonText}>Xem chi tiết</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.primaryButton}>
        <Text style={styles.primaryButtonText}>Đăng ký ngay</Text>
      </TouchableOpacity>
    </View>
  </View>
);

const CardMembershipScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />
      <View style={styles.appBar}>
        <TouchableOpacity style={styles.appBarIcon} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={22} color={PALETTE.onPrimary} />
        </TouchableOpacity>
        <Text style={styles.appBarTitle}>Gói dịch vụ</Text>
        <TouchableOpacity style={styles.appBarIcon}>
          <MaterialIcons name="help-outline" size={22} color={PALETTE.onPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <View style={styles.heroContent}>
            <Text style={styles.heroEyebrow}>GymXFit Pass</Text>
            <Text style={styles.heroTitle}>Chọn gói tập {`\n`}phù hợp lộ trình của bạn</Text>
            <Text style={styles.heroSubtitle}>
              Minh bạch giá • Linh hoạt thanh toán • Hỗ trợ PT tận nơi
            </Text>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>CLB toàn quốc</Text>
              <Text style={styles.statValue}>20+</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>PT đồng hành</Text>
              <Text style={styles.statValue}>50+</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Ưu đãi bảo lưu</Text>
              <Text style={styles.statValue}>45 ngày</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Tiện ích đi kèm</Text>
          <View style={styles.chipWrap}>
            {serviceHighlights.map(highlight => (
              <ServiceChip key={highlight.label} icon={highlight.icon} label={highlight.label} />
            ))}
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionLabel}>Gói tập nổi bật</Text>
            <Text style={styles.sectionDescription}>
              So sánh quyền lợi và chọn mức giá phù hợp nhu cầu của bạn
            </Text>
          </View>
          <TouchableOpacity style={styles.linkButton}>
            <Text style={styles.linkButtonText}>Xem bảng giá</Text>
            <MaterialIcons name="chevron-right" size={18} color={PALETTE.primary} />
          </TouchableOpacity>
        </View>

        {membershipPlans.map(plan => (
          <MembershipCard key={plan.id} plan={plan} />
        ))}

        <View style={styles.supportCard}>
          <View style={styles.supportHeader}>
            <MaterialCommunityIcons
              name="account-tie-voice"
              size={28}
              color={PALETTE.primary}
            />
            <Text style={styles.sectionLabel}>Cần tư vấn chi tiết?</Text>
          </View>
          <Text style={styles.sectionDescription}>
            Đội ngũ GymXFit sẽ hỗ trợ bạn chọn lộ trình, thiết kế giáo án và tư vấn thanh toán chỉ
            trong 5 phút.
          </Text>
          <TouchableOpacity style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Liên hệ ngay</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default CardMembershipScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PALETTE.background,
  },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: PALETTE.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  appBarIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  appBarTitle: {
    color: PALETTE.onPrimary,
    fontWeight: '700',
    fontSize: 18,
  },
  content: {
    paddingBottom: 40,
  },
  heroCard: {
    backgroundColor: PALETTE.primary,
    margin: 20,
    borderRadius: 24,
    padding: 24,
    gap: 18,
  },
  heroContent: {
    gap: 8,
  },
  heroEyebrow: {
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontSize: 12,
  },
  heroTitle: {
    color: PALETTE.onPrimary,
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 32,
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 15,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
  statValue: {
    color: PALETTE.onPrimary,
    fontWeight: '700',
    fontSize: 18,
    marginTop: 4,
  },
  section: {
    marginHorizontal: 20,
    marginTop: 12,
  },
  sectionHeader: {
    marginHorizontal: 20,
    marginTop: 28,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  sectionLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: PALETTE.textPrimary,
  },
  sectionDescription: {
    color: PALETTE.textSecondary,
    fontSize: 14,
    marginTop: 4,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.surface,
    borderColor: PALETTE.outline,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 8,
  },
  chipText: {
    color: PALETTE.textPrimary,
    fontWeight: '500',
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  linkButtonText: {
    color: PALETTE.primary,
    fontWeight: '600',
    marginRight: 2,
  },
  planCard: {
    marginHorizontal: 20,
    marginVertical: 12,
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  planBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  planBadgeText: {
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  planName: {
    fontSize: 22,
    fontWeight: '700',
    color: PALETTE.textPrimary,
  },
  planCaption: {
    color: PALETTE.textSecondary,
    marginTop: 4,
  },
  planImage: {
    width: 120,
    height: 80,
  },
  planPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: PALETTE.secondary,
    marginTop: 12,
  },
  divider: {
    height: 1,
    backgroundColor: PALETTE.outline,
    marginVertical: 16,
  },
  featureList: {
    gap: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureText: {
    color: PALETTE.textPrimary,
    flex: 1,
    fontSize: 15,
  },
  planActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: PALETTE.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: PALETTE.onPrimary,
    fontWeight: '700',
  },
  secondaryButton: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: PALETTE.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: PALETTE.primary,
    fontWeight: '700',
  },
  supportCard: {
    margin: 20,
    backgroundColor: PALETTE.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: PALETTE.outline,
    gap: 12,
  },
  supportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
});
