import {React ,useState, useEffect} from 'react';
import { SafeAreaView, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GastosModal } from '../utils/gastos_rapidos';
import { useAuth } from '../../context/AuthContext';
import { collectionGroup, onSnapshot } from "firebase/firestore";

import { db } from '../../firebaseConfig';

import { styles } from './../styles';

export default function PantallaResumen({ navigation }) {
  const { usuarioAutenticado } = useAuth();
  const [debes, setDebes] = useState(0);
  const [teDeben, setTeDeben] = useState(0);

  const [mostrar_modal, setModal] = useState(false);

  useEffect(() => {
    if (!usuarioAutenticado || !usuarioAutenticado.uid) {
      console.log('Usuario no autenticado o UID no disponible');
      return;
    }

    const uid = usuarioAutenticado.uid;

    // Suscripción en tiempo real a todas las subcolecciones 'gastos'
    const unsubscribe = onSnapshot(collectionGroup(db, 'gastos'), (querySnapshot) => {
      let totalDebes = 0;
      let totalTeDeben = 0;

      console.log(`Se encontraron ${querySnapshot.size} gastos.`);

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const {
          deudas = [],
          cantidad,
          pagadoPor, // Este es el UID de quien pagó el gasto general
          participantes = [],
        } = data;

        // Si hay deudas explícitas
        if (Array.isArray(deudas) && deudas.length > 0) {
          deudas.forEach((deuda) => {
            const { deudor, acreedor, monto } = deuda;
            const deudorUid = typeof deudor === 'string' ? deudor : deudor?.uid;
            const acreedorUid = typeof acreedor === 'string' ? acreedor : acreedor?.uid;

            if (deudorUid === uid) {
              // MODIFICACIÓN:
              // Si el usuario actual (uid) es el deudor de esta deuda específica,
              // solo se debe sumar a totalDebes si el usuario actual (uid) NO fue quien pagó el gasto general.
              // 'pagadoPor' aquí se refiere al pagador del gasto al que pertenece esta lista de 'deudas'.
              if (pagadoPor !== uid) {
                totalDebes += Number(monto) || 0;
              }
              // Si pagadoPor === uid, significa que el usuario actual pagó el gasto.
              // Por lo tanto, no debería acumular en 'totalDebes' por ninguna deuda listada
              // donde él mismo sea el deudor para este gasto específico.
            } else if (acreedorUid === uid) {
              totalTeDeben += Number(monto) || 0;
            }
          });
        }

        // Si no hay deudas explícitas, pero hay participantes
        else if (
          cantidad &&
          pagadoPor &&
          Array.isArray(participantes) &&
          participantes.length > 0
        ) {
          const montoPorPersona = cantidad / participantes.length;

          participantes.forEach((p) => {
            const participanteUid = typeof p === 'string' ? p : p.uid;
            if (!participanteUid || participanteUid === pagadoPor) return;

            if (participanteUid === uid) {
              totalDebes += montoPorPersona;
            } else if (pagadoPor === uid) {
              totalTeDeben += montoPorPersona;
            }
          });
        }
      });

      console.log('Total debes:', totalDebes);
      console.log('Total te deben:', totalTeDeben);

      setDebes(Math.round(totalDebes));
      setTeDeben(Math.round(totalTeDeben));
    });

    // Limpiar suscripción al desmontar
    return () => unsubscribe();
  }, [usuarioAutenticado]);

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

         

      </View>
    </SafeAreaView>
  );
}
