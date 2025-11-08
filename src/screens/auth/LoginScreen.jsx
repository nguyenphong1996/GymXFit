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
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import { requestLoginOtp } from '@api/userApi';

const LoginScreen = ({ navigation }) => {
  const [mobileNumber, setMobileNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    const trimmedNumber = mobileNumber.trim();

    if (trimmedNumber === '') {
      Alert.alert('Lỗi', 'Vui lòng nhập số điện thoại của bạn.');
      return;
    }
    if (trimmedNumber.length !== 10) {
      Alert.alert('Lỗi', 'Số điện thoại phải có 10 chữ số.');
      return;
    }

    setIsLoading(true);
    try {
      await requestLoginOtp(trimmedNumber);
      Alert.alert(
        'Thành công',
        'Mã OTP đã được gửi đến số điện thoại của bạn.',
      );
      navigation.navigate('VerifyLoginScreen', { phone: trimmedNumber });
    } catch (error) {
      Alert.alert('Đăng nhập thất bại', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* 🟩 Logo */}
      <Image
        source={require('@assets/images/logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />

      <Text style={styles.loginText}>Đăng nhập</Text>

      {/* 🟩 Ô nhập số điện thoại với icon hợp lý */}
      <View style={styles.inputContainer}>
        <MaterialIcons
          name="smartphone"
          size={24}
          color="#20B24A"
          style={styles.inputIcon}
        />
        <TextInput
          style={styles.input}
          placeholder="Nhập số điện thoại"
          placeholderTextColor="#888"
          keyboardType="phone-pad"
          value={mobileNumber}
          onChangeText={setMobileNumber}
          editable={!isLoading}
        />
      </View>

      {/* 🟩 Nút đăng nhập với icon đăng nhập chuẩn */}
      <TouchableOpacity
        onPress={handleLogin}
        style={[styles.button, isLoading && styles.buttonDisabled]}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <View style={styles.buttonContent}>
            <MaterialIcons name="login" size={22} color="#fff" />
            <Text style={styles.buttonText}>Đăng nhập</Text>
          </View>
        )}
      </TouchableOpacity>

      <Text style={styles.registerText}>
        Bạn chưa có tài khoản?{' '}
        <Text
          style={styles.registerLink}
          onPress={() => navigation.navigate('RegisterScreen')}
        >
          Đăng ký ngay
        </Text>
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  logo: {
    width: 200,
    height: 100,
    marginBottom: 20,
  },
  loginText: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 20,
    color: '#000',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#20B24A',
    borderWidth: 1,
    borderRadius: 10,
    width: '100%',
    height: 50,
    paddingHorizontal: 10,
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
    backgroundColor: '#20B24A',
    paddingVertical: 15,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
    fontWeight: '700',
  },
  registerText: {
    marginTop: 10,
    color: '#000',
    textAlign: 'center',
    fontSize: 14,
  },
  registerLink: {
    color: '#20B24A',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});

export default LoginScreen;
