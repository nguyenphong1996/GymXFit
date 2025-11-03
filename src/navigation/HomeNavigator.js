import React, { useCallback, useContext, useMemo, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// App screens
import HomeScreen from '@screens/home/HomeScreen';
import NotificationScreen from '@screens/home/NotificationScreen';
import ProfileScreen from '@screens/profile/ProfileScreen';
import QrScannerModal from '@screens/qr/QrScannerModal';
import UpdateProfileScreen from '@screens/profile/UpdateProfileScreen';
import SearchCalendarScreen from '@screens/booking/SearchCalendarScreen';
import BookScreen from '@screens/booking/BookScreen';
import NewsScreen from '@screens/home/NewsScreen';
import CalendarScreen from '@screens/booking/CalendarScreen';
import CardMembershipScreen from '@screens/membership/CardMembershipScreen';
import WorkoutScreen from '@screens/workouts/WorkoutScreen';
import WorkoutScreen2 from '@screens/workouts/WorkoutScreen2';
import WorkoutVideoScreen from '@screens/video/WorkoutVideoScreen';
import { UserContext } from '@context/UserContext';
import { checkInToClass, checkOutFromClass } from '@api/classesApi';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const renderCustomTabBar = props => <CustomTabBar {...props} />;

// Custom Tab Bar với FAB
const CustomTabBar = ({ state, descriptors, navigation }) => {
    const [showQRScanner, setShowQRScanner] = useState(false);
    const { user } = useContext(UserContext);

    const role = user?.role;

    const parseQrPayload = useCallback(result => {
        const rawValue = result?.value;
        if (!rawValue) {
            throw new Error('Không tìm thấy dữ liệu trong QR.');
        }

        if (typeof rawValue === 'object' && rawValue !== null) {
            return rawValue;
        }

        if (typeof rawValue === 'string') {
            try {
                return JSON.parse(rawValue);
            } catch {
                throw new Error('Mã QR không đúng định dạng.');
            }
        }

        throw new Error('Định dạng QR không được hỗ trợ.');
    }, []);

    const ensureRoleSupported = useCallback(() => {
        if (!role) {
            throw new Error('Không xác định được vai trò người dùng.');
        }
        if (role !== 'customer' && role !== 'staff') {
            throw new Error('Vai trò hiện tại chưa được hỗ trợ điểm danh QR.');
        }
        return role;
    }, [role]);

    const performAttendance = useCallback(
        async (actionType, result) => {
            const userRole = ensureRoleSupported();
            const payload = parseQrPayload(result);

            const classId = payload?.classId;
            if (!classId) {
                throw new Error('QR không chứa thông tin lớp học hợp lệ.');
            }

            const qrValue = typeof result?.value === 'string' ? result.value : payload;
            const action = actionType === 'checkin' ? 'check-in' : 'check-out';

            const response =
                actionType === 'checkin'
                    ? await checkInToClass({ classId, qrValue, role: userRole })
                    : await checkOutFromClass({ classId, qrValue, role: userRole });

            return response?.message || `Hoàn tất ${action} lớp ${classId}.`;
        },
        [ensureRoleSupported, parseQrPayload],
    );

    const handleCheckIn = useCallback(
        async result => {
            const message = await performAttendance('checkin', result);
            return message || 'Check-in thành công.';
        },
        [performAttendance],
    );

    const handleCheckOut = useCallback(
        async result => {
            const message = await performAttendance('checkout', result);
            return message || 'Check-out thành công.';
        },
        [performAttendance],
    );

    const quickInfo = useMemo(
        () =>
            role
                ? `Quét mã để điểm danh (${role === 'staff' ? 'PT' : 'Hội viên'})`
                : 'Đăng nhập để dùng điểm danh QR',
        [role],
    );

    return (
        <View style={styles.tabContainer}>
            {/* QR Scanner Modal */}
            <QrScannerModal
                visible={showQRScanner}
                onClose={() => setShowQRScanner(false)}
                onCheckIn={role ? handleCheckIn : undefined}
                onCheckOut={role ? handleCheckOut : undefined}
                helperTitle={quickInfo}
                disableActions={!role}
                onUnsupportedRole={() =>
                    Alert.alert('Không thể điểm danh', 'Bạn cần đăng nhập với tài khoản hội viên hoặc huấn luyện viên.')
                }
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

            {/* Nút Notification */}
            <TouchableOpacity
                style={styles.tabButton}
                onPress={() => navigation.navigate('Notification')}
            >
                <Icon
                    name="star"
                    size={24}
                    color={state.routes[state.index].name === 'Notification' ? '#fff' : '#ddd'}
                />
                <Text style={[styles.tabLabel, state.routes[state.index].name === 'Notification' && styles.activeLabel]}>
                    Yêu thích
                </Text>
            </TouchableOpacity>

            {/* Nút Profile */}
            <TouchableOpacity
                style={styles.tabButton}
                onPress={() => navigation.navigate('ProfileStack')}
            >
                <Icon
                    name="headset-mic"
                    size={24}
                    color={state.routes[state.index].name === 'ProfileStack' ? '#fff' : '#ddd'}
                />
                <Text style={[styles.tabLabel, state.routes[state.index].name === 'ProfileStack' && styles.activeLabel]}>
                    Hỗ trợ
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
            <Stack.Screen name='WorkoutScreen' component={WorkoutScreen} />
            <Stack.Screen name='WorkoutScreen2' component={WorkoutScreen2} />
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
            <Tab.Screen name="Notification" component={NotificationScreen} />
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
