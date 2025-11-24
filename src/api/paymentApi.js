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
