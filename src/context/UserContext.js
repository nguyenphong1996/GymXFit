import React, { createContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { getProfile } from '@api/userApi';

const getErrorMessage = (error, fallbackMessage = 'Đã có lỗi xảy ra.') => {
  if (!error) {
    return fallbackMessage;
  }

  if (typeof error === 'string') {
    return error;
  }

  return (
    error?.response?.data?.message ||
    error?.message ||
    fallbackMessage
  );
};

const isUnauthorizedError = (error) => {
  const status = error?.response?.status;
  if (status === 401 || status === 403 || status === 498) {
    return true;
  }

  const message = getErrorMessage(error, '').toLowerCase();
  const unauthorizedKeywords = [
    'token expired',
    'please login',
    'unauthorized',
    'invalid token',
    'jwt expired',
    'jwt malformed',
    'đăng nhập',
    'dang nhap',
    'hết hạn',
    'het han',
  ];

  return unauthorizedKeywords.some(keyword => message.includes(keyword));
};

const clearStoredAuthState = async (setUser, setUserToken) => {
  setUser(null);
  setUserToken(null);
  await AsyncStorage.removeItem('token');
};

const resolveTokenValue = (rawToken) => {
  if (!rawToken) {
    return null;
  }

  if (typeof rawToken === 'string') {
    return rawToken.trim();
  }

  if (typeof rawToken === 'object') {
    return (
      rawToken.accessToken ||
      rawToken.access_token ||
      rawToken.token ||
      rawToken.value ||
      null
    );
  }

  return null;
};

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userToken, setUserToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Persist the token, optionally prime user state, then refresh profile from API.
   * Dùng khi đăng nhập hoặc xác thực OTP thành công.
   */
  const login = useCallback(async (token, initialUser = null) => {
    setIsLoading(true);
    const resolvedToken = resolveTokenValue(token);

    if (!resolvedToken) {
      setIsLoading(false);
      throw new Error('Không nhận được token hợp lệ từ server.');
    }

    setUserToken(resolvedToken);
    await AsyncStorage.setItem('token', resolvedToken);

    if (initialUser) {
      setUser(prev => ({ ...(prev || {}), ...initialUser }));
    }

    try {
      console.log('🔄 UserContext login: Fetching profile after setting token...');
      // Pass the token directly to getProfile to avoid race conditions with AsyncStorage
      const response = await getProfile(resolvedToken);
      if (response?.ok && response?.user) {
        setUser(response.user);
        console.log('✅ UserContext login: Profile loaded successfully');
        return response.user;
      }
      console.warn('⚠️ UserContext login: Profile response not ok or no user data');
      return null;
    } catch (error) {
      if (isUnauthorizedError(error)) {
        await clearStoredAuthState(setUser, setUserToken);
        // console.warn('Token không hợp lệ hoặc đã hết hạn sau khi đăng nhập:', error);
        console.warn('⚠️ UserContext login: Token invalid after login, cleared state');
        throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      }

      console.error('❌ UserContext login: Profile fetch failed:', error.message);
      // For network errors, allow login to continue but warn user
      if (error.message.includes('Network Error') || !error.response) {
        console.warn('🔄 UserContext login: Network error detected, allowing login without profile');
        // Don't throw, allow login to complete
        return null;
      }
      throw new Error(getErrorMessage(error, 'Không thể tải thông tin cá nhân.'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Xóa token khỏi AsyncStorage và reset toàn bộ state.
   */
  const logout = useCallback(async () => {
    setIsLoading(true);
    await clearStoredAuthState(setUser, setUserToken);
    setIsLoading(false);
  }, []);

  /**
   * Tải lại thông tin profile của user hiện tại.
   */
  const refreshUser = useCallback(async () => {
    try {
      const response = await getProfile();
      if (response?.ok && response?.user) {
        setUser(response.user);
      }
    } catch (error) {
      console.error('Lỗi khi làm mới thông tin user:', error);
      if (isUnauthorizedError(error)) {
        await clearStoredAuthState(setUser, setUserToken);
      }
    }
  }, []);

  /**
   * Khi app khởi động, kiểm tra xem đã có token lưu sẵn không.
   */
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (token) {
          await login(token);
          return;
        }
      } catch (error) {
        if (isUnauthorizedError(error)) {
          await clearStoredAuthState(setUser, setUserToken);
          console.log('Token cũ đã hết hạn, tự động đăng xuất.');
        } else {
          console.error('Lỗi khi kiểm tra trạng thái đăng nhập:', error);
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkLoginStatus();
  }, [login]);

  return (
    <UserContext.Provider
      value={{
        user,
        userToken,
        isLoading,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
