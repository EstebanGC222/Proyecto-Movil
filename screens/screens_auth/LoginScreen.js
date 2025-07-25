// En screens/LoginScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useAuth } from '../../context/AuthContext'; 

import { styles } from './../styles';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cargandoLoginLocal, setCargandoLoginLocal] = useState(false); // Estado de carga LOCAL para el proceso de login

  const { iniciarSesionConCorreo } = useAuth();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Campos Vacíos", "Por favor, ingresa tu correo y contraseña.");
      return;
    }

    setCargandoLoginLocal(true); // Activa el indicador de carga local
    try {
      const resultado = await iniciarSesionConCorreo(email, password);

      // No necesitamos hacer nada aquí si tiene éxito, porque onAuthStateChanged
      // en AuthContext se encargará de cambiar el estado global 'usuarioAutenticado',
      // lo que hará que AppNavigator cambie a la pantalla principal de la app.

      if (!resultado.exito) {
        // Si la función del context devuelve un error, muéstralo
        Alert.alert("Error de Inicio de Sesión", resultado.error || "No se pudo iniciar sesión. Verifica tus credenciales.");
      }
    } catch (error) {
      // Este catch es por si 'iniciarSesionConCorreo' lanzara una excepción no controlada
      // (aunque la diseñamos para devolver {exito, error})
      console.error("LoginScreen: Error inesperado en handleLogin:", error);
      Alert.alert("Error", "Ocurrió un error inesperado al intentar iniciar sesión.");
    } finally {
      // ESTO ES CRUCIAL: Se ejecuta siempre, tanto si hay éxito como si hay error.
      // Desactiva el indicador de carga LOCAL.
      setCargandoLoginLocal(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.kavContainer}
    >
      <View style={styles.AuthContainer}>
        <Text style={styles.titulo}>Iniciar Sesión</Text>

        <TextInput
          style={styles.input}
          placeholder="Correo Electrónico"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!cargandoLoginLocal} // No editable mientras carga
        />

        <TextInput
          style={styles.input}
          placeholder="Contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!cargandoLoginLocal} // No editable mientras carga
        />

        {/* Usa el estado de carga LOCAL */}
        {cargandoLoginLocal ? (
          <ActivityIndicator size="large" color="#007bff" style={styles.spinner} />
        ) : (
          <Button title="Iniciar Sesión" onPress={handleLogin} />
        )}

        <TouchableOpacity
          onPress={() => !cargandoLoginLocal && navigation.navigate('Registro')} // No navegable mientras carga
          disabled={cargandoLoginLocal}
        >
          <Text style={[styles.enlace, cargandoLoginLocal && styles.enlaceDeshabilitado]}>
            ¿No tienes cuenta? Regístrate aquí
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}