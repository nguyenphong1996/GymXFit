import createAxiosInstance from './axiosInstance';

const get = async (endpoint, params = {}) => {
  const client = createAxiosInstance();
  const response = await client.get(`/api${endpoint}`, { params });
  return response; // Return full response object
};

const post = async (endpoint, body = {}) => {
  const client = createAxiosInstance();
  const response = await client.post(`/api${endpoint}`, body);
  return response; // Return full response object
};

export const getPermanentUpgradeQuote = async ({ packageId, billingCycle }) => {
  return post(`/user/membership/quote`, { packageId, billingCycle });
};

export const getTemporaryUpgradeQuote = async ({ packageId, billingCycle }) => {
  return get(`/user/membership/temporary-quote`, { packageId, billingCycle });
};

export const getMembershipInfo = async () => get('/user/membership');
export const getUserMe = async () => get('/user/me');
export const getProfile = async () => get('/user/profile');
export const getAllPackages = async () => get('/packages');

export const createPaymentUrl = async (paymentDetails) => {
  return post('/v1/payment/create-payment-url', paymentDetails);
};
