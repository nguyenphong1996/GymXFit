import React, { useState } from 'react';
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  FlatList,
  ImageBackground,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import MIcon from 'react-native-vector-icons/MaterialCommunityIcons';

// Tabs
const TABS = ['All', 'Circuit', 'Split', 'Legs', 'Cardio', 'Arm'];

const mockData = [
  {
    id: '1',
    type: 'workout-full',
    title: 'Squat Exercise',
    duration: 12,
    calories: 120,
    image: require('@assets/images/womanhelping.png'),
  },
  {
    id: '2',
    type: 'workout-full',
    title: 'Full Body Stretching',
    duration: 12,
    calories: 120,
    image: require('@assets/images/womanhelping2.png'),
  },
  {
    id: '3',
    type: 'workout-split',
    title: 'Circuit Training',
    duration: 50,
    calories: 1300,
    exercises: 5,
    image: require('@assets/images/gym1.png'),
  },
  {
    id: '4',
    type: 'nutrition-split',
    title: 'Delights With Greek Yogurt',
    duration: 6,
    calories: 200,
    image: require('@assets/images/gym2.png'),
  },
  {
    id: '5',
    type: 'workout-split',
    title: 'Split Strength Training',
    duration: 12,
    calories: 1250,
    exercises: 5,
    image: {
      uri: 'https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=500&q=80',
    },
  },
  {
    id: '6',
    type: 'nutrition-split',
    title: 'Turkey And Avocado Wrap',
    duration: 10,
    calories: 350,
    image: require('@assets/images/gym3.png'),
  },
];

const renderContentItem = ({ item }) => {
  // 🔹 Kiểu 1: Workout Full (ảnh nền + overlay)
  if (item.type === 'workout-full') {
    return (
      <TouchableOpacity style={styles.cardFullContainer}>
        <ImageBackground
          source={item.image}
          style={styles.cardFullBackground}
          imageStyle={{ borderRadius: 20 }}
        >
          <View style={styles.cardOverlay}>
            <Icon
              name="star-border"
              size={20}
              color="#fff"
              style={styles.starIcon}
            />
            <View style={styles.cardFullContent}>
              <Text style={styles.cardTitleWhite}>{item.title}</Text>
              <View style={styles.cardInfoRow}>
                <Icon name="schedule" size={14} color="#fff" />
                <Text style={styles.cardInfoWhite}>
                  {' '}
                  {item.duration} Minutes
                </Text>
                <MIcon
                  name="fire"
                  size={14}
                  color="#fff"
                  style={{ marginLeft: 5 }}
                />
                <Text style={styles.cardInfoWhite}> {item.calories} Kcal</Text>
              </View>
            </View>
            <MIcon
              name="play-circle"
              size={30}
              color="#fff"
              style={styles.playIcon}
            />
          </View>
        </ImageBackground>
      </TouchableOpacity>
    );
  }

  // 🔹 Kiểu 2: Split (chữ trái, ảnh phải)
  if (item.type.includes('-split')) {
    const isWorkout = item.type.startsWith('workout');
    return (
      <TouchableOpacity style={styles.cardSplitContainer}>
        <View style={styles.cardSplitTextContainer}>
          <Text style={styles.cardTitleBlack}>{item.title}</Text>
          <View style={styles.cardInfoRow}>
            <Text style={styles.cardInfoGray}>⏰ {item.duration} Minutes</Text>
            <Text style={styles.cardInfoGray}>
              🔥 {item.calories} {isWorkout ? 'Kcal' : 'Cal'}
            </Text>
            {isWorkout && (
              <Text style={styles.cardInfoGray}>
                🤸 {item.exercises} Exercises
              </Text>
            )}
          </View>
        </View>
        <View style={styles.cardSplitImageContainer}>
          <Image source={item.image} style={styles.cardSplitImage} />
          <Icon
            name="star-border"
            size={18}
            color="#fff"
            style={[styles.starIcon, { top: 8, right: 8 }]}
          />
        </View>
      </TouchableOpacity>
    );
  }

  return null;
};

