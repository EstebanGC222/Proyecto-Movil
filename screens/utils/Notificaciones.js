import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';

// Configuración para la notificaciones
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
  }),
});

// enviar
export async function MandarNotificacion() {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Se ha hecho un cambio en el grupo.',
      body: 'Realizando una prueba de la notificaciones enviadas desde un boton de confirmar',
    },
    trigger: { seconds: 1 },
  });
}

export async function PermisoNotificacionAsync() {
  if (!Device.isDevice) {
    Alert.alert('Error', 'Debes usar un dispositivo físico para recibir notificaciones.');
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    Alert.alert('Permiso denegado', 'No se pudo obtener permiso para notificaciones.');
    return false;
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

  return true;
}
