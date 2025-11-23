import React, { useState } from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { MEMBERSHIP_CONTACT } from './membershipPlans';

// Material Design 3 Colors
const MD3_COLORS = {
  primary: '#1F8E4A',
  onPrimary: '#FFFFFF',
  primaryContainer: '#C2F0D4',
  surface: '#FFFFFF',
  surfaceContainerLow: '#F3F4F0',
  surfaceContainerHigh: '#E7EBE6',
  background: '#F5F7F6',
  onBackground: '#191C19',
  outline: '#72796F',
  outlineVariant: '#C1C9BF',
  textPrimary: '#10241A',
  textSecondary: '#47614F',
  tertiary: '#2196F3',
};

const MD3_TYPE = {
  headlineMedium: { fontSize: 28, lineHeight: 36, fontWeight: '600' },
  titleLarge: { fontSize: 22, lineHeight: 28, fontWeight: '700' },
  titleMedium: { fontSize: 16, lineHeight: 24, fontWeight: '600' },
  bodyMedium: { fontSize: 14, lineHeight: 20, fontWeight: '400' },
  labelLarge: { fontSize: 14, lineHeight: 20, fontWeight: '600' },
};

const FAQ_DATA = [
  {
    id: 1,
    category: 'Thanh toán & Đăng ký',
    icon: 'credit-card',
    questions: [
      {
        q: 'Có thể thanh toán theo tháng không?',
        a: 'Có. Bạn có thể chọn thanh toán theo tháng, quý hoặc năm. Thanh toán dài hạn sẽ được giảm giá thêm.',
      },
      {
        q: 'Có thể hủy gói thành viên không?',
        a: 'Bạn có thể hủy bất kỳ lúc nào. Phí đã đóng sẽ được bảo lưu hoặc hoàn trả theo chính sách (trừ phí xử lý nếu có).',
      },
      {
        q: 'Có cần ký hợp đồng dài hạn không?',
        a: 'Không bắt buộc. Bạn có thể chọn gói linh hoạt theo tháng hoặc cam kết dài hạn để nhận ưu đãi tốt hơn.',
      },
    ],
  },
  {
    id: 2,
    category: 'Gói dịch vụ',
    icon: 'card-membership',
    questions: [
      {
        q: 'Gói Basic có được tham gia lớp nhóm không?',
        a: 'Gói Basic chỉ sử dụng khu tập tự do (cardio, tạ, máy). Muốn tham gia lớp nhóm, bạn cần nâng cấp lên gói Plus hoặc Premium.',
      },
      {
        q: 'Khác biệt giữa gói Plus và Premium?',
        a: 'Gói Premium có thêm: khăn miễn phí, tủ đồ VIP, ưu đãi PT hàng tháng, giảm 10-20% khi mua gói PT, và guest pass 4 lần/tháng.',
      },
      {
        q: 'Có thể nâng/hạ cấp gói giữa kỳ không?',
        a: 'Có thể. Phí chênh lệch sẽ được tính theo số ngày sử dụng còn lại trong tháng.',
      },
    ],
  },
  {
    id: 3,
    category: 'Lớp học & PT',
    icon: 'fitness-center',
    questions: [
      {
        q: 'Booking lớp học như thế nào?',
        a: 'Bạn có thể booking trực tiếp trên app GymXFit hoặc tại quầy lễ tân. Lớp có thể được đặt trước 7 ngày.',
      },
      {
        q: 'Nếu đặt lớp nhưng không đến thì sao?',
        a: 'Bạn nên hủy trước 2 giờ. Nếu no-show quá 3 lần/tháng, tài khoản có thể bị tạm khóa quyền booking 1 tuần.',
      },
      {
        q: 'Gói Premium tặng bao nhiêu buổi PT?',
        a: 'Tặng 1-2 buổi PT miễn phí mỗi tháng để duy trì form và theo dõi tiến độ.',
      },
    ],
  },
  {
    id: 4,
    category: 'Cơ sở vật chất',
    icon: 'place',
    questions: [
      {
        q: 'Có thể tập ở nhiều chi nhánh không?',
        a: 'Có. Tất cả gói đều được sử dụng tại 20+ chi nhánh GymXFit trên toàn quốc.',
      },
      {
        q: 'Gym có mở cửa 24/7 không?',
        a: 'Có. Các chi nhánh chính mở cửa 24/7. Một số chi nhánh nhỏ có thể đóng cửa vào giữa đêm (2-5h sáng).',
      },
      {
        q: 'InBody đo như thế nào?',
        a: 'InBody được đo miễn phí tại quầy. Staff sẽ hướng dẫn và in kết quả cho bạn. Khuyến nghị đo 1-2 lần/tháng.',
      },
      {
        q: 'Có bãi đỗ xe không?',
        a: 'Hầu hết chi nhánh đều có bãi đỗ xe miễn phí hoặc hợp tác với bãi gửi xe gần đó. Vui lòng liên hệ chi nhánh cụ thể để biết chi tiết.',
      },
    ],
  },
  {
    id: 5,
    category: 'Chính sách khác',
    icon: 'policy',
    questions: [
      {
        q: 'Bảo lưu thẻ thành viên như thế nào?',
        a: 'Bạn có thể bảo lưu (freeze) tối đa 45 ngày/năm. Thời gian bảo lưu sẽ được cộng thêm vào thời hạn thẻ.',
      },
      {
        q: 'Có được dẫn bạn bè tập thử không?',
        a: 'Gói Premium có guest pass 4 lần/tháng. Các gói khác có thể mua guest pass 100,000đ/lần.',
      },
      {
        q: 'Làm mất thẻ thành viên thì sao?',
        a: 'Báo ngay cho quầy lễ tân để khóa thẻ cũ và làm thẻ mới. Phí làm lại thẻ là 50,000đ.',
      },
    ],
  },
];

