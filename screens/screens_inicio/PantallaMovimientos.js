import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, Image } from 'react-native';
import { collection, collectionGroup, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useAuth } from '../../context/AuthContext';
import { styles as globalStyles } from './../styles';

export default function PantallaMovimientos() {
  const { usuarioAutenticado } = useAuth();
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [usuariosMap, setUsuariosMap] = useState({});
  const [gruposMap, setGruposMap] = useState({});

  // 1. Cargar mapa de usuarios (UID -> Nombre)
  useEffect(() => {
    if (!usuarioAutenticado) return;
    const unsubscribeUsuarios = onSnapshot(
      collection(db, 'usuarios'),
      (snapshot) => {
        const uMap = {};
        snapshot.docs.forEach((doc) => {
          const userData = doc.data();
          uMap[doc.id] = userData.nombreCompleto || userData.displayName || userData.email || `Usuario (${doc.id.substring(0,5)}...)`;
        });
        setUsuariosMap(uMap);
      },
      (err) => {
        console.error("Error cargando usuarios para Movimientos: ", err);
      }
    );
    return () => unsubscribeUsuarios();
  }, [usuarioAutenticado]);

  // 2. Cargar mapa de grupos (grupoId -> Nombre)
  useEffect(() => {
    if (!usuarioAutenticado) return;
    const unsubscribeGrupos = onSnapshot(
      collection(db, 'grupos'),
      (snapshot) => {
        const gMap = {};
        snapshot.docs.forEach((doc) => {
          const grupoData = doc.data();
          gMap[doc.id] = grupoData.nombre || `Grupo (${doc.id.substring(0,5)}...)`;
        });
        setGruposMap(gMap);
      },
      (err) => {
        console.error("Error cargando grupos para Movimientos: ", err);
      }
    );
    return () => unsubscribeGrupos();
  }, [usuarioAutenticado]);

  // 3. Cargar y filtrar movimientos (gastos)
  useEffect(() => {
    if (!usuarioAutenticado?.uid || Object.keys(usuariosMap).length === 0 || Object.keys(gruposMap).length === 0) {
      if (movimientos.length === 0) setLoading(true);
      return;
    }
    setLoading(true);

    // Quitar orderBy temporalmente hasta crear el índice
    const unsubscribeMovimientos = onSnapshot(collectionGroup(db, 'gastos'), (querySnapshot) => {
      const gastosFiltrados = [];
      querySnapshot.forEach((doc) => {
        const gasto = doc.data();
        const grupoId = doc.ref.parent.parent?.id;

        let participa = false;
        if (Array.isArray(gasto.participantes)) {
          participa = gasto.participantes.some(p => (typeof p === 'string' ? p : p.uid) === usuarioAutenticado.uid);
        }

        if (participa && grupoId) {
          let fechaGasto = new Date();
          if (gasto.fechaCreacion) {
            fechaGasto = gasto.fechaCreacion.toDate ? gasto.fechaCreacion.toDate() : new Date(gasto.fechaCreacion);
          }

          gastosFiltrados.push({
            id: doc.id,
            ...gasto,
            grupoId: grupoId,
            nombreGrupo: gruposMap[grupoId] || "Grupo Desconocido",
            nombrePagador: usuariosMap[gasto.pagadoPor] || "Pagador Desconocido",
            fechaCreacion: fechaGasto
          });
        }
      });

      // Ordenar en el cliente (menos eficiente pero funciona sin índice)
      gastosFiltrados.sort((a, b) => b.fechaCreacion - a.fechaCreacion);
      
      setMovimientos(gastosFiltrados);
      setLoading(false);
      setError(null);
    }, (err) => {
      console.error("Error cargando movimientos: ", err);
      setError("No se pudieron cargar los movimientos.");
      setLoading(false);
    });

    return () => unsubscribeMovimientos();
  }, [usuarioAutenticado, usuariosMap, gruposMap]);

  if (loading && movimientos.length === 0) {
    return (
      <View style={[globalStyles.contenedor, localStyles.contenedorCentrado]}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={localStyles.textoCargando}>Cargando movimientos...</Text>
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

  const renderMovimientoItem = ({ item }) => (
    <View style={localStyles.movimientoItemContainer}>
      <View style={localStyles.movimientoHeader}>
        <Text style={localStyles.movimientoNombre}>{item.nombre || "Gasto sin descripción"}</Text>
        <Text style={localStyles.movimientoMonto}>
          ${item.cantidad || 0}
        </Text>
      </View>
      <Text style={localStyles.movimientoDetalle}>Grupo: {item.nombreGrupo}</Text>
      <Text style={localStyles.movimientoDetalle}>Pagado por: {item.nombrePagador}</Text>
      <Text style={localStyles.movimientoFecha}>
        {item.fechaCreacion ? item.fechaCreacion.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Fecha no disponible'}
      </Text>
      {item.fotoURL && (
        <Image source={{ uri: item.fotoURL }} style={localStyles.movimientoImagen} resizeMode="cover" />
      )}
    </View>
  );

  return (
    <View style={globalStyles.contenedor}>
      <Text style={globalStyles.titulo}>Mis Movimientos</Text>
      {movimientos.length === 0 && !loading ? (
        <View style={[globalStyles.contenedorCentrado, {flex: 1}]}>
            <Text style={localStyles.placeholderText}>No tienes movimientos registrados en los grupos donde participas.</Text>
        </View>
      ) : (
        <FlatList
          data={movimientos}
          keyExtractor={(item) => item.id}
          renderItem={renderMovimientoItem}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </View>
  );
}

const localStyles = StyleSheet.create({
  contenedorCentrado: {
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
    fontSize: 16,
    color: '#777',
    paddingHorizontal: 20,
  },
  movimientoItemContainer: {
    backgroundColor: '#fff',
    padding: 15,
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  movimientoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  movimientoNombre: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#333',
    flex: 1, 
    marginRight: 8, 
  },
  movimientoMonto: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#007bff',
    textAlign: 'right',
  },
  movimientoDetalle: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
  },
  movimientoFecha: {
    fontSize: 12,
    color: '#777',
    marginTop: 8,
  },
  movimientoImagen: {
    width: '100%',
    height: 180,
    borderRadius: 6,
    marginTop: 10,
    backgroundColor: '#e0e0e0',
  }
});