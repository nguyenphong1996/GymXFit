import React, { useCallback, useContext, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// New Booking Flow
import BookingNavigator from './BookingNavigator';
import MyBookingsScreen from '@screens/booking/MyBookingsScreen';

// App screens
import HomeScreen from '@screens/home/HomeScreen';
import FavoriteVideosScreen from '@screens/video/FavoriteVideosScreen';
import ProfileScreen from '@screens/profile/ProfileScreen';
import QrScannerModal from '@screens/qr/QrScannerModal';
import UpdateProfileScreen from '@screens/profile/UpdateProfileScreen';
import PaymentCardsScreen from '@screens/profile/PaymentCardsScreen';
import GymxfitPolicyScreen from '@screens/profile/GymxfitPolicyScreen';
import NewsScreen from '@screens/home/NewsScreen';
import SearchCalendarScreen from '@screens/booking/SearchCalendarScreen';
import PaymentScreen from '@screens/payment/PaymentScreen';
import PaymentTokenScreen from '@screens/payment/PaymentTokenScreen';
import PaymentTokenizationScreen from '@screens/payment/PaymentTokenizationScreen';
import PaymentCardSelectScreen from '@screens/payment/PaymentCardSelectScreen';
import BankTransferScreen from '@screens/payment/BankTransferScreen';
import CardMembershipScreen from '../screens/membership/CardMembershipScreen';
import CardMembershipDetailScreen from '../screens/membership/CardMembershipDetailScreen';
import FAQScreen from '@screens/membership/FAQScreen';
import PaymentMethodScreen from '@screens/membership/PaymentMethodScreen';
import PaymentResultScreen from '@screens/payment/PaymentResultScreen';
import WorkoutScreen from '@screens/workouts/WorkoutScreen';
import WorkoutVideoScreen from '@screens/video/WorkoutVideoScreen';
import ActivityLogsScreen from '@screens/profile/ActivityLogsScreen';
import { UserContext } from '@context/UserContext';
import { scanAttendance } from '@api/classesApi';
import ServiceInfoScreen from '@screens/profile/ServiceInfoScreen';

// This long function is not relevant to the navigation change, keeping it as is.
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

// Custom Tab Bar with FAB (no changes needed here)
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
                
                if (!user) {
                    console.error('User not found - not logged in');
                    return {
                        success: false,
                        message: 'Vui lòng đăng nhập để sử dụng chức năng điểm danh',
                    };
                }

                const role = user.role || 'customer';
                console.log('Resolved role:', role);

                if (role !== 'customer' && role !== 'staff') {
                    console.error('Invalid role:', role);
                    return {
                        success: false,
                        message: 'Vai trò hiện tại chưa được hỗ trợ điểm danh QR',
                    };
                }

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

                console.log('=== SCAN SUCCESS - CALLING API ===');
                console.log('QR Data:', qrData);
                console.log('Class ID:', classId);
                console.log('Role:', role);
                
                const response = await scanAttendance({ 
                    classId, 
                    qrValue: qrData,
                    role 
                });

                console.log('=== SCAN SUCCESS - API RESPONSE ===');
                console.log('Response:', response);
                console.log('Response.success:', response?.success);
                console.log('Response.message:', response?.message);

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
            <QrScannerModal
                visible={showQRScanner}
                onClose={() => setShowQRScanner(false)}
                onScanSuccess={handleScanSuccess}
                helperTitle="Quét mã QR để điểm danh vào lớp học"
            />
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
            {/* THIS IS THE MODIFIED TAB */}
            <TouchableOpacity
                style={styles.tabButton}
                onPress={() => navigation.navigate('BookingStack')}
            >
                <Icon
                    name="assignment"
                    size={24}
                    color={state.routes[state.index].name === 'BookingStack' ? '#fff' : '#ddd'}
                />
                <Text style={[styles.tabLabel, state.routes[state.index].name === 'BookingStack' && styles.activeLabel]}>
                    Đặt lịch
                </Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={styles.fabContainer}
                onPress={() => setShowQRScanner(true)}
            >
                <View style={styles.fab}>
                    <Icon name="qr-code-scanner" size={32} color="#fff" />
                </View>
                <Text style={styles.fabLabel}>Quét mã</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={styles.tabButton}
                onPress={() => navigation.navigate('Favorites')}
            >
                <Icon
                    name="favorite"
                    size={24}
                    color={state.routes[state.index].name === 'Favorites' ? '#fff' : '#ddd'}
                />
                <Text style={[styles.tabLabel, state.routes[state.index].name === 'Favorites' && styles.activeLabel]}>
                    Yêu thích
                </Text>
            </TouchableOpacity>
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

const PaymentStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name='PaymentMethod' component={PaymentMethodScreen} />
        <Stack.Screen name='PaymentCardSelect' component={PaymentCardSelectScreen} />
        <Stack.Screen name='PaymentTokenization' component={PaymentTokenizationScreen} />
        <Stack.Screen name='PaymentTokenScreen' component={PaymentTokenScreen} />
        <Stack.Screen name='BankTransferScreen' component={BankTransferScreen} />
        <Stack.Screen name='PaymentResult' component={PaymentResultScreen} />
    </Stack.Navigator>
);

