import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import PantallaResumen from './screens_inicio/PantallaResumen';
import PantallaDeudores from './screens_inicio/PantallaDeudores';
import PantallaMovimientos from './screens_inicio/PantallaMovimientos';

const Stack = createNativeStackNavigator();

export default function Inicio() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="Inicio" 
        component={PantallaResumen} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="Deudores" 
        component={PantallaDeudores} 
        options={{ title: 'Lista de D/A' }} 
        
      />
      <Stack.Screen 
        name="Movimientos" 
        component={PantallaMovimientos} 
        options={{ title: 'Lista de Movimientos' }} 
      />
    </Stack.Navigator>
  );
}
