import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { UserContext } from '@context/UserContext';
import UserNavigator from '@navigation/UserNavigator';
import HomeNavigator from '@navigation/HomeNavigator';
import SurveyScreen from '@screens/survey/SurveyScreen';
import PaymentResultScreen from '@screens/payment/PaymentResultScreen'; // Import PaymentResultScreen

const Stack = createNativeStackNavigator();

const linking = {
  prefixes: ['gymxfit://'],
  config: {
    screens: {
      HomeApp: {
        screens: {
          PaymentResult: 'payment-result',
        },
      },
      // You can add other screens here if needed for deep linking
    },
  },
};


const AppNavigator = () => {
  const { user, userToken, isLoading } = useContext(UserContext);

  // If we are loading, show a spinner
  if (isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer linking={linking} fallback={<View style={styles.loaderContainer}><ActivityIndicator size="large" /></View>}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {userToken ? (
          // User is logged in
          user && user.name ? (
            // User has a name, go to main app
            <Stack.Screen name="HomeApp" component={HomeNavigator} />
          ) : (
            // User has no name, go to survey
            <Stack.Screen name="Survey" component={SurveyScreen} />
          )
        ) : (
          // No token, go to auth flow
          <Stack.Screen name="Auth" component={UserNavigator} />
        )}
        {/* Add PaymentResultScreen to the root stack to be accessible from deep link */}
        <Stack.Screen name="PaymentResult" component={PaymentResultScreen} />
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
