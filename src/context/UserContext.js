import React, { createContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { getProfile, getMembershipInfo } from '@api/userApi';

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

const clearStoredAuthState = async (setUser, setUserToken, setMembership) => {
  setUser(null);
  setUserToken(null);
  setMembership(null); // Clear membership on logout
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
  const [membership, setMembership] = useState(null); // New state for membership
  const [isLoading, setIsLoading] = useState(true);

  const fetchMembership = useCallback(async () => {
    try {
      console.log('🔄 UserContext: Fetching membership info...');
      const response = await getMembershipInfo();
      if (response?.ok && response?.membership) {
        setMembership(response.membership);
        console.log('✅ UserContext: Membership loaded successfully', response.membership);
      } else {
        setMembership(null); // Set to null if no active membership
        console.log('ℹ️ UserContext: No active membership found.');
      }
    } catch (error) {
      console.error('❌ UserContext: Membership fetch failed:', error.message);
      setMembership(null); // Clear on error
      if (isUnauthorizedError(error)) {
        // Logout will be handled by the parent function that catches this
        throw error;
      }
    }
  }, []);

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
      const response = await getProfile(resolvedToken);
      if (response?.ok && response?.user) {
        setUser(response.user);
        console.log('✅ UserContext login: Profile loaded successfully');
        
        // Fetch membership info right after getting profile
        await fetchMembership();

        return response.user;
      }
      console.warn('⚠️ UserContext login: Profile response not ok or no user data');
      return null;
    } catch (error) {
      if (isUnauthorizedError(error)) {
        await clearStoredAuthState(setUser, setUserToken, setMembership);
        console.warn('⚠️ UserContext login: Token invalid after login, cleared state');
        throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      }

      console.error('❌ UserContext login: Profile fetch failed:', error.message);
      if (error.message.includes('Network Error') || !error.response) {
        console.warn('🔄 UserContext login: Network error detected, allowing login without profile');
        return null;
      }
      throw new Error(getErrorMessage(error, 'Không thể tải thông tin cá nhân.'));
    } finally {
      setIsLoading(false);
    }
  }, [fetchMembership]);

  /**
   * Xóa token khỏi AsyncStorage và reset toàn bộ state.
   */
  const logout = useCallback(async () => {
    setIsLoading(true);
    await clearStoredAuthState(setUser, setUserToken, setMembership);
    setIsLoading(false);
  }, []);

  /**
   * Tải lại thông tin profile và membership của user hiện tại.
   */
  const refreshUser = useCallback(async () => {
    try {
      const profileResponse = await getProfile();
      if (profileResponse?.ok && profileResponse?.user) {
        setUser(profileResponse.user);
      }
      await fetchMembership();
    } catch (error) {
      console.error('Lỗi khi làm mới thông tin user:', error);
      if (isUnauthorizedError(error)) {
        await clearStoredAuthState(setUser, setUserToken, setMembership);
      }
    }
  }, [fetchMembership]);

  /**
   * Khi app khởi động, kiểm tra xem đã có token lưu sẵn không.
   */
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (token) {
          await login(token);
        }
      } catch (error) {
        // The login function already handles unauthorized errors
        console.error('Lỗi khi kiểm tra trạng thái đăng nhập:', error);
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
        membership, // Expose membership state
        isLoading,
        login,
        logout,
        refreshUser,
        fetchMembership, // Expose refresh function
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
