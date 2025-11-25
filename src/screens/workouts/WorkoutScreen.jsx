import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Alert,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Image,
  TextInput,
  ActivityIndicator,
  SafeAreaView,
  Keyboard,
  Platform,
  ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import {
  addVideoToFavorites,
  getAllVideos,
  getFavoriteVideos,
  removeVideoFromFavorites,
} from '@api/userApi';

/* ============================================================
   FORMAT THỜI LƯỢNG
============================================================ */
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

/* ============================================================
   HELPER: PHÂN LOẠI VIDEO THEO 3 NHÓM (yoga, tap co, dinh duong)
   Logic: kiểm tra cả video.category và video.subcategory (nếu có)
   Nếu không khớp, video sẽ rơi vào "Khác" (không hiển thị trong 3 mục)
============================================================ */
const classifyVideo = video => {
  const cat = (
    (video.category || '') +
    ' ' +
    (video.subcategory || '')
  ).toLowerCase();

  if (cat.includes('yoga')) return 'yoga';
  if (
    cat.includes('tập cơ') ||
    cat.includes('tap co') ||
    cat.includes('strength') ||
    cat.includes('muscle') ||
    cat.includes('gym') ||
    cat.includes('cardio') ||
    cat.includes('fitness')
  )
    return 'tapco';
  if (
    cat.includes('dinh') ||
    cat.includes('nutrition') ||
    cat.includes('food') ||
    cat.includes('ăn') ||
    cat.includes('vitamin')
  )
    return 'dinhduong';

  // Fallback: try keywords in title
  const title = (video.title || '').toLowerCase();
  if (title.includes('yoga')) return 'yoga';
  if (
    title.includes('tập cơ') ||
    title.includes('tap co') ||
    title.includes('strength') ||
    title.includes('muscle')
  )
    return 'tapco';
  if (
    title.includes('dinh') ||
    title.includes('nutrition') ||
    title.includes('ăn')
  )
    return 'dinhduong';

  return 'other';
};

