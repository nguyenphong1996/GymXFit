import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Ưu tiên env, nếu không có thì dùng server production
const DEFAULT_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL
  || process.env.API_BASE_URL
  || 'https://be.vnchack.com/';

const createAxiosInstance = (contentType = 'application/json') => {
  // Log Base URL để debug lỗi kết nối
  if (__DEV__) {
    console.log('Creating Axios Instance with Base URL:', DEFAULT_BASE_URL);
  }

  const axiosInstance = axios.create({
    baseURL: DEFAULT_BASE_URL,
    timeout: 30000, // 30 seconds timeout
    timeoutErrorMessage: 'Yêu cầu quá lâu, vui lòng thử lại',
  });

  axiosInstance.interceptors.request.use(
    async (config) => {
      const token = await AsyncStorage.getItem('token');
      const headers = {
        Accept: 'application/json',
      };

      if (contentType) {
        headers['Content-Type'] = contentType;
      }

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      config.headers = {
        ...config.headers,
        ...headers,
      };

      return config;
    },
    error => Promise.reject(error),
  );

  axiosInstance.interceptors.response.use(
    response => {
      // Log response thành công
      console.log('=== Axios Success ===');
      console.log('URL:', response.config?.url);
      console.log('Status:', response.status);
      console.log('Data:', JSON.stringify(response.data, null, 2));
      console.log('====================');
      return response.data;
    },
    error => {
      // Nếu là lỗi 401 (Unauthorized), chỉ log warning nhẹ nhàng vì UserContext sẽ xử lý logout
      if (error.response?.status === 401) {
        console.warn(`⚠️ Phiên đăng nhập hết hạn (401) tại ${error.config?.url}`);
        return Promise.reject(error);
      }

      // Log chi tiết lỗi để debug cho các lỗi khác
      console.error('=== Axios Error ===');
      console.error('URL:', error.config?.url);
      console.error('BaseURL:', error.config?.baseURL);
      console.error('Method:', error.config?.method);
      console.error('Status:', error.response?.status);
      console.error('Data:', error.response?.data);
      console.error('Message:', error.message);
      console.error('==================');

      if (error.message === 'Network Error' && !error.response) {
        console.warn('⚠️ Lỗi kết nối mạng: Vui lòng kiểm tra xem thiết bị và server có cùng mạng Wifi không, và IP server đã chính xác chưa.');
      }
      
      return Promise.reject(error);
    },
  );

  return axiosInstance;
};

export default createAxiosInstance;
