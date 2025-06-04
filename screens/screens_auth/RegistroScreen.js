// En screens/RegistroScreen.js
import React, { useState } from 'react';
import {
  View, Text, TextInput, Button, StyleSheet,
  TouchableOpacity, ActivityIndicator, KeyboardAvoidingView,
  Platform, Alert, ScrollView
} from 'react-native';
import { useAuth } from '../../context/AuthContext'; // Ajusta la RUTA
import { styles } from '../styles';

export default function RegistroScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [cargandoRegistroLocal, setCargandoRegistroLocal] = useState(false); // Estado de carga LOCAL

  const { registrarConCorreo } = useAuth();

  const handleRegistro = async () => {
    if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
      Alert.alert("Campos Vacíos", "Por favor, completa todos los campos.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Error de Contraseña", "Las contraseñas no coinciden.");
      return;
    }
    

    setCargandoRegistroLocal(true); // Activa el indicador de carga LOCAL
    try {
      const resultado = await registrarConCorreo(email, password);

      if (resultado.exito) {
        Alert.alert(
          "Registro Exitoso",
          "Tu cuenta ha sido creada. Serás redirigido para iniciar sesión.",
          [{ text: "OK" }]
          // No necesitamos navegar aquí. onAuthStateChanged en AuthContext
          // actualizará el estado del usuario, y AppNavigator
          // debería cambiar automáticamente a la app principal (MainAppTabs).
          // Si quisieras forzar ir a Login primero, podrías hacerlo aquí,
          // pero el flujo natural es que ya esté logueado.
        );
        // Si el registro es exitoso, el usuario ya está "logueado" en Firebase Auth.
        // El onAuthStateChanged lo detectará y AppNavigator mostrará MainAppTabs.
      } else {
        Alert.alert("Error de Registro", resultado.error || "No se pudo crear la cuenta. Inténtalo de nuevo.");
      }
    } catch (error) {
      // Catch para errores inesperados en la propia función handleRegistro
      console.error("RegistroScreen: Error inesperado en handleRegistro:", error);
      Alert.alert("Error", "Ocurrió un error inesperado durante el registro.");
    } finally {
      // ESTO ES CRUCIAL: Se ejecuta siempre.
      setCargandoRegistroLocal(false); // Desactiva el indicador de carga LOCAL
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.kavContainer}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled" // Ayuda con los taps dentro del ScrollView
      >
        <View style={styles.container}>
          <Text style={styles.titulo}>Crear Cuenta</Text>

          <TextInput
            style={styles.input}
            placeholder="Correo Electrónico"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!cargandoRegistroLocal}
          />

          <TextInput
            style={styles.input}
            placeholder="Contraseña"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!cargandoRegistroLocal}
          />

          <TextInput
            style={styles.input}
            placeholder="Confirmar Contraseña"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            editable={!cargandoRegistroLocal}
          />

          {cargandoRegistroLocal ? (
            <ActivityIndicator size="large" color="#007bff" style={styles.spinner} />
          ) : (
            <Button title="Registrarse" onPress={handleRegistro} />
          )}

          <TouchableOpacity
            onPress={() => !cargandoRegistroLocal && navigation.navigate('Login')}
            disabled={cargandoRegistroLocal}
          >
            <Text style={[styles.enlace, cargandoRegistroLocal && styles.enlaceDeshabilitado]}>
              ¿Ya tienes cuenta? Inicia sesión
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}