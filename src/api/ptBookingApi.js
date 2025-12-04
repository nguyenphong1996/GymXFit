import createAxiosInstance from '@api/axiosInstance';

// Lấy danh sách PT (có thể lọc theo skill, search)
export async function listActiveStaff(params = {}) {
  const axios = createAxiosInstance();
  const response = await axios.get('/api/customer/pt/staff', { params });
  return response;
}

// Xem lịch trống của PT
export async function getPtAvailability(staffId, date) {
  if (!staffId) {
    throw new Error('Thiếu staffId để xem lịch trống.');
  }
  const axios = createAxiosInstance();
  const response = await axios.get('/api/customer/pt/availability', {
    params: { staffId, date },
  });
  return response;
}

// Đặt lịch PT
export async function createPtBooking(payload) {
  const axios = createAxiosInstance();
  const response = await axios.post('/api/customer/pt/bookings', payload);
  return response;
}

// Lấy danh sách booking của customer
export async function listPtBookings(params = {}) {
  const axios = createAxiosInstance();
  const response = await axios.get('/api/customer/pt/bookings', { params });
  return response;
}

// Hủy booking
export async function cancelPtBooking(bookingId) {
  if (!bookingId) {
    throw new Error('Thiếu bookingId để hủy.');
  }
  const axios = createAxiosInstance();
  // Backend dùng DELETE /api/customer/pt/bookings/:bookingId
  const response = await axios.delete(`/api/customer/pt/bookings/${bookingId}`);
  return response;
}
