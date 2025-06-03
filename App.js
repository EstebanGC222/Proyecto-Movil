import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { GruposProvider } from './context/GruposContext'; 
import { AuthProvider, useAuth } from './context/AuthContext'; 

import  AuthStackNavigator  from './screens/screens_auth/AuthStackNavigator'; 

import Inicio from './screens/Inicio';
import NavegacionGrupos from './screens/screens_grupos/NavegacionGrupos';
import Configuracion from './screens/Configuracion';


const Tab = createBottomTabNavigator();

// Componente que decide qué navegador mostrar (Autenticación o App Principal)
function AppNavigator() {
  const { usuarioAutenticado, cargandoAutenticacion } = useAuth();

  console.log("AppNavigator: cargandoAutenticacion =", cargandoAutenticacion, "usuarioAutenticado =", !!usuarioAutenticado);


  if (cargandoAutenticacion) {
    // Muestra una pantalla de carga mientras se verifica el estado de autenticación
    return (
      <View style={styles.contenedorCargaGlobal}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  // Si la carga terminó, decide qué navegador mostrar
  // Si hay un usuario, muestra MainAppTabs, sino AuthStackNavigator
  return usuarioAutenticado ? (
    <GruposProvider>
      <MainAppTabs />
    </GruposProvider>
  )
  :
  ( 
   <AuthStackNavigator />
  );
}

// Componente para el TabNavigator principal de la aplicación
function MainAppTabs() {
  return (
    <Tab.Navigator
      initialRouteName='Inicio' 
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
        tabBarActiveTintColor: '#007bff', // Un azul vibrante
        tabBarInactiveTintColor: 'grey',
        
      })}
    >
      <Tab.Screen
        name="Grupos"
        component={NavegacionGrupos}
        options={{ headerShown: false }} 
      />
      <Tab.Screen
        name="Inicio"
        component={Inicio}
        options={{ headerShown: false }} 
      />
      <Tab.Screen
        name="Configuración"
        component={Configuracion}
        options={{ headerShown: true }} 
      />
    </Tab.Navigator>
  );
}

// Componente Principal de la Aplicación
export default function App() {
  return (
    <AuthProvider>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
    </AuthProvider>
  );
}

// Estilos
const styles = StyleSheet.create({
  contenedorCargaGlobal: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff', 
  }
});