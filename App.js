import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import AdminPanel from './components/AdminPanel';
import AttendanceScanner from './components/AttendanceScanner';
import Reports from './components/Reports';

const Stack = createStackNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="AdminPanel">
        <Stack.Screen name="AdminPanel" component={AdminPanel} options={{ title: 'Admin Panel' }} />
        <Stack.Screen name="AttendanceScanner" component={AttendanceScanner} options={{ title: 'Attendance Scanner' }} />
        <Stack.Screen name="Reports" component={Reports} options={{ title: 'Attendance Reports' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
