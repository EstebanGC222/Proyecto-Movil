import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function PantallaMovimientos() {
  return (
    <View style={styles.contenedor}>
      <Text style={styles.titulo}>Lista de Movimientos</Text>
      
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titulo: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});
