// screens/HelpCenterScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons'; // ✅ Thư viện icon

const HelpCenterScreen = ({ navigation }) => {
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [activeTab, setActiveTab] = useState('FAQ');
  const [activeCategory, setActiveCategory] = useState('Chung');

  const faqData = [
    {
      question: 'Làm thế nào để thay đổi mật khẩu?',
      answer:
        'Bạn có thể thay đổi mật khẩu trong phần “Tài khoản” → “Bảo mật” → “Đổi mật khẩu”.',
    },
    {
      question: 'Tôi có thể cập nhật thông tin cá nhân ở đâu?',
      answer:
        'Vào “Tài khoản” → “Chỉnh sửa thông tin” để thay đổi họ tên, email hoặc số điện thoại.',
    },
    {
      question: 'Làm thế nào để liên hệ với bộ phận hỗ trợ?',
      answer:
        'Bạn có thể chọn tab “Liên hệ với chúng tôi” để xem các phương thức liên hệ như hotline, email, hoặc mạng xã hội.',
    },
    {
      question: 'Tôi có thể hủy dịch vụ đã đăng ký không?',
      answer: 'Có, bạn có thể hủy bất kỳ lúc nào trong phần “Dịch vụ của tôi”.',
    },
    {
      question: 'Ứng dụng có thu phí không?',
      answer:
        'Một số tính năng cao cấp có thể yêu cầu phí, bạn có thể xem chi tiết trong mục “Gói dịch vụ”.',
    },
  ];

  const toggleQuestion = index => {
    setSelectedQuestion(selectedQuestion === index ? null : index);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Icon name="arrow-back" size={22} color="#0EBE7E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Trợ giúp & Câu hỏi thường gặp</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>Chúng tôi có thể giúp gì cho bạn?</Text>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'FAQ' && styles.tabButtonActive,
            ]}
            onPress={() => setActiveTab('FAQ')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'FAQ' && styles.tabTextActive,
              ]}
            >
              Câu hỏi thường gặp
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'Contact' && styles.tabButtonActiveOutline,
            ]}
            onPress={() => setActiveTab('Contact')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'Contact' && styles.tabTextOutline,
              ]}
            >
              Liên hệ với chúng tôi
            </Text>
          </TouchableOpacity>
        </View>

        {/* Danh mục */}
        <View style={styles.categoryContainer}>
          {['Chung', 'Tài khoản', 'Dịch vụ'].map(item => (
            <TouchableOpacity
              key={item}
              style={[
                styles.categoryButton,
                activeCategory === item && styles.categoryButtonActive,
              ]}
              onPress={() => setActiveCategory(item)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.categoryText,
                  activeCategory === item && styles.categoryTextActive,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Thanh tìm kiếm */}
        <View style={styles.searchContainer}>
          <Icon
            name="search"
            size={20}
            color="#0EBE7E"
            style={{ marginRight: 8 }}
          />
          <TextInput
            placeholder="Tìm kiếm..."
            placeholderTextColor="#888"
            style={styles.searchInput}
          />
        </View>

        {/* FAQ */}
        {faqData.map((item, index) => (
          <View key={index} style={styles.faqItem}>
            <TouchableOpacity
              style={styles.faqQuestion}
              onPress={() => toggleQuestion(index)}
              activeOpacity={0.7}
            >
              <Text style={styles.questionText}>{item.question}</Text>
              <Icon
                name={
                  selectedQuestion === index ? 'expand-less' : 'expand-more'
                }
                size={20}
                color="#000"
              />
            </TouchableOpacity>

            {selectedQuestion === index && (
              <Text style={styles.answerText}>{item.answer}</Text>
            )}
            <View style={styles.separator} />
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

export default HelpCenterScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginLeft: 10,
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 16,
    color: '#000',
    marginTop: 10,
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 15,
  },
  tabButton: {
    borderWidth: 1,
    borderColor: '#0EBE7E',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 25,
    marginHorizontal: 5,
  },
  tabButtonActive: {
    backgroundColor: '#0EBE7E',
  },
  tabButtonActiveOutline: {
    backgroundColor: '#fff',
  },
  tabText: {
    color: '#0EBE7E',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#fff',
  },
  tabTextOutline: {
    color: '#000',
  },
  categoryContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 15,
  },
  categoryButton: {
    borderWidth: 1,
    borderColor: '#0EBE7E',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 20,
    marginHorizontal: 5,
  },
  categoryButtonActive: {
    backgroundColor: '#0EBE7E',
  },
  categoryText: {
    color: '#0EBE7E',
    fontWeight: '500',
  },
  categoryTextActive: {
    color: '#fff',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 20,
    marginHorizontal: 30,
    marginVertical: 15,
    paddingHorizontal: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
    color: '#000',
  },
  faqItem: {
    paddingHorizontal: 30,
    marginBottom: 10,
  },
  faqQuestion: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  questionText: {
    fontWeight: '600',
    fontSize: 14,
    color: '#000',
    flex: 1,
    marginRight: 10,
  },
  answerText: {
    fontSize: 13,
    color: '#444',
    marginTop: 8,
    lineHeight: 18,
  },
  separator: {
    borderBottomWidth: 1,
    borderColor: '#0EBE7E',
    marginTop: 10,
  },
});
