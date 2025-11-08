import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useFocusEffect } from '@react-navigation/native';

import {
  getFavoriteVideos,
  removeVideoFromFavorites,
} from '@api/userApi';

const formatDuration = seconds => {
  const value = Number(seconds);
  if (!Number.isFinite(value) || value <= 0) {
    return null;
  }
  const mins = Math.floor(value / 60);
  const secs = Math.floor(value % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')} phút`;
};

const formatDate = isoString => {
  const date = isoString ? new Date(isoString) : null;
  if (!date || Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toLocaleDateString('vi-VN');
};

const FavoriteVideosScreen = ({ navigation }) => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [updatingFavoriteId, setUpdatingFavoriteId] = useState(null);

  const syncFavorites = useCallback(
    async (showSkeleton = true) => {
      if (showSkeleton) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      setError(null);

      try {
        const response = await getFavoriteVideos();
        const list = Array.isArray(response?.data)
          ? response.data
          : response?.favorites || [];
        setFavorites(list);
      } catch (err) {
        setFavorites([]);
        setError(err.message || 'Không thể tải danh sách video yêu thích.');
      } finally {
        if (showSkeleton) {
          setLoading(false);
        } else {
          setRefreshing(false);
        }
      }
    },
    [],
  );

  useFocusEffect(
    useCallback(() => {
      syncFavorites(true);
    }, [syncFavorites]),
  );

  const handleRefresh = useCallback(() => {
    syncFavorites(false);
  }, [syncFavorites]);

  const handleToggleFavorite = useCallback(async videoId => {
    setUpdatingFavoriteId(videoId);
    try {
      await removeVideoFromFavorites(videoId);
      setFavorites(prev => prev.filter(item => item.videoId !== videoId));
    } catch (err) {
      Alert.alert('Không thể cập nhật', err.message || 'Vui lòng thử lại.');
    } finally {
      setUpdatingFavoriteId(prev => (prev === videoId ? null : prev));
    }
  }, []);

  const renderFavoriteItem = useCallback(
    ({ item }) => {
      const durationLabel = formatDuration(item.duration);
      const caloriesSource = item.estimatedCalories ?? item.estimated_calories;
      const caloriesLabel = Number.isFinite(Number(caloriesSource))
        ? `${Math.round(Number(caloriesSource))} Kcal`
        : null;
      const categoryLabel = item.subcategory || item.category || null;
      const metaParts = [durationLabel, caloriesLabel, categoryLabel].filter(Boolean);
      const favoritedLabel = formatDate(item.favoritedAt);

      const isUpdating = updatingFavoriteId === item.videoId;
      return (
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.9}
          onPress={() =>
            navigation.navigate('WorkoutVideo', {
              videoId: item.videoId,
              initialFavorite: true,
            })
          }
        >
          <Image
            source={
              item.thumbnail
                ? { uri: item.thumbnail }
                : require('@assets/images/workout1.jpg')
            }
            style={styles.thumbnail}
          />
          <View style={styles.cardBody}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle} numberOfLines={2}>
                {item.title || 'Video tập luyện'}
              </Text>
              <TouchableOpacity
                style={styles.favoriteButton}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                onPress={() => handleToggleFavorite(item.videoId)}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <ActivityIndicator size="small" color="#f0c419" />
                ) : (
                  <MaterialIcons name="star" size={22} color="#f0c419" />
                )}
              </TouchableOpacity>
            </View>
            {metaParts.length ? (
              <Text style={styles.cardMeta}>{metaParts.join(' • ')}</Text>
            ) : null}
            {favoritedLabel ? (
              <Text style={styles.cardSubMeta}>Đã lưu {favoritedLabel}</Text>
            ) : null}
          </View>
        </TouchableOpacity>
      );
    },
    [handleToggleFavorite, navigation],
  );

  if (loading) {
    return (
      <View style={styles.feedbackContainer}>
        <ActivityIndicator size="large" color="#30C451" />
        <Text style={styles.feedbackText}>Đang tải video yêu thích...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.feedbackContainer}>
        <MaterialIcons name="error-outline" size={28} color="#d85b28" />
        <Text style={styles.feedbackText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => syncFavorites(true)}>
          <Text style={styles.retryText}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialIcons name="star" size={22} color="#fff" />
        <Text style={styles.headerTitle}>Bài tập yêu thích</Text>
        <View style={{ width: 22 }} />
      </View>

      <FlatList
        data={favorites}
        keyExtractor={item => item.favoriteId || item.videoId}
        renderItem={renderFavoriteItem}
        contentContainerStyle={
          favorites.length ? styles.listContent : styles.emptyContainer
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#30C451"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialIcons name="collections-bookmark" size={36} color="#9ab3a2" />
            <Text style={styles.emptyTitle}>Chưa có video yêu thích</Text>
            <Text style={styles.emptySubtitle}>
              Hãy đánh dấu các bài tập bạn muốn xem lại để xuất hiện tại đây.
            </Text>
            <TouchableOpacity
              style={styles.goWorkoutButton}
              onPress={() => navigation.navigate('HomeStack', { screen: 'WorkoutScreen' })}
            >
              <Text style={styles.goWorkoutText}>Khám phá bài tập</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
};

export default FavoriteVideosScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7f6',
  },
  header: {
    height: 88,
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: '#30C451',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  listContent: {
    padding: 16,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 18,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  thumbnail: {
    width: 120,
    height: 120,
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
  },
  cardBody: {
    flex: 1,
    padding: 14,
    justifyContent: 'center',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  cardTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#102f1c',
  },
  cardMeta: {
    fontSize: 13,
    color: '#4e6758',
    marginTop: 6,
  },
  cardSubMeta: {
    fontSize: 12,
    color: '#7a8c7f',
    marginTop: 6,
  },
  favoriteButton: {
    padding: 6,
    borderRadius: 999,
  },
  emptyContainer: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1b3a27',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#5d6f63',
    textAlign: 'center',
  },
  goWorkoutButton: {
    marginTop: 12,
    backgroundColor: '#30C451',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  goWorkoutText: {
    color: '#fff',
    fontWeight: '600',
  },
  feedbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 12,
  },
  feedbackText: {
    fontSize: 16,
    color: '#1f2f25',
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: '#30C451',
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
  },
});
