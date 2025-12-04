import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const COLORS = {
  primary: '#1F8E4A',
  background: '#F5F7F6',
  surface: '#FFFFFF',
  text: '#10241A',
  secondary: '#47614F',
};

const Section = ({ title, children }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

const Bullet = ({ text }) => (
  <View style={styles.bulletRow}>
    <View style={styles.bulletDot} />
    <Text style={styles.bulletText}>{text}</Text>
  </View>
);

const GymxfitPolicyScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.surface} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chính sách GYMXFIT</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.lead}>
          Chính sách áp dụng cho hội viên và dịch vụ trên ứng dụng GYMXFIT. Vui lòng đọc kỹ trước khi sử dụng.
        </Text>

        <Section title="1. Hội viên & Gói dịch vụ">
          <Bullet text="Tài khoản hội viên là cá nhân, không chuyển nhượng." />
          <Bullet text="Quyền lợi, thời hạn, điều kiện sử dụng nằm trong mô tả từng gói; mua gói đồng nghĩa chấp thuận điều khoản." />
        </Section>

        <Section title="2. Đăng ký & Xác thực">
          <Bullet text="Thông tin cá nhân phải chính xác; cần xác thực số điện thoại/email để kích hoạt." />
          <Bullet text="GYMXFIT có quyền tạm khóa nếu phát hiện gian lận, chia sẻ tài khoản hoặc vi phạm nội quy." />
        </Section>

        <Section title="3. Thanh toán">
          <Bullet text="Hỗ trợ kênh VNPAY (thẻ nội địa/quốc tế, token lưu thẻ, QR) và chuyển khoản (nếu có)." />
          <Bullet text="Số tiền, phí và mô tả đơn hàng hiển thị trước khi thanh toán." />
          <Bullet text="Với lưu thẻ (token), thông tin thẻ được token hóa bởi đối tác thanh toán; GYMXFIT không lưu số thẻ/OTP." />
        </Section>

        <Section title="4. Gia hạn & Tự động gia hạn (nếu áp dụng)">
          <Bullet text="Nếu bật tự động gia hạn, hệ thống thu phí theo chu kỳ gói từ thẻ/token đã lưu." />
          <Bullet text="Có thể tắt tự động gia hạn bất kỳ lúc nào trước ngày gia hạn tiếp theo." />
        </Section>

        <Section title="5. Bảo lưu & Tạm ngưng">
          <Bullet text="Một số gói hỗ trợ bảo lưu/tạm ngưng theo điều kiện riêng (thời gian tối đa, số lần)." />
          <Bullet text="Khi bảo lưu, thời gian còn lại được cộng dồn sau khi mở lại." />
        </Section>

        <Section title="6. Hủy gói & Hoàn tiền">
          <Bullet text="Gói đã kích hoạt không hoàn tiền trừ khi mô tả gói có quy định khác hoặc theo luật." />
          <Bullet text="Nếu thanh toán nhầm/thu sai, liên hệ hỗ trợ kèm chứng từ; xử lý hoàn qua kênh thanh toán gốc, thời gian theo ngân hàng/đối tác." />
        </Section>

        <Section title="7. Quy tắc sử dụng">
          <Bullet text="Tuân thủ nội quy phòng tập/đối tác; không chia sẻ tài khoản." />
          <Bullet text="Hành vi gian lận, gây mất an toàn, phát tán nội dung xấu có thể bị khóa tài khoản/gói mà không hoàn tiền." />
        </Section>

        <Section title="8. Dữ liệu & bảo mật">
          <Bullet text="GYMXFIT thu thập thông tin cần thiết (hồ sơ hội viên, lịch sử giao dịch, dữ liệu tập luyện nếu có)." />
          <Bullet text="Dữ liệu thanh toán xử lý bởi đối tác; GYMXFIT không lưu thông tin thẻ đầy đủ/OTP." />
          <Bullet text="Bạn có quyền yêu cầu cập nhật, truy xuất hoặc xóa dữ liệu theo quy định pháp luật." />
        </Section>

        <Section title="9. Hỗ trợ & Khiếu nại">
          <Bullet text="Kênh hỗ trợ: hotline/email/Zalo (xem trong ứng dụng)." />
          <Bullet text="Khiếu nại về gói/thu phí gửi trong 7 ngày từ thời điểm phát sinh, kèm mã giao dịch và chứng từ." />
        </Section>

        <Section title="10. Thay đổi chính sách">
          <Bullet text="GYMXFIT có thể cập nhật chính sách; tiếp tục sử dụng đồng nghĩa chấp thuận thay đổi." />
        </Section>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 56,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  content: { padding: 16 },
  lead: { fontSize: 14, color: COLORS.secondary, marginBottom: 12, lineHeight: 20 },
  section: { backgroundColor: COLORS.surface, borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#e7e8ea' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 },
  bulletDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.primary, marginTop: 7, marginRight: 8 },
  bulletText: { flex: 1, fontSize: 14, color: COLORS.secondary, lineHeight: 20 },
});

export default GymxfitPolicyScreen;
