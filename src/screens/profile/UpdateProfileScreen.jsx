// 📁 src/screens/PT/UpdateProfileScreen.jsx
import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { launchImageLibrary } from 'react-native-image-picker';
import { updateProfile, updateAvatar } from '@api/userApi';
import { UserContext } from '@context/UserContext';

const { width } = Dimensions.get('window');
const PRIMARY_COLOR = '#30C451';
const LIGHT_GREEN = '#E8F9EF';

const UpdateProfileScreen = ({ navigation }) => {
  const { user, refreshUser } = useContext(UserContext);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [height, setHeight] = useState(user?.height?.toString() || '');
  const [weight, setWeight] = useState(user?.weight?.toString() || '');
  const [dob, setDob] = useState(user?.dob ? new Date(user.dob) : new Date());
  const [gender, setGender] = useState(user?.gender || 'Nam');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  // 📸 Chọn ảnh đại diện
  const handleChooseAvatar = async () => {
    const result = await launchImageLibrary({ mediaType: 'photo' });
    if (result.didCancel) return;
    const image = result.assets?.[0];
    if (!image) return;
    setLoading(true);
    try {
      await updateAvatar(image);
      await refreshUser();
      Alert.alert('✅ Thành công', 'Ảnh đại diện đã được cập nhật!');
    } catch {
      Alert.alert('❌ Lỗi', 'Không thể cập nhật ảnh đại diện.');
    } finally {
      setLoading(false);
    }
  };

  // 💾 Cập nhật thông tin
  const handleUpdate = async () => {
    if (!name.trim()) {
      Alert.alert('Cảnh báo', 'Vui lòng nhập tên đầy đủ!');
      return;
    }
    setLoading(true);
    try {
      await updateProfile({
        name,
        email,
        phone,
        height: parseFloat(height),
        weight: parseFloat(weight),
        dob: dob.toISOString().split('T')[0],
        gender,
      });
      await refreshUser();
      Alert.alert('✅ Thành công', 'Hồ sơ đã được cập nhật.');
      navigation.goBack();
    } catch {
      Alert.alert('❌ Lỗi', 'Không thể cập nhật hồ sơ.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = d =>
    `${String(d.getDate()).padStart(2, '0')}/${String(
      d.getMonth() + 1,
    ).padStart(2, '0')}/${d.getFullYear()}`;

  const avatarSource = user?.avatar
    ? { uri: `${user.avatar}?timestamp=${Date.now()}` }
    : require('@assets/images/avt.png');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cập nhật hồ sơ</Text>
        <TouchableOpacity onPress={handleUpdate}>
          <Icon name="save" size={26} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          <Image source={avatarSource} style={styles.avatar} />
          <TouchableOpacity
            style={styles.cameraButton}
            onPress={handleChooseAvatar}
          >
            <Icon name="photo-camera" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Họ và tên */}
          <Text style={styles.label}>Họ và tên</Text>
          <TextInput
            style={styles.input}
            placeholder="Nhập họ và tên"
            value={name}
            onChangeText={setName}
          />

          {/* Email */}
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Nhập email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />

          {/* Số điện thoại */}
          <Text style={styles.label}>Số điện thoại</Text>
          <TextInput
            style={styles.input}
            placeholder="Nhập số điện thoại"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />

          {/* Ngày sinh */}
          <Text style={styles.label}>Ngày sinh</Text>
          <TouchableOpacity
            style={styles.dateInput}
            onPress={() => setShowDatePicker(true)}
          >
            <Icon name="calendar-today" size={20} color={PRIMARY_COLOR} />
            <Text style={styles.dateText}>{formatDate(dob)}</Text>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={dob}
              mode="date"
              display="spinner"
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) setDob(selectedDate);
              }}
            />
          )}

          {/* Giới tính */}
          <Text style={styles.label}>Giới tính</Text>
          <View style={styles.genderRow}>
            {['Nam', 'Nữ', 'Khác'].map(option => (
              <TouchableOpacity
                key={option}
                style={styles.genderOption}
                onPress={() => setGender(option)}
              >
                <Icon
                  name={
                    gender === option
                      ? 'radio-button-checked'
                      : 'radio-button-unchecked'
                  }
                  size={22}
                  color={gender === option ? PRIMARY_COLOR : '#999'}
                />
                <Text
                  style={[
                    styles.genderText,
                    gender === option && styles.genderTextActive,
                  ]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Chiều cao */}
          <Text style={styles.label}>Chiều cao (cm)</Text>
          <TextInput
            style={styles.input}
            placeholder="Nhập chiều cao"
            value={height}
            onChangeText={setHeight}
            keyboardType="numeric"
          />

          {/* Cân nặng */}
          <Text style={styles.label}>Cân nặng (kg)</Text>
          <TextInput
            style={styles.input}
            placeholder="Nhập cân nặng"
            value={weight}
            onChangeText={setWeight}
            keyboardType="numeric"
          />

          {/* Nút Lưu */}
          <TouchableOpacity
            style={[styles.saveButton, loading && { opacity: 0.7 }]}
            onPress={handleUpdate}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Lưu thay đổi</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default UpdateProfileScreen;

const styles = StyleSheet.create({
  header: {
    backgroundColor: PRIMARY_COLOR,
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    elevation: 4,
  },
  backButton: {
    width: 35,
    height: 35,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  container: {
    paddingHorizontal: 20,
    backgroundColor: '#fff',
  },
  avatarContainer: {
    alignItems: 'center',
    marginTop: 25,
    marginBottom: 10,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: LIGHT_GREEN,
    borderWidth: 3,
    borderColor: PRIMARY_COLOR,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: width / 2 - 80,
    backgroundColor: PRIMARY_COLOR,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  form: {
    marginTop: 10,
  },
  label: {
    fontSize: 15,
    color: '#333',
    marginBottom: 6,
    marginTop: 12,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#F9F9F9',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 15,
    fontSize: 15,
    color: '#222',
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  dateText: {
    marginLeft: 10,
    color: '#222',
    fontSize: 15,
  },
  genderRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  genderOption: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  genderText: {
    color: '#444',
    fontSize: 15,
    marginLeft: 6,
  },
  genderTextActive: {
    color: PRIMARY_COLOR,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 14,
    marginTop: 30,
    marginBottom: 20,
    paddingVertical: 14,
    alignItems: 'center',
    elevation: 3,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
});
