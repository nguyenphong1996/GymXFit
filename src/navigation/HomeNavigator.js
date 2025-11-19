import React, { useCallback, useContext, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// App screens
import HomeScreen from '@screens/home/HomeScreen';
import FavoriteVideosScreen from '@screens/video/FavoriteVideosScreen';
import ProfileScreen from '@screens/profile/ProfileScreen';
import QrScannerModal from '@screens/qr/QrScannerModal';
import UpdateProfileScreen from '@screens/profile/UpdateProfileScreen';
import SearchCalendarScreen from '@screens/booking/SearchCalendarScreen';
import BookScreen from '@screens/booking/BookScreen';
import NewsScreen from '@screens/home/NewsScreen';
import CalendarScreen from '@screens/booking/CalendarScreen';
import CardMembershipScreen from '@screens/membership/CardMembershipScreen';
import CardMembershipDetailScreen from '@screens/membership/CardMembershipDetailScreen';
import WorkoutScreen from '@screens/workouts/WorkoutScreen';
import WorkoutVideoScreen from '@screens/video/WorkoutVideoScreen';
import { UserContext } from '@context/UserContext';
import { scanAttendance } from '@api/classesApi';

const resolveCheckinWindowMessage = (message = '', code = '') => {
    const normalizedMessage = typeof message === 'string' ? message.toLowerCase() : '';
    const normalizedCode = typeof code === 'string' ? code.toLowerCase() : '';

    if (
        normalizedCode === 'checkin_window_not_started' ||
        normalizedMessage.includes('pre-defined time window') ||
        normalizedMessage.includes('check-in is only allowed') ||
        normalizedMessage.includes('chỉ được điểm danh trong khung giờ') ||
        normalizedMessage.includes('chưa đến giờ điểm danh')
    ) {
        return 'Chưa đến giờ điểm danh - Vui lòng quay lại gần giờ bắt đầu lớp.';
    }

    if (
        normalizedCode === 'checkin_window_closed' ||
        normalizedMessage.includes('window is closed') ||
        normalizedMessage.includes('đã hết giờ điểm danh') ||
        normalizedMessage.includes('quá giờ điểm danh')
    ) {
        return 'Đã hết giờ điểm danh - Vui lòng liên hệ lễ tân hoặc PT để được hỗ trợ.';
    }

    return null;
};

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const renderCustomTabBar = props => <CustomTabBar {...props} />;

// Custom Tab Bar với FAB
const CustomTabBar = ({ state, descriptors, navigation }) => {
    const [showQRScanner, setShowQRScanner] = useState(false);
    const { user } = useContext(UserContext);

    // Handle QR scan with new API
    const handleScanSuccess = useCallback(
        async (qrData) => {
            try {
                console.log('=== QR SCAN - START ===');
                console.log('User:', user);
                console.log('User Role:', user?.role);
                console.log('QR Data:', qrData);
                
                // Check if user is logged in
                if (!user) {
                    console.error('User not found - not logged in');
                    return {
                        success: false,
                        message: 'Vui lòng đăng nhập để sử dụng chức năng điểm danh',
                    };
                }

                // Get role, default to 'customer' if not set
                const role = user.role || 'customer';
                console.log('Resolved role:', role);

                // Validate role
                if (role !== 'customer' && role !== 'staff') {
                    console.error('Invalid role:', role);
                    return {
                        success: false,
                        message: 'Vai trò hiện tại chưa được hỗ trợ điểm danh QR',
                    };
                }

                // Validate QR data structure
                if (!qrData || typeof qrData !== 'object') {
                    return {
                        success: false,
                        message: 'Mã QR không hợp lệ - Dữ liệu không đúng định dạng',
                    };
                }

                const classId = qrData?.classId;
                if (!classId) {
                    return {
                        success: false,
                        message: 'Mã QR không hợp lệ - Thiếu thông tin lớp học',
                    };
                }

                // Check if QR has expired
                if (qrData.expiresAt) {
                    const expiryTime = new Date(qrData.expiresAt).getTime();
                    const currentTime = new Date().getTime();
                    
                    if (currentTime > expiryTime) {
                        return {
                            success: false,
                            message: 'Mã QR đã hết hạn',
                        };
                    }
                }

                // Call check-in API
                console.log('=== SCAN SUCCESS - CALLING API ===');
                console.log('QR Data:', qrData);
                console.log('Class ID:', classId);
                console.log('Role:', role);
                
                const response = await scanAttendance({ 
                    classId, 
                    qrValue: qrData,  // Pass object directly, API will handle it
                    role 
                });

                console.log('=== SCAN SUCCESS - API RESPONSE ===');
                console.log('Response:', response);
                console.log('Response.success:', response?.success);
                console.log('Response.message:', response?.message);

                // Check API response
                if (response?.success === false) {
                    const errorMsg = response?.message || '';
                    
                    console.log('=== RESPONSE SUCCESS = FALSE ===');
                    console.log('Error Message:', errorMsg);

                    const checkinWindowMessage = resolveCheckinWindowMessage(errorMsg, response?.error);
                    if (checkinWindowMessage) {
                        return {
                            success: false,
                            message: checkinWindowMessage,
                        };
                    }
                    
                    // Handle specific errors
                    if (errorMsg.includes('not enrolled') || errorMsg.includes('không đăng ký')) {
                        return {
                            success: false,
                            message: 'Quét sai lớp học - Bạn chưa đăng ký lớp này',
                        };
                    }
                    
                    if (errorMsg.includes('expired') || errorMsg.includes('hết hạn')) {
                        return {
                            success: false,
                            message: 'Mã QR đã hết hạn',
                        };
                    }
                    
                    return {
                        success: false,
                        message: errorMsg || 'Quét QR lỗi',
                    };
                }

                console.log('=== CHECK-IN SUCCESS ===');
                
                // Success
                return {
                    success: true,
                    message: response?.message || 'Quét mã thành công! Đã check-in vào lớp học.',
                };
            } catch (error) {
                console.error('Error in handleScanSuccess:', error);
                
                const errorMsg = error?.message || '';

                const checkinWindowMessage = resolveCheckinWindowMessage(errorMsg, error?.response?.data?.error);
                if (checkinWindowMessage) {
                    return {
                        success: false,
                        message: checkinWindowMessage,
                    };
                }
                
                // Handle specific errors
                if (errorMsg.includes('not enrolled') || errorMsg.includes('không đăng ký')) {
                    return {
                        success: false,
                        message: 'Quét sai lớp học - Bạn chưa đăng ký lớp này',
                    };
                }
                
                if (errorMsg.includes('expired') || errorMsg.includes('hết hạn')) {
                    return {
                        success: false,
                        message: 'Mã QR đã hết hạn',
                    };
                }
                
                return {
                    success: false,
                    message: 'Quét QR lỗi - ' + (errorMsg || 'Không thể xử lý mã QR'),
                };
            }
        },
        [user],
    );

    return (
        <View style={styles.tabContainer}>
            {/* QR Scanner Modal */}
            <QrScannerModal
                visible={showQRScanner}
                onClose={() => setShowQRScanner(false)}
                onScanSuccess={handleScanSuccess}
                helperTitle="Quét mã QR để điểm danh vào lớp học"
            />

            {/* Nút Home */}
            <TouchableOpacity
                style={styles.tabButton}
                onPress={() => navigation.navigate('HomeStack')}
            >
                <Icon
                    name="home"
                    size={24}
                    color={state.routes[state.index].name === 'HomeStack' ? '#fff' : '#ddd'}
                />
                <Text style={[styles.tabLabel, state.routes[state.index].name === 'HomeStack' && styles.activeLabel]}>
                    Trang chủ
                </Text>
            </TouchableOpacity>

            {/* Nút Search */}
            <TouchableOpacity
                style={styles.tabButton}
                onPress={() => navigation.navigate('SearchCalendarScreen')}
            >
                <Icon
                    name="assignment"
                    size={24}
                    color={state.routes[state.index].name === 'SearchCalendarScreen' ? '#fff' : '#ddd'}
                />
                <Text style={[styles.tabLabel, state.routes[state.index].name === 'SearchCalendarScreen' && styles.activeLabel]}>
                    Đặt lịch
                </Text>
            </TouchableOpacity>

            {/* FAB - QR Scan ở giữa */}
            <TouchableOpacity
                style={styles.fabContainer}
                onPress={() => setShowQRScanner(true)}
            >
                <View style={styles.fab}>
                    <Icon name="qr-code-scanner" size={32} color="#fff" />
                </View>
                <Text style={styles.fabLabel}>Quét mã</Text>
            </TouchableOpacity>

            {/* Nút Favorites */}
            <TouchableOpacity
                style={styles.tabButton}
                onPress={() => navigation.navigate('Favorites')}
            >
                <Icon
                    name="star"
                    size={24}
                    color={state.routes[state.index].name === 'Favorites' ? '#fff' : '#ddd'}
                />
                <Text style={[styles.tabLabel, state.routes[state.index].name === 'Favorites' && styles.activeLabel]}>
                    Yêu thích
                </Text>
            </TouchableOpacity>

            {/* Nút Profile */}
            <TouchableOpacity
                style={styles.tabButton}
                onPress={() => navigation.navigate('ProfileStack')}
            >
                <Icon
                    name="person"
                    size={24}
                    color={state.routes[state.index].name === 'ProfileStack' ? '#fff' : '#ddd'}
                />
                <Text style={[styles.tabLabel, state.routes[state.index].name === 'ProfileStack' && styles.activeLabel]}>
                    Profile
                </Text>
            </TouchableOpacity>
        </View>
    );
};

const HomeStack = () => {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name='Home' component={HomeScreen} />
            <Stack.Screen name='SearchCalendarScreen' component={SearchCalendarScreen} />
            <Stack.Screen name='News' component={NewsScreen} />
            <Stack.Screen name='CalendarScreen' component={CalendarScreen} />
            <Stack.Screen name='CardMembershipScreen' component={CardMembershipScreen} />
            <Stack.Screen name='CardMembershipDetail' component={CardMembershipDetailScreen} />
            <Stack.Screen name='WorkoutScreen' component={WorkoutScreen} />
            <Stack.Screen name='WorkoutVideo' component={WorkoutVideoScreen} />
            <Stack.Screen name='BookScreen' component={BookScreen} />
        </Stack.Navigator>
    )
}

