import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import CustomerServiceScreen from '@screens/support/CustomerServiceScreen';
import HelpCenterScreen from '@screens/support/HelpCenterScreen';
import HelpFaqScreen from '@screens/support/HelpFaqScreen';
import LoginScreen from '@screens/auth/LoginScreen';
import MemberNewsScreen from '@screens/news/MemberNewsScreen';
import OnlineSupportScreen from '@screens/support/OnlineSupportScreen';
import RegisterScreen from '@screens/auth/RegisterScreen';
import SurveyScreen from '@screens/survey/SurveyScreen';
import VerifyRegisterScreen from '@screens/auth/VerifyRegisterScreen';
import VerifyLoginScreen from '@screens/auth/VerifyLoginScreen';
import WelcomeScreen from '@screens/onboarding/WelcomeScreen';
import WorkoutScreen from '@screens/workouts/WorkoutScreen';
import WorkoutVideoScreen from '@screens/video/WorkoutVideoScreen';
import UpdateProfileScreen from '@screens/profile/UpdateProfileScreen';
import BookScreen from '@screens/booking/BookScreen';
import FavoriteVideosScreen from '@screens/video/FavoriteVideosScreen';
import SearchCalendarScreen from '@screens/booking/SearchCalendarScreen';
import NotificationScreen from '@screens/home/NotificationScreen';
import HomeScreen from '@screens/home/HomeScreen';


const Stack = createNativeStackNavigator();

const UserNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="NewsScreen"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="LoginScreen" component={LoginScreen} />
      <Stack.Screen name="RegisterScreen" component={RegisterScreen} />
      <Stack.Screen
        name="VerifyRegisterScreen"
        component={VerifyRegisterScreen}
      />
      <Stack.Screen name="VerifyLoginScreen" component={VerifyLoginScreen} />
      <Stack.Screen name="SurveyScreen" component={SurveyScreen} />
      <Stack.Screen name="CustomerService" component={CustomerServiceScreen} />
      <Stack.Screen name="HelpScreen" component={HelpCenterScreen} />
      <Stack.Screen name="HelpScreen2" component={HelpFaqScreen} />
      <Stack.Screen name="NewsScreen" component={MemberNewsScreen} />
      <Stack.Screen name="OnlineSupport" component={OnlineSupportScreen} />
      <Stack.Screen name="WelcomeScreen" component={WelcomeScreen} />
      <Stack.Screen name="WorkoutScreen" component={WorkoutScreen} />
      <Stack.Screen name="WorkoutVideo" component={WorkoutVideoScreen} />
      <Stack.Screen name="UpdateProfile" component={UpdateProfileScreen} />
      <Stack.Screen name="BookScreen" component={BookScreen} />
      <Stack.Screen
        name="FavoriteVideosScreen"
        component={FavoriteVideosScreen}
      />
      <Stack.Screen
        name="SearchCalendarScreen"
        component={SearchCalendarScreen}
      />
      <Stack.Screen name="NotificationScreen" component={NotificationScreen} />
      <Stack.Screen name="HomeScreen" component={HomeScreen} />
    </Stack.Navigator>
  );
};

export default UserNavigator;
