// 📁 screens/WorkoutVideoScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
  ActivityIndicator,
} from 'react-native';
import Video from 'react-native-video';
import { useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import MIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { getVideoById } from '@api/userApi';

const WorkoutVideoScreen = ({ navigation }) => {
  const route = useRoute();
  const videoId = route?.params?.videoId;

  const [videoData, setVideoData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
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

  const toggleFavorite = () => setIsFavorite(prev => !prev);

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

  const infoText =
    videoData.description ||
    'Tăng cường sức mạnh cơ bụng và cải thiện độ linh hoạt của phần thân trên. Giữ tư thế ổn định khi gập người và kiểm soát nhịp thở đều.';

  return (
    <SafeAreaView style={styles.container}>
      {/* ----------- HEADER ----------- */}
      <View style={styles.headerWrap}>
        <View style={styles.header}>
          {/* 🔙 Back */}
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.backWrap}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={26} color="#20B24A" />
          </TouchableOpacity>

          <Text style={styles.headerText}>{videoData.level || 'Bài tập'}</Text>

          {/* 🔍, 🔔, 👤 */}
          <View style={styles.headerRight}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setShowSearch(!showSearch)}
            >
              <Icon
                name="search"
                size={26}
                color="#20B24A"
                style={styles.rightIcon}
              />
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.8}>
              <Icon
                name="notifications-none"
                size={26}
                color="#20B24A"
                style={styles.rightIcon}
              />
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.8}>
              <Icon
                name="person-outline"
                size={26}
                color="#20B24A"
                style={styles.rightIcon}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search input */}
        {showSearch && (
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm trong mô tả bài tập..."
            placeholderTextColor="#888"
            value={searchText}
            onChangeText={setSearchText}
          />
        )}
      </View>

      {/* ----------- CONTENT ----------- */}
      <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>
        {/* 🎬 Video */}
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

          {/* ⭐ Favorite */}
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.favoriteBtn}
            onPress={toggleFavorite}
          >
            <Icon
              name={isFavorite ? 'star' : 'star-border'}
              size={32}
              color={isFavorite ? '#FFD700' : '#20B24A'}
            />
          </TouchableOpacity>
        </View>

        {/* 📄 Info */}
        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>{videoData.title}</Text>
            <Text style={styles.infoDesc}>{infoText}</Text>

            <View style={styles.infoRowWrapper}>
              {/* ⏱️ Thời gian */}
              <View style={styles.infoItem}>
                <Icon
                  name="schedule"
                  size={18}
                  color="#20B24A"
                  style={styles.infoIcon}
                />
                <Text style={styles.infoItemText}>
                  {String(Math.floor(videoData.duration / 60)).padStart(2, '0')}
                  :{String(videoData.duration % 60).padStart(2, '0')}
                </Text>
              </View>

              {/* 🔥 Số lần */}
              <View style={styles.infoItem}>
                <MIcon
                  name="fire"
                  size={18}
                  color="#20B24A"
                  style={styles.infoIcon}
                />
                <Text style={styles.infoItemText}>3 lần</Text>
              </View>

              {/* 🏃‍♂️ Mức độ */}
              <View style={styles.infoItem}>
                <MIcon
                  name="run"
                  size={18}
                  color="#20B24A"
                  style={styles.infoIcon}
                />
                <Text style={styles.infoItemText}>
                  {videoData.level || 'Trung bình'}
                </Text>
              </View>
            </View>
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

  headerWrap: { paddingHorizontal: 18, marginBottom: 10 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  backWrap: { width: 30, alignItems: 'flex-start' },
  headerText: { fontSize: 22, fontWeight: '700', color: '#111' },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  rightIcon: { marginLeft: 14 },

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
  favoriteBtn: { position: 'absolute', top: 16, right: 16, zIndex: 6 },

  infoSection: { paddingHorizontal: 18, marginTop: 14 },
  infoCard: {
    backgroundColor: '#EEF94E',
    borderRadius: 45,
    paddingVertical: 22,
    paddingHorizontal: 22,
    alignItems: 'center',
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
    color: '#111',
  },
  infoDesc: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  infoRowWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 35,
    paddingVertical: 12,
    paddingHorizontal: 24,
    width: '100%',
  },
  infoItem: { flexDirection: 'row', alignItems: 'center' },
  infoIcon: { marginRight: 6 },
  infoItemText: { fontSize: 14, color: '#333', fontWeight: '500' },
});

export default WorkoutVideoScreen;