const TabBar = ({ activeTab, setActiveTab }) => (
  <View style={styles.tabBar}>
    {TABS.map(tab => (
      <TouchableOpacity
        key={tab}
        style={[
          styles.tabButton,
          activeTab === tab ? styles.activeTab : styles.inactiveTab,
        ]}
        onPress={() => setActiveTab(tab)}
      >
        <Text
          style={
            activeTab === tab ? styles.activeTabText : styles.inactiveTabText
          }
        >
          {tab}
        </Text>
      </TouchableOpacity>
    ))}
  </View>
);

const SearchScreen = ({ navigation }) => {
  const [keyword, setKeyword] = useState('');
  const [activeTab, setActiveTab] = useState('All');

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.arrowSearchContainer}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#000" />
          <Text style={styles.txtsize20bold}>Search</Text>
        </TouchableOpacity>
        <View style={styles.headerIcon}>
          <TouchableOpacity>
            <Icon
              name="notifications-none"
              size={26}
              color="#000"
              style={{ marginEnd: 21 }}
            />
          </TouchableOpacity>
          <TouchableOpacity>
            <Icon name="person-outline" size={26} color="#000" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Ô tìm kiếm */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search"
          value={keyword}
          onChangeText={setKeyword}
        />
      </View>

      {/* Thanh tab */}
      <TabBar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Danh sách */}
      <FlatList
        data={mockData}
        renderItem={renderContentItem}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      />
    </View>
  );
};

export default SearchScreen;

const styles = StyleSheet.create({
  // --- Layout ---
  container: {
    flex: 1,
    width: '100%',
    backgroundColor: '#fff',
    padding: 35,
    paddingBottom: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  arrowSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  txtsize20bold: {
    fontSize: 20,
    fontWeight: 'bold',
    marginStart: 12,
  },
  headerIcon: {
    flexDirection: 'row',
  },

  // --- Search ---
  searchContainer: {
    marginVertical: 13,
  },
  searchInput: {
    borderColor: '#212020',
    borderWidth: 1,
    borderRadius: 30,
    fontSize: 13,
    paddingStart: 12,
  },

  // --- Tab Bar ---
  tabBar: {
    flexDirection: 'row',
    gap: 7,
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 20,
  },
  tabButton: {
    width: '31%',
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#30c451',
    borderColor: '#30c451',
  },
  inactiveTab: {
    backgroundColor: '#fff',
    borderColor: '#212020',
  },
  activeTabText: {
    color: '#fff',
    fontWeight: 'bold',
    paddingVertical: 4,
    fontSize: 16,
  },
  inactiveTabText: {
    color: '#212020',
    fontSize: 16,
    paddingVertical: 4,
  },

  // --- Card Style 1 ---
  cardFullContainer: {
    height: 180,
    marginBottom: 20,
    borderRadius: 20,
  },
  cardFullBackground: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
    padding: 15,
  },
  cardFullContent: {
    position: 'absolute',
    bottom: 15,
    left: 15,
  },
  cardTitleWhite: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  cardInfoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    alignItems: 'center',
  },
  cardInfoWhite: {
    color: '#fff',
    fontSize: 12,
  },
  starIcon: {
    position: 'absolute',
    top: 15,
    right: 15,
  },
  playIcon: {
    position: 'absolute',
    bottom: 15,
    right: 15,
  },

  // --- Card Style 2 ---
  cardSplitContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 0.5,
  },
  cardSplitTextContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  cardTitleBlack: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  cardInfoGray: {
    color: '#888',
    fontSize: 12,
  },
  cardSplitImageContainer: {
    width: 120,
    height: 120,
  },
  cardSplitImage: {
    width: '100%',
    height: '100%',
    borderRadius: 15,
  },
});
