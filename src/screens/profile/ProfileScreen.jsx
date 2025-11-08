import React, { useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StatusBar,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { UserContext } from '@context/UserContext';
import { useNavigation } from '@react-navigation/native';

const formatDateForDisplay = dateString => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, '0')}/${(
      date.getMonth() + 1
    )
      .toString()
      .padStart(2, '0')}/${date.getFullYear()}`;
  } catch {
    return '';
  }
};

const calculateAge = dobString => {
  if (!dobString) return '--';
  try {
    const birthDate = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age > 0 ? age : '--';
  } catch {
    return '--';
  }
};

const ProfileScreen = () => {
  const { user, logout, isLoading } = useContext(UserContext);
  const navigation = useNavigation();

  const handleLogout = () => {
    Alert.alert('Xác nhận đăng xuất', 'Bạn có chắc chắn muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Đăng xuất', style: 'destructive', onPress: logout },
    ]);
  };

  if (isLoading || !user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#20B24A" />
      </View>
    );
  }

  const userName = user.name || 'Chưa cập nhật';
  const userEmail = user.email || 'Chưa cập nhật';
  const userDob = formatDateForDisplay(user.dob) || 'Chưa cập nhật';
  const userWeight = user.weight || '--';
  const userHeight = user.height || '--';
  const userAge = calculateAge(user.dob);
  const avatarSource = user.avatar
    ? { uri: `${user.avatar}?timestamp=${Date.now()}` }
    : require('@assets/images/avt.png');

  return (
    <ScrollView style={styles.container}>
      <StatusBar backgroundColor="#20B24A" barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <Image style={styles.avatar} source={avatarSource} />
        <Text style={styles.name}>{userName}</Text>
        <Text style={styles.email}>{userEmail}</Text>

        <View style={styles.infoStats}>
          <InfoStat label="Cân nặng" value={`${userWeight} kg`} />
          <InfoStat label="Tuổi" value={userAge} />
          <InfoStat label="Chiều cao" value={`${userHeight} cm`} />
        </View>
      </View>

      {/* Options */}
      <View style={styles.optionContainer}>
        <OptionItem
          icon="account-edit"
          text="Chỉnh sửa hồ sơ"
          onPress={() => navigation.navigate('UpdateProfile')}
        />
        <OptionItem icon="book-open-page-variant" text="Hướng dẫn sử dụng" />
        <OptionItem icon="headset" text="Liên hệ hỗ trợ" />
        <OptionItem icon="file-document" text="Hợp đồng của tôi" />
        <OptionItem icon="lock-reset" text="Đổi mật khẩu" />
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Icon name="logout" size={22} color="#fff" style={{ marginRight: 8 }} />
        <Text style={styles.logoutText}>Đăng xuất</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

/* === COMPONENT: InfoStat === */
const InfoStat = ({ label, value }) => (
  <View style={styles.statBox}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

/* === COMPONENT: OptionItem === */
const OptionItem = ({ icon, text, onPress }) => (
  <TouchableOpacity style={styles.optionItem} onPress={onPress}>
    <Icon name={icon} size={26} color="#20B24A" />
    <Text style={styles.optionText}>{text}</Text>
    <Icon name="chevron-right" size={26} color="#9E9E9E" />
  </TouchableOpacity>
);

export default ProfileScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    backgroundColor: '#20B24A',
    alignItems: 'center',
    paddingVertical: 40,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#E8F5E9',
  },
  name: { fontSize: 22, fontWeight: '700', color: '#fff', marginTop: 12 },
  email: { fontSize: 14, color: '#E0FFE8', marginBottom: 20 },

  infoStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#1A9E42',
    borderRadius: 15,
    paddingVertical: 10,
    paddingHorizontal: 20,
    width: '85%',
  },
  statBox: { alignItems: 'center', flex: 1 },
  statValue: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  statLabel: { color: '#C8E6C9', fontSize: 13, marginTop: 2 },

  optionContainer: { marginTop: 15, paddingHorizontal: 20 },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
  },
  optionText: {
    flex: 1,
    fontSize: 17,
    color: '#212121',
    fontWeight: '500',
    marginLeft: 15,
  },

  logoutButton: {
    backgroundColor: '#E53935',
    marginHorizontal: 30,
    marginTop: 40,
    marginBottom: 50,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    elevation: 3,
  },
  logoutText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
