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

const THEME = {
  primary: '#2F5D44',
  onPrimary: '#FFFFFF',
  background: '#F6F2EB',
  surface: '#FFFFFF',
  textPrimary: '#1F2A24',
  textSecondary: '#59665E',
  outline: '#D8CEC2',
};

const Section = ({ icon, title, items }) => {
  if (!items || !items.length) return null;
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <MaterialCommunityIcons name={icon} size={20} color={THEME.primary} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {items.map(item => (
        <View key={item} style={styles.sectionRow}>
          <MaterialIcons name="check" size={18} color={THEME.primary} />
          <Text style={styles.sectionText}>{item}</Text>
        </View>
      ))}
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
    Alert.alert('Đang phát triển', 'Đăng ký trực tuyến sẽ được cập nhật trong phiên bản tới.');
  };

  if (!plan) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={THEME.background} />
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={22} color={THEME.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{plan.name} Pass</Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.heroCard, { backgroundColor: plan.cardColor }]}>
          <View style={styles.planBadge}>
            <Text style={[styles.planBadgeText, { color: plan.accentText || '#1F8E4A' }]}>
              {plan.badge}
            </Text>
          </View>
          <View style={styles.heroBody}>
            <View style={styles.heroTextBlock}>
              <Text style={styles.heroName}>{plan.name}</Text>
              <Text style={styles.heroCaption}>{plan.caption}</Text>
              <Text style={styles.heroPrice}>{plan.price}</Text>
            </View>
            <View style={styles.heroImageWrapper}>
              <Image source={plan.image} style={styles.heroImage} resizeMode="contain" />
            </View>
          </View>
        </View>

        <Section icon="star-circle" title="Quyền lợi nổi bật" items={plan.summary} />
        <Section icon="format-list-bulleted" title="Chi tiết quyền lợi" items={plan.details} />
        <Section icon="shield-check" title="Tiện ích kèm theo" items={plan.perks} />
        <Section icon="alert-circle" title="Lưu ý & Giới hạn" items={plan.restrictions} />

        <View style={styles.contactCard}>
          <Text style={styles.contactTitle}>Muốn đăng ký ngay?</Text>
          <Text style={styles.contactDescription}>
            Nhấn nút bên dưới hoặc gọi hotline {MEMBERSHIP_CONTACT} để gặp nhân viên GymXFit.
          </Text>
          <View style={styles.ctaRow}>
            <TouchableOpacity style={styles.ctaOutlined} onPress={handleContact}>
              <Text style={styles.ctaOutlinedText}>Gọi hotline</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.ctaContained} onPress={handleRegister}>
              <MaterialIcons name="shopping-cart" size={18} color="#fff" />
              <Text style={styles.ctaContainedText}>Đăng ký ngay</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default CardMembershipDetailScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: THEME.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: THEME.outline,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(47, 93, 68, 0.08)',
  },
  headerTitle: {
    color: THEME.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  content: {
    paddingBottom: 48,
  },
  heroCard: {
    margin: 20,
    borderRadius: 20,
    padding: 20,
  },
  planBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  planBadgeText: {
    fontWeight: '700',
    fontSize: 12,
    textTransform: 'uppercase',
  },
  heroBody: {
    marginTop: 12,
    gap: 14,
  },
  heroTextBlock: {
    flex: 1,
    paddingRight: 12,
    gap: 6,
  },
  heroName: {
    fontSize: 24,
    fontWeight: '700',
    color: THEME.textPrimary,
  },
  heroCaption: {
    color: THEME.textSecondary,
  },
  heroPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: THEME.primary,
    marginTop: 8,
  },
  heroImageWrapper: {
    width: '100%',
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: THEME.surface,
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.textPrimary,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 8,
  },
  sectionText: {
    flex: 1,
    color: THEME.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  contactCard: {
    marginHorizontal: 20,
    marginTop: 4,
    backgroundColor: THEME.primary,
    borderRadius: 18,
    padding: 20,
    gap: 10,
  },
  contactTitle: {
    color: THEME.onPrimary || '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  contactDescription: {
    color: 'rgba(255,255,255,0.85)',
  },
  ctaRow: {
    flexDirection: 'row',
    gap: 12,
  },
  ctaOutlined: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.8)',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaOutlinedText: {
    color: '#fff',
    fontWeight: '700',
  },
  ctaContained: {
    flex: 1,
    backgroundColor: '#21432E',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  ctaContainedText: {
    color: '#fff',
    fontWeight: '700',
  },
});
