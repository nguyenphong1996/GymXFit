import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const newsData = [
  {
    id: 1,
    title: 'Tập luyện đúng cách giúp cải thiện sức khỏe và vóc dáng',
    date: '17/09/2025',
    image: require('@assets/images/workout1.jpg'),
    description:
      'Cùng tìm hiểu bí quyết tập luyện hiệu quả giúp bạn đạt được mục tiêu nhanh hơn.',
  },
  {
    id: 2,
    title: 'Chế độ dinh dưỡng hợp lý cho người tập gym',
    date: '10/08/2025',
    image: require('@assets/images/workout1.jpg'),
    description:
      'Khám phá thực đơn giàu dinh dưỡng giúp duy trì năng lượng và phục hồi cơ bắp tốt hơn.',
  },
  {
    id: 3,
    title: 'Tập nhóm – bí quyết giữ động lực mỗi ngày',
    date: '03/07/2025',
    image: require('@assets/images/workout1.jpg'),
    description:
      'Tập luyện cùng bạn bè giúp bạn duy trì cảm hứng và kết quả lâu dài.',
  },
  {
    id: 4,
    title: 'Bài tập cardio đốt cháy calo hiệu quả nhất',
    date: '22/06/2025',
    image: require('@assets/images/workout1.jpg'),
    description:
      'Những bài tập giúp tăng cường thể lực và hỗ trợ giảm mỡ nhanh chóng.',
  },
];

const MemberNewsScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <MaterialIcons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tin tức</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {newsData.map(item => (
          <TouchableOpacity
            key={item.id}
            style={styles.card}
            activeOpacity={0.8}
          >
            <Image source={item.image} style={styles.newsImage} />
            <View style={styles.cardContent}>
              <Text style={styles.newsTitle}>{item.title}</Text>
              <Text style={styles.newsDescription}>{item.description}</Text>
              <Text style={styles.newsDate}>{item.date}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

export default MemberNewsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0EBE7E',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
  },
  backButton: {
    padding: 5,
    marginRight: 10,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginTop: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  newsImage: {
    width: '100%',
    height: 160,
    resizeMode: 'cover',
  },
  cardContent: {
    padding: 12,
  },
  newsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000',
  },
  newsDescription: {
    fontSize: 13,
    color: '#555',
    marginTop: 5,
    lineHeight: 18,
  },
  newsDate: {
    fontSize: 12,
    color: '#0EBE7E',
    marginTop: 8,
    textAlign: 'right',
  },
});