/* ============================================================
   COMPONENT CHÍNH - LAYOUT: OPTION B (3 SECTION, cuộn dọc)
   Yêu cầu: giữ nguyên featured banner như trước, sau đó chia 3 mục
============================================================ */
const WorkoutScreen = ({ navigation, route }) => {
  const incomingKeyword =
    typeof route?.params?.keyword === 'string' ? route.params.keyword : '';
  const keywordRef = useRef(incomingKeyword);

  const [searchText, setSearchText] = useState(incomingKeyword);
  const [debouncedSearch, setDebouncedSearch] = useState(
    incomingKeyword.trim(),
  );
  const [favoriteMap, setFavoriteMap] = useState({});
  const [updatingFavoriteId, setUpdatingFavoriteId] = useState(null);

  const [allVideos, setAllVideos] = useState([]); // store everything fetched
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  /* Đồng bộ keyword */
  useEffect(() => {
    if (incomingKeyword !== keywordRef.current) {
      keywordRef.current = incomingKeyword;
      setSearchText(incomingKeyword);
      setDebouncedSearch(incomingKeyword.trim());
    }
  }, [incomingKeyword]);

  /* Fetch videos */
  const fetchVideos = useCallback(async (query = '') => {
    setIsLoading(true);
    setError(null);

    const trimmedQuery = query.trim();
    try {
      const response = await getAllVideos({
        limit: 100,
        ...(trimmedQuery ? { search: trimmedQuery } : {}),
      });

      if (response?.success) {
        const rawVideos = response.videos || [];
        setAllVideos(rawVideos);
      } else {
        setAllVideos([]);
        setError(response?.message || 'Không thể tải danh sách bài tập.');
      }
    } catch (err) {
      setAllVideos([]);
      setError(err.message || 'Lỗi không xác định');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /* Debounce search */
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchText.trim());
    }, 400);
    return () => clearTimeout(t);
  }, [searchText]);

  /* Fetch khi search */
  useEffect(() => {
    fetchVideos(debouncedSearch);
  }, [debouncedSearch, fetchVideos]);

  /* Favorite */
  const fetchFavorites = useCallback(async () => {
    try {
      const response = await getFavoriteVideos();
      const list = Array.isArray(response?.data)
        ? response.data
        : response?.favorites || [];

      const mapped = {};
      list.forEach(item => {
        const videoId = item.videoId || item.id;
        if (videoId) mapped[videoId] = item;
      });
      setFavoriteMap(mapped);
    } catch (err) {
      console.warn('Lỗi lấy danh sách yêu thích:', err?.message || err);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchFavorites();
    }, [fetchFavorites]),
  );

  /* Toggle Favorite */
  const toggleFavorite = async video => {
    const videoId = video?.id;
    if (!videoId) return;

    const isFavorite = Boolean(favoriteMap[videoId]);
    setUpdatingFavoriteId(videoId);

    try {
      if (isFavorite) {
        await removeVideoFromFavorites(videoId);
        setFavoriteMap(prev => {
          const n = { ...prev };
          delete n[videoId];
          return n;
        });
      } else {
        const response = await addVideoToFavorites(videoId);
        const payload =
          response?.data || response?.favorite || response?.data?.data || {};
        setFavoriteMap(prev => ({
          ...prev,
          [videoId]: { ...payload, videoId },
        }));
      }
    } catch (error) {
      Alert.alert('Không thể cập nhật yêu thích', error.message || 'Thử lại.');
    } finally {
      setUpdatingFavoriteId(null);
    }
  };

  const handleNavigateToVideo = id => {
    navigation.navigate('WorkoutVideo', {
      videoId: id,
      initialFavorite: Boolean(favoriteMap[id]),
    });
  };

  /* Phân nhóm videos theo phân loại */
  const groups = React.useMemo(() => {
    const yoga = [];
    const tapco = [];
    const dinhduong = [];

    // If there is a debouncedSearch, we already fetched with search param
    // but to be safe, still filter client-side by title/category
    const normalizedSearch = debouncedSearch.toLowerCase();

    allVideos.forEach(v => {
      // If search is present, filter out videos that don't match
      if (normalizedSearch) {
        const haystack = (
          (v.title || '') +
          ' ' +
          (v.category || '') +
          ' ' +
          (v.subcategory || '')
        ).toLowerCase();
        if (!haystack.includes(normalizedSearch)) return;
      }

      const cls = classifyVideo(v);
      if (cls === 'yoga') yoga.push(v);
      else if (cls === 'tapco') tapco.push(v);
      else if (cls === 'dinhduong') dinhduong.push(v);
    });

    // Optional: sort each group by relevance (title match first)
    const sorter = list => {
      const q = normalizedSearch;
      if (!q) return list;
      return list
        .map((video, idx) => {
          const title = (video.title || '').toLowerCase();
          const category = (
            video.subcategory ||
            '' ||
            video.category ||
            ''
          ).toLowerCase();
          const score =
            (title === q ? 5 : 0) +
            (title.includes(q) ? 3 : 0) +
            (category.includes(q) ? 2 : 0);
          return { video, score, idx };
        })
        .sort((a, b) =>
          b.score === a.score ? a.idx - b.idx : b.score - a.score,
        )
        .map(x => x.video);
    };

    return {
      yoga: sorter(yoga),
      tapco: sorter(tapco),
      dinhduong: sorter(dinhduong),
    };
  }, [allVideos, debouncedSearch]);

  const featuredVideo = allVideos.length ? allVideos[0] : null; // giữ logic ban đầu: featured là video đầu

  /* Render mỗi item (tái sử dụng) */
  const renderWorkoutItem = ({ item }) => {
    const isFavorite = Boolean(favoriteMap[item.id]);
    const isUpdating = updatingFavoriteId === item.id;

    const caloriesLabel = Number.isFinite(Number(item.estimated_calories))
      ? `${Math.round(Number(item.estimated_calories))} Kcal`
      : '--';

    return (
      <TouchableOpacity
        style={styles.resultCard}
        activeOpacity={0.88}
        onPress={() => handleNavigateToVideo(item.id)}
      >
        <View style={styles.resultInfo}>
          <Text style={styles.resultTitle} numberOfLines={2}>
            {item.title}
          </Text>

          <View style={styles.resultMetaRow}>
            <View style={styles.resultMetaItem}>
              <MaterialIcons name="schedule" size={16} color="#4d6654" />
              <Text style={styles.resultMetaText}>
                {formatDuration(item.duration)}
              </Text>
            </View>

            <View style={styles.resultMetaItem}>
              <MaterialIcons
                name="local-fire-department"
                size={16}
                color="#d85b28"
              />
              <Text style={styles.resultMetaText}>{caloriesLabel}</Text>
            </View>

            <View style={styles.resultMetaItem}>
              <MaterialIcons name="category" size={16} color="#3a6043" />
              <Text style={styles.resultMetaText}>
                {item.subcategory || item.category}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.resultThumbnailWrapper}>
          <Image
            source={
              item.thumbnail
                ? { uri: item.thumbnail }
                : require('@assets/images/workout1.jpg')
            }
            style={styles.resultThumbnail}
          />

          <TouchableOpacity
            style={[
              styles.favoriteButton,
              isFavorite && styles.favoriteButtonActive,
              isUpdating && { opacity: 0.6 },
            ]}
            onPress={() => toggleFavorite(item)}
            disabled={isUpdating}
          >
            <MaterialIcons
              name={isFavorite ? 'star' : 'star-border'}
              size={20}
              color={isFavorite ? '#FFD700' : '#fff'}
            />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerIcon}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={28} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.headerTextWrap}>
          <Text style={styles.greeting}>Bài tập</Text>
          <Text style={styles.headerSub}>Khám phá và luyện tập mỗi ngày</Text>
        </View>

        <View style={{ width: 40 }} />
      </View>

      {/* SEARCH */}
      <View style={styles.searchBar}>
        <MaterialIcons name="search" size={20} color="#4d6654" />
        <TextInput
          style={styles.searchField}
          placeholder="Tìm kiếm bài tập, chủ đề..."
          placeholderTextColor="#7a8c7f"
          value={searchText}
          onChangeText={setSearchText}
          returnKeyType="search"
          onSubmitEditing={() =>
            setDebouncedSearch(searchText.trim()) || Keyboard.dismiss()
          }
        />
        {searchText.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearchText('')}
            style={styles.clearButton}
          >
            <MaterialIcons name="close" size={18} color="#7a8c7f" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 80 }}>
        {/* FEATURED BANNER (giữ nguyên) */}
        {featuredVideo && (
          <TouchableOpacity
            style={styles.dailyCard}
            onPress={() => handleNavigateToVideo(featuredVideo.id)}
          >
            <Image
              source={
                featuredVideo.thumbnail
                  ? { uri: featuredVideo.thumbnail }
                  : require('@assets/images/workout1.jpg')
              }
              style={styles.dailyImage}
            />

            <View style={styles.dailyOverlay}>
              <View style={styles.dailyTag}>
                <Text style={styles.dailyTagText}>⚡ Bài tập trong ngày</Text>
              </View>

              <Text style={styles.dailyTitle} numberOfLines={2}>
                {featuredVideo.title}
              </Text>

              <View style={styles.dailyMetaRow}>
                <Text style={styles.dailyMeta}>
                  ⏱ {formatDuration(featuredVideo.duration)}
                </Text>
                <Text style={styles.dailyMeta}>
                  🔥 {Math.round(featuredVideo.estimated_calories || 0)} Kcal
                </Text>
                <Text style={styles.dailyMeta}>
                  💪 {featuredVideo.subcategory || featuredVideo.category}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        )}

        {/* 3 SECTION: YOGA */}
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Yoga</Text>
            <TouchableOpacity
              onPress={() => {
                /* optional: navigate to full list */
              }}
            >
              <Text style={styles.sectionMore}>Xem tất cả</Text>
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <ActivityIndicator size="small" />
          ) : groups.yoga.length ? (
            <FlatList
              data={groups.yoga}
              renderItem={renderWorkoutItem}
              keyExtractor={i => i.id}
              contentContainerStyle={{ paddingHorizontal: 20 }}
              scrollEnabled={false}
            />
          ) : (
            <View style={styles.emptyRow}>
              <Text style={styles.emptyText}>Không có video Yoga.</Text>
            </View>
          )}
        </View>

        {/* TẬP CƠ */}
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Tập cơ</Text>
            <TouchableOpacity onPress={() => {}}>
              <Text style={styles.sectionMore}>Xem tất cả</Text>
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <ActivityIndicator size="small" />
          ) : groups.tapco.length ? (
            <FlatList
              data={groups.tapco}
              renderItem={renderWorkoutItem}
              keyExtractor={i => i.id}
              contentContainerStyle={{ paddingHorizontal: 20 }}
              scrollEnabled={false}
            />
          ) : (
            <View style={styles.emptyRow}>
              <Text style={styles.emptyText}>Không có video Tập cơ.</Text>
            </View>
          )}
        </View>

        {/* DINH DƯỠNG */}
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Dinh dưỡng</Text>
            <TouchableOpacity onPress={() => {}}>
              <Text style={styles.sectionMore}>Xem tất cả</Text>
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <ActivityIndicator size="small" />
          ) : groups.dinhduong.length ? (
            <FlatList
              data={groups.dinhduong}
              renderItem={renderWorkoutItem}
              keyExtractor={i => i.id}
              contentContainerStyle={{ paddingHorizontal: 20 }}
              scrollEnabled={false}
            />
          ) : (
            <View style={styles.emptyRow}>
              <Text style={styles.emptyText}>Không có video Dinh dưỡng.</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Loading / Error full screen fallback (nếu muốn hiện khi danh sách trống) */}
      {!allVideos.length && isLoading && (
        <View style={styles.feedbackContainer}>
          <ActivityIndicator size="large" color="#30C451" />
          <Text style={styles.feedbackText}>Đang tải bài tập...</Text>
        </View>
      )}

      {!allVideos.length && error && (
        <View style={styles.feedbackContainer}>
          <MaterialIcons name="error-outline" size={28} color="#d85b28" />
          <Text style={styles.feedbackText}>{error}</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

export default WorkoutScreen;

/* ============================================================
   STYLES (tham khảo giữ nguyên phần lớn style cũ, thêm vài style section)
============================================================ */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f6f4',
  },

  header: {
    backgroundColor: '#2FAE66',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 28 : 60,
    paddingBottom: 28,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#2FAE66',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  headerIcon: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },

  headerTextWrap: {
    flex: 1,
    alignItems: 'center',
  },

  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  headerSub: {
    marginTop: 4,
    fontSize: 15,
    color: '#CFF7E6',
    fontWeight: '500',
  },

  /* SEARCH */
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f6f3',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 16,
    marginHorizontal: 20,
  },
  searchField: {
    flex: 1,
    fontSize: 16,
    color: '#1f2f24',
  },
  clearButton: {
    padding: 4,
    backgroundColor: '#e2ebe5',
    borderRadius: 12,
  },

  /* DAILY FEATURED (BANNER) */
  dailyCard: {
    marginTop: 20,
    marginHorizontal: 20,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  dailyImage: {
    width: '100%',
    height: 180,
    opacity: 0.9,
  },
  dailyOverlay: {
    position: 'absolute',
    bottom: 12,
    left: 14,
    right: 14,
  },
  dailyTag: {
    backgroundColor: '#2FAE66',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  dailyTagText: {
    color: '#fff',
    fontWeight: '600',
  },
  dailyTitle: {
    color: '#fff',
    fontSize: 20,
    marginTop: 6,
    fontWeight: '700',
  },
  dailyMetaRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
    flexWrap: 'wrap',
  },
  dailyMeta: {
    color: '#fff',
    fontSize: 13,
  },

  /* SECTION */
  sectionWrap: {
    marginTop: 18,
    marginBottom: 6,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1b2d1f',
  },
  sectionMore: {
    color: '#3a6043',
    fontWeight: '600',
  },

  listContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },

  /* ITEM CARD */
  resultCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    gap: 14,
  },
  resultInfo: { flex: 1, gap: 10 },
  resultTitle: { fontSize: 16, fontWeight: '700', color: '#1b2d1f' },

  resultMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  resultMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  resultMetaText: { color: '#566c5f', fontSize: 13 },

  resultThumbnailWrapper: {
    width: 90,
    height: 90,
    borderRadius: 14,
    overflow: 'hidden',
  },
  resultThumbnail: {
    width: '100%',
    height: '100%',
  },
  favoriteButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 28,
    height: 28,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteButtonActive: {
    backgroundColor: '#fff',
  },

  feedbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  feedbackText: {
    color: '#4d6654',
    textAlign: 'center',
  },

  emptyRow: { paddingHorizontal: 20, paddingVertical: 12 },
  emptyText: { color: '#7a8c7f' },
});
