import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons'; // 🟩 Thêm thư viện icon
import { requestOTP } from '@api/userApi';

const RegisterScreen = props => {
  const { navigation } = props;
  const [mobileNumber, setMobileNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    const trimmedNumber = mobileNumber.trim();

    if (trimmedNumber === '') {
      Alert.alert('Lỗi', 'Vui lòng nhập số điện thoại.');
      return;
    }

    if (trimmedNumber.length !== 10) {
      Alert.alert('Lỗi', 'Số điện thoại phải có 10 chữ số.');
      return;
    }

    setIsLoading(true);
    try {
      await requestOTP(trimmedNumber);
      Alert.alert(
        'Thành công',
        'Mã OTP đã được gửi đến số điện thoại của bạn.',
      );
      navigation.navigate('VerifyRegisterScreen', {
        phone: trimmedNumber,
      });
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message;
      Alert.alert('Lỗi', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 🟩 Logo */}
      <Image
        source={require('@assets/images/logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />

      {/* 🟩 Tiêu đề */}
      <Text style={styles.subtitle}>Đăng ký với FitNexus</Text>

      {/* 🟩 Ô nhập số điện thoại có icon */}
      <View style={styles.inputWrapper}>
        <MaterialIcons
          name="smartphone"
          size={24}
          color="#4CAF50"
          style={styles.inputIcon}
        />
        <TextInput
          style={styles.input}
          placeholder="Số điện thoại"
          placeholderTextColor="#888"
          keyboardType="phone-pad"
          value={mobileNumber}
          onChangeText={setMobileNumber}
          editable={!isLoading}
        />
      </View>

      {/* 🟩 Nút đăng ký có icon */}
      <TouchableOpacity
        onPress={handleRegister}
        style={[styles.button, isLoading && styles.buttonDisabled]}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <View style={styles.buttonContent}>
            <MaterialIcons name="person-add" size={22} color="#fff" />
            <Text style={styles.buttonText}>Đăng ký</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* 🟩 Liên kết đăng nhập có icon */}
      <View style={styles.signInContainer}>
        <Text style={styles.signInText}>Đã có tài khoản? </Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('LoginScreen')}
          style={styles.signInLinkContainer}
        >
          <MaterialIcons name="login" size={18} color="#4CAF50" />
          <Text style={styles.signInLink}> Đăng nhập</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#000',
    marginBottom: 30,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#4CAF50',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    width: '100%',
    height: 50,
    marginBottom: 20,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  button: {
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#A5D6A7',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  signInContainer: {
    flexDirection: 'row',
    marginTop: 20,
    alignItems: 'center',
  },
  signInText: {
    fontSize: 14,
    color: '#000',
  },
  signInLinkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  signInLink: {
    color: '#4CAF50',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
    fontSize: 14,
  },
});

export default RegisterScreen;
