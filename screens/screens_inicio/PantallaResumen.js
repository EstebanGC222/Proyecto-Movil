import {React ,useState} from 'react';
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GastosModal } from '../utils/gastos_rapidos';

import { styles } from './../styles';

export default function PantallaResumen({ navigation }) {
  const debes = 1000;
  const teDeben = 1500;
  const balance = teDeben - debes;

  console.log("styles:", styles);

  const [mostrar_modal, setModal] = useState(false);

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

        <View style={styles.botonCircularL}>
          <TouchableOpacity style={styles.botonCircular}>
            <Ionicons name="add" size={30} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.botonCircularR} onPress={() => setModal(true)}>
              <Ionicons name="add" size={30} color="#fff" />
          </TouchableOpacity>

          <GastosModal visible={mostrar_modal} onClose={() => setModal(false)} />
        </View>
      </View>
    </SafeAreaView>
  );
}
