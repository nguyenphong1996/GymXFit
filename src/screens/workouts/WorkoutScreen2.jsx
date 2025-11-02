// screens/WorkoutScreen2.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const WorkoutScreen2 = ({ navigation }) => {
  const roundData = [
    {
      round: 'Hiệp 1',
      exercises: [
        {
          id: '1',
          title: 'Đẩy ngực với tạ đòn',
          time: '00:30',
          reps: '3x',
          videoId: '68f27b44812ace4e1165a782',
        },
        {
          id: '2',
          title: 'Hít xà tam đầu',
          time: '00:15',
          reps: '2x',
          videoId: '68f27b44812ace4e1165a782',
        },
        {
          id: '3',
          title: 'Gập bụng trên ghế nghiêng',
          time: '00:30',
          reps: '3x',
          videoId: '68f27b44812ace4e1165a782',
          active: true,
        },
      ],
    },
    {
      round: 'Hiệp 2',
      exercises: [
        { id: '4', title: 'Deadlift kiểu Romania', time: '00:10', reps: '2x' },
        {
          id: '5',
          title: 'Lăn cơ bằng con lăn (Foam Rolling)',
          time: '00:10',
          reps: '4x',
        },
      ],
    },
  ];

  const renderExercise = item => (
    <TouchableOpacity
      key={item.id}
      style={styles.exerciseCard}
      onPress={() =>
        navigation.navigate('WorkoutVideo', { videoId: item.videoId })
      }
    >
      {/* Nút phát video */}
      <View style={styles.playButtonWrap}>
        <Icon
          name={item.active ? 'play-circle' : 'play-circle-outline'}
          size={44}
          color={item.active ? '#30C451' : '#000'}
        />
      </View>

      {/* Thông tin bài tập */}
      <View style={styles.exerciseInfo}>
        <Text style={styles.exerciseTitle}>{item.title}</Text>
        <View style={styles.exerciseDetails}>
          <Icon name="clock-outline" size={16} color="#555" />
          <Text style={styles.exerciseTime}>{item.time}</Text>
        </View>
      </View>

      {/* Số lần lặp */}
      <Text style={styles.repsText}>Lặp lại {item.reps}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.leftHeader}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={26} color="#111" />
          </TouchableOpacity>
          <Text style={styles.title}>Nâng cao</Text>
        </View>
        <View style={styles.rightHeader}>
          <TouchableOpacity>
            <Icon
              name="magnify"
              size={24}
              color="#111"
              style={{ marginLeft: 12 }}
            />
          </TouchableOpacity>
          <TouchableOpacity>
            <Icon
              name="bell-outline"
              size={24}
              color="#111"
              style={{ marginLeft: 12 }}
            />
          </TouchableOpacity>
          <TouchableOpacity>
            <Icon
              name="account-circle-outline"
              size={24}
              color="#111"
              style={{ marginLeft: 12 }}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Banner (giữ ảnh) */}
      <View style={styles.featuredWrapper}>
        <View style={styles.featuredCard}>
          <Image
            source={require('@assets/images/workout1.jpg')}
            style={styles.featuredImage}
          />

          <View style={styles.badgeWrap}>
            <Text style={styles.badgeText}>Sức mạnh phần thân trên</Text>
          </View>

          <View style={styles.featuredOverlay}>
            <View style={styles.featuredDetails}>
              <View style={styles.detailRow}>
                <Icon name="clock-outline" size={16} color="#fff" />
                <Text style={styles.featuredDetailText}>60 Phút</Text>
              </View>
              <View style={styles.detailRow}>
                <Icon name="fire" size={16} color="#fff" />
                <Text style={styles.featuredDetailText}>1450 Kcal</Text>
              </View>
              <View style={styles.detailRow}>
                <Icon name="dumbbell" size={16} color="#fff" />
                <Text style={styles.featuredDetailText}>Nâng cao</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.featuredFavorite}>
              <Icon name="star-outline" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Danh sách các hiệp */}
      {roundData.map(round => (
        <View
          key={round.round}
          style={{ marginBottom: 16, paddingHorizontal: 18 }}
        >
          <Text style={styles.roundTitle}>{round.round}</Text>
          {round.exercises.map(ex => renderExercise(ex))}
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'ios' ? 36 : 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderBottomWidth: 0.3,
    borderBottomColor: '#ccc',
  },
  leftHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111',
    marginLeft: 10,
  },
  featuredWrapper: {
    backgroundColor: '#20B24A',
    padding: 12,
    marginBottom: 18,
  },
  featuredCard: {
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  featuredImage: {
    width: '100%',
    height: 180,
    resizeMode: 'cover',
  },
  badgeWrap: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 14,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111',
  },
  featuredOverlay: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 10,
    padding: 10,
    paddingRight: 46,
  },
  featuredDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  featuredDetailText: {
    color: '#fff',
    marginLeft: 6,
    fontSize: 13,
    fontWeight: '600',
  },
  featuredFavorite: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roundTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
    marginBottom: 10,
  },
  exerciseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  playButtonWrap: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111',
    marginBottom: 4,
  },
  exerciseDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exerciseTime: {
    marginLeft: 6,
    fontSize: 12,
    color: '#333',
  },
  repsText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111',
  },
});

export default WorkoutScreen2;
