import createAxiosInstance from '@api/axiosInstance';

const withClient = () => createAxiosInstance();

// Helper function to retry failed requests
const retryRequest = async (requestFn, maxRetries = 2) => {
  let lastError;
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error;
      const shouldRetry = [502, 503, 504].includes(error.response?.status);
      if (shouldRetry && i < maxRetries) {
        console.log(`Retry attempt ${i + 1}/${maxRetries}...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        continue;
      }
      break;
    }
  }
  throw lastError;
};

// Helper function to translate common error messages from English to Vietnamese
const translateErrorMessage = (message) => {
  if (!message || typeof message !== 'string') return message;
  
  const translations = {
    // Enrollment related
    'You are already enrolled in this class': 'Bạn đã đăng ký lớp học này rồi',
    'already enrolled': 'đã đăng ký rồi',
    'Class is full': 'Lớp học đã đầy',
    'Class not found': 'Không tìm thấy lớp học',
    'Cannot enroll': 'Không thể đăng ký',
    'Enrollment not found': 'Không tìm thấy đăng ký',
    'Cannot cancel enrollment': 'Không thể hủy đăng ký',
    'Class has already started': 'Lớp học đã bắt đầu',
    'Class has not started yet': 'Lớp học chưa bắt đầu',
    'Class has ended': 'Lớp học đã kết thúc',
    
    // Check-in/out related
    'Already checked in': 'Đã điểm danh vào rồi',
    'Already checked out': 'Đã điểm danh ra rồi',
    'Not checked in yet': 'Chưa điểm danh vào',
    'You must check in first': 'Bạn phải điểm danh vào trước',
    'Check-in time has passed': 'Đã hết thời gian điểm danh vào',
    'Too early to check in': 'Chưa đến giờ điểm danh vào',
    'Too late to check out': 'Đã quá giờ điểm danh ra',
    'Check-in is only allowed within the pre-defined time window before class start': 'Chỉ được điểm danh trong khung giờ cho phép trước khi lớp bắt đầu',
    'Check-in window is closed': 'Đã hết giờ điểm danh. Vui lòng liên hệ lễ tân để được hỗ trợ',
    checkin_window_not_started: 'Chỉ được điểm danh trong khung giờ cho phép trước khi lớp bắt đầu',
    checkin_window_closed: 'Đã hết giờ điểm danh. Vui lòng liên hệ lễ tân để được hỗ trợ',
    
    // QR code related
    'QR code expired': 'Mã QR đã hết hạn',
    'QR code has expired': 'Mã QR đã hết hạn',
    'Invalid QR code': 'Mã QR không hợp lệ',
    'QR code is invalid': 'Mã QR không hợp lệ',
    
    // Validation related
    'Invalid class': 'Lớp học không hợp lệ',
    'Invalid enrollment': 'Đăng ký không hợp lệ',
    'Invalid request': 'Yêu cầu không hợp lệ',
    'Missing required fields': 'Thiếu thông tin bắt buộc',
    
    // Auth related
    'Unauthorized': 'Không có quyền truy cập',
    'Token expired': 'Phiên đăng nhập đã hết hạn',
    'Authentication required': 'Yêu cầu đăng nhập',
    'Access denied': 'Truy cập bị từ chối',
    
    // General errors
    'Network Error': 'Lỗi kết nối mạng',
    'Server Error': 'Lỗi máy chủ',
    'Internal Server Error': 'Lỗi máy chủ nội bộ',
    'Bad Request': 'Yêu cầu không hợp lệ',
    'Not Found': 'Không tìm thấy',
    'Forbidden': 'Không có quyền truy cập',
    'Service Unavailable': 'Dịch vụ không khả dụng',
    'Request Timeout': 'Yêu cầu hết thời gian',
  };
  
  // Check exact match first
  if (translations[message]) {
    return translations[message];
  }
  
  // Check if message contains any of the English phrases
  for (const [english, vietnamese] of Object.entries(translations)) {
    if (message.includes(english)) {
      return message.replace(english, vietnamese);
    }
  }
  
  return message;
};

const attendanceErrorMessages = {
  checkin_window_not_started: 'Chưa đến giờ điểm danh. Vui lòng quay lại gần giờ bắt đầu lớp.',
  checkin_window_closed: 'Đã hết giờ điểm danh. Vui lòng liên hệ lễ tân hoặc PT để được hỗ trợ.',
};

const translateAttendanceErrorCode = (code) => {
  if (!code) return null;
  const normalizedCode = String(code).toLowerCase();
  return attendanceErrorMessages[normalizedCode] || null;
};

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
    const rawMessage = error.response?.data?.message || 'Không thể tải danh sách lớp học.';
    const message = translateErrorMessage(rawMessage);
    throw new Error(message);
  }
};

export const enrollInClass = async (classId) => {
  if (!classId) {
    throw new Error('Thiếu mã lớp học để đăng ký.');
  }

  try {
    console.log('=== Enrolling in Class ===');
    console.log('Class ID:', classId);
    
    const response = await retryRequest(() => 
      withClient().post(`/api/customer/classes/${classId}/enroll`)
    );
    
    console.log('Enroll Response:', response);
    
    // If API returns success: false, throw error
    if (response?.success === false) {
      const translatedMessage = translateErrorMessage(response?.message || 'Đăng ký lớp học thất bại.');
      throw new Error(translatedMessage);
    }
    
    return response;
  } catch (error) {
    console.error('=== Enroll Error ===');
    console.error('Class ID:', classId);
    console.error('Status:', error.response?.status);
    console.error('Error:', error.response?.data || error.message);
    
    // Handle 502: Backend might have saved data but failed to return response
    // Verify enrollment status before throwing error
    if (error.response?.status === 502) {
      try {
        console.log('502 Error detected - Verifying enrollment status...');
        // Wait a bit for backend to finish processing
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check if user is now enrolled
        const enrollments = await withClient().get('/api/customer/enrollments');
        const isEnrolled = enrollments?.enrollments?.some(e => e.classId === classId);
        
        if (isEnrolled) {
          console.log('✓ Enrollment verified successfully despite 502 error');
          return { 
            success: true, 
            message: 'Đăng ký lớp học thành công.',
            verified: true 
          };
        }
      } catch (verifyError) {
        console.error('Failed to verify enrollment:', verifyError);
      }
      
      throw new Error('Máy chủ tạm thời không khả dụng. Vui lòng kiểm tra lại trạng thái đăng ký.');
    }
    
    if (error.response?.status === 503) {
      throw new Error('Dịch vụ tạm thời bảo trì. Vui lòng thử lại sau.');
    }
    
    if (error.response?.status === 504) {
      throw new Error('Yêu cầu hết thời gian chờ. Vui lòng kiểm tra kết nối và thử lại.');
    }
    
    // If error is already an Error instance, rethrow it
    if (error instanceof Error && !error.response) {
      throw error;
    }
    
    // Otherwise, extract message from API response
    const rawMessage = error.response?.data?.message || error.message || 'Không thể đăng ký lớp học.';
    const message = translateErrorMessage(rawMessage);
    throw new Error(message);
  }
};

export const getMyEnrollments = async (params = {}) => {
  try {
    const response = await withClient().get('/api/customer/enrollments', { params });
    return response;
  } catch (error) {
    const rawMessage = error.response?.data?.message || 'Không thể tải lịch đã đăng ký.';
    const message = translateErrorMessage(rawMessage);
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
    const rawMessage = error.response?.data?.message || 'Không thể tải chi tiết đăng ký.';
    const message = translateErrorMessage(rawMessage);
    throw new Error(message);
  }
};

export const cancelEnrollment = async (enrollmentId, payload = {}) => {
  if (!enrollmentId) {
    throw new Error('Thiếu mã đăng ký để hủy.');
  }
  try {
    const response = await withClient().patch(`/api/customer/enrollments/${enrollmentId}/cancel`, payload);
    
    // If API returns success: false, throw error
    if (response?.success === false) {
      const translatedMessage = translateErrorMessage(response?.message || 'Hủy đăng ký thất bại.');
      throw new Error(translatedMessage);
    }
    
    return response;
  } catch (error) {
    // If error is already an Error instance, rethrow it
    if (error instanceof Error && !error.response) {
      throw error;
    }
    // Otherwise, extract message from API response
    const rawMessage = error.response?.data?.message || error.message || 'Không thể hủy đăng ký.';
    const message = translateErrorMessage(rawMessage);
    throw new Error(message);
  }
};

const resolveRolePrefix = role => {
  if (role === 'staff') return 'staff';
  return 'customer';
};

const normaliseQrValue = qrValue => {
  if (!qrValue) return qrValue;
  if (typeof qrValue === 'object') return qrValue;
  if (typeof qrValue === 'string') {
    try {
      return JSON.parse(qrValue);
    } catch {
      return qrValue;
    }
  }
  return qrValue;
};

const buildAttendanceError = (error, fallback) => {
  const data = error.response?.data || {};
  const codeMessage = translateAttendanceErrorCode(data?.error);
  if (codeMessage) {
    return codeMessage;
  }

  const rawMessage = data?.message || fallback;
  return translateErrorMessage(rawMessage);
};

/**
 * Scan QR code for attendance (check-in/check-out)
 * @param {Object} params
 * @param {string} params.classId - Class ID
 * @param {string|Object} params.qrValue - QR code data
 * @param {string} params.role - User role (customer or staff)
 * @returns {Promise} Response from API
 */
export const scanAttendance = async ({ classId, qrValue, role = 'customer' }) => {
  if (!classId) throw new Error('Thiếu mã lớp học để điểm danh.');

  const prefix = resolveRolePrefix(role);
  const qrData = normaliseQrValue(qrValue);
  
  console.log('=== ATTENDANCE SCAN API CALL ===');
  console.log('URL:', `/api/${prefix}/classes/${classId}/attendance/scan`);
  console.log('QR Data:', qrData);
  console.log('Role:', role);

  try {
    const response = await withClient().post(
      `/api/${prefix}/classes/${classId}/attendance/scan`,
      { qrValue: qrData }
    );
    
    console.log('=== ATTENDANCE SCAN RESPONSE ===');
    console.log('Response:', JSON.stringify(response, null, 2));
    
    return response;
  } catch (error) {
    console.error('=== ATTENDANCE SCAN ERROR ===');
    console.error('Error:', error);
    console.error('Error Response:', error.response?.data);
    
    throw new Error(buildAttendanceError(error, 'Không thể điểm danh bằng QR.'));
  }
};

// Backward compatibility - deprecated, use scanAttendance instead
export const checkInToClass = async (params) => {
  console.warn('⚠️ checkInToClass is deprecated. Use scanAttendance instead.');
  return scanAttendance(params);
};

// Backward compatibility - deprecated, use scanAttendance instead
export const checkOutFromClass = async (params) => {
  console.warn('⚠️ checkOutFromClass is deprecated. Use scanAttendance instead.');
  return scanAttendance(params);
};
