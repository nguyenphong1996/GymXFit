import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import PtListScreen from '@screens/booking/PtListScreen';
import BookingCalendarScreen from '@screens/booking/BookingCalendarScreen';
import SearchCalendarScreen from '@screens/booking/SearchCalendarScreen';
import BookingConfirmationScreen from '@screens/booking/BookingConfirmationScreen';
import MyBookingsScreen from '@screens/booking/MyBookingsScreen';

const Stack = createNativeStackNavigator();

const BookingNavigator = () => {
  return (
    <Stack.Navigator 
      initialRouteName="SearchCalendarScreen"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="SearchCalendarScreen" component={SearchCalendarScreen} />
      <Stack.Screen name="PtListScreen" component={PtListScreen} />
      <Stack.Screen name="BookingCalendarScreen" component={BookingCalendarScreen} />
      <Stack.Screen name="BookingConfirmationScreen" component={BookingConfirmationScreen} />
      <Stack.Screen name="MyBookingsScreen" component={MyBookingsScreen} />
    </Stack.Navigator>
  );
};

export default BookingNavigator;