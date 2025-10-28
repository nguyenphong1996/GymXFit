import createAxiosInstance from '@api/axiosInstance';

const withClient = () => createAxiosInstance();

export const searchAvailableClasses = async (params = {}) => {
  try {
    const response = await withClient().get('/api/customer/classes/search', {
      params: {
        ...params,
        cacheBust: Date.now(),
      },
      headers: {
        'Cache-Control': 'no-cache',
      },
    });
    return response;
  } catch (error) {
    const message = error.response?.data?.message || 'Không thể tải danh sách lớp học.';
    throw new Error(message);
  }
};

export const enrollInClass = async (classId) => {
  if (!classId) {
    throw new Error('Thiếu mã lớp học để đăng ký.');
  }

  try {
    const response = await withClient().post(`/api/customer/classes/${classId}/enroll`);
    return response;
  } catch (error) {
    const message = error.response?.data?.message || 'Đăng ký lớp học thất bại.';
    throw new Error(message);
  }
};

export const getMyEnrollments = async (params = {}) => {
  try {
    const response = await withClient().get('/api/customer/enrollments', { params });
    return response;
  } catch (error) {
    const message = error.response?.data?.message || 'Không thể tải lịch đã đăng ký.';
    throw new Error(message);
  }
};

export const getEnrollmentDetail = async (enrollmentId) => {
  if (!enrollmentId) {
    throw new Error('Thiếu mã đăng ký để lấy chi tiết.');
  }
  try {
    const response = await withClient().get(`/api/customer/enrollments/${enrollmentId}`);
    return response;
  } catch (error) {
    const message = error.response?.data?.message || 'Không thể tải chi tiết đăng ký.';
    throw new Error(message);
  }
};

export const cancelEnrollment = async (enrollmentId, payload = {}) => {
  if (!enrollmentId) {
    throw new Error('Thiếu mã đăng ký để hủy.');
  }
  try {
    const response = await withClient().patch(`/api/customer/enrollments/${enrollmentId}/cancel`, payload);
    return response;
  } catch (error) {
    const message = error.response?.data?.message || 'Không thể hủy đăng ký.';
    throw new Error(message);
  }
};
