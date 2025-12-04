// GymXFit/src/api/paymentApi.js
import createAxiosInstance from './axiosInstance';

export const createVnpayPaymentUrl = async (paymentDetails) => {
  try {
    const axiosInstance = createAxiosInstance();
    const response = await axiosInstance.post('/api/v1/payment/create-payment-url', paymentDetails);
    return response;
  } catch (error) {
    console.error('Error creating VNPAY payment URL:', error);
    throw error;
  }
};

export const checkVnpayPaymentStatus = async (queryParams) => {
    try {
      const axiosInstance = createAxiosInstance();
      const response = await axiosInstance.get('/api/v1/payment/vnpay-return', { params: queryParams });
      return response;
    } catch (error) {
      console.error('Error checking VNPAY payment status:', error);
      throw error;
    }
  };

export const createVnpayTokenInitUrl = async (payload) => {
  try {
    const axiosInstance = createAxiosInstance();
    const response = await axiosInstance.post('/api/v1/payment/token/init', payload);
    return response;
  } catch (error) {
    console.error('Error creating VNPAY token init URL:', error);
    throw error;
  }
};

export const createVnpayTokenPayUrl = async (payload) => {
  try {
    const axiosInstance = createAxiosInstance();
    const response = await axiosInstance.post('/api/v1/payment/token/pay', payload);
    return response;
  } catch (error) {
    console.error('Error creating VNPAY token pay URL:', error);
    throw error;
  }
};

export const getVnpayTransactionStatus = async (txnRef) => {
  try {
    const axiosInstance = createAxiosInstance();
    const response = await axiosInstance.get(`/api/v1/payment/transaction/${txnRef}`);
    return response;
  } catch (error) {
    console.error('Error getting VNPAY transaction status:', error);
    throw error;
  }
};

export const getVnpayTokens = async (userId) => {
  try {
    const axiosInstance = createAxiosInstance();
    const response = await axiosInstance.get('/api/v1/payment/tokens', { params: { userId } });
    return response;
  } catch (error) {
    if (error?.response?.status === 404) {
      // Backend chưa triển khai route này (prod cũ) -> trả về danh sách rỗng để không lỗi app
      console.warn('VNPAY tokens endpoint not available (404) - returning empty list');
      return [];
    }
    console.error('Error fetching VNPAY tokens:', error);
    throw error;
  }
};

export const deleteVnpayToken = async (id) => {
  try {
    const axiosInstance = createAxiosInstance();
    const response = await axiosInstance.delete(`/api/v1/payment/tokens/${id}`);
    return response;
  } catch (error) {
    if (error?.response?.status === 404) {
      console.warn('VNPAY token delete endpoint not available (404)');
      return { ok: false };
    }
    console.error('Error deleting VNPAY token:', error);
    throw error;
  }
};