const FAQItem = ({ question, answer }) => {
  const [expanded, setExpanded] = useState(false);
  const animHeight = React.useRef(new Animated.Value(0)).current;
  const animRotate = React.useRef(new Animated.Value(0)).current;

  const toggleExpand = () => {
    const toValue = expanded ? 0 : 1;
    
    Animated.parallel([
      Animated.spring(animHeight, {
        toValue,
        friction: 8,
        tension: 40,
        useNativeDriver: false,
      }),
      Animated.timing(animRotate, {
        toValue,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
    
    setExpanded(!expanded);
  };

  const maxHeight = animHeight.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 500],
  });

  const rotate = animRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <View style={styles.faqItem}>
      <TouchableOpacity
        style={styles.faqQuestion}
        onPress={toggleExpand}
        activeOpacity={0.7}
      >
        <View style={styles.questionIcon}>
          <MaterialCommunityIcons name="help-circle-outline" size={20} color={MD3_COLORS.primary} />
        </View>
        <Text style={styles.questionText}>{question}</Text>
        <Animated.View style={{ transform: [{ rotate }] }}>
          <MaterialIcons name="expand-more" size={24} color={MD3_COLORS.textSecondary} />
        </Animated.View>
      </TouchableOpacity>
      
      <Animated.View style={[styles.faqAnswer, { maxHeight, overflow: 'hidden' }]}>
        <View style={styles.answerContent}>
          <Text style={styles.answerText}>{answer}</Text>
        </View>
      </Animated.View>
    </View>
  );
};

const CategorySection = ({ category, icon, questions }) => {
  return (
    <View style={styles.categorySection}>
      <View style={styles.categoryHeader}>
        <View style={styles.categoryIconContainer}>
          <MaterialIcons name={icon} size={24} color={MD3_COLORS.primary} />
        </View>
        <Text style={styles.categoryTitle}>{category}</Text>
      </View>
      
      <View style={styles.faqList}>
        {questions.map((item, index) => (
          <FAQItem key={index} question={item.q} answer={item.a} />
        ))}
      </View>
    </View>
  );
};

