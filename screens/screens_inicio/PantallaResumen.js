import React from 'react';
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function PantallaResumen({ navigation }) {
  const debes = 1000;
  const teDeben = 1500;
  const balance = teDeben - debes;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.contenedor}>
        <Text style={styles.titulo}>Resumen</Text>
        
        <View style={styles.resumenValores}>
          <View style={styles.filaValor}>
            <Text style={styles.etiqueta}>Debes: </Text>
            <Text style={styles.valor}>${debes}</Text>
          </View>
          <View style={styles.filaValor}>
            <Text style={styles.etiqueta}>Te deben: </Text>
            <Text style={styles.valor}>${teDeben}</Text>
          </View>
          <View style={styles.filaValor}>
            <Text style={styles.etiqueta}>Balance: </Text>
            <Text style={styles.valor}>${balance}</Text>
          </View>
        </View>

        <View style={styles.seccionesParalelas}>
          <TouchableOpacity 
            onPress={() => navigation.navigate('Deudores')} 
            style={styles.seccionBoton}
          >
            <Text style={styles.seccionTexto}>Lista de D/A</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => navigation.navigate('Movimientos')} 
            style={styles.seccionBoton}
          >
            <Text style={styles.seccionTexto}>Lista de Movimientos</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.botonCircular}>
          <Ionicons name="add" size={30} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contenedor: {
    flex: 1,
    padding: 20,
  },
  titulo: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    alignSelf: 'center',
    marginTop: 50,
  },
  resumenValores: {
    marginBottom: 30,
  },
  filaValor: {
    flexDirection: 'row',
    marginBottom: 10,
    justifyContent: 'center',
  },
  etiqueta: {
    fontSize: 18,
    fontWeight: '500',
  },
  valor: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  seccionesParalelas: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  seccionBoton: {
    padding: 10,
    backgroundColor: '#007bff',
    borderRadius: 5,
    width: '45%',
    alignItems: 'center',
  },
  seccionTexto: {
    color: '#fff',
    fontSize: 16,
  },
  botonCircular: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    backgroundColor: '#007bff',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
