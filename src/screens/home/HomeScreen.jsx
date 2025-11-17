import React, { useState, useContext, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Text,
  View,
  Image,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Animated,
  Alert,
  TextInput,
  Keyboard,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { UserContext } from '@context/UserContext';
import { getAllVideos } from '@api/userApi';
import { searchAvailableClasses } from '@api/classesApi';

const MATERIAL_COLORS = {
  primary: '#1F8E4A',
  onPrimary: '#FFFFFF',
  primaryContainer: '#C2F0D4',
  background: '#F5F7F6',
  surface: '#FFFFFF',
  surfaceVariant: '#E7EFE8',
  outline: '#D7E5DB',
  textPrimary: '#10241A',
  textSecondary: '#47614F',
  secondary: '#3A5B4C',
  error: '#B3261E',
};

const ELEVATION = {
  shadowColor: 'rgba(16, 36, 26, 0.12)',
  shadowOpacity: 0.9,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 8 },
  elevation: 4,
};

const formatDateLabel = (date) => {
  try {
    return new Date(date).toLocaleDateString('vi-VN', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
    });
  } catch {
    return '--/--';
  }
};

const formatTimeRange = (start, end) => {
  try {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const formatter = (value) =>
      value.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    return `${formatter(startDate)} - ${formatter(endDate)}`;
  } catch {
    return '--:--';
  }
};

const formatDurationLabel = (rawDuration) => {
  const numericDuration = Number(rawDuration);
  if (!Number.isFinite(numericDuration) || numericDuration <= 0) return null;

  const totalSeconds = Math.round(numericDuration);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  const secondsLabel = seconds < 10 ? `0${seconds}` : `${seconds}`;
  return `${minutes} phút ${secondsLabel} giây`;
};

const getViewCount = (video) => {
  if (!video) return 0;
  const possibleKeys = [
    'viewCount',
    'views',
    'totalViews',
    'total_view',
    'view_count',
    'watchCount',
  ];
  for (const key of possibleKeys) {
    const value = video[key];
    if (typeof value === 'number') return value;
    if (typeof value === 'string' && value.trim() !== '') return Number(value) || 0;
  }
  if (video.metrics && typeof video.metrics === 'object') {
    const metricKeys = ['viewCount', 'views', 'totalViews'];
    for (const key of metricKeys) {
      const metricValue = video.metrics[key];
      if (typeof metricValue === 'number') return metricValue;
      if (typeof metricValue === 'string' && metricValue.trim() !== '') {
        return Number(metricValue) || 0;
      }
    }
  }
  return 0;
};

const CATEGORY_CONFIG = {
  workout: {
    label: 'Workout',
    subcategories: [
      'Upper Body',
      'Lower Body',
      'Back',
      'Legs',
      'Full Body',
      'Core',
      'Chest',
      'Shoulders',
      'Arms',
      'Glutes',
    ],
  },
  cardio: {
    label: 'Cardio',
    subcategories: [
      'Running',
      'Cycling',
      'Jump Rope',
      'HIIT',
      'Dance',
      'Swimming',
      'Rowing',
      'Elliptical',
    ],
  },
  stretching: {
    label: 'Stretching',
    subcategories: [
      'Flexibility',
      'Mobility',
      'Dynamic Stretch',
      'Static Stretch',
      'Yoga Stretches',
      'Recovery',
    ],
  },
  nutrition: {
    label: 'Nutrition',
    subcategories: [
      'Meal Prep',
      'Recipes',
      'Nutrition Tips',
      'Supplements',
      'Diet Plans',
      'Hydration',
    ],
  },
  yoga: {
    label: 'Yoga',
    subcategories: [
      'Hatha Yoga',
      'Vinyasa Yoga',
      'Power Yoga',
      'Yin Yoga',
      'Ashtanga Yoga',
      'Beginner Yoga',
    ],
  },
  other: {
    label: 'Other',
    subcategories: ['General', 'Tips', 'Motivation', 'Education'],
  },
};