const MembershipFAQScreen = ({ navigation }) => {
  const handleContactPress = () => {
    Linking.openURL(`tel:${MEMBERSHIP_CONTACT}`).catch(() => {});
  };

  const totalQuestions = FAQ_DATA.reduce((sum, cat) => sum + cat.questions.length, 0);

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
        <Text style={styles.appBarTitle}>Câu hỏi thường gặp</Text>
        <View style={styles.appBarButton} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <MaterialCommunityIcons name="help-circle" size={48} color={MD3_COLORS.primary} />
          </View>
          <Text style={styles.headerTitle}>Câu hỏi thường gặp</Text>
          <Text style={styles.headerSubtitle}>
            Tìm câu trả lời nhanh cho các thắc mắc về gói thành viên
          </Text>
        </View>

        {/* Quick Stats */}
        <View style={styles.quickStats}>
          <View style={styles.statCard}>
            <MaterialIcons name="question-answer" size={28} color={MD3_COLORS.tertiary} />
            <Text style={styles.statValue}>{totalQuestions}</Text>
            <Text style={styles.statLabel}>Câu hỏi</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialIcons name="category" size={28} color={MD3_COLORS.tertiary} />
            <Text style={styles.statValue}>{FAQ_DATA.length}</Text>
            <Text style={styles.statLabel}>Chủ đề</Text>
          </View>
        </View>

        {/* FAQ Categories */}
        {FAQ_DATA.map((category) => (
          <CategorySection
            key={category.id}
            category={category.category}
            icon={category.icon}
            questions={category.questions}
          />
        ))}

        {/* Contact Card */}
        <View style={styles.contactCard}>
          <View style={styles.contactIcon}>
            <MaterialCommunityIcons name="headset" size={32} color={MD3_COLORS.primary} />
          </View>
          <Text style={styles.contactTitle}>Vẫn còn thắc mắc?</Text>
          <Text style={styles.contactDescription}>
            Đội ngũ tư vấn viên sẵn sàng hỗ trợ bạn 24/7
          </Text>
          <TouchableOpacity 
            style={styles.contactButton} 
            onPress={handleContactPress}
            activeOpacity={0.9}
          >
            <MaterialIcons name="phone" size={18} color={MD3_COLORS.onPrimary} />
            <Text style={styles.contactButtonText}>Liên hệ ngay</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default MembershipFAQScreen;

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

  // Header
  header: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
  },
  headerIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: MD3_COLORS.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    ...MD3_TYPE.headlineMedium,
    color: MD3_COLORS.onBackground,
    marginBottom: 8,
    textAlign: 'center',
  },
  headerSubtitle: {
    ...MD3_TYPE.bodyMedium,
    color: MD3_COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },

  // Quick Stats
  quickStats: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: MD3_COLORS.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  statValue: {
    ...MD3_TYPE.titleLarge,
    color: MD3_COLORS.onBackground,
  },
  statLabel: {
    ...MD3_TYPE.bodyMedium,
    color: MD3_COLORS.textSecondary,
  },

  // Category Section
  categorySection: {
    marginBottom: 20,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 12,
  },
  categoryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: MD3_COLORS.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryTitle: {
    ...MD3_TYPE.titleLarge,
    color: MD3_COLORS.onBackground,
  },

  // FAQ List
  faqList: {
    gap: 8,
    paddingHorizontal: 16,
  },

  // FAQ Item
  faqItem: {
    backgroundColor: MD3_COLORS.surface,
    borderRadius: 12,
    overflow: 'hidden',
  },
  faqQuestion: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  questionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: MD3_COLORS.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  questionText: {
    ...MD3_TYPE.titleMedium,
    color: MD3_COLORS.onBackground,
    flex: 1,
  },
  faqAnswer: {
    overflow: 'hidden',
  },
  answerContent: {
    paddingHorizontal: 60,
    paddingBottom: 16,
  },
  answerText: {
    ...MD3_TYPE.bodyMedium,
    color: MD3_COLORS.textSecondary,
    lineHeight: 22,
  },

  // Contact Card
  contactCard: {
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: MD3_COLORS.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: MD3_COLORS.outlineVariant,
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  contactIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: MD3_COLORS.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  contactTitle: {
    ...MD3_TYPE.titleLarge,
    color: MD3_COLORS.onBackground,
  },
  contactDescription: {
    ...MD3_TYPE.bodyMedium,
    color: MD3_COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  contactButton: {
    backgroundColor: MD3_COLORS.primary,
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  contactButtonText: {
    ...MD3_TYPE.labelLarge,
    color: MD3_COLORS.onPrimary,
  },
});
