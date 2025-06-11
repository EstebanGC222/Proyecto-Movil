import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import { collection, collectionGroup, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useAuth } from '../../context/AuthContext';
import { styles as globalStyles } from './../styles'; // Asumiendo que tienes un styles.js global

export default function PantallaDeudores() {
  const { usuarioAutenticado } = useAuth();
  const [saldosNetos, setSaldosNetos] = useState([]);
  const [usuariosMap, setUsuariosMap] = useState({});
  const [loadingGastos, setLoadingGastos] = useState(true);
  const [loadingUsuarios, setLoadingUsuarios] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribeUsuarios = onSnapshot(
      collection(db, 'usuarios'),
      (snapshot) => {
        const uMap = {};
        snapshot.docs.forEach((doc) => {
          const userData = doc.data();
          uMap[doc.id] = userData.nombreCompleto || userData.displayName || userData.email || `Usuario (${doc.id.substring(0,5)}...)`;
        });
        setUsuariosMap(uMap);
        setLoadingUsuarios(false);
      },
      (err) => {
        console.error("Error cargando usuarios: ", err);
        setError("No se pudieron cargar los datos de los usuarios.");
        setLoadingUsuarios(false);
      }
    );
    return () => unsubscribeUsuarios();
  }, []);

  useEffect(() => {
    if (loadingUsuarios && Object.keys(usuariosMap).length === 0) {
        if (Object.keys(usuariosMap).length === 0 && loadingUsuarios) return;
    }

    const unsubscribeGastos = onSnapshot(
      collectionGroup(db, 'gastos'),
      (querySnapshot) => {
        const saldos = {}; 

        const getUid = (field) => {
          if (typeof field === 'string') return field;
          return field?.uid || null;
        };

        querySnapshot.forEach((doc) => {
          const gasto = doc.data();
          const {
            deudas = [],
            cantidad,
            pagadoPor, 
            participantes = [], 
          } = gasto;

          const pagadorDelGastoUid = getUid(pagadoPor);

          if (Array.isArray(deudas) && deudas.length > 0) {
            deudas.forEach((deuda) => {
              const deudorUid = getUid(deuda.deudor);
              const acreedorUid = getUid(deuda.acreedor);
              const monto = Number(deuda.monto) || 0;

              if (deudorUid) saldos[deudorUid] = (saldos[deudorUid] || 0) - monto;
              if (acreedorUid) saldos[acreedorUid] = (saldos[acreedorUid] || 0) + monto;
            });
          } else if (cantidad && pagadorDelGastoUid && Array.isArray(participantes) && participantes.length > 0) {
            const montoTotalGasto = Number(cantidad) || 0;
            const numParticipantes = participantes.length;
            if (numParticipantes === 0) return; // Evitar división por cero
            const montoPorPersona = montoTotalGasto / numParticipantes;

            saldos[pagadorDelGastoUid] = (saldos[pagadorDelGastoUid] || 0) + montoTotalGasto;

            participantes.forEach((p) => {
              const participanteUid = getUid(p); 
              if (participanteUid) {
                saldos[participanteUid] = (saldos[participanteUid] || 0) - montoPorPersona;
              }
            });
          }
        });

        const resultadoFinal = Object.entries(saldos)
          .map(([uid, balance]) => ({
            uid,
            nombre: usuariosMap[uid] || `Usuario (${uid.substring(0,5)}...)`,
            saldo: Math.round(balance),
          }))
          .filter(item => item.saldo !== 0) 
          .sort((a, b) => { 
            if (a.saldo < 0 && b.saldo > 0) return -1; 
            if (a.saldo > 0 && b.saldo < 0) return 1;
            return Math.abs(b.saldo) - Math.abs(a.saldo); 
          });
        
        setSaldosNetos(resultadoFinal);
        setLoadingGastos(false);
        setError(null);
      },
      (err) => {
        console.error("Error cargando gastos: ", err);
        setError("No se pudieron cargar los datos de los gastos.");
        setLoadingGastos(false);
      }
    );

    return () => unsubscribeGastos();
  }, [usuariosMap, loadingUsuarios]);

  if (loadingGastos || loadingUsuarios) {
    return (
      <View style={[globalStyles.contenedor, localStyles.contenedorCentrado]}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={localStyles.textoCargando}>Cargando saldos...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[globalStyles.contenedor, localStyles.contenedorCentrado]}>
        <Text style={globalStyles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={globalStyles.contenedor}>
      <Text style={globalStyles.titulo}>Lista de Deudores y Acreedores</Text>
      {saldosNetos.length === 0 ? (
        <Text style={localStyles.placeholderText}>No hay saldos pendientes o todos están al día.</Text>
      ) : (
        <FlatList
          data={saldosNetos}
          keyExtractor={(item) => item.uid}
          renderItem={({ item }) => (
            <View style={localStyles.saldosItemContainer}>
              <Text style={[localStyles.saldosNombre, item.uid === usuarioAutenticado?.uid ? localStyles.saldosUsuarioActual : {}]}>
                {item.nombre}
                {item.uid === usuarioAutenticado?.uid ? " (Tú)" : ""}
              </Text>
              <Text style={item.saldo < 0 ? localStyles.saldosDebe : localStyles.saldosLeDeben}>
                {item.saldo < 0
                  ? `Debe: $${Math.abs(item.saldo)}`
                  : `Le deben: $${item.saldo}`}
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

// Estilos locales para esta pantalla, puedes moverlos a tu archivo global si prefieres
const localStyles = StyleSheet.create({
  contenedorCentrado: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textoCargando: {
    marginTop: 10,
    fontSize: 16,
    color: '#555',
  },
  placeholderText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#777',
  },
  saldosItemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
    borderRadius: 5,
    marginBottom: 8,
  },
  saldosNombre: {
    fontSize: 16,
    color: '#333',
  },
  saldosUsuarioActual: {
    fontWeight: 'bold',
  },
  saldosDebe: {
    fontSize: 16,
    color: 'red',
    fontWeight: 'bold',
  },
  saldosLeDeben: {
    fontSize: 16,
    color: 'green',
    fontWeight: 'bold',
  },
});
