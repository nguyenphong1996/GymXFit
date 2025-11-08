import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {
  addVideoToFavorites,
  getAllVideos,
  getFavoriteVideos,
  removeVideoFromFavorites,
} from '@api/userApi';

const formatDuration = (seconds) => {
  if (!seconds && seconds !== 0) {
    return '--:--';
  }
  const totalSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(totalSeconds / 60);
  const remainSeconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainSeconds).padStart(2, '0')} phút`;
};

const LEVEL_OPTIONS = [
  { key: 'beginner', label: 'Người mới' },
  { key: 'intermediate', label: 'Trung cấp' },
  { key: 'advanced', label: 'Nâng cao' },
];

const WorkoutScreen = ({ navigation, route }) => {
  const incomingKeyword =
    typeof route?.params?.keyword === 'string' ? route.params.keyword : '';
  const keywordRef = useRef(incomingKeyword);

  const [searchText, setSearchText] = useState(incomingKeyword);
  const [debouncedSearch, setDebouncedSearch] = useState(incomingKeyword.trim());
  const [favoriteMap, setFavoriteMap] = useState({});
  const [updatingFavoriteId, setUpdatingFavoriteId] = useState(null);
  const [activeLevel, setActiveLevel] = useState(LEVEL_OPTIONS[0].key);

  const [videos, setVideos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (incomingKeyword !== keywordRef.current) {
      keywordRef.current = incomingKeyword;
      setSearchText(incomingKeyword);
      setDebouncedSearch(incomingKeyword.trim());
    }
  }, [incomingKeyword]);

  const fetchVideos = useCallback(async (query = '') => {
    setIsLoading(true);
    setError(null);
    const trimmedQuery = query.trim();
    try {
      const response = await getAllVideos({
        limit: 30,
        ...(trimmedQuery ? { search: trimmedQuery } : {}),
      });
      if (response?.success) {
        const rawVideos = response.videos || [];
        if (!trimmedQuery) {
          setVideos(rawVideos);
        } else {
          const normalizedQuery = trimmedQuery.toLowerCase();
          const rankedVideos = rawVideos
            .map((video, index) => {
              const title = (video.title || '').toLowerCase();
              const category = (video.subcategory || video.category || '').toLowerCase();
              const score =
                (title === normalizedQuery ? 5 : 0) +
                (title.includes(normalizedQuery) ? 3 : 0) +
                (category.includes(normalizedQuery) ? 2 : 0);
              return { video, score, index };
            })
            .sort((a, b) => {
              if (b.score === a.score) {
                return a.index - b.index;
              }
              return b.score - a.score;
            })
            .map((entry) => entry.video);
          setVideos(rankedVideos);
        }
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

  const fetchFavorites = useCallback(async () => {
    try {
      const response = await getFavoriteVideos();
      const list = Array.isArray(response?.data)
        ? response.data
        : response?.favorites || [];
      const mapped = {};
      list.forEach(item => {
        const videoId = item.videoId || item.id;
        if (videoId) {
          mapped[videoId] = item;
        }
      });
      setFavoriteMap(mapped);
    } catch (err) {
      console.warn('Không thể tải danh sách yêu thích:', err?.message || err);
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

  useFocusEffect(
    useCallback(() => {
      fetchFavorites();
    }, [fetchFavorites]),
  );

  const handleSearchChange = useCallback((text) => {
    setSearchText(text);
  }, []);

  const handleSearchSubmit = useCallback(() => {
    setDebouncedSearch(searchText.trim());
    Keyboard.dismiss();
  }, [searchText]);

  const handleClearSearch = useCallback(() => {
    setSearchText('');
    setDebouncedSearch('');
    Keyboard.dismiss();
  }, []);

  const toggleFavorite = useCallback(
    async video => {
      const videoId = video?.id;
      if (!videoId) {
        return;
      }

      const currentlyFavorite = Boolean(favoriteMap[videoId]);
      setUpdatingFavoriteId(videoId);

      try {
        if (currentlyFavorite) {
          await removeVideoFromFavorites(videoId);
          setFavoriteMap(prev => {
            const next = { ...prev };
            delete next[videoId];
            return next;
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
        Alert.alert(
          'Không thể cập nhật yêu thích',
          error.message || 'Vui lòng thử lại.',
        );
      } finally {
        setUpdatingFavoriteId(null);
      }
    },
    [favoriteMap],
  );

  const handleNavigateToVideo = (videoId) => {
    navigation.navigate('WorkoutVideo', {
      videoId,
      initialFavorite: Boolean(favoriteMap[videoId]),
    });
  };

  const renderWorkoutItem = ({ item, index }) => {
    const isTopResult = Boolean(searchText.trim().length) && index === 0;
    const isFavorite = Boolean(favoriteMap[item.id]);
    const isUpdating = updatingFavoriteId === item.id;
    const caloriesLabel = Number.isFinite(Number(item.estimated_calories))
      ? `${Math.round(Number(item.estimated_calories))} Kcal`
      : '--';

    return (
      <TouchableOpacity
        style={[styles.resultCard, isTopResult && styles.topResultCard]}
        activeOpacity={0.88}
        onPress={() => handleNavigateToVideo(item.id)}
      >
        <View style={styles.resultInfo}>
          <View style={styles.resultTitleRow}>
            {isTopResult ? (
              <View style={styles.topResultBadge}>
                <MaterialIcons name="push-pin" size={14} color="#2f6f4f" />
                <Text style={styles.topResultBadgeText}>Kết quả ưu tiên</Text>
              </View>
            ) : null}
            <Text style={styles.resultTitle} numberOfLines={2}>
              {item.title}
            </Text>
          </View>

          <View style={styles.resultMetaRow}>
            <View style={styles.resultMetaItem}>
              <MaterialIcons name="schedule" size={16} color="#4d6654" />
              <Text style={styles.resultMetaText}>{formatDuration(item.duration)}</Text>
            </View>
            <View style={styles.resultMetaItem}>
              <MaterialIcons name="local-fire-department" size={16} color="#d85b28" />
              <Text style={styles.resultMetaText}>{caloriesLabel}</Text>
            </View>
            <View style={styles.resultMetaItem}>
              <MaterialIcons name="category" size={16} color="#3a6043" />
              <Text style={styles.resultMetaText}>{item.subcategory || item.category}</Text>
            </View>
          </View>
        </View>

        <View style={styles.resultThumbnailWrapper}>
          {item.thumbnail ? (
            <Image source={{ uri: item.thumbnail }} style={styles.resultThumbnail} />
          ) : (
            <Image source={require('@assets/images/workout1.jpg')} style={styles.resultThumbnail} />
          )}
          <TouchableOpacity
            style={[styles.favoriteButton, isFavorite && styles.favoriteButtonActive, isUpdating && { opacity: 0.6 }]}
            onPress={() => toggleFavorite(item)}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            disabled={isUpdating}
          >
            <MaterialIcons
              name={isFavorite ? 'favorite' : 'favorite-border'}
              size={20}
              color={isFavorite ? '#f05454' : '#ffffff'}
            />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const featuredVideo = useMemo(() => (videos.length ? videos[0] : null), [videos]);
  const remainingVideos = useMemo(
    () => (featuredVideo ? videos.slice(1) : videos),
    [videos, featuredVideo],
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerArea}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialIcons name="arrow-back" size={24} color="#145724" />
          </TouchableOpacity>
          <Text style={styles.title}>Bài tập</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.iconButton} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <MaterialIcons name="notifications-none" size={24} color="#145724" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <MaterialIcons name="person-outline" size={24} color="#145724" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.searchBar}>
          <MaterialIcons name="search" size={20} color="#4d6654" />
          <TextInput
            style={styles.searchField}
            placeholder="Tìm kiếm bài tập, chủ đề..."
            placeholderTextColor="#7a8c7f"
            value={searchText}
            onChangeText={handleSearchChange}
            returnKeyType="search"
            autoCorrect={false}
            onSubmitEditing={handleSearchSubmit}
          />
          {searchText.length ? (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={handleClearSearch}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <MaterialIcons name="close" size={18} color="#7a8c7f" />
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity
            style={styles.searchAction}
            onPress={handleSearchSubmit}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <MaterialIcons name="arrow-forward" size={20} color="#1f7a3a" />
          </TouchableOpacity>
        </View>

        <View style={styles.levelContainer}>
          {LEVEL_OPTIONS.map((option) => {
            const isActive = option.key === activeLevel;
            return (
              <TouchableOpacity
                key={option.key}
                style={[styles.levelChip, isActive && styles.levelChipActive]}
                onPress={() => setActiveLevel(option.key)}
                activeOpacity={0.85}
              >
                <Text style={[styles.levelChipText, isActive && styles.levelChipTextActive]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {isLoading ? (
        <View style={styles.feedbackContainer}>
          <ActivityIndicator size="large" color="#30C451" />
          <Text style={styles.feedbackText}>Đang tải bài tập...</Text>
        </View>
      ) : error ? (
        <View style={styles.feedbackContainer}>
          <MaterialIcons name="error-outline" size={28} color="#d85b28" />
          <Text style={styles.feedbackText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => fetchVideos(debouncedSearch)}
            activeOpacity={0.85}
          >
            <Text style={styles.retryText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={remainingVideos}
          keyExtractor={(item) => item.id}
          renderItem={renderWorkoutItem}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            featuredVideo ? (
              <TouchableOpacity
                style={styles.featuredCardWrapper}
                activeOpacity={0.9}
                onPress={() => handleNavigateToVideo(featuredVideo.id)}
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
                  <View style={styles.featuredBadge}>
                    <MaterialIcons name="bolt" size={16} color="#fff" />
                    <Text style={styles.featuredBadgeText}>Bài tập trong ngày</Text>
                  </View>
                  <Text style={styles.featuredTitle} numberOfLines={2}>
                    {featuredVideo.title}
                  </Text>
                  <View style={styles.featuredMetaRow}>
                    <View style={styles.featuredMetaItem}>
                      <MaterialIcons name="schedule" size={16} color="#fff" />
                      <Text style={styles.featuredMetaText}>{formatDuration(featuredVideo.duration)}</Text>
                    </View>
                    <View style={styles.featuredMetaItem}>
                      <MaterialIcons name="local-fire-department" size={16} color="#fff" />
                      <Text style={styles.featuredMetaText}>
                        {Number.isFinite(Number(featuredVideo.estimated_calories))
                          ? `${Math.round(Number(featuredVideo.estimated_calories))} Kcal`
                          : '--'}
                      </Text>
                    </View>
                    <View style={styles.featuredMetaItem}>
                      <MaterialIcons name="category" size={16} color="#fff" />
                      <Text style={styles.featuredMetaText}>
                        {featuredVideo.subcategory || featuredVideo.category}
                      </Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ) : (
              <View style={styles.featuredPlaceholder} />
            )
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialIcons name="sentiment-dissatisfied" size={32} color="#7a8c7f" />
              <Text style={styles.feedbackText}>Không tìm thấy bài tập phù hợp.</Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

export default WorkoutScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f6f4',
  },
  headerArea: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 18,
    backgroundColor: '#ffffff',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconButton: {
    padding: 8,
    borderRadius: 14,
    backgroundColor: '#e6f3ec',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#10381d',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f6f3',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 18,
    gap: 10,
  },
  searchField: {
    flex: 1,
    fontSize: 16,
    color: '#1f2f24',
    paddingVertical: 0,
  },
  clearButton: {
    padding: 4,
    borderRadius: 12,
    backgroundColor: '#e2ebe5',
  },
  searchAction: {
    padding: 6,
    borderRadius: 12,
    backgroundColor: '#d4f0df',
  },
  levelContainer: {
    flexDirection: 'row',
    marginTop: 16,
    justifyContent: 'space-between',
  },
  levelChip: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 4,
    borderRadius: 14,
    backgroundColor: '#e6f3ec',
    alignItems: 'center',
  },
  levelChipActive: {
    backgroundColor: '#1f7a3a',
  },
  levelChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f7a3a',
  },
  levelChipTextActive: {
    color: '#ffffff',
  },
  feedbackContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 14,
  },
  feedbackText: {
    textAlign: 'center',
    fontSize: 15,
    color: '#4d6654',
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: '#30C451',
    borderRadius: 12,
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    paddingTop: 16,
  },
  featuredCardWrapper: {
    borderRadius: 22,
    overflow: 'hidden',
    marginBottom: 20,
    backgroundColor: '#000',
  },
  featuredImage: {
    width: '100%',
    height: 210,
  },
  featuredOverlay: {
    position: 'absolute',
    inset: 0,
    padding: 20,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.35)',
    gap: 12,
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: 'rgba(48,196,81,0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  featuredBadgeText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 0.3,
  },
  featuredTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
  },
  featuredMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  featuredMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  featuredMetaText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  featuredPlaceholder: {
    height: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  resultCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    gap: 16,
  },
  topResultCard: {
    borderWidth: 1.5,
    borderColor: '#30C451',
  },
  resultInfo: {
    flex: 1,
    gap: 12,
  },
  resultTitleRow: {
    gap: 8,
  },
  topResultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    backgroundColor: '#d8f2e0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  topResultBadgeText: {
    color: '#2f6f4f',
    fontSize: 12,
    fontWeight: '600',
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1b2d1f',
  },
  resultMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  resultMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  resultMetaText: {
    fontSize: 13,
    color: '#566c5f',
  },
  resultThumbnailWrapper: {
    width: 96,
    height: 96,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
  },
  resultThumbnail: {
    width: '100%',
    height: '100%',
  },
  favoriteButton: {
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
  favoriteButtonActive: {
    backgroundColor: '#ffffff',
  },
});
