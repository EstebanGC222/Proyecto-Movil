import React, { useState, useEffect } from 'react';
import { Button, Platform, Text, View, Alert } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';

// Configuración para la notificaciones
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,   // mostrar alerta visual
    shouldPlaySound: true,   // reproducir sonido
    shouldSetBadge: false,    // actualizar icono badge (iOS)
  }),
});

// enviar
export async function MandarNotificacion() {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Se ha hecho un cambio en el grupo.',
      body: 'Realizando una prueba de la notificaciones enviadas desde un boton de confirmar',
    },
    trigger: { seconds: 2 },
  });
}

export async function PermisoNotificacionAsync() {
  if (!Device.isDevice) {
    Alert.alert('Error', 'Debes usar un dispositivo físico para recibir notificaciones.');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let Estado = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    Estado = status;
  }

  if (Estado !== 'granted') {
    Alert.alert('Permiso denegado', 'No se pudo obtener permiso para notificaciones.');
    return null;
  }

  // Configurar canal para Android
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }
  
  const tokenData = await Notifications.getExpoPushTokenAsync();
  
  console.log(' Push Token:', tokenData.data);
  return tokenData.data;
}