const HomeStack = () => {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name='Home' component={HomeScreen} />
            <Stack.Screen name='News' component={NewsScreen} />
            <Stack.Screen name='SearchCalendarScreen' component={SearchCalendarScreen} />
            <Stack.Screen name='CardMembershipScreen' component={CardMembershipScreen} />
            <Stack.Screen name='CardMembershipDetail' component={CardMembershipDetailScreen} />
            <Stack.Screen name='MembershipFAQ' component={FAQScreen} />
            <Stack.Screen name='WorkoutScreen' component={WorkoutScreen} />
            <Stack.Screen name='WorkoutVideo' component={WorkoutVideoScreen} />
            <Stack.Screen name='PaymentMethod' component={PaymentMethodScreen} />
            <Stack.Screen name='ActivityLogs' component={ActivityLogsScreen} />
        </Stack.Navigator>
    );
};

const ProfileStack = () => {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name='Profile' component={ProfileScreen} />
            <Stack.Screen name='MyBookings' component={MyBookingsScreen} />
            <Stack.Screen name='UpdateProfile' component={UpdateProfileScreen} />
            <Stack.Screen name='PaymentCards' component={PaymentCardsScreen} />
            <Stack.Screen name='MembershipFAQ' component={FAQScreen} />
            <Stack.Screen name='GymxfitPolicy' component={GymxfitPolicyScreen} />
            <Stack.Screen name='ServiceInfo' component={ServiceInfoScreen} />
            <Stack.Screen name='ActivityLogs' component={ActivityLogsScreen} />
        </Stack.Navigator>
    );
};

// Main Tab Navigator
const MainTabs = () => (
    <Tab.Navigator
        initialRouteName='HomeStack'
        tabBar={props => <CustomTabBar {...props} />}
        screenOptions={{ headerShown: false }}
    >
        <Tab.Screen name="HomeStack" component={HomeStack} />
        <Tab.Screen name="BookingStack" component={BookingNavigator} />
        <Tab.Screen name="Favorites" component={FavoriteVideosScreen} />
        <Tab.Screen name="ProfileStack" component={ProfileStack} />
    </Tab.Navigator>
);

const RootStack = createNativeStackNavigator();

const HomeNavigator = () => {
    return (
        <RootStack.Navigator screenOptions={{ headerShown: false }}>
            <RootStack.Screen name="Main" component={MainTabs} />
            <RootStack.Group screenOptions={{ presentation: 'modal' }}>
                <RootStack.Screen name="PaymentStack" component={PaymentStack} />
            </RootStack.Group>
        </RootStack.Navigator>
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
