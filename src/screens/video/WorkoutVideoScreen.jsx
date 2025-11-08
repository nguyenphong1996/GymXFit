import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute } from '@react-navigation/native';
import Video from 'react-native-video';
import Icon from 'react-native-vector-icons/MaterialIcons';

import {
  addVideoToFavorites,
  getFavoriteVideos,
  getVideoById,
  removeVideoFromFavorites,
} from '@api/userApi';

const FALLBACK_DESCRIPTION =
  'Tăng cường sức mạnh cơ bắp và độ linh hoạt cho toàn thân. Hít thở đều, giữ tư thế ổn định và thực hiện động tác với nhịp chậm để đạt hiệu quả tối đa.';

const formatDurationLabel = value => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return '00:00';
  const minutes = Math.floor(numeric / 60);
  const seconds = Math.floor(numeric % 60);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const WorkoutVideoScreen = ({ navigation }) => {
  const route = useRoute();
  const videoId = route?.params?.videoId;
  const initialFavorite = Boolean(route?.params?.initialFavorite);

  const [videoData, setVideoData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFavorite, setIsFavorite] = useState(initialFavorite);
  const [isSyncingFavorite, setIsSyncingFavorite] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    const fetchVideoDetails = async () => {
      if (!videoId) {
        setError('Không tìm thấy Video ID được truyền qua.');
        setIsLoading(false);
        return;
      }

      try {
        const response = await getVideoById(videoId);
        if (response.success && response.video) {
          setVideoData(response.video);
        } else {
          setError(response.message || 'Không thể tải dữ liệu video.');
        }
      } catch (err) {
        setError(err.message || 'Lỗi kết nối đến máy chủ.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchVideoDetails();
  }, [videoId]);

  useEffect(() => {
    let isMounted = true;

    const syncFavoriteState = async () => {
      if (!videoId) {
        return;
      }
      try {
        const response = await getFavoriteVideos();
        const list = Array.isArray(response?.data)
          ? response.data
          : response?.favorites || [];
        const found = list.some(item => item.videoId === videoId);
        if (isMounted) {
          setIsFavorite(found);
        }
      } catch (err) {
        console.warn('Không thể đồng bộ trạng thái yêu thích:', err?.message || err);
      }
    };

    syncFavoriteState();

    return () => {
      isMounted = false;
    };
  }, [videoId]);

  const handleToggleFavorite = async () => {
    if (!videoId) {
      return;
    }

    setIsSyncingFavorite(true);
    try {
      if (isFavorite) {
        await removeVideoFromFavorites(videoId);
        setIsFavorite(false);
      } else {
        await addVideoToFavorites(videoId);
        setIsFavorite(true);
      }
    } catch (err) {
      Alert.alert(
        'Không thể cập nhật yêu thích',
        err.message || 'Vui lòng thử lại.',
      );
    } finally {
      setIsSyncingFavorite(false);
    }
  };

  const descriptionText = useMemo(() => {
    const raw = `${videoData?.description || ''}`.trim();
    return raw.length ? raw : FALLBACK_DESCRIPTION;
  }, [videoData?.description]);

  const durationLabel = useMemo(() => formatDurationLabel(videoData?.duration), [videoData?.duration]);

  const viewCount = useMemo(() => {
    const raw =
      videoData?.views ??
      videoData?.viewCount ??
      videoData?.totalViews ??
      videoData?.total_view ??
      videoData?.watchCount ??
      0;
    const numeric = Number(raw);
    return Number.isFinite(numeric) && numeric > 0 ? numeric : 0;
  }, [videoData]);

  const intensityLabel = useMemo(() => {
    const labels = [videoData?.level, videoData?.difficulty, videoData?.subcategory, videoData?.category].filter(Boolean);
    return labels.length ? labels[0] : 'Tổng hợp';
  }, [videoData]);

  const caloriesLabel = useMemo(() => {
    const numeric = Number(videoData?.estimated_calories);
    if (!Number.isFinite(numeric) || numeric <= 0) return '';
    return `${Math.round(numeric)} Kcal`;
  }, [videoData]);

  const viewLabel = useMemo(() => {
    if (!viewCount) return '';
    return `${viewCount} lượt xem`;
  }, [viewCount]);

  const metaChips = useMemo(() => {
    const chips = [{ key: 'duration', icon: 'schedule', label: durationLabel || '00:00' }];
    if (caloriesLabel) {
      chips.push({ key: 'calories', icon: 'local-fire-department', label: caloriesLabel });
    }
    if (viewLabel) {
      chips.push({ key: 'views', icon: 'visibility', label: viewLabel });
    }
    if (intensityLabel) {
      chips.push({ key: 'level', icon: 'fitness-center', label: intensityLabel });
    }
    return chips;
  }, [durationLabel, caloriesLabel, viewLabel, intensityLabel]);

  if (isLoading) {
    return (
      <View style={styles.centerStatus}>
        <ActivityIndicator size="large" color="#20B24A" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerStatus}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!videoData) {
    return (
      <View style={styles.centerStatus}>
        <Text>Không có dữ liệu video.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerWrap}>
        <View style={styles.header}>
          <TouchableOpacity activeOpacity={0.8} style={styles.backWrap} onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={26} color="#20B24A" />
          </TouchableOpacity>

          <Text style={styles.headerText}>{videoData.level || 'Bài tập'}</Text>

          <View style={styles.headerRight}>
            <TouchableOpacity activeOpacity={0.8} onPress={() => setShowSearch(prev => !prev)}>
              <Icon name="search" size={26} color="#20B24A" style={styles.rightIcon} />
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.8}>
              <Icon name="notifications-none" size={26} color="#20B24A" style={styles.rightIcon} />
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.8}>
              <Icon name="person-outline" size={26} color="#20B24A" style={styles.rightIcon} />
            </TouchableOpacity>
          </View>
        </View>

        {showSearch ? (
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm trong mô tả bài tập..."
            placeholderTextColor="#888"
            value={searchText}
            onChangeText={setSearchText}
          />
        ) : null}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.videoContainer}>
          {videoData.streaming_url ? (
            <Video
              source={{ uri: videoData.streaming_url }}
              style={styles.videoPlayer}
              controls
              resizeMode="contain"
              paused={false}
            />
          ) : (
            <View style={[styles.videoPlayer, { backgroundColor: '#000' }]} />
          )}

          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.favoriteBtn}
            onPress={handleToggleFavorite}
            disabled={isSyncingFavorite}
          >
            {isSyncingFavorite ? (
              <ActivityIndicator size="small" color="#FFD700" />
            ) : (
              <Icon name={isFavorite ? 'star' : 'star-border'} size={32} color={isFavorite ? '#FFD700' : '#20B24A'} />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.videoTitle}>{videoData.title}</Text>
          <Text style={styles.videoDescription}>{descriptionText}</Text>

          <View style={styles.chipContainer}>
            {metaChips.map(chip => (
              <View key={chip.key} style={styles.chip}>
                <Icon name={chip.icon} size={16} color="#2f6f4f" />
                <Text style={styles.chipText}>{chip.label}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'ios' ? 36 : 10,
  },
  centerStatus: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
  },
  headerWrap: {
    paddingHorizontal: 18,
    marginBottom: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  backWrap: {
    width: 30,
    alignItems: 'flex-start',
  },
  headerText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rightIcon: {
    marginLeft: 14,
  },
  searchInput: {
    marginTop: 10,
    backgroundColor: '#f1f1f1',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 8,
    fontSize: 16,
    color: '#000',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 60,
  },
  videoContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    position: 'relative',
    marginBottom: 20,
  },
  videoPlayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
  favoriteBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 6,
  },
  infoSection: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    marginTop: 12,
    marginBottom: 28,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    gap: 12,
  },
  videoTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#10381d',
  },
  videoDescription: {
    fontSize: 14,
    color: '#465b4c',
    lineHeight: 20,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#e6f3ec',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipText: {
    fontSize: 13,
    color: '#2f6f4f',
    fontWeight: '600',
  },
});

export default WorkoutVideoScreen;
