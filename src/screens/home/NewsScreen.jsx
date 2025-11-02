import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StatusBar,
  StyleSheet,
  useColorScheme,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';

const NEWS_DATA = [
  {
    id: 1,
    image: require('@assets/images/lesmils1.jpg'),
    title: 'Phòng gym Bình Thạnh tốt nhất bạn nên biết',
    date: '06/10/2025',
  },
  {
    id: 2,
    image: require('@assets/images/lesmils2.jpg'),
    title: 'Phòng tập tiên phong ứng dụng công nghệ Face ID',
    date: '07/10/2025',
  },
  {
    id: 3,
    image: require('@assets/images/lesmils3.jpg'),
    title: 'Carb là gì? Những loại thực phẩm giàu carb tốt cho sức khỏe',
    date: '08/10/2025',
  },
  {
    id: 4,
    image: require('@assets/images/lesmils4.jpg'),
    title: 'Tất tần tật thực phẩm bổ sung hiệu quả cho người tập gym',
    date: '09/10/2025',
  },
];

const NewsScreen = ({ navigation }) => {
  const isDarkMode = useColorScheme() === 'light';
  const [articles] = useState(NEWS_DATA);

  const renderNewsItem = ({ item }) => {
    const { image, title, date } = item;
    return (
      <TouchableOpacity
        style={styles.itemContent}
        activeOpacity={0.8}
        onPress={() => console.log('Xem chi tiết:', title)}
      >
        <Image style={styles.imageContent} source={image} />
        <View style={styles.textContent}>
          <Text
            style={styles.textTitleContent}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {title}
          </Text>
          <View style={styles.dateContainer}>
            <Ionicons name="calendar-outline" size={16} color="#888" />
            <Text style={styles.textDate}>{date}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={styles.headerContainer}>
        <TouchableOpacity
          style={styles.backHeader}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back-ios" size={20} color="#fff" />
          <Text style={styles.textBack}>Quay lại</Text>
        </TouchableOpacity>

        <View style={styles.titleHeader}>
          <Text style={styles.textTitle}>Tin tức GymXFit</Text>
        </View>

        <View style={{ flex: 1 }} />
      </View>

      {/* Content */}
      <View style={styles.contentContainer}>
        <FlatList
          data={articles}
          renderItem={renderNewsItem}
          keyExtractor={item => item.id.toString()}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </View>
  );
};

export default NewsScreen;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    backgroundColor: '#fff',
  },
  headerContainer: {
    height: 100,
    backgroundColor: '#30C451',
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 15,
    paddingBottom: 15,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  backHeader: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  textBack: {
    color: '#fff',
    marginStart: 5,
    fontSize: 12,
  },
  titleHeader: {
    flex: 2,
    alignItems: 'center',
  },
  textTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 25,
    marginVertical: 20,
  },
  itemContent: {
    backgroundColor: '#fff',
    marginBottom: 15,
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 3,
  },
  imageContent: {
    width: '100%',
    height: 150,
  },
  textContent: {
    padding: 10,
    justifyContent: 'space-between',
  },
  textTitleContent: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  textDate: {
    fontSize: 13,
    color: '#888',
    marginLeft: 5,
  },
});
