// screens/WorkoutVideoScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
  ActivityIndicator,
} from 'react-native';
import Video from 'react-native-video';
import { useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
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

  // 🔹 Lấy dữ liệu video theo videoId
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

  // ------------------ Render ------------------
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

  // Mô tả tạm nếu API không có
  const infoText =
    videoData.description ||
    'Tăng cường sức mạnh cơ bụng và cải thiện độ linh hoạt của phần thân trên. Giữ tư thế ổn định khi gập người và kiểm soát nhịp thở đều.';

  return (
    <SafeAreaView style={styles.container}>
      {/* ----------- HEADER ----------- */}
      <View style={styles.headerWrap}>
        <View style={styles.header}>
          {/* 🔙 Nút Back */}
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.backWrap}
            onPress={() => navigation.goBack()}
          >
            <Image
              source={require('@assets/images/back.png')}
              style={styles.backIcon}
            />
          </TouchableOpacity>

          {/* Tiêu đề */}
          <Text style={styles.headerText}>{videoData.level || 'Bài tập'}</Text>

          {/* Nhóm icon bên phải */}
          <View style={styles.headerRight}>
            {/* 🔍 Nút tìm kiếm */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setShowSearch(!showSearch)}
            >
              <Image
                source={require('@assets/images/Search_icon.png')}
                style={styles.icon}
              />
            </TouchableOpacity>

            {/* 🔔 Thông báo */}
            <TouchableOpacity activeOpacity={0.8}>
              <Image
                source={require('@assets/images/Notifications_icon.png')}
                style={styles.icon}
              />
            </TouchableOpacity>

            {/* 👤 User */}
            <TouchableOpacity activeOpacity={0.8}>
              <Image
                source={require('@assets/images/User_Icon.png')}
                style={styles.icon}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Ô tìm kiếm hiển thị khi bật */}
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

      {/* ----------- NỘI DUNG CHÍNH ----------- */}
      <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>
        {/* 🎬 Video Player */}
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
            <Image
              source={require('@assets/images/workout1.jpg')}
              style={styles.videoPlayer}
            />
          )}

          {/* ⭐ Nút yêu thích */}
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.favoriteBtn}
            onPress={toggleFavorite}
          >
            <Image
              source={
                isFavorite
                  ? require('@assets/images/yellowstar.png')
                  : require('@assets/images/favorites_white_star.png')
              }
              style={styles.favoriteIcon}
            />
          </TouchableOpacity>
        </View>

        {/* 📄 Thông tin bài tập */}
        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>{videoData.title}</Text>
            <Text style={styles.infoDesc}>{infoText}</Text>

            {/* Dòng thông tin nhỏ */}
            <View style={styles.infoRowWrapper}>
              <View style={styles.infoItem}>
                <Image
                  source={require('@assets/images/time.png')}
                  style={styles.smallIcon}
                />
                <Text style={styles.infoItemText}>
                  {Math.floor(videoData.duration / 60)}:
                  {String(videoData.duration % 60).padStart(2, '0')}
                </Text>
              </View>

              <View style={styles.infoItem}>
                <Image
                  source={require('@assets/images/calories.png')}
                  style={styles.smallIcon}
                />
                <Text style={styles.infoItemText}>3 lần</Text>
              </View>

              <View style={styles.infoItem}>
                <Image
                  source={require('@assets/images/Workout_icon.png')}
                  style={styles.smallIcon}
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

  // ---------- Header ----------
  headerWrap: { paddingHorizontal: 18, marginBottom: 10 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  backWrap: { width: 30, alignItems: 'flex-start' },
  backIcon: { width: 22, height: 22, resizeMode: 'contain' },
  headerText: { fontSize: 22, fontWeight: '700', color: '#111' },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  icon: { width: 26, height: 26, marginLeft: 14, resizeMode: 'contain' },

  // ---------- Search ----------
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

  // ---------- Video ----------
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
  favoriteIcon: { width: 32, height: 32, resizeMode: 'contain' },

  // ---------- Info ----------
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
  smallIcon: { width: 18, height: 18, resizeMode: 'contain', marginRight: 6 },
  infoItemText: { fontSize: 14, color: '#333', fontWeight: '500' },
});

export default WorkoutVideoScreen;
