import React from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';

import { useGrupos } from '../context/GruposContext';



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

// --- Estilos ---
const styles = StyleSheet.create({
  contenedorPrincipal: {
    flex: 1, // Ocupa todo el espacio disponible
    padding: 15,
    backgroundColor: '#f8f9fa', // Un fondo claro
  },
  contenedorCentrado: {
    flex: 1, // Ocupa todo el espacio
    justifyContent: 'center', // Centra verticalmente
    alignItems: 'center', // Centra horizontalmente
  },
  titulo: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#343a40',
  },
  textoVacio: {
    fontSize: 16,
    color: '#6c757d', // Un gris suave
    textAlign: 'center',
    marginBottom: 5,
  },
  lista: {
    flex: 1, // Permite que la lista ocupe el espacio restante
  },
  itemContainer: {
    backgroundColor: '#ffffff', // Fondo blanco para cada item
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dee2e6', // Un borde sutil
    shadowColor: "#000", // Sombra (opcional, para iOS)
    shadowOffset: {
        width: 0,
        height: 1,
    },
    shadowOpacity: 0.20,
    shadowRadius: 1.41,
    elevation: 2, // Sombra (opcional, para Android)
  },
  itemNombre: {
    fontSize: 18,
    fontWeight: '600', // Semi-bold
    color: '#495057',
  },
  itemDescripcion: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 4,
  },
  // Estilos para el botón flotante (descomentar si lo añades)
  
  botonFlotante: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: '#007bff',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  botonFlotanteTexto: {
    color: 'white',
    fontSize: 30,
    lineHeight: 30, // Ajuste para centrar el '+'
  },
  
});