import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import COLORS from '../theme/colors';

import HomeScreen from '../screens/HomeScreen';
import JointSelectionScreen from '../screens/JointSelectionScreen';
import MeasurementScreen from '../screens/MeasurementScreen';
import HistoryScreen from '../screens/HistoryScreen';
import AboutScreen from '../screens/AboutScreen';
import CalibrationScreen from '../screens/CalibrationScreen';

const Stack = createNativeStackNavigator();

const screenOptions = {
    headerStyle: {
        backgroundColor: COLORS.surface,
    },
    headerTintColor: COLORS.primary,
    headerTitleStyle: {
        fontWeight: 'bold',
    },
    contentStyle: {
        backgroundColor: COLORS.background,
    },
    animation: 'slide_from_right',
};

export default function AppNavigator() {
    return (
        <SafeAreaProvider>
            <NavigationContainer>
                <Stack.Navigator
                    initialRouteName="Home"
                    screenOptions={screenOptions}
                >
                    <Stack.Screen
                        name="Home"
                        component={HomeScreen}
                        options={{ headerShown: false }}
                    />
                    <Stack.Screen
                        name="JointSelection"
                        component={JointSelectionScreen}
                        options={{ title: 'Eklem Seçimi' }}
                    />
                    <Stack.Screen
                        name="Measurement"
                        component={MeasurementScreen}
                        options={{ title: 'Ölçüm' }}
                    />
                    <Stack.Screen
                        name="History"
                        component={HistoryScreen}
                        options={{ title: 'Geçmiş Ölçümler' }}
                    />
                    <Stack.Screen
                        name="About"
                        component={AboutScreen}
                        options={{ title: 'Hakkında' }}
                    />
                    <Stack.Screen
                        name="Calibration"
                        component={CalibrationScreen}
                        options={{ title: 'Kalibrasyon' }}
                    />
                </Stack.Navigator>
            </NavigationContainer>
        </SafeAreaProvider>
    );
}
