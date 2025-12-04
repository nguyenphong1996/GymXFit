import createAxiosInstance from '@api/axiosInstance';

const extractArray = payload => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.staff)) return payload.staff;
  if (Array.isArray(payload?.staffs)) return payload.staffs;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.users)) return payload.users;
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  if (Array.isArray(payload?.data?.results)) return payload.data.results;
  return [];
};

export const listStaff = async (params = {}) => {
  const axios = createAxiosInstance();
  // Sửa endpoint từ /api/admin/staff thành /api/customer/pt/staff
  // để Customer có thể gọi được mà không cần quyền Admin
  const response = await axios.get('/api/customer/pt/staff', {
    params,
  });
  return extractArray(response);
};

export default {
  listStaff,
};
