import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import Inicio from './screens/Inicio';
import Grupos from './screens/Grupos';
import Configuracion from './screens/Configuracion';

const Tab = createBottomTabNavigator();



export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator initialRouteName='Inicio'
        screenOptions={({ route }) => ({
          tabBarIcon: ({ color, size }) => {
            let nombreIcono;
            if (route.name === 'Inicio') {
              nombreIcono = 'home';
            } else if (route.name === 'Grupos') {
              nombreIcono = 'people';
            } else if (route.name === 'Configuración') {
              nombreIcono = 'settings';
            }
            return <Ionicons name={nombreIcono} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#007bff',
          tabBarInactiveTintColor: 'grey',
        })}
      >
        
        <Tab.Screen name="Grupos" component={Grupos} options={{ headerShown: false }} />
        <Tab.Screen name="Inicio" component={Inicio} options={{ headerShown: false }} />
        <Tab.Screen name="Configuración" component={Configuracion} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}