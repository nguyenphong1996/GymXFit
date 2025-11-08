// 📁 VerifyRegisterScreen.js
import React, { useState, useEffect, useRef, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { verifyOtp, requestOTP } from '@api/userApi';
import { UserContext } from '@context/UserContext';

const VerifyRegisterScreen = ({ navigation }) => {
  const [otp, setOtp] = useState(['', '', '', '']);
  const [countdown, setCountdown] = useState(60);
  const [isResending, setIsResending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const inputsRef = useRef([]);
  const { login } = useContext(UserContext);

  // ✅ Lấy params an toàn
  const route = useRoute();
  const phone = route?.params?.phone || '';

  // Nếu không có phone → quay lại màn hình đăng ký
  useEffect(() => {
    if (!phone) {
      Alert.alert('Thiếu thông tin', 'Không tìm thấy số điện thoại xác thực.', [
        {
          text: 'Quay lại',
          onPress: () => navigation.navigate('RegisterScreen'),
        },
      ]);
    }
  }, [phone]);

  // ⏳ Đếm ngược gửi lại mã
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown(prev => (prev <= 1 ? 0 : prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const handleChange = (text, index) => {
    const char = text.replace(/[^0-9]/g, '').slice(0, 1);
    setOtp(prev => {
      const next = [...prev];
      next[index] = char;
      return next;
    });
    if (char !== '' && index < 3) inputsRef.current[index + 1]?.focus();
  };

  const handleAutoFill = fullText => {
    const digits = fullText.replace(/\D/g, '').slice(0, 4).split('');
    if (digits.length === 4) {
      setOtp(digits);
      Keyboard.dismiss();
    }
  };

  // ✅ Xác minh OTP
  const handleContinue = async () => {
    const code = otp.join('');
    if (code.length !== 4) {
      Alert.alert('Lỗi', 'Vui lòng nhập đủ 4 chữ số mã xác thực.');
      return;
    }

    Keyboard.dismiss();
    setIsVerifying(true);
    try {
      const response = await verifyOtp(phone, code);
      if (response.ok && response.token) {
        await login(response.token, response.user);
        Alert.alert('Thành công!', 'Tài khoản của bạn đã được xác thực.', [
          { text: 'OK', onPress: () => navigation.navigate('SurveyScreen') },
        ]);
      } else {
        throw new Error(response.message || 'Không nhận được token từ server.');
      }
    } catch (error) {
      Alert.alert('Xác thực thất bại', error.message);
    } finally {
      setIsVerifying(false);
    }
  };

  // 🔁 Gửi lại mã OTP
  const handleResendCode = async () => {
    if (countdown > 0 || isResending) return;
    setIsResending(true);
    try {
      await requestOTP(phone);
      Alert.alert('Thành công', 'Mã xác thực mới đã được gửi lại!');
      setCountdown(60);
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      Alert.alert('Gửi lại thất bại', errorMessage);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* 🔹 Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => navigation.navigate('RegisterScreen')}
        >
          <MaterialIcons name="arrow-back" size={26} color="#000" />
        </TouchableOpacity>

        <Text style={styles.title}>Xác minh</Text>

        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => navigation.navigate('LoginScreen')}
        >
          <MaterialIcons name="close" size={26} color="#000" />
        </TouchableOpacity>
      </View>

      {/* 🔹 Nội dung */}
      <View style={styles.content}>
        <Text style={styles.subtitle}>
          Nhập mã gồm 4 chữ số mà FitNexus vừa gửi đến {phone}
        </Text>

        <View style={styles.inputContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={el => (inputsRef.current[index] = el)}
              style={styles.input}
              value={digit}
              onChangeText={text => handleChange(text, index)}
              keyboardType="number-pad"
              maxLength={1}
              onSubmitEditing={() =>
                index < 3
                  ? inputsRef.current[index + 1]?.focus()
                  : handleContinue()
              }
              onTextInput={e => {
                const text = e.nativeEvent?.text || '';
                if (text.length > 1) handleAutoFill(text);
              }}
            />
          ))}
        </View>

        <TouchableOpacity
          style={[styles.button, isVerifying && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={isVerifying}
          activeOpacity={0.85}
        >
          {isVerifying ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Tiếp tục</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.resendText}>
          Chưa nhận được mã?{' '}
          <Text
            style={[styles.resendLink, countdown > 0 && styles.resendDisabled]}
            onPress={handleResendCode}
          >
            {countdown > 0 ? `Gửi lại sau ${countdown}s` : 'Gửi lại'}
          </Text>
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  iconButton: { padding: 8 },
  title: { fontSize: 22, fontWeight: '700', color: '#000' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  subtitle: {
    fontSize: 16,
    color: '#000',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  inputContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 25,
  },
  input: {
    height: 55,
    width: 55,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 10,
    textAlign: 'center',
    fontSize: 20,
    marginHorizontal: 8,
    color: '#000',
  },
  button: {
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  buttonDisabled: { backgroundColor: '#A5D6A7' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  resendText: { marginTop: 25, color: '#000', textAlign: 'center' },
  resendLink: { color: '#4CAF50', fontWeight: 'bold' },
  resendDisabled: { color: 'gray' },
});

export default VerifyRegisterScreen;
