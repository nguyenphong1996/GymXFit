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

const NEWS_DATA = [
  {
    id: '1',
    image: require('@assets/images/lesmils1.jpg'),
    title: 'Phòng gym Bình Thạnh tốt nhất bạn nên biết',
    date: '06/10/2025',
  },
  {
    id: '2',
    image: require('@assets/images/lesmils2.jpg'),
    title: 'Phòng tập tiên phong ứng dụng công nghệ Face ID',
    date: '07/10/2025',
  },
  {
    id: '3',
    image: require('@assets/images/lesmils3.jpg'),
    title: 'Carb là gì? Những thực phẩm giàu carb tốt cho sức khỏe',
    date: '08/10/2025',
  },
  {
    id: '4',
    image: require('@assets/images/lesmils4.jpg'),
    title: 'Thực phẩm bổ sung hiệu quả cho người tập gym',
    date: '09/10/2025',
  },
];

const NewsScreen = ({ navigation }) => {
  const isDarkMode = useColorScheme() === 'dark';
  const [articles] = useState(NEWS_DATA);

  const renderNewsItem = ({ item }) => (
    <View style={styles.itemContent}>
      <Image style={styles.imageContent} source={item.image} />
      <View style={styles.textContent}>
        <Text
          style={styles.textTitleContent}
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          {item.title}
        </Text>
        <Text style={styles.textDate}>{item.date}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={styles.headerContainer}>
        <TouchableOpacity
          style={styles.backHeader}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={22} color="#fff" />
          <Text style={styles.textBack}>Quay lại</Text>
        </TouchableOpacity>
        <View style={styles.titleHeader}>
          <Text style={styles.textTitle}>Tin tức GymXFit</Text>
        </View>
        <View style={{ flex: 1 }} />
      </View>

      {/* Danh sách tin tức */}
      <FlatList
        data={articles}
        renderItem={renderNewsItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

export default NewsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    marginStart: 7,
    fontSize: 13,
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
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  itemContent: {
    backgroundColor: '#fff',
    marginBottom: 15,
    borderRadius: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
    overflow: 'hidden',
  },
  imageContent: {
    width: '100%',
    height: 150,
  },
  textContent: {
    padding: 10,
  },
  textTitleContent: {
    fontSize: 15,
    fontWeight: '600',
  },
  textDate: {
    fontSize: 13,
    color: '#666',
    marginTop: 5,
  },
});