const DEFAULT_CATEGORY_KEY = 'other';
const CATEGORY_ORDER = ['workout', 'cardio', 'stretching', 'nutrition', 'yoga', 'other'];
const PRIMARY_VIDEO_FETCH_LIMIT = Math.max(CATEGORY_ORDER.length * 8, 48);
const ADDITIONAL_CATEGORY_FETCH_LIMIT = 12;

const normalizeKey = (value) =>
  typeof value === 'string' ? value.trim().toLowerCase() : '';

const buildSubcategoryMap = (list) =>
  list.reduce((acc, name) => {
    acc[normalizeKey(name)] = name;
    return acc;
  }, {});

Object.keys(CATEGORY_CONFIG).forEach((key) => {
  CATEGORY_CONFIG[key].subcategoryMap = buildSubcategoryMap(
    CATEGORY_CONFIG[key].subcategories || [],
  );
});

const resolveCategoryInfo = (categoryRaw) => {
  const normalized = normalizeKey(categoryRaw);

  if (normalized) {
    for (const key of Object.keys(CATEGORY_CONFIG)) {
      const config = CATEGORY_CONFIG[key];
      if (normalized === key || normalized === normalizeKey(config.label)) {
        return { key, label: config.label };
      }
    }
  }

  const fallbackConfig = CATEGORY_CONFIG[DEFAULT_CATEGORY_KEY];
  return { key: DEFAULT_CATEGORY_KEY, label: fallbackConfig.label };
};

const resolveSubcategoryInfo = (categoryKey, subcategoryRaw) => {
  const config = CATEGORY_CONFIG[categoryKey];
  if (!config) return { key: '', label: '' };

  const normalized = normalizeKey(subcategoryRaw);
  if (normalized && config.subcategoryMap[normalized]) {
    const label = config.subcategoryMap[normalized];
    return { key: normalized, label };
  }

  if (!normalized && categoryKey === 'other') {
    const defaultLabel = 'General';
    return { key: normalizeKey(defaultLabel), label: defaultLabel };
  }

  return { key: '', label: '' };
};

const getVideoCategoryInfo = (video) => {
  let categoryResult = resolveCategoryInfo(video?.category);
  let subcategoryResult = resolveSubcategoryInfo(categoryResult.key, video?.subcategory);

  if (!subcategoryResult.label && video?.subcategory) {
    const normalizedSub = normalizeKey(video.subcategory);
    for (const key of Object.keys(CATEGORY_CONFIG)) {
      const candidateConfig = CATEGORY_CONFIG[key];
      if (candidateConfig.subcategoryMap[normalizedSub]) {
        categoryResult = { key, label: candidateConfig.label };
        subcategoryResult = {
          key: normalizedSub,
          label: candidateConfig.subcategoryMap[normalizedSub],
        };
        break;
      }
    }

    if (!subcategoryResult.label) {
      subcategoryResult = resolveSubcategoryInfo(categoryResult.key, '');
    }
  }

  const sectionKey = `${categoryResult.key}__${subcategoryResult.key || 'none'}`;

  return {
    categoryKey: categoryResult.key,
    categoryLabel: categoryResult.label,
    subcategoryKey: subcategoryResult.key,
    subcategoryLabel: subcategoryResult.label,
    sectionKey,
  };
};

const collectCategoryKeysFromVideos = (list) => {
  const categoryKeys = new Set();
  list.forEach((video) => {
    const info = getVideoCategoryInfo(video);
    if (info.categoryKey) {
      categoryKeys.add(info.categoryKey);
    }
  });
  return categoryKeys;
};

