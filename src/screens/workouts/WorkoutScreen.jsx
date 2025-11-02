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
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { getAllVideos } from '@api/userApi';

const PRIMARY_COLOR = '#30C451';

// 🕒 Format thời lượng
const formatDuration = seconds => {
  if (!seconds && seconds !== 0) return '--:--';
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
  const [filterVisible, setFilterVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [favorites, setFavorites] = useState({});
  const [videos, setVideos] = useState([]);
  const [filteredVideos, setFilteredVideos] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const categories = [
    { id: 'Tất cả', name: 'Tất cả', icon: 'apps' },
    { id: 'Yoga', name: 'Yoga', icon: 'self-improvement' },
    { id: 'Cơ tay', name: 'Cơ tay', icon: 'fitness-center' },
    { id: 'Cơ bụng', name: 'Cơ bụng', icon: 'directions-run' },
    { id: 'Cardio', name: 'Cardio', icon: 'favorite-border' },
    { id: 'Cơ chân', name: 'Cơ chân', icon: 'accessibility-new' },
  ];

  // 📦 Gọi API danh sách video
  const fetchVideos = useCallback(async query => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await getAllVideos({
        limit: 30,
        ...(query ? { search: query } : {}),
      });

      if (response?.success) {
        const vids = response.videos || [];
        setVideos(vids);
        setFilteredVideos(vids);
      } else {
        setVideos([]);
        setFilteredVideos([]);
        setError(response?.message || 'Không thể tải danh sách bài tập.');
      }
    } catch (err) {
      setError(err.message);
      setVideos([]);
      setFilteredVideos([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ⏳ Debounce tìm kiếm
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(searchText.trim());
    }, 400);
    return () => clearTimeout(timeout);
  }, [searchText]);

  // 🔁 Tải lại dữ liệu khi search thay đổi
  useEffect(() => {
    fetchVideos(debouncedSearch);
  }, [debouncedSearch, fetchVideos]);

  // 🧩 Lọc theo loại
  const filterByCategory = useCallback(
    category => {
      setSelectedCategory(category);
      if (category === 'Tất cả') {
        setFilteredVideos(videos);
      } else {
        const filtered = videos.filter(
          v =>
            v.category?.toLowerCase().includes(category.toLowerCase()) ||
            v.subcategory?.toLowerCase().includes(category.toLowerCase()),
        );
        setFilteredVideos(filtered);
      }
    },
    [videos],
  );

  // ⭐ Thêm / Xoá yêu thích
  const toggleFavorite = id =>
    setFavorites(prev => ({
      ...prev,
      [id]: !prev[id],
    }));

  // ▶️ Xem video
  const handleNavigateToVideo = videoId => {
    if (!videoId) return;
    navigation.navigate('WorkoutVideo', { videoId });
  };

  const featuredVideo = filteredVideos.length > 0 ? filteredVideos[0] : null;

  // 🎞️ Render 1 item bài tập
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
            <Icon name="schedule" size={16} color="#333" />
            <Text style={styles.detailText}>
              {formatDuration(item.duration)}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Icon name="whatshot" size={16} color="#333" />
            <Text style={styles.detailText}>
              {item.estimated_calories} Kcal
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Icon name="fitness-center" size={16} color="#333" />
            <Text style={styles.detailText}>
              {item.subcategory || item.category}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.thumbSection}>
        <Image
          source={
            item.thumbnail
              ? { uri: item.thumbnail }
              : require('@assets/images/workout1.jpg')
          }
          style={styles.thumbImage}
        />
        <TouchableOpacity
          style={styles.itemFavorite}
          onPress={() => toggleFavorite(item.id)}
        >
          <Icon
            name={favorites[item.id] ? 'star' : 'star-border'}
            size={20}
            color={favorites[item.id] ? '#FFD700' : '#fff'}
          />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* 🧭 Header */}
      <View style={styles.header}>
        <View style={styles.leftHeader}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color="#111" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Bài tập</Text>
        </View>

        <View style={styles.rightHeader}>
          <TouchableOpacity onPress={() => setSearchVisible(!searchVisible)}>
            <Icon name="search" size={22} color="#111" />
          </TouchableOpacity>

          <TouchableOpacity>
            <Icon name="notifications-none" size={22} color="#111" />
          </TouchableOpacity>

          <TouchableOpacity>
            <Icon name="account-circle" size={24} color="#111" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 🔍 Thanh tìm kiếm */}
      {searchVisible && (
        <View style={styles.searchBar}>
          <Icon name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Nhập tên bài tập..."
            placeholderTextColor="#888"
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>
      )}

      {/* Hiển thị trạng thái */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PRIMARY_COLOR} />
          <Text style={styles.loadingText}>Đang tải bài tập...</Text>
        </View>
      ) : error ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{error}</Text>
        </View>
      ) : (
        <>
          {/* 🌟 Featured Video */}
          {featuredVideo && (
            <TouchableOpacity
              style={styles.featuredWrapper}
              onPress={() => handleNavigateToVideo(featuredVideo.id)}
              activeOpacity={0.85}
            >
              <Image
                source={
                  featuredVideo.thumbnail
                    ? { uri: featuredVideo.thumbnail }
                    : require('@assets/images/workout1.jpg')
                }
                style={styles.featuredImage}
              />
              <View style={styles.featuredOverlay}>
                <View style={styles.badgeWrap}>
                  <Text style={styles.badgeText}>Bài tập nổi bật</Text>
                </View>
                <Text style={styles.featuredTitle}>{featuredVideo.title}</Text>
              </View>
            </TouchableOpacity>
          )}

          {/* 🔽 ICON BỘ LỌC DƯỚI BANNER */}
          <View style={styles.filterBar}>
            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => setFilterVisible(!filterVisible)}
            >
              <Icon
                name="tune"
                size={24}
                color={filterVisible ? PRIMARY_COLOR : '#111'}
              />
              <Text
                style={[
                  styles.filterLabel,
                  { color: filterVisible ? PRIMARY_COLOR : '#111' },
                ]}
              >
                Bộ lọc
              </Text>
            </TouchableOpacity>
          </View>

          {/* 🧩 DANH MỤC HIỆN RA KHI NHẤN ICON */}
          {filterVisible && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoryScroll}
              contentContainerStyle={styles.categoryContainer}
            >
              {categories.map(cat => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryButton,
                    selectedCategory === cat.id && styles.categoryActive,
                  ]}
                  onPress={() => filterByCategory(cat.id)}
                >
                  <Icon
                    name={cat.icon}
                    size={26}
                    color={selectedCategory === cat.id ? '#fff' : PRIMARY_COLOR}
                  />
                  <Text
                    style={[
                      styles.categoryText,
                      selectedCategory === cat.id && { color: '#fff' },
                    ]}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* 📋 Danh sách bài tập */}
          <FlatList
            contentContainerStyle={styles.listContent}
            data={filteredVideos.slice(1)}
            keyExtractor={item => String(item.id)}
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderBottomWidth: 0.4,
    borderBottomColor: '#ccc',
  },
  leftHeader: { flexDirection: 'row', alignItems: 'center' },
  rightHeader: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111',
    marginLeft: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    marginHorizontal: 18,
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  searchInput: { flex: 1, marginLeft: 6, color: '#111', fontSize: 14 },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  loadingText: { marginTop: 10, fontSize: 14, color: '#555' },
  featuredWrapper: {
    margin: 18,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
  },
  featuredImage: { width: '100%', height: 200 },
  featuredOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
    padding: 14,
  },
  badgeWrap: {
    backgroundColor: PRIMARY_COLOR,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginBottom: 6,
  },
  badgeText: { color: '#fff', fontWeight: '600', fontSize: 12 },
  featuredTitle: { color: '#fff', fontSize: 20, fontWeight: '700' },

  // 🎛 Bộ lọc
  filterBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 18,
    marginBottom: 8,
  },
  filterButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  filterLabel: { fontSize: 15, fontWeight: '600' },

  // 🧩 Danh mục
  categoryScroll: { marginVertical: 12 },
  categoryContainer: { paddingHorizontal: 14, gap: 12 },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: PRIMARY_COLOR,
    borderRadius: 30,
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
  },
  categoryActive: {
    backgroundColor: PRIMARY_COLOR,
    borderColor: PRIMARY_COLOR,
    transform: [{ scale: 1.03 }],
  },
  categoryText: {
    marginLeft: 10,
    fontSize: 16,
    color: PRIMARY_COLOR,
    fontWeight: '700',
  },

  listContent: { paddingHorizontal: 16, paddingBottom: 40 },
  workoutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    elevation: 2,
  },
  workoutInfo: { flex: 1, marginRight: 10 },
  workoutTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111',
    marginBottom: 4,
  },
  workoutDetailsColumn: { flexDirection: 'column', gap: 2 },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailText: { fontSize: 12, color: '#444' },
  thumbSection: {
    width: 90,
    height: 90,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  thumbImage: { width: '100%', height: '100%' },
  itemFavorite: { position: 'absolute', top: 6, right: 6 },
});

export default WorkoutScreen;
