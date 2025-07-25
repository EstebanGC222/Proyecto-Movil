// En screens/Configuracion.js
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useAuth } from '../context/AuthContext';

import { styles } from './styles';

export default function Configuracion({ navigation }) {
  const {
    perfilUsuarioActual,
    cerrarSesion,
    actualizarNumeroTelefonoUsuario,
    cargandoPerfil,
    usuarioAutenticado // para el uid
  } = useAuth();

  const [inputNumeroTelefono, setInputNumeroTelefono] = useState('');
  const [guardandoNumero, setGuardandoNumero] = useState(false);

  useEffect(() => {
    // Solo intenta pre-rellenar si perfilUsuarioActual existe
    if (perfilUsuarioActual) {
      setInputNumeroTelefono(perfilUsuarioActual.numeroTelefono || ''); // Usa '' como fallback si numeroTelefono es null/undefined
    } else {
      setInputNumeroTelefono(''); // Si no hay perfil, el input debe estar vacío
    }
  }, [perfilUsuarioActual]); // Se ejecuta cuando perfilUsuarioActual cambia

  const handleGuardarNumero = async () => {
    // Necesitamos el uid del usuario autenticado para saber a quién actualizar
    if (!usuarioAutenticado || !usuarioAutenticado.uid) {
        Alert.alert("Error", "No se pudo identificar al usuario. Intenta iniciar sesión de nuevo.");
        return;
    }

    const numeroLimpio = inputNumeroTelefono.replace(/\D/g, '');
    if (!numeroLimpio || numeroLimpio.length < 7) {
      Alert.alert("Número Inválido", "Ingresa un número de teléfono válido (solo dígitos, ej: 3001234567).");
      return;
    }

    setGuardandoNumero(true);
    const resultado = await actualizarNumeroTelefonoUsuario(usuarioAutenticado.uid, numeroLimpio);
    setGuardandoNumero(false);

    if (resultado.exito) {
      console.log("Número de teléfono guardado/actualizado.");
    } else {
      console.log("Fallo al guardar número de teléfono:", resultado.error);
    }
  };

  const handleCerrarSesion = async () => {
    Alert.alert(
        "Cerrar Sesión",
        "¿Estás seguro de que quieres cerrar sesión?",
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Sí, Cerrar Sesión",
            onPress: async () => {
              await cerrarSesion();
            },
            style: "destructive",
          },
        ],
        { cancelable: true }
      );
  };

  // --- Lógica de Renderizado ---

  // Caso 1: El perfil todavía se está cargando (después de que la auth inicial terminó)
  // `cargandoPerfil` se activa en AuthContext al llamar a `obtenerPerfilUsuario`.
  // `perfilUsuarioActual` será null hasta que esa función termine.
  // `!guardandoNumero` es para no mostrar este spinner si ya estamos en el proceso de "Guardar Número".
  if (cargandoPerfil && !perfilUsuarioActual && !guardandoNumero) {
    return (
      <View style={styles.contenidoCentrado}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text>Cargando tu información de perfil...</Text>
      </View>
    );
  }

  // Caso 2: La carga del perfil terminó (cargandoPerfil es false),
  // pero por alguna razón perfilUsuarioActual sigue siendo null.
  // Esto indica un problema al cargar el perfil o que el usuario realmente no tiene uno (raro si el registro lo crea).
  if (!cargandoPerfil && !perfilUsuarioActual) {
    return (
      <View style={styles.contenedorCentrado}>
          <Text style={styles.errorText}>No se pudo cargar la información de tu perfil.</Text>
          <Text style={styles.errorText}>Intenta cerrar sesión y volver a iniciar.</Text>
        <View style={{ marginTop: 20 }}>
          <Button title="Cerrar Sesión" onPress={handleCerrarSesion} color="#dc3545" />
        </View>
      </View>
    );
  }

  // perfilUsuarioActual DEBERÍA existir.
  if (!perfilUsuarioActual) {
    return (
        <View style={styles.contenedorCentrado}>
            <Text>Cargando...</Text>
            <ActivityIndicator size="large" />
        </View>
    );
  }

  // Ahora es seguro acceder a perfilUsuarioActual.numeroTelefono
  const numeroInputNormalizado = inputNumeroTelefono.replace(/\D/g, '');
  // Comprueba si perfilUsuarioActual.numeroTelefono existe antes de compararlo
  const numeroActualGuardado = perfilUsuarioActual.numeroTelefono || '';
  const numeroHaCambiado = numeroActualGuardado !== numeroInputNormalizado;

  return (
    <ScrollView style={styles.scrollContenedor} contentContainerStyle={styles.scrollContent}>
      
      <View style={styles.seccion}>
        <Text style={styles.label}>Tu Número de Teléfono:</Text>
        <Text style={styles.subLabel}>
          (Este número se usará para que otros te encuentren si te tienen en sus contactos)
        </Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: 3001234567 (solo números)"
          value={inputNumeroTelefono}
          onChangeText={setInputNumeroTelefono}
          keyboardType="phone-pad"
          editable={!guardandoNumero}
        />
        <Button
          title={guardandoNumero ? "Guardando..." : "Guardar Número"}
          onPress={handleGuardarNumero}
          disabled={guardandoNumero || !numeroHaCambiado || !inputNumeroTelefono.trim()}
        />
        {guardandoNumero && <ActivityIndicator size="small" color="#007bff" style={styles.indicadorGuardado} />}
      </View>

      <View style={styles.seccionEspaciada}>
        <Button
          title="Cerrar Sesión"
          onPress={handleCerrarSesion}
          color="#dc3545"
        />
      </View>
    </ScrollView>
  );
}