const QuickActions = ({
  navigation,
  onNavigateBooking,
  onNavigateTrainer,
  quickActionLoading,
}) => (
  <View style={styles.tabBarContainer}>
    <View style={styles.tabBar}>
      <TouchableOpacity
        style={styles.itemTabBar}
        onPress={() => navigation.navigate('WorkoutScreen')}
      >
        <View style={styles.bgImage}>
          <MaterialCommunityIcons name="dumbbell" size={28} color={MATERIAL_COLORS.primary} />
        </View>
        <Text style={styles.itemText}>Workout</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.itemTabBar}
        onPress={() => {
          if (onNavigateBooking) {
            onNavigateBooking();
          } else {
            navigation.navigate('SearchCalendarScreen');
          }
        }}
        disabled={quickActionLoading === 'booking'}
      >
        <View style={styles.bgImage}>
          {quickActionLoading === 'booking' ? (
            <ActivityIndicator size="small" color={MATERIAL_COLORS.primary} />
          ) : (
            <MaterialCommunityIcons name="calendar-plus" size={28} color={MATERIAL_COLORS.primary} />
          )}
        </View>
        <Text style={styles.itemText}>Schedule</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.itemTabBar}
        onPress={() => {
          if (onNavigateTrainer) {
            onNavigateTrainer();
          } else {
            navigation.navigate('BookScreen');
          }
        }}
        disabled={quickActionLoading === 'trainer'}
      >
        <View style={styles.bgImage}>
          {quickActionLoading === 'trainer' ? (
            <ActivityIndicator size="small" color={MATERIAL_COLORS.primary} />
          ) : (
            <MaterialCommunityIcons name="account-tie" size={28} color={MATERIAL_COLORS.primary} />
          )}
        </View>
        <Text style={styles.itemText}>Coaching</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.itemTabBar}
        onPress={() => navigation.navigate('CardMembershipScreen')}
      >
        <View style={styles.bgImage}>
          <MaterialCommunityIcons
            name="card-account-details-outline"
            size={28}
            color={MATERIAL_COLORS.primary}
          />
        </View>
        <Text style={styles.itemText}>Services</Text>
      </TouchableOpacity>
    </View>
  </View>
);

const VideoCarousel = ({ title, data, onPressVideo, onPressSeeAll }) => (
  <View style={styles.sectionWrapper}>
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {onPressSeeAll ? (
        <TouchableOpacity style={styles.sectionAction} onPress={onPressSeeAll}>
          <Text style={styles.sectionActionText}>Tất cả</Text>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#08843a" />
        </TouchableOpacity>
      ) : null}
    </View>

    <FlatList
      data={data}
      renderItem={({ item }) => <VideoCard video={item} onPress={onPressVideo} />}
      keyExtractor={(item) => item.id}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.horizontalListContent}
      ItemSeparatorComponent={() => <View style={styles.horizontalSpacer} />}
    />
  </View>
);

const HighlightClasses = ({ classes, onPressClass }) => {
  if (!classes.length) return null;

  return (
    <View style={styles.sectionWrapper}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Lớp sắp diễn ra</Text>
        <TouchableOpacity style={styles.sectionAction} onPress={() => onPressClass()}>
          <Text style={styles.sectionActionText}>Đặt lịch</Text>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#08843a" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={classes}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.classCard}
            activeOpacity={0.85}
            onPress={() => onPressClass(item)}
          >
            <View style={styles.classTimeBadge}>
              <Text style={styles.classTimeText}>{formatDateLabel(item.startTime)}</Text>
            </View>
            <Text style={styles.className}>{item.name}</Text>
            <Text style={styles.classSchedule}>{formatTimeRange(item.startTime, item.endTime)}</Text>
            {item.location ? (
              <View style={styles.classLocationRow}>
                <MaterialIcons name="location-on" size={16} color="#30C451" />
                <Text style={styles.classLocationText}>{item.location}</Text>
              </View>
            ) : null}
            <Text style={styles.classSpots}>
              {item.availableSpots} chỗ trống • PT {item.instructor?.name || 'GymXFit'}
            </Text>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item.classId}
        horizontal
        showsHorizontalScrollIndicator={false}
      />
    </View>
  );
};

