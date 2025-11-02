// screens/WorkoutScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Image,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { getAllVideos } from '@api/userApi';

const formatDuration = seconds => {
  if (!seconds && seconds !== 0) {
    return '--:--';
  }
  const totalSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(totalSeconds / 60);
  const remainSeconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainSeconds).padStart(
    2,
    '0',
  )} phút`;
};

const WorkoutScreen = ({ navigation }) => {
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [favorites, setFavorites] = useState({});

  const [videos, setVideos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchVideos = useCallback(async (query = '') => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getAllVideos({
        limit: 30,
        ...(query ? { search: query } : {}),
      });
      if (response?.success) {
        setVideos(response.videos || []);
      } else {
        setVideos([]);
        setError(response?.message || 'Không thể tải danh sách bài tập.');
      }
    } catch (err) {
      setVideos([]);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchText.trim());
    }, 400);
    return () => clearTimeout(handler);
  }, [searchText]);

  useEffect(() => {
    fetchVideos(debouncedSearch);
  }, [debouncedSearch, fetchVideos]);

  const toggleFavorite = id => {
    setFavorites(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleNavigateToVideo = videoId => {
    navigation.navigate('WorkoutVideo', { videoId });
  };

  const renderWorkoutItem = ({ item }) => (
    <TouchableOpacity
      style={styles.workoutCard}
      activeOpacity={0.85}
      onPress={() => handleNavigateToVideo(item.id)}
    >
      <View style={styles.workoutInfo}>
        <Text style={styles.workoutTitle}>{item.title}</Text>

        <View style={styles.workoutDetailsColumn}>
          <View style={styles.detailItem}>
            <MaterialIcons name="schedule" size={16} color="#333" />
            <Text style={styles.detailText}>
              {formatDuration(item.duration)}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="flame-outline" size={16} color="#333" />
            <Text style={styles.detailText}>
              {item.estimated_calories} Kcal
            </Text>
          </View>
          <View style={styles.detailItem}>
            <FontAwesome5 name="dumbbell" size={14} color="#333" />
            <Text style={styles.detailText}>
              {item.subcategory || item.category}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.thumbSection}>
        {item.thumbnail ? (
          <Image source={{ uri: item.thumbnail }} style={styles.thumbImage} />
        ) : (
          <Image
            source={require('@assets/images/workout1.jpg')}
            style={styles.thumbImage}
          />
        )}
        <TouchableOpacity
          style={styles.itemFavorite}
          onPress={() => toggleFavorite(item.id)}
        >
          <MaterialIcons
            name={favorites[item.id] ? 'star' : 'star-border'}
            size={20}
            color={favorites[item.id] ? '#FFD700' : '#fff'}
          />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const featuredVideo = videos[0];

  return (
    <View style={styles.container}>
      <View style={styles.innerPadding}>
        <View style={styles.header}>
          <View style={styles.leftHeader}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={22} color="#333" />
            </TouchableOpacity>
            <Text style={styles.title}>Bài tập</Text>
          </View>

          <View style={styles.rightHeader}>
            <TouchableOpacity onPress={() => setSearchVisible(!searchVisible)}>
              <Ionicons name="search" size={20} color="#333" />
            </TouchableOpacity>
            <TouchableOpacity>
              <Ionicons name="notifications-outline" size={20} color="#333" />
            </TouchableOpacity>
            <TouchableOpacity>
              <Ionicons name="person-circle-outline" size={22} color="#333" />
            </TouchableOpacity>
          </View>
        </View>

        {searchVisible && (
          <TextInput
            style={styles.searchInput}
            placeholder="Nhập tên bài tập..."
            placeholderTextColor="#888"
            value={searchText}
            onChangeText={setSearchText}
          />
        )}
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#30C451" />
          <Text style={styles.loadingText}>Đang tải bài tập...</Text>
        </View>
      ) : error ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{error}</Text>
        </View>
      ) : (
        <>
          <View style={styles.levelContainer}>
            <TouchableOpacity style={styles.levelButton}>
              <Text style={styles.levelText}>Người mới</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.levelButton}>
              <Text style={styles.levelText}>Trung cấp</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.levelButton}>
              <Text style={styles.levelText}>Nâng cao</Text>
            </TouchableOpacity>
          </View>

          {featuredVideo ? (
            <TouchableOpacity
              style={styles.featuredWrapper}
              activeOpacity={0.85}
              onPress={() => handleNavigateToVideo(featuredVideo.id)}
            >
              <View style={styles.featuredCard}>
                {featuredVideo.thumbnail ? (
                  <Image
                    source={{ uri: featuredVideo.thumbnail }}
                    style={styles.featuredImage}
                  />
                ) : (
                  <Image
                    source={require('@assets/images/workout1.jpg')}
                    style={styles.featuredImage}
                  />
                )}
                <View style={styles.badgeWrap}>
                  <Text style={styles.badgeText}>Bài tập trong ngày</Text>
                </View>
                <View style={styles.featuredOverlay}>
                  <Text style={styles.featuredTitle}>
                    {featuredVideo.title}
                  </Text>
                  <View style={styles.featuredDetails}>
                    <View style={styles.detailItem}>
                      <MaterialIcons name="schedule" size={16} color="#fff" />
                      <Text style={styles.featuredDetailText}>
                        {formatDuration(featuredVideo.duration)}
                      </Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Ionicons name="flame-outline" size={16} color="#fff" />
                      <Text style={styles.featuredDetailText}>
                        {featuredVideo.estimated_calories} Kcal
                      </Text>
                    </View>
                    <View style={styles.detailItem}>
                      <FontAwesome5 name="dumbbell" size={14} color="#fff" />
                      <Text style={styles.featuredDetailText}>
                        {featuredVideo.subcategory || featuredVideo.category}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ) : null}

          <FlatList
            contentContainerStyle={styles.listContent}
            data={videos.slice(1)}
            keyExtractor={item => item.id}
            renderItem={renderWorkoutItem}
            ListEmptyComponent={
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>
                  Không tìm thấy bài tập phù hợp.
                </Text>
              </View>
            }
            showsVerticalScrollIndicator={false}
          />
        </>
      )}
    </View>
  );
};

export default WorkoutScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  innerPadding: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ececec',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: { fontSize: 22, fontWeight: '700', color: '#111' },
  rightHeader: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  searchInput: {
    marginTop: 12,
    backgroundColor: '#f2f2f2',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#111',
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 24,
  },
  loadingText: { fontSize: 15, color: '#555', textAlign: 'center' },
  levelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  levelButton: {
    backgroundColor: '#e8f8ee',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  levelText: { fontSize: 14, fontWeight: '600', color: '#08843a' },
  featuredWrapper: { paddingHorizontal: 20 },
  featuredCard: {
    marginTop: 12,
    borderRadius: 18,
    overflow: 'hidden',
    position: 'relative',
  },
  featuredImage: { width: '100%', height: 200 },
  badgeWrap: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: '#30C451',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  featuredOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
    padding: 20,
    justifyContent: 'flex-end',
  },
  featuredTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 10,
  },
  featuredDetails: { flexDirection: 'row', gap: 16 },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailText: { fontSize: 13, color: '#333' },
  featuredDetailText: { fontSize: 13, color: '#fff', fontWeight: '600' },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 16,
  },
  workoutCard: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    gap: 16,
  },
  workoutInfo: { flex: 1 },
  workoutTitle: { fontSize: 17, fontWeight: '700', color: '#111' },
  workoutDetailsColumn: { marginTop: 12, gap: 8 },
  thumbSection: {
    width: 110,
    height: 110,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
  },
  thumbImage: { width: '100%', height: '100%' },
  itemFavorite: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
});
