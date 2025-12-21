import React, { useContext, useEffect, useRef } from 'react';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { View, ActivityIndicator, StyleSheet, Linking } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useToast } from '@context/ToastContext';
import { createPtBooking } from '@api/ptBookingApi';

import { UserContext } from '@context/UserContext';
import UserNavigator from '@navigation/UserNavigator';
import HomeNavigator from '@navigation/HomeNavigator';
import SurveyScreen from '@screens/survey/SurveyScreen';

const Stack = createNativeStackNavigator();

const linking = {
  prefixes: ['gymxfit://', 'com.gymxfit://'], // Added both schemes for safety
  config: {
    screens: {
      HomeApp: {
        screens: {
          PaymentStack: {
            screens: {
              PaymentResult: 'payment-result',
            },
          },
        },
      },
    },
  },
};

const AppNavigator = () => {
  const { user, userToken, isLoading } = useContext(UserContext);
  const { showToast } = useToast();
  const navigationRef = useNavigationContainerRef();

  useEffect(() => {
    const handleDeepLink = async (event) => {
      console.log('Deep link received:', event.url);
      const url = new URL(event.url);
      const vnp_ResponseCode = url.searchParams.get('vnp_ResponseCode');

      // Only process payment-related deep links
      if (url.pathname.includes('payment-result')) {
        const pendingBookingJSON = await AsyncStorage.getItem('pendingBooking');
        const pendingMembershipJSON = await AsyncStorage.getItem('pendingMembership');
        
        await AsyncStorage.removeItem('pendingBooking'); // Always remove to prevent re-booking
        await AsyncStorage.removeItem('pendingMembership'); // Remove membership data

        if (vnp_ResponseCode === '00') {
          // Payment successful
          
          // Handle PT booking (existing logic)
          if (pendingBookingJSON) {
            try {
              const pendingBooking = JSON.parse(pendingBookingJSON);
              await createPtBooking(pendingBooking);
              showToast({
                type: 'success',
                title: 'Thành công',
                message: 'Bạn đã đặt lịch PT thành công!',
              });
              // Navigate to bookings screen after a short delay
              setTimeout(() => {
                navigationRef.navigate('HomeApp', {
                  screen: 'Profile',
                  params: { screen: 'MyBookings' },
                });
              }, 500);
            } catch (bookingError) {
              console.error('Failed to create booking after payment:', bookingError);
              showToast({
                type: 'error',
                title: 'Lỗi đặt lịch',
                message: 'Thanh toán thành công nhưng đặt lịch thất bại. Vui lòng liên hệ hỗ trợ.',
              });
            }
          }
          
          // Handle Membership activation (Backend đã tự động activate)
          if (pendingMembershipJSON) {
            try {
              const pendingMembership = JSON.parse(pendingMembershipJSON);
              console.log('Payment successful for membership:', pendingMembership);
              
              // Backend đã tự động activate membership trong vnpayService.js
              // Chỉ cần show success message và navigate
              
              showToast({
                type: 'success',
                title: 'Thành công',
                message: `Bạn đã đăng ký gói ${pendingMembership.packageName} thành công!`,
              });
              
              // Navigate to membership screen
              setTimeout(() => {
                navigationRef.navigate('HomeApp', {
                  screen: 'HomeStack',
                  params: { 
                    screen: 'CardMembershipScreen' 
                  },
                });
              }, 500);
              
            } catch (membershipError) {
              console.error('Error handling membership after payment:', membershipError);
              showToast({
                type: 'error',
                title: 'Lỗi',
                message: 'Thanh toán thành công. Vui lòng kiểm tra lại gói membership.',
              });
            }
          }
        } else {
          // Payment failed
          showToast({
            type: 'error',
            title: 'Thanh toán thất bại',
            message: 'Thanh toán của bạn không thành công. Vui lòng thử lại.',
          });
        }
      }
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Check for initial URL
    Linking.getInitialURL().then(url => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    return () => {
      subscription.remove();
    };
  }, [showToast, navigationRef]);

  if (isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef} linking={linking} fallback={<View style={styles.loaderContainer}><ActivityIndicator size="large" /></View>}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {userToken ? (
          user && user.name ? (
            <Stack.Screen name="HomeApp" component={HomeNavigator} />
          ) : (
            <Stack.Screen name="Survey" component={SurveyScreen} />
          )
        ) : (
          <Stack.Screen name="Auth" component={UserNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
