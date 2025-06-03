import React from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';

import { useGrupos } from '../context/GruposContext';

import { styles } from './styles';

export default function Grupos({navigation}) {

  // Usamos nuestro hook para obtener los datos y el estado de carga del Context
  const { grupos, loading } = useGrupos();

  // Si estamos cargando, mostramos el ActivityIndicator
  if (loading) {
    return (
      <View style={styles.contenedorCentrado}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text>Cargando grupos...</Text>
      </View>
    );
  }

  // Función para renderizar CADA item de la lista
  const renderGrupoItem = ({ item }) => (
    // Usamos TouchableOpacity para que sea clickeable en el futuro
    <TouchableOpacity
      style={styles.itemContainer}
      onPress={() => {
        
        console.log("Grupo presionado:", item.id, item.nombre);
        navigation.navigate('DetalleGrupo', { grupoId: item.id });
      }}
    >
      <Text style={styles.itemNombre}>{item.nombre}</Text>
      {/* Mostramos descripción si existe */}
      {item.descripcion ? <Text style={styles.itemDescripcion}>{item.descripcion}</Text> : null}
    </TouchableOpacity>
  );

  // Si NO estamos cargando, retornamos la vista principal
  return (
    <View style={styles.contenedorPrincipal}>
      
      {/* Condición: ¿Hay grupos en la lista? */}
      {grupos.length === 0 ? (
        // Si NO hay grupos, muestra este mensaje
        <View style={styles.contenedorCentrado}>
          <Text style={styles.textoVacio}>No tienes grupos todavía.</Text>
          <Text style={styles.textoVacio}>¡Crea uno!</Text>
        </View>
      ) : (
        // Si SÍ hay grupos, muestra la FlatList
        <FlatList
          data={grupos} // Le pasamos la lista de grupos del Context
          renderItem={renderGrupoItem} // Le decimos CÓMO dibujar cada grupo (usando nuestra función)
          keyExtractor={(item) => item.id} // Le decimos CÓMO obtener una clave ÚNICA para cada item (usamos el ID de Firestore)
          style={styles.lista}
        />
      )}

        <TouchableOpacity
          style={styles.botonFlotante} // Usa los estilos del botón flotante que definiste
          onPress={() => navigation.navigate('CrearGrupo')} // La navegación
        >
        <Text style={styles.botonFlotanteTexto}>+</Text>
        </TouchableOpacity>
    </View>
  );
}