import React, { useState, useRef, useEffect } from 'react';
import { Modal, View, Text, Button, TextInput, Image, Alert, Platform } from 'react-native';
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
  const [pushToken, setPushToken] = useState(null);

  const camaraRef = useRef(null);

  useEffect(() => {
    if (visible) {
      const pedirTodosLosPermisos = async () => {
        console.log("Solicitando permisos...");
  
        // Cámara
        const { granted: camaraOk } = await pedirPermiso();
        if (!camaraOk) {
          Alert.alert("Permiso de cámara denegado", "Necesitas permitir acceso a la cámara.");
          return;
        }
  
        // Galería
        const { granted: galeriaOk } = await MediaLibrary.requestPermissionsAsync();
        if (!galeriaOk) {
          Alert.alert("Permiso de galería denegado", "Necesitas permitir acceso a la galería.");
          return;
        }
  
        // Notificaciones
        try {
          const token = await PermisoNotificacionAsync();
          if (token) setPushToken(token);
        } catch (err) {
          console.log(' Error pidiendo permiso de notificaciones:', err);
        }
      };
  
      pedirTodosLosPermisos();
    }
  }, [visible]);
  

  const cambiar_camara = () => {
    setVistaCamara(prev => (prev === 'back' ? 'front' : 'back'));
  };

  const tomarFoto = async () => {
    console.log("tomando foto");
    if (camaraRef.current) {
      const foto = await camaraRef.current.takePictureAsync();

      console.log("foto tomdad: ",foto);

      const assets = await MediaLibrary.saveToLibraryAsync(foto.uri);

      console.log("assets: ", assets);

      setFotoTomada(foto.uri);
      setMostrarCamara(false);
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

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.ModalContainer}>
        <View style={styles.Modalcontent}>
          {mostrarCamara ? (
            <>
              <CameraView style={{ width: '100%', height: 300 }} ref={camaraRef} facing={vistaCamara} />
              <Button title="Cambiar cámara" onPress={cambiar_camara} />
              <Button title="Tomar Foto" onPress={tomarFoto} />
              <Button title="Cancelar" onPress={() => setMostrarCamara(false)} color="red" />
            </>
          ) : (
            <>
              <Button
                title="Cerrar"
                onPress={() => {
                  limpiarFormulario();
                  onClose();
                }}
                color="red"
              />
              <Text style={styles.Modaltitle}>Agregar gasto</Text>

              <TextInput placeholder="Ingresa el gasto" value={gasto} onChangeText={setGasto} style={styles.ModalInput} />

              <TextInput placeholder="Ingresa el valor" value={valor} onChangeText={setValor} keyboardType="numeric" style={styles.ModalInput} />

              <Button title="Tomar foto del gasto" onPress={() => setMostrarCamara(true)} />

              {fotoTomada && <Image source={{ uri: fotoTomada }} style={{ width: 200, height: 200, marginTop: 10 }} />}

              <Button
                title="Confirmar"
                onPress={() => {
                  handleConfirmar();
                  MandarNotificacion();
                }}
              />
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}
