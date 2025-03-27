import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function Configuracion() {
  return (
    <View style={styles.contenedor}>
      <Text>Pantalla de Configuración</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
