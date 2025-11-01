import React, { useContext } from 'react';
import {
  Text,
  View,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBar,
} from 'react-native';
import { UserContext } from '@context/UserContext';
import { useNavigation } from '@react-navigation/native';

const formatDateForDisplay = dateString => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch (e) {
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
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age > 0 ? age : '--';
  } catch (e) {
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
      <View style={[styles.container, styles.loadingContainer]}>
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
    <ScrollView style={{ flex: 1, backgroundColor: '#fff' }}>
      <StatusBar backgroundColor="#20B24A" barStyle="light-content" />

      {/* Header avatar */}
      <View style={styles.header}>
        <Image style={styles.avatar} source={avatarSource} />
        <Text style={styles.name}>{userName}</Text>
        <Text style={styles.email}>{userEmail}</Text>

        <View style={styles.infoStats}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{userWeight}</Text>
            <Text style={styles.statLabel}>Cân nặng (kg)</Text>
          </View>
          <View style={styles.verticalLine} />
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{userAge}</Text>
            <Text style={styles.statLabel}>Tuổi</Text>
          </View>
          <View style={styles.verticalLine} />
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{userHeight}</Text>
            <Text style={styles.statLabel}>Chiều cao (cm)</Text>
          </View>
        </View>
      </View>

      {/* Options list */}
      <View style={styles.optionContainer}>
        <TouchableOpacity
          style={styles.itemOption}
          onPress={() => navigation.navigate('UpdateProfile')}
        >
          <Image
            style={styles.optionIcon}
            source={require('@assets/images/profile.png')}
          />
          <Text style={styles.optionText}>Chỉnh sửa hồ sơ</Text>
          <Image
            style={styles.arrowIcon}
            source={require('@assets/images/arrowright.png')}
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.itemOption}>
          <Image
            style={styles.optionIcon}
            source={require('@assets/images/tutorial.png')}
          />
          <Text style={styles.optionText}>Hướng dẫn sử dụng</Text>
          <Image
            style={styles.arrowIcon}
            source={require('@assets/images/arrowright.png')}
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.itemOption}>
          <Image
            style={styles.optionIcon}
            source={require('@assets/images/support.png')}
          />
          <Text style={styles.optionText}>Liên hệ</Text>
          <Image
            style={styles.arrowIcon}
            source={require('@assets/images/arrowright.png')}
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.itemOption}>
          <Image
            style={styles.optionIcon}
            source={require('@assets/images/contract.png')}
          />
          <Text style={styles.optionText}>Hợp đồng</Text>
          <Image
            style={styles.arrowIcon}
            source={require('@assets/images/arrowright.png')}
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.itemOption}>
          <Image
            style={styles.optionIcon}
            source={require('@assets/images/password.png')}
          />
          <Text style={styles.optionText}>Đổi mật khẩu</Text>
          <Image
            style={styles.arrowIcon}
            source={require('@assets/images/arrowright.png')}
          />
        </TouchableOpacity>
      </View>

      {/* Logout button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Image
          style={styles.logoutIcon}
          source={require('@assets/images/logout.png')}
        />
        <Text style={styles.logoutText}>Đăng xuất</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
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
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginTop: 12,
  },
  email: {
    fontSize: 14,
    color: '#E0FFE8',
    marginBottom: 20,
  },
  infoStats: {
    flexDirection: 'row',
    backgroundColor: '#1A9E42',
    borderRadius: 15,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginTop: 10,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  statLabel: {
    color: '#E8F5E9',
    fontSize: 13,
  },
  verticalLine: {
    width: 1,
    backgroundColor: '#fff',
    marginHorizontal: 10,
  },
  optionContainer: {
    padding: 20,
    marginTop: 10,
  },
  itemOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 0.5,
    borderBottomColor: '#ddd',
  },
  optionIcon: {
    width: 35,
    height: 35,
    tintColor: '#20B24A',
  },
  optionText: {
    flex: 1,
    fontSize: 17,
    fontWeight: '500',
    marginLeft: 15,
    color: '#212020',
  },
  arrowIcon: {
    width: 18,
    height: 18,
    tintColor: '#777',
  },
  logoutButton: {
    backgroundColor: '#E53935',
    marginHorizontal: 30,
    marginTop: 30,
    marginBottom: 50,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
  },
  logoutIcon: {
    width: 20,
    height: 20,
    tintColor: '#fff',
    marginRight: 10,
  },
  logoutText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
});