const VideoCard = ({ video, onPress }) => {
  const { categoryLabel, subcategoryLabel } = getVideoCategoryInfo(video);
  const subtitleParts = [categoryLabel];
  if (subcategoryLabel && subcategoryLabel !== categoryLabel) {
    subtitleParts.push(subcategoryLabel);
  }
  const subtitle = subtitleParts.filter(Boolean).join(' • ') || categoryLabel || 'Other';

  const durationLabel = formatDurationLabel(video.duration);
  const caloriesValue = Number(video.estimated_calories);
  const caloriesLabel =
    Number.isFinite(caloriesValue) && caloriesValue > 0 ? `${Math.round(caloriesValue)} kcal` : null;
  const hasMeta = Boolean(durationLabel || caloriesLabel);

  const badgeScale = useRef(new Animated.Value(1)).current;

  const animateBadge = useCallback(
    (toValue) => {
      Animated.spring(badgeScale, {
        toValue,
        useNativeDriver: true,
        friction: 6,
        tension: 160,
      }).start();
    },
    [badgeScale],
  );

  const handlePressIn = useCallback(() => animateBadge(0.92), [animateBadge]);
  const handlePressOut = useCallback(() => animateBadge(1), [animateBadge]);
  const handlePress = useCallback(() => onPress(video), [onPress, video]);

  return (
    <TouchableOpacity
      style={styles.videoCard}
      activeOpacity={0.85}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <View style={styles.videoCardImageWrapper}>
        {video.thumbnail ? (
          <Image style={styles.videoCardImage} source={{ uri: video.thumbnail }} />
        ) : (
          <Image style={styles.videoCardImage} source={require('@assets/images/lesmils1.jpg')} />
        )}
        <Animated.View style={[styles.videoBadge, { transform: [{ scale: badgeScale }] }]}>
          <View pointerEvents="none" style={styles.videoBadgeHighlight} />
          <MaterialCommunityIcons name="play-circle" size={14} color="#fff" />
          <Text style={styles.videoBadgeText}>Xem ngay</Text>
        </Animated.View>
      </View>

      <View style={styles.videoCardContent}>
        <Text style={styles.videoCardTitle} numberOfLines={2}>
          {video.title}
        </Text>
        <Text style={styles.videoCardSubtitle} numberOfLines={1}>
          {subtitle}
        </Text>

        {hasMeta ? (
          <View style={styles.videoMetaRow}>
            {durationLabel ? (
              <View style={styles.videoMetaItem}>
                <MaterialCommunityIcons name="timer-outline" size={14} color="#3a6043" />
                <Text style={styles.videoMetaText}>{durationLabel}</Text>
              </View>
            ) : null}
            {caloriesLabel ? (
              <View style={styles.videoMetaItem}>
                <MaterialCommunityIcons name="fire" size={14} color="#e86a33" />
                <Text style={styles.videoMetaText}>{caloriesLabel}</Text>
              </View>
            ) : null}
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
};

const CategorySection = ({ categoryLabel, videos, onPressVideo }) => {
  const hasVideos = Boolean(videos?.length);
  return (
    <View style={styles.sectionWrapper}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{categoryLabel}</Text>
      </View>
      {hasVideos ? (
        <FlatList
          horizontal
          data={videos}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <VideoCard video={item} onPress={onPressVideo} />}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalListContent}
          ItemSeparatorComponent={() => <View style={styles.horizontalSpacer} />}
        />
      ) : (
        <View style={styles.categoryEmpty}>
          <Text style={styles.categoryEmptyText}>Nội dung đang được cập nhật cho hạng mục này.</Text>
        </View>
      )}
    </View>
  );
};

const HomeScreen = ({ navigation }) => {
  const { user } = useContext(UserContext);
  const userName = user?.name || user?.phone || 'hội viên';

  const [videos, setVideos] = useState([]);
  const [highlightClasses, setHighlightClasses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [quickActionLoading, setQuickActionLoading] = useState(null);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');

  const fetchHomeData = useCallback(async (isPullToRefresh = false) => {
    if (isPullToRefresh) {
      setRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const [videosResponse, classesResponse] = await Promise.all([
        getAllVideos({ limit: PRIMARY_VIDEO_FETCH_LIMIT }),
        searchAvailableClasses({ limit: 6, sortBy: 'startTime', sortOrder: 'asc' }),
      ]);

      if (videosResponse?.success) {
        let fetchedVideos = videosResponse.videos || [];
        const existingIds = new Set(fetchedVideos.map((video) => video.id));
        const categoryPresence = collectCategoryKeysFromVideos(fetchedVideos);
        const missingCategoryKeys = CATEGORY_ORDER.filter(
          (categoryKey) => !categoryPresence.has(categoryKey),
        );

        if (missingCategoryKeys.length) {
          const additionalResponses = await Promise.allSettled(
            missingCategoryKeys.map((categoryKey) =>
              getAllVideos({ limit: ADDITIONAL_CATEGORY_FETCH_LIMIT, category: categoryKey }),
            ),
          );

          additionalResponses.forEach((result) => {
            if (result.status === 'fulfilled' && result.value?.success) {
              (result.value.videos || []).forEach((video) => {
                if (!existingIds.has(video.id)) {
                  existingIds.add(video.id);
                  fetchedVideos.push(video);
                }
              });
            }
          });
        }

        setVideos(fetchedVideos);
      } else {
        setVideos([]);
        setError(videosResponse?.message || 'Không thể tải bài tập.');
      }

      if (classesResponse?.success) {
        setHighlightClasses(classesResponse.data || []);
      } else {
        setHighlightClasses([]);
      }
    } catch (err) {
      setError(err.message);
      setVideos([]);
      setHighlightClasses([]);
    } finally {
      if (isPullToRefresh) {
        setRefreshing(false);
      } else {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchHomeData(false);
  }, [fetchHomeData]);

  const handleRefresh = useCallback(() => fetchHomeData(true), [fetchHomeData]);

  const handlePressVideo = useCallback(
    (video) => {
      if (!video?.id) return;
      navigation.navigate('WorkoutVideo', { videoId: video.id });
    },
    [navigation],
  );

  const handleSearchIconPress = useCallback(() => {
    setIsSearchActive(true);
  }, []);

  const handleCancelSearch = useCallback(() => {
    setIsSearchActive(false);
    setSearchKeyword('');
    Keyboard.dismiss();
  }, []);

  const handleSubmitSearch = useCallback(() => {
    const trimmedKeyword = searchKeyword.trim();
    if (!trimmedKeyword) return;
    Keyboard.dismiss();
    setIsSearchActive(false);
    setSearchKeyword('');
    navigation.navigate('WorkoutScreen', { keyword: trimmedKeyword });
  }, [navigation, searchKeyword]);

  const handleSearchChange = useCallback((value) => {
    setSearchKeyword(value);
  }, []);

  const navigateToSearchCalendar = useCallback(
    (params) => {
      const targetParams = params ? { ...params } : {};
      const parentNavigator = navigation.getParent();
      if (parentNavigator) {
        parentNavigator.navigate({
          name: 'SearchCalendarScreen',
          params: targetParams,
          merge: false,
        });
      } else {
        navigation.navigate('SearchCalendarScreen', targetParams);
      }
    },
    [navigation],
  );

  const fetchQuickClassesAndNavigate = useCallback(
    async (actionType) => {
      if (quickActionLoading) return;
      setQuickActionLoading(actionType);
      try {
        const today = new Date();
        const startDate = new Date(today);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(today);
        endDate.setHours(23, 59, 59, 999);

        const response = await searchAvailableClasses({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          sortBy: 'startTime',
          sortOrder: 'asc',
          limit: 50,
        });

        if (response?.success) {
          navigateToSearchCalendar({ prefetchedClasses: response.data || [] });
        } else {
          Alert.alert('Không thể tải lớp', response?.message || 'Vui lòng thử lại sau.');
          navigateToSearchCalendar();
        }
      } catch (err) {
        Alert.alert('Không thể tải lớp', err.message || 'Vui lòng thử lại sau.');
        navigateToSearchCalendar();
      } finally {
        setQuickActionLoading(null);
      }
    },
    [quickActionLoading, navigateToSearchCalendar],
  );

  const handleNavigateBooking = useCallback(
    () => fetchQuickClassesAndNavigate('booking'),
    [fetchQuickClassesAndNavigate],
  );

  const handleNavigateTrainer = useCallback(
    () => navigation.navigate('BookScreen'),
    [navigation],
  );

  const handlePressClass = useCallback(
    (classItem) => {
      if (classItem?.classId) {
        navigateToSearchCalendar({ highlightClassId: classItem.classId });
      } else {
        navigateToSearchCalendar();
      }
    },
    [navigateToSearchCalendar],
  );

  const videoCategoryPairs = useMemo(
    () =>
      videos.map((video) => ({
        video,
        info: getVideoCategoryInfo(video),
        viewCount: getViewCount(video),
      })),
    [videos],
  );

  const mostWatchedVideos = useMemo(() => {
    if (!videoCategoryPairs.length) return [];
    return [...videoCategoryPairs]
      .sort((a, b) => b.viewCount - a.viewCount)
      .slice(0, Math.min(6, videoCategoryPairs.length))
      .map((entry) => entry.video);
  }, [videoCategoryPairs]);

  const categorySections = useMemo(
    () =>
      CATEGORY_ORDER.map((categoryKey) => {
        const config = CATEGORY_CONFIG[categoryKey];
        const videosByCategory = videoCategoryPairs
          .filter(({ info }) => info.categoryKey === categoryKey)
          .sort((a, b) => b.viewCount - a.viewCount)
          .map((entry) => entry.video);

        return {
          key: `category_${categoryKey}`,
          categoryKey,
          categoryLabel: config.label,
          videos: videosByCategory,
        };
      }),
    [videoCategoryPairs],
  );

  const listHeader = (
    <View>
      <View style={styles.headerContainer}>
        <View style={styles.headerContent}>
          {isSearchActive ? (
            <View style={styles.searchBar}>
              <MaterialIcons name="search" size={20} color="#3a6043" />
              <TextInput
                style={styles.searchInput}
                placeholder="Tìm kiếm video..."
                placeholderTextColor="#6a7c6f"
                value={searchKeyword}
                onChangeText={handleSearchChange}
                autoFocus
                returnKeyType="search"
                onSubmitEditing={handleSubmitSearch}
                blurOnSubmit={false}
              />
              {searchKeyword.trim().length ? (
                <TouchableOpacity
                  style={styles.searchSubmitIcon}
                  onPress={handleSubmitSearch}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <MaterialIcons name="arrow-forward" size={20} color="#1e6f3d" />
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity
                style={styles.searchCancelIcon}
                onPress={handleCancelSearch}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialIcons name="close" size={20} color="#6a7c6f" />
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={styles.headerText}>Xin chào {userName}!</Text>
              <Text style={styles.headerSubText}>Cùng GymXFit hoàn thành mục tiêu hôm nay nhé.</Text>
            </>
          )}
        </View>

        {!isSearchActive ? (
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerActionIcon}
              onPress={handleSearchIconPress}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialIcons name="search" size={24} color="#145724" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerActionIcon}
              onPress={() => navigation.navigate('Favorites')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialIcons name="star-border" size={24} color="#145724" />
            </TouchableOpacity>
          </View>
        ) : null}
      </View>

      <QuickActions
        navigation={navigation}
        onNavigateBooking={handleNavigateBooking}
        onNavigateTrainer={handleNavigateTrainer}
        quickActionLoading={quickActionLoading}
      />
      <HighlightClasses classes={highlightClasses} onPressClass={handlePressClass} />
      {mostWatchedVideos.length ? (
        <VideoCarousel
          title="Xem nhiều nhất"
          data={mostWatchedVideos}
          onPressVideo={handlePressVideo}
          onPressSeeAll={() => navigation.navigate('WorkoutScreen')}
        />
      ) : null}
    </View>
  );

  if (isLoading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#30C451" />
        <Text style={styles.loadingText}>Đang tải nội dung...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchHomeData(false)}>
            <Text style={styles.retryText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={categorySections}
          keyExtractor={(item) => item.key}
          renderItem={({ item }) => (
            <CategorySection
              categoryLabel={item.categoryLabel}
              videos={item.videos}
              onPressVideo={handlePressVideo}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#30C451']}
            />
          }
          ListHeaderComponent={listHeader}
          ListEmptyComponent={() =>
            videos.length ? null : (
              <View style={styles.sectionWrapper}>
                <View style={styles.stateContainer}>
                  <Text style={styles.stateText}>
                    Dữ liệu đang được cập nhật. Vui lòng quay lại sau ít phút.
                  </Text>
                </View>
              </View>
            )
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerContent: {
    flex: 1,
  },
  headerText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111',
  },
  headerSubText: {
    marginTop: 6,
    color: '#4f4f4f',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerActionIcon: {
    padding: 6,
    borderRadius: 12,
    backgroundColor: '#e7f4eb',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f5f1',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1b2d1f',
    paddingVertical: 0,
  },
  searchSubmitIcon: {
    padding: 4,
    borderRadius: 10,
    backgroundColor: '#d8f2e0',
  },
  searchCancelIcon: {
    padding: 4,
  },
  tabBarContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderRadius: 24,
    backgroundColor: MATERIAL_COLORS.surface,
    borderWidth: 1,
    borderColor: MATERIAL_COLORS.outline,
    paddingVertical: 20,
    paddingHorizontal: 12,
    ...ELEVATION,
  },
  itemTabBar: {
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  bgImage: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: MATERIAL_COLORS.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: MATERIAL_COLORS.primary,
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  itemText: {
    fontSize: 12,
    color: MATERIAL_COLORS.textPrimary,
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 16,
  },
  sectionWrapper: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#102615',
  },
  sectionAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionActionText: {
    color: '#08843a',
    fontWeight: '600',
  },
  categoryEmpty: {
    paddingVertical: 24,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e1ece6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryEmptyText: {
    fontSize: 13,
    color: '#4f4f4f',
    textAlign: 'center',
  },
  classCard: {
    width: 240,
    marginRight: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  classTimeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#30C451',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  classTimeText: {
    color: '#fff',
    fontWeight: '600',
  },
  className: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
  },
  classSchedule: {
    fontSize: 14,
    color: '#333',
  },
  classLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  classLocationText: {
    fontSize: 13,
    color: '#555',
  },
  classSpots: {
    fontSize: 12,
    color: '#08843a',
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 40,
    paddingTop: 16,
  },
  horizontalListContent: {
    paddingHorizontal: 20,
  },
  horizontalSpacer: {
    width: 16,
  },
  videoCard: {
    width: 220,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e1ece6',
    overflow: 'hidden',
    paddingBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  videoCardImageWrapper: {
    width: '100%',
    height: 140,
    position: 'relative',
  },
  videoCardImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f4f6f5',
  },
  videoBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(48, 196, 81, 0.95)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    overflow: 'hidden',
  },
  videoBadgeHighlight: {
    position: 'absolute',
    top: -12,
    left: 0,
    right: 0,
    height: '160%',
    opacity: 0.28,
    backgroundColor: '#ffffff',
    transform: [{ rotate: '-12deg' }],
  },
  videoBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  videoCardContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 8,
  },
  videoCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
  },
  videoCardSubtitle: {
    fontSize: 13,
    color: '#3a6043',
    fontWeight: '600',
  },
  videoMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  videoMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  videoMetaText: {
    fontSize: 12,
    color: '#4f4f4f',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    color: '#555',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 16,
    color: '#d14343',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#30C451',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryText: {
    color: '#fff',
    fontWeight: '700',
  },
  stateContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  stateText: {
    color: '#555',
    textAlign: 'center',
  },
});
