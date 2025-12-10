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

const MATERIAL_COLORS = {
  primary: '#1F8E4A',
  background: '#F5F7F6',
  surface: '#FFFFFF',
  outline: '#D7E5DB',
  textPrimary: '#10241A',
  textSecondary: '#47614F',
};

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
  // Full Image Card (Workout Full)
  if (item.type === 'workout-full') {
    return (
      <TouchableOpacity style={styles.cardFullContainer}>
        <ImageBackground
          source={item.image}
          style={styles.cardFullBackground}
          imageStyle={{ borderRadius: 20 }}
        >
          <View style={styles.cardOverlay} />

          <View style={styles.cardFullContent}>
            <Text style={styles.cardTitleWhite}>{item.title}</Text>

            <View style={styles.cardInfoRow}>
              <Icon name="schedule" size={14} color="#fff" />
              <Text style={styles.cardInfoWhite}> {item.duration} Minutes</Text>

              <MIcon name="fire" size={14} color="#fff" />
              <Text style={styles.cardInfoWhite}> {item.calories} Kcal</Text>
            </View>
          </View>

          <MIcon
            name="play-circle"
            size={38}
            color="#fff"
            style={styles.playIcon}
          />
        </ImageBackground>
      </TouchableOpacity>
    );
  }

  // Split Card (thumbnail right)
  if (item.type.includes('-split')) {
    const isWorkout = item.type.includes('workout');

    return (
      <TouchableOpacity style={styles.cardSplitContainer}>
        <View style={styles.cardSplitTextContainer}>
          <Text style={styles.cardTitleBlack}>{item.title}</Text>

          <View style={styles.cardInfoRow}>
            <Text style={styles.cardInfoGray}>⏰ {item.duration} Minutes</Text>
            <Text style={styles.cardInfoGray}>🔥 {item.calories} Kcal</Text>
            {isWorkout && (
              <Text style={styles.cardInfoGray}>
                🤸 {item.exercises} Exercises
              </Text>
            )}
          </View>
        </View>

        <View style={styles.cardSplitImageWrapper}>
          <Image source={item.image} style={styles.cardSplitImage} />
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
    <View style={styles.screen}>
      {/* FULL WIDTH HEADER giống BookScreen */}
      <View style={styles.headerContainer}>
        <TouchableOpacity
          style={styles.backHeader}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        <View style={styles.titleHeader}>
          <Text style={styles.headerTitle}>Tìm kiếm</Text>
        </View>

        <View style={{ flex: 1 }} />
      </View>

      {/* CONTENT WRAPPER */}
      <View style={styles.container}>
        <View style={styles.searchContainer}>
          <Icon
            name="search"
            size={22}
            color={MATERIAL_COLORS.textSecondary}
            style={{ marginRight: 10 }}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm..."
            placeholderTextColor="#9AA5A0"
            value={keyword}
            onChangeText={setKeyword}
          />
        </View>

        <TabBar activeTab={activeTab} setActiveTab={setActiveTab} />

        <FlatList
          data={mockData}
          renderItem={renderContentItem}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 140 }}
        />
      </View>
    </View>
  );
};

export default SearchScreen;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: MATERIAL_COLORS.background,
  },

  /** HEADER FULL WIDTH – chuẩn BookScreen */
  headerContainer: {
    height: 110,
    backgroundColor: MATERIAL_COLORS.primary,
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingBottom: 18,
    paddingHorizontal: 18,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },

  backHeader: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },

  titleHeader: {
    flex: 2,
    alignItems: 'center',
  },

  headerTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },

  /** CONTENT WRAPPER */
  container: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 20,
  },

  /** SEARCH BOX */
  searchContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: MATERIAL_COLORS.outline,
    alignItems: 'center',
    marginBottom: 18,
    elevation: 2,
  },

  searchInput: {
    flex: 1,
    fontSize: 16,
    color: MATERIAL_COLORS.textPrimary,
  },

  /** TABS */
  tabBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
    marginBottom: 20,
  },

  tabButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },

  activeTab: {
    backgroundColor: MATERIAL_COLORS.primary,
    borderColor: MATERIAL_COLORS.primary,
  },

  inactiveTab: {
    backgroundColor: '#fff',
    borderColor: MATERIAL_COLORS.outline,
  },

  activeTabText: {
    color: '#fff',
    fontWeight: '600',
  },

  inactiveTabText: {
    color: MATERIAL_COLORS.textPrimary,
    fontWeight: '500',
  },

  /** FULL IMAGE CARD */
  cardFullContainer: {
    height: 190,
    marginBottom: 22,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#000',
  },

  cardFullBackground: {
    flex: 1,
    justifyContent: 'flex-end',
  },

  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.28)',
  },

  cardFullContent: {
    position: 'absolute',
    bottom: 18,
    left: 15,
  },

  cardTitleWhite: {
    color: '#fff',
    fontSize: 19,
    fontWeight: '700',
    marginBottom: 6,
  },

  cardInfoWhite: {
    color: '#fff',
    fontSize: 13,
  },

  playIcon: {
    position: 'absolute',
    bottom: 18,
    right: 18,
  },

  /** SPLIT CARD */
  cardSplitContainer: {
    flexDirection: 'row',
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: MATERIAL_COLORS.outline,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    overflow: 'hidden',
  },

  cardSplitTextContainer: {
    flex: 1,
    padding: 15,
    justifyContent: 'center',
  },

  cardTitleBlack: {
    fontSize: 17,
    fontWeight: '700',
    color: MATERIAL_COLORS.textPrimary,
    marginBottom: 10,
  },

  cardInfoGray: {
    fontSize: 13,
    color: MATERIAL_COLORS.textSecondary,
    marginBottom: 2,
  },

  cardSplitImageWrapper: {
    width: 125,
    height: 125,
  },

  cardSplitImage: {
    width: '100%',
    height: '100%',
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
  },
});