const ProfileStack = () => {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name='Profile' component={ProfileScreen} />
            <Stack.Screen name='UpdateProfile' component={UpdateProfileScreen} />
        </Stack.Navigator>
    )
}

const HomeNavigator = () => {
    return (
        <Tab.Navigator
            initialRouteName='HomeStack'
            tabBar={renderCustomTabBar}
            screenOptions={{
                headerShown: false,
            }}
        >
            <Tab.Screen name="HomeStack" component={HomeStack} />
            <Tab.Screen name="SearchCalendarScreen" component={SearchCalendarScreen} />
            <Tab.Screen name="Favorites" component={FavoriteVideosScreen} />
            <Tab.Screen name="ProfileStack" component={ProfileStack} />
        </Tab.Navigator>
    );
};

const styles = StyleSheet.create({
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#30C451',
        height: 70,
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingHorizontal: 10,
        position: 'relative',
        elevation: 8,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: -2 },
    },
    tabButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
    },
    tabLabel: {
        fontSize: 11,
        color: '#ddd',
        marginTop: 2,
        textAlign: 'center',
    },
    activeLabel: {
        color: '#fff',
        fontWeight: '600',
    },
    fabContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        top: -20,
    },
    fab: {
        backgroundColor: '#30C451',
        width: 70,
        height: 70,
        borderRadius: 35,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 12,
        shadowColor: '#30C451',
        shadowOpacity: 0.4,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
        borderWidth: 5,
        borderColor: '#fff',
    },
    fabLabel: {
        color: '#fff',
        fontSize: 11,
        marginTop: 4,
        fontWeight: '600',
    },
});

export default HomeNavigator;
