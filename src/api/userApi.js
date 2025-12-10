import createAxiosInstance from '@api/axiosInstance';

export const requestOTP = async (phoneNumber) => {
    try {
        const response = await createAxiosInstance().post('/api/auth/register', {
            phone: phoneNumber,
        });
        return response;
    } catch (error) {
        // Ném lỗi ra ngoài để component có thể bắt và xử lý
        console.error('Lỗi khi yêu cầu OTP:', error.response?.data || error.message);
        throw error;
    }
}

export async function verifyOtp(phoneNumber, code) {
    try {
        const response = await createAxiosInstance().post('/api/auth/verify-register', {
            phone: phoneNumber,
            code: code,
        });
        return response;
    } catch (error) {
        // Nếu thất bại, lấy thông báo lỗi và NÉM nó ra
        const errorMessage = error.response?.data?.message || 'Mã OTP không hợp lệ hoặc đã hết hạn.';
        throw new Error(errorMessage);
    }
}

export async function requestLoginOtp(phoneNumber) {
    try {
        console.log('=== Requesting Login OTP ===');
        console.log('Phone:', phoneNumber);
        
        const response = await createAxiosInstance().post('/api/auth/login', {
            phone: phoneNumber,
        });
        
        console.log('Login OTP Response:', response);
        return response;
    } catch (error) {
        console.error('=== Login OTP Error ===');
        console.error('Phone:', phoneNumber);
        console.error('Error:', error.response?.data || error.message);
        
        const errorMessage = error.response?.data?.error 
            || error.response?.data?.message 
            || error.message 
            || 'Không thể gửi mã OTP. Vui lòng thử lại.';
        throw new Error(errorMessage);
    }
}

export async function verifyLoginOtp(phoneNumber, code) {
    try {
        console.log('=== Verifying Login OTP ===');
        console.log('Phone:', phoneNumber);
        console.log('Code:', code);
        
        const response = await createAxiosInstance().post('/api/auth/verify-login', {
            phone: phoneNumber,
            code: code,
        });
        
        console.log('Verify Login Response:', response);
        // Nếu thành công, response sẽ chứa token và thông tin user
        return response;
    } catch (error) {
        console.error('=== Verify Login Error ===');
        console.error('Phone:', phoneNumber);
        console.error('Code:', code);
        console.error('Error:', error.response?.data || error.message);
        
        const errorMessage = error.response?.data?.message 
            || error.message 
            || 'Mã OTP không hợp lệ. Vui lòng thử lại.';
        throw new Error(errorMessage);
    }
}

export async function getProfile(token = null) {
    try {
        console.log('🔄 getProfile: Starting profile fetch...');
        // Truyền token vào instance nếu có, để login flow không bị race condition
        const client = createAxiosInstance(undefined, token);
        const response = await client.get('/api/user/profile', {
            params: { cacheBust: Date.now() },
            headers: { 'Cache-Control': 'no-cache' },
        });
        console.log('✅ getProfile: Success', response);
        return response;
    } catch (error) {
        // Nếu là lỗi 401 (Unauthorized), không cần log error vì UserContext sẽ xử lý logout
        if (error.response?.status !== 401) {
            console.error('❌ getProfile: Failed', error.message);
        }
        const errorMessage = error.response?.data?.message || 'Không thể tải thông tin cá nhân.';
        throw new Error(errorMessage);
    }
}

export async function getUserMe() {
    const client = createAxiosInstance();
    try {
        const response = await client.get('/api/user/me', {
            params: { cacheBust: Date.now() },
            headers: { 'Cache-Control': 'no-cache' },
        });
        return response;
    } catch (error) {
        const status = error?.response?.status;

        // Fallback: một số môi trường chưa có /api/user/me, thử /api/user/profile
        if (status === 404 || status === 405 || status === 501) {
            try {
                const profileResponse = await client.get('/api/user/profile', {
                    params: { cacheBust: Date.now() },
                    headers: { 'Cache-Control': 'no-cache' },
                });
                return profileResponse;
            } catch (fallbackError) {
                const fallbackMessage =
                    fallbackError.response?.data?.message ||
                    'Không thể tải thông tin hội viên (fallback).';
                throw new Error(fallbackMessage);
            }
        }

        const errorMessage = error.response?.data?.message || 'Không thể tải thông tin hội viên.';
        throw new Error(errorMessage);
    }
}

export async function updateProfile(profileData) {
    try {
        // ⚠️ Lưu ý: Hàm này không còn dùng để cập nhật avatar
        const response = await createAxiosInstance().put('/api/user/profile', profileData);
        return response;
    } catch (error) {
        const errorMessage = error.response?.data?.message || 'Cập nhật thông tin thất bại.';
        throw new Error(errorMessage);
    }
}

