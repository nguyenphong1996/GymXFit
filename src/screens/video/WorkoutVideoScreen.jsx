import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Keyboard,
} from 'react-native';

import Video from 'react-native-video';
import { useRoute } from '@react-navigation/native';
import { getVideoById } from '@api/userApi';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const formatTime = (rawSeconds) => {
  if (!Number.isFinite(rawSeconds)) return '00:00';
  const totalSeconds = Math.max(0, Math.floor(rawSeconds));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const FALLBACK_DESCRIPTION =
  'Tăng cường sức mạnh cơ bắp và độ linh hoạt cho toàn thân. Hít thở đều, giữ tư thế ổn định và thực hiện động tác với nhịp chậm để đạt hiệu quả tối đa.';

const WorkoutVideoScreen = ({ navigation }) => {
  const route = useRoute();
  const videoId = route?.params?.videoId;
  const videoRef = useRef(null);
  const searchInputRef = useRef(null);

  const [videoData, setVideoData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const fetchVideoDetails = async () => {
      if (!videoId) {
        setError('Không tìm thấy video được yêu cầu.');
        setIsLoading(false);
        return;
      }

      try {
        const response = await getVideoById(videoId);
        if (response.success && response.video) {
          setVideoData(response.video);
          setDuration(Number(response.video.duration) || 0);
        } else {
          setError(response.message || 'Không thể tải dữ liệu video.');
        }
      } catch (err) {
        setError(err.message || 'Đã xảy ra lỗi khi tải video.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchVideoDetails();
  }, [videoId]);

  useEffect(() => {
    if (showSearch) {
      searchInputRef.current?.focus();
    }
  }, [showSearch]);

  const handleToggleFavorite = useCallback(() => {
    setIsFavorite((prev) => !prev);
  }, []);

  const handleToggleSearch = useCallback(() => {
    setShowSearch((prev) => {
      const next = !prev;
      if (!next) {
        setSearchText('');
        Keyboard.dismiss();
      }
      return next;
    });
  }, []);

  const handleSearchChange = useCallback((value) => {
    setSearchText(value);
  }, []);

  const handleSearchSubmit = useCallback(() => {
    Keyboard.dismiss();
  }, []);

  const handleTogglePlay = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  const effectiveDuration = useMemo(
    () => (duration || Number(videoData?.duration) || 0),
    [duration, videoData?.duration],
  );

  const handleSeekRelative = useCallback(
    (offsetSeconds) => {
      const baseDuration = effectiveDuration > 0 ? effectiveDuration : Math.max(currentTime, 0);
      const target = Math.min(Math.max(currentTime + offsetSeconds, 0), baseDuration);
      if (videoRef.current && Number.isFinite(target)) {
        videoRef.current.seek(target);
      }
      setCurrentTime(target);
    },
    [currentTime, effectiveDuration],
  );

  const handleRewind = useCallback(() => handleSeekRelative(-10), [handleSeekRelative]);
  const handleForward = useCallback(() => handleSeekRelative(10), [handleSeekRelative]);

  const handleProgress = useCallback(
    (progress) => {
      if (!progress?.currentTime && progress?.currentTime !== 0) return;
      setCurrentTime(progress.currentTime);
    },
    [],
  );

  const handleLoad = useCallback(
    (meta) => {
      if (meta?.duration) {
        setDuration(Number(meta.duration));
      }
    },
    [setDuration],
  );

  const handleEnd = useCallback(() => {
    setIsPlaying(false);
    setCurrentTime(effectiveDuration);
  }, [effectiveDuration]);

  const formattedCurrentTime = useMemo(() => formatTime(currentTime), [currentTime]);
  const formattedDuration = useMemo(
    () => formatTime(effectiveDuration),
    [effectiveDuration],
  );

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
    const labels = [
      videoData?.level,
      videoData?.difficulty,
      videoData?.subcategory,
      videoData?.category,
    ].filter(Boolean);
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
    const chips = [
      { key: 'duration', icon: 'schedule', label: formattedDuration },
    ];
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
  }, [formattedDuration, caloriesLabel, viewLabel, intensityLabel]);

  const descriptionText = useMemo(() => {
    const rawDescription = `${videoData?.description || ''}`.trim();
    return rawDescription.length ? rawDescription : FALLBACK_DESCRIPTION;
  }, [videoData]);

  const progressPercentage = useMemo(() => {
    if (!effectiveDuration) return 0;
    return Math.min(Math.max((currentTime / effectiveDuration) * 100, 0), 100);
  }, [currentTime, effectiveDuration]);

  if (isLoading) {
    return (
      <View style={styles.statusContainer}>
        <ActivityIndicator size="large" color="#30C451" />
        <Text style={styles.statusText}>Đang tải video...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.statusContainer}>
        <MaterialIcons name="error-outline" size={36} color="#d85b28" />
        <Text style={styles.statusText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
          <Text style={styles.retryText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!videoData) {
    return (
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>Không có dữ liệu video.</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
          <Text style={styles.retryText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerArea}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.headerIconButton}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialIcons name="arrow-back" size={24} color="#145724" />
          </TouchableOpacity>

          <View style={styles.headerTitleBlock}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {intensityLabel}
            </Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {videoData.title}
            </Text>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerIconButton}
              onPress={handleToggleSearch}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialIcons name="search" size={22} color="#145724" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerIconButton} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <MaterialIcons name="notifications-none" size={22} color="#145724" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerIconButton} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <MaterialIcons name="person-outline" size={22} color="#145724" />
            </TouchableOpacity>
          </View>
        </View>

        {showSearch ? (
          <View style={styles.searchBar}>
            <MaterialIcons name="search" size={20} color="#4d6654" />
            <TextInput
              ref={searchInputRef}
              style={styles.searchInput}
              placeholder="Tìm kiếm trong video..."
              placeholderTextColor="#6a7c6f"
              value={searchText}
              onChangeText={handleSearchChange}
              returnKeyType="search"
              onSubmitEditing={handleSearchSubmit}
            />
            {searchText.length ? (
              <TouchableOpacity
                style={styles.searchClear}
                onPress={() => setSearchText('')}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <MaterialIcons name="close" size={18} color="#6a7c6f" />
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.videoSection}>
          <View style={styles.videoSurface}>
            {videoData.streaming_url ? (
              <Video
                ref={videoRef}
                source={{ uri: videoData.streaming_url }}
                style={styles.videoPlayer}
                resizeMode="cover"
                paused={!isPlaying}
                onProgress={handleProgress}
                onLoad={handleLoad}
                onEnd={handleEnd}
              />
            ) : (
              <Image
                source={require('@assets/images/workout1.jpg')}
                style={styles.videoPlayer}
                resizeMode="cover"
              />
            )}

            <TouchableOpacity
              style={styles.favoriteFab}
              onPress={handleToggleFavorite}
              activeOpacity={0.85}
            >
              <MaterialIcons
                name={isFavorite ? 'favorite' : 'favorite-border'}
                size={24}
                color={isFavorite ? '#f05454' : '#ffffff'}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.playerControlRow}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={handleRewind}
              activeOpacity={0.8}
            >
              <MaterialIcons name="replay-10" size={26} color="#1b2d1f" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.controlPlayButton}
              onPress={handleTogglePlay}
              activeOpacity={0.9}
            >
              <MaterialIcons
                name={isPlaying ? 'pause-circle-filled' : 'play-circle-filled'}
                size={48}
                color="#30C451"
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={handleForward}
              activeOpacity={0.8}
            >
              <MaterialIcons name="forward-10" size={26} color="#1b2d1f" />
            </TouchableOpacity>
          </View>

          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>{formattedCurrentTime}</Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressIndicator, { width: `${progressPercentage}%` }]} />
            </View>
            <Text style={styles.progressLabel}>{formattedDuration}</Text>
          </View>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.videoTitle}>{videoData.title}</Text>
          <Text style={styles.videoDescription}>{descriptionText}</Text>

          <View style={styles.chipContainer}>
            {metaChips.map((chip) => (
              <View key={chip.key} style={styles.chip}>
                <MaterialIcons name={chip.icon} size={16} color="#2f6f4f" />
                <Text style={styles.chipText}>{chip.label}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// ---------------- STYLES ----------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f6f4',
  },
  statusContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    paddingHorizontal: 28,
    backgroundColor: '#f3f6f4',
  },
  statusText: {
    fontSize: 15,
    color: '#4d6654',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 4,
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
    gap: 12,
  },
  headerIconButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#e6f3ec',
  },
  headerTitleBlock: {
    flex: 1,
    marginHorizontal: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10381d',
  },
  headerSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: '#4d6654',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchBar: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f6f3',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1f2f24',
    paddingVertical: 0,
  },
  searchClear: {
    padding: 4,
    borderRadius: 10,
    backgroundColor: '#e2ebe5',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    paddingBottom: 40,
    gap: 24,
  },
  videoSection: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    gap: 18,
  },
  videoSurface: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#000',
    position: 'relative',
  },
  videoPlayer: {
    position: 'absolute',
    inset: 0,
  },
  favoriteFab: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  playerControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  controlButton: {
    padding: 8,
    borderRadius: 14,
    backgroundColor: '#eef6f0',
  },
  controlPlayButton: {
    padding: 4,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 4,
  },
  progressLabel: {
    fontSize: 12,
    color: '#4d6654',
    minWidth: 42,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 999,
    backgroundColor: '#e2ebe5',
    overflow: 'hidden',
  },
  progressIndicator: {
    height: '100%',
    backgroundColor: '#30C451',
    borderRadius: 999,
  },
  infoSection: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
    gap: 16,
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
