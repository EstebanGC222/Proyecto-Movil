import React, { useState, useRef } from 'react';
import { Modal, View, Text, Button, TextInput, Image, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';

import { styles } from './../styles';

import { MandarNotificacion } from './Notificaciones';
import { PermisoNotificacionAsync } from './Notificaciones';

export function GastosModal({ visible, onClose, onSubmit }) {
    const [permiso, pedirPermiso] = useCameraPermissions();
    const [gasto, setGasto] = useState('');
    const [valor, setValor] = useState('');
    const [mostrarCamara, setMostrarCamara] = useState(false);
    const [fotoTomada, setFotoTomada] = useState(null);
    const [vistaCamara, setVistaCamara] = useState('back');

    const camaraRef = useRef(null);
    

    console.log("Entrando a gastos_rapidos")

    const cambiar_camara = () => {
        setVistaCamara(prev => (prev === 'back' ? 'front' : 'back'));
    };
    
    const tomarFoto = async () => {
        if (camaraRef.current) {
            const foto = await camaraRef.current.takePictureAsync();
            await MediaLibrary.saveToLibraryAsync(foto.uri);
            setFotoTomada(foto.uri);
            setMostrarCamara(false);
        }
    };

    const solicitarPermiso = async () => {
        const { granted } = await pedirPermiso();
        if (!granted) {
            alert("Permiso de cámara denegado");
        }
    };

    const limpiarFormulario = () => {
        setGasto('');
        setValor('');
        setFotoTomada(null);
        setMostrarCamara(false);
    };

    const handleConfirmar = () => {
        if (!gasto || !valor) {
            Alert.alert('Error', 'Completa todos los campos.');
            return;
        }

        const gastoData = {
            gasto,
            valor: parseFloat(valor),
            foto: fotoTomada,
        };

        onSubmit(gastoData);
        limpiarFormulario();
        onClose();
    };

    if (!permiso) return <View />;
    if (!permiso.granted) {
        return (
            <Modal visible={true} transparent>
                <View style={styles.permisoContainer}>
                    <Text style={styles.permisoText}>Permiso de cámara requerido</Text>
                    <Button title="Solicitar permiso" onPress={solicitarPermiso} />
                </View>
            </Modal>
        );
    }

    async function PermisoNotificacionAsync() {
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

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.modalContainer}>
                <View style={styles.content}>
                    {mostrarCamara ? (
                        <>
                            <CameraView style={{ width: '100%', height: 300 }} ref={camaraRef} facing={vistaCamara} />
                            <Button title='cambiar camara' onPress={cambiar_camara}/>
                            <Button title="Tomar Foto" onPress={tomarFoto} />
                            <Button title="Cancelar" onPress={() => setMostrarCamara(false)} color="red" />

                        </>
                    ) : (
                        <>
                            <Button title="Cerrar" onPress={()=>{limpiarFormulario(),onClose()}} color="red" />
                            <Text style={styles.title}>Agregar gasto</Text>

                            <TextInput
                                placeholder="Ingresa el gasto"
                                value={gasto}
                                onChangeText={setGasto}
                                style={styles.input}
                            />

                            <TextInput
                                placeholder="Ingresa el valor"
                                value={valor}
                                onChangeText={setValor}
                                keyboardType="numeric"
                                style={styles.input}
                            />

                            <Button title="Tomar foto del gasto" onPress={()=>{
                                setMostrarCamara(true)
                             }} />

                            {fotoTomada && (
                                <Image
                                    source={{ uri: fotoTomada }}
                                    style={{ width: 200, height: 200, marginTop: 10 }}
                                />
                            )}

                            <Button
                                title='Confirmar'
                                onPress={()=>{handleConfirmar() ,MandarNotificacion()}}
                            />
                        </>
                    )}
                </View>
            </View>
        </Modal>
    );
}

