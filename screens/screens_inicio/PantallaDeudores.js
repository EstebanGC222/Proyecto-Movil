import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { styles } from './../styles'

export default function PantallaDeudores() {
  return (
    <View style={styles.contenedor}>
      <Text style={styles.titulo}>Lista de Deudores y Acreedores</Text>
      <Text>Aqui se mostraran los saldos netos de cada persona</Text>
    </View>
  );
}
