// GymXFit/src/api/paymentApi.js
import createAxiosInstance from './axiosInstance';

export const createVnpayPaymentUrl = async (paymentDetails) => {
  try {
    const axiosInstance = createAxiosInstance();
    const response = await axiosInstance.post('/payment/create_payment_url', paymentDetails);
    return response;
  } catch (error) {
    console.error('Error creating VNPAY payment URL:', error);
    throw error;
  }
};

export const checkVnpayPaymentStatus = async (queryParams) => {
    try {
      const axiosInstance = createAxiosInstance();
      const response = await axiosInstance.get('/payment/vnpay_return', { params: queryParams });
      return response;
    } catch (error) {
      console.error('Error checking VNPAY payment status:', error);
      throw error;
    }
  };