export async function updateAvatar(file) {
    // để gửi file thì cần formData
    const formData = new FormData();
    formData.append('avatar', {
        uri: file.uri,
        type: file.type,
        name: file.fileName || 'avatar.jpg'
    });

    try {
        // Khi gửi FormData, cần set header 'Content-Type' đặc biệt
        const axiosMultipartInstance = createAxiosInstance('multipart/form-data');
        const response = await axiosMultipartInstance.put('/api/user/avatar', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response;
    } catch (error) {
        const errorMessage = error.response?.data?.message || 'Tải ảnh lên thất bại';
        throw new Error(errorMessage);
    }
}

export async function requestDeleteAccount() {
    try {
        const response = await createAxiosInstance().post('/api/user/delete-account/request');
        return response;
    } catch (error) {
        const errorMessage = error.response?.data?.message || 'Yêu cầu xóa tài khoản thất bại';
        throw new Error(errorMessage);
    }
}

export async function confirmDeleteAccount(code) {
    try {
        const response = await createAxiosInstance().post('/api/user/delete-account/confirm', { code });
        return response;
    } catch (error) {
        const errorMessage = error.response?.data?.message || 'Xác nhận xóa tài khoản thất bại';
        throw new Error(errorMessage);
    }
}

export async function getAllVideos(params = {}) {
    try {
        const response = await createAxiosInstance().get('/api/videos', { params });
        return response;
    } catch (error) {
        const errorMessage = error.response?.data?.message || 'Không thể tải danh sách video.';
        throw new Error(errorMessage);
    }
}

export async function getVideoById(videoId) {
    try {
        const response = await createAxiosInstance().get(`/api/videos/${videoId}`);
        return response;
    } catch (error) {
        // <<< THÊM LOG LỖI CHI TIẾT >>>
        console.error('--- userApi: getVideoById FAILED ---');
        console.error('Video ID:', videoId);
        console.error('Full Axios Error:', error.response?.data || error.message || error);
        // ---------------------------------
        const errorMessage = error.response?.data?.message || 'Không thể tải thông tin video.';
        throw new Error(errorMessage);
    }
}

export async function getFavoriteVideos() {
    try {
        const response = await createAxiosInstance().get('/api/customer/videos/favorites');
        return response;
    } catch (error) {
        const errorMessage = error.response?.data?.message || 'Không thể tải danh sách video yêu thích.';
        throw new Error(errorMessage);
    }
}

export async function addVideoToFavorites(videoId) {
    if (!videoId) {
        throw new Error('Thiếu mã video để thêm vào danh sách yêu thích.');
    }

    try {
        const response = await createAxiosInstance().post(`/api/customer/videos/${videoId}/favorites`);
        return response;
    } catch (error) {
        const errorMessage = error.response?.data?.message || 'Không thể thêm video vào danh sách yêu thích.';
        throw new Error(errorMessage);
    }
}

export async function removeVideoFromFavorites(videoId) {
    if (!videoId) {
        throw new Error('Thiếu mã video để bỏ khỏi danh sách yêu thích.');
    }

    try {
        const response = await createAxiosInstance().delete(`/api/customer/videos/${videoId}/favorites`);
        return response;
    } catch (error) {
        const errorMessage = error.response?.data?.message || 'Không thể gỡ video khỏi danh sách yêu thích.';
        throw new Error(errorMessage);
    }
}

// ============== MEMBERSHIP & PACKAGES ==============

export const getMembershipInfo = async () => {
    const client = createAxiosInstance();
    try {
        const response = await client.get('/api/user/membership', {
            params: { cacheBust: Date.now() },
            headers: { 'Cache-Control': 'no-cache' },
        });
        return response; // FIX: Return response directly
    } catch (error) {
        console.error('❌ getMembershipInfo: Failed', error.response?.data || error.message);
        throw error;
    }
};

export const getAllPackages = async () => {
    const client = createAxiosInstance();
    try {
        const response = await client.get('/api/packages');
        return response; // FIX: Return response directly
    } catch (error) {
        console.error('❌ getAllPackages: Failed', error.response?.data || error.message);
        throw error;
    }
};

export const getMembershipUpgradeQuote = async ({ packageId, billingCycle, isTemporary }) => {
  const client = createAxiosInstance();
  try {
    const payload = { packageId, billingCycle };
    if (isTemporary !== undefined) {
      payload.isTemporary = isTemporary;
    }
    const response = await client.post('/api/user/membership/quote', payload);
    return response; // FIX: Return response directly
  } catch (error) {
    console.error('❌ getMembershipUpgradeQuote: Failed', error.response?.data || error.message);
    throw error;
  }
};