import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView, // Usamos ScrollView
  Platform,
  Keyboard
} from 'react-native';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'; 
import { db } from '../../firebaseConfig'; 
import * as Contacts from 'expo-contacts';



export default function CrearGrupoScreen({ navigation }) {
  // --- ESTADOS ---
  const [nombreGrupo, setNombreGrupo] = useState('');
  const [descripcionGrupo, setDescripcionGrupo] = useState('');
  const [participantesSeleccionados, setParticipantesSeleccionados] = useState([]);
  const [contactos, setContactos] = useState([]);
  const [permisoContactos, setPermisoContactos] = useState(null);
  const [cargandoContactos, setCargandoContactos] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false); 
  
  const [Cantidad, setCantidad] = useState(0);

  // --- EFECTO PARA PERMISOS Y CARGA DE CONTACTOS ---
  useEffect(() => {
    (async () => {
      setPermisoContactos(null);
      setCargandoContactos(true);
      const { status } = await Contacts.requestPermissionsAsync();
      setPermisoContactos(status);
      if (status === 'granted') {
        console.log('Permiso concedido, leyendo contactos...');
        try {
          const { data } = await Contacts.getContactsAsync({
            fields: [Contacts.Fields.Name, Contacts.Fields.ID],
          });
          if (data.length > 0) {
            const contactosFiltrados = data
              .filter(c => c.name)
              .sort((a, b) => a.name.localeCompare(b.name));
            setContactos(contactosFiltrados);
            console.log(`Leídos ${contactosFiltrados.length} contactos con nombre.`);
          } else {
            console.log('No se encontraron contactos.');
            setContactos([]);
          }
        } catch (error) {
          console.error("Error leyendo contactos: ", error);
          Alert.alert("Error", "No se pudieron cargar los contactos.");
          setContactos([]);
        }
      } else {
        console.log('Permiso de contactos denegado.');
        setContactos([]);
      }
      setCargandoContactos(false);
    })();
  }, []);


  // --- FUNCIÓN toggleParticipante ---
  const toggleParticipante = useCallback((contacto) => {
    const participanteSimple = { id: contacto.id, nombre: contacto.name };
    setParticipantesSeleccionados((prevSeleccionados) => {
      const yaSeleccionado = prevSeleccionados.some(p => p.id === participanteSimple.id);
      if (yaSeleccionado) {
        return prevSeleccionados.filter(p => p.id !== participanteSimple.id);
      } else {
        return [...prevSeleccionados, participanteSimple];
      }
    });
  }, []);

  // --- FUNCIÓN handleCrearGrupo ---
const handleCrearGrupo = useCallback(async () => { // La hacemos async para usar await
  Keyboard.dismiss(); // Cierra el teclado

  // 1. Validación simple (aunque el botón ya está deshabilitado)
  if (!nombreGrupo.trim()) {
    Alert.alert("Error", "El nombre del grupo no puede estar vacío.");
    return; // Detiene la ejecución si no es válido
  }

  if (participantesSeleccionados.length === 0) {
      Alert.alert("Error", "Debes seleccionar al menos un participante.");
      return; // Detiene la ejecución
  }

  if (Cantidad === '' || Cantidad === 0) {
    Alert.alert("Error", "La cantidad no puede estar vacía.");
    return;
  }

  // 2. Iniciar Estado de Carga (UX)
  setIsSubmitting(true);

  try {
    // 3. Preparar los Datos para Firestore
    //    Mapeamos los participantes seleccionados para obtener solo sus IDs (Contact ID por ahora
    //    después se pone lo del ID de users cuando hagamos la auth Ignacio
    const participantesIds = participantesSeleccionados.map(p => p.id);

    const nuevoGrupoData = {
      nombre: nombreGrupo.trim(), // Quitar espacios extra del nombre
      descripcion: descripcionGrupo.trim(), // Quitar espacios extra
      // Usamos los IDs mapeados
      participantes: participantesIds,
      //Aqui usamos la Cantidad para el valor
      Cantidad: Cantidad,
      // Aquí usamos serverTimestamp()
      fechaCreacion: serverTimestamp(),
    };

    console.log('Guardando en Firestore:', nuevoGrupoData);

    // 4. Llamada a Firebase para Añadir el Documento
    const docRef = await addDoc(collection(db, "grupos"), nuevoGrupoData);
    console.log("Grupo añadido con ID: ", docRef.id);

    // 5. Éxito (UX y Navegación)
    Alert.alert("Éxito", `Grupo "${nombreGrupo.trim()}" creado correctamente.`);
    navigation.goBack(); // Volver a la pantalla anterior (lista de grupos)

    // Nota: No necesitamos actualizar el Context manualmente aquí porque
    // el onSnapshot en GruposContext debería detectar el nuevo documento
    // y actualizar la lista automáticamente ✨

  } catch (error) {
    // 6. Error (UX)
    console.error("Error al crear grupo en Firestore: ", error);
    Alert.alert("Error", "No se pudo crear el grupo. Inténtalo de nuevo.");
    

  } finally {
    // 7. Finalizar Estado de Carga (UX) - Se ejecuta siempre (éxito o error)
    setIsSubmitting(false);
  }
}, [nombreGrupo, descripcionGrupo, participantesSeleccionados, navigation]); // Dependencias de useCallback

  // --- FILTRADO DE CONTACTOS ---
  const filteredContacts = useMemo(() => {
    if (!searchQuery) {
      return contactos;
    }
    return contactos.filter(contacto =>
      contacto.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [contactos, searchQuery]);


  // --- RENDERIZADO DE CADA CONTACTO ---
  const renderContactoItem = useCallback(({ item }) => {
    const isSelected = participantesSeleccionados.some(p => p.id === item.id);
    return (
      <TouchableOpacity
        style={[styles.contactoItem, isSelected ? styles.contactoSeleccionado : {}]}
        onPress={() => toggleParticipante(item)}
        disabled={cargandoContactos}
      >
        <Text style={styles.contactoNombre}>{item.name}</Text>
      </TouchableOpacity>
    );
  }, [participantesSeleccionados, cargandoContactos, toggleParticipante]);

  const Formato = (value) => {
    if (!value) return '$0.00';

    const Decimal = parseFloat(Value);
    
    if (isNaN(Decimal)) return '$0.00';
  
    return `$${Decimal.toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // --- RENDERIZADO PRINCIPAL ---
  return (
    // Usamos ScrollView como contenedor principal
    <ScrollView
        style={styles.scrollViewContainer}
        contentContainerStyle={styles.scrollViewContent} // Estilo para el contenido interno
        keyboardShouldPersistTaps="handled"
    >
      {/* 1. Manejo de Estados Iniciales */}
      {(permisoContactos === null || cargandoContactos) && permisoContactos !== 'denied' && (
          <View style={styles.contenedorCentrado}>
             <ActivityIndicator size="large" color="#007bff" />
             <Text style={styles.statusText}>{permisoContactos === null ? 'Solicitando permiso...' : 'Cargando contactos...'}</Text>
          </View>
      )}

      {/* 2. Si el permiso fue denegado */}
      {permisoContactos === 'denied' && !cargandoContactos && (
          <View style={styles.contenedorCentrado}>
              <Text style={styles.placeholderText}>Permiso de contactos denegado.</Text>
              <Button title="Volver" onPress={() => navigation.goBack()} />
          </View>
      )}

      {/* 3. Si el permiso fue concedido y no estamos cargando */}
      {permisoContactos === 'granted' && !cargandoContactos && (
          // Contenedor normal para los elementos
          <View style={styles.mainContent}>
              {/* --- Inputs, botón, seleccionados --- */}
              <Text style={styles.label}>Nombre del Grupo *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: Viaje a Cartagena"
                value={nombreGrupo}
                onChangeText={setNombreGrupo}
               />
              <Text style={styles.label}>Descripción (Opcional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Ej: Gastos del viaje de fin de año"
                value={descripcionGrupo}
                onChangeText={setDescripcionGrupo}
                multiline
               />

              <Text style={styles.label}>Ingrese una cantidad</Text>
              <TextInput
                value={Cantidad}
                onChangeText={setCantidad}
                placeholder="Cantidad"
                keyboardType="number-pad"
                style={styles.input}
              />

              <View style={styles.buttonContainer}>
                  <Button
                    title={isSubmitting ? "Creando..." : "Crear Grupo"} // Cambia el título
                    onPress={handleCrearGrupo}
                    // Deshabilitado si falta nombre O participantes O si ya se está enviando
                    disabled={!nombreGrupo.trim() || participantesSeleccionados.length === 0 || isSubmitting}
                  />
                  {/* Mostrar un ActivityIndicator pequeño cerca del botón si está cargando */}
                  {isSubmitting && <ActivityIndicator style={styles.indicadorBoton} size="small" color="#007bff" />}
              </View>
              {participantesSeleccionados.length > 0 && (
                  <View style={styles.seleccionadosContainer}>
                    <Text style={styles.seleccionadosLabel}>Seleccionados:</Text>
                    <View style={styles.seleccionadosWrapper}>
                      {participantesSeleccionados.map(p => (
                        <TouchableOpacity key={p.id} onPress={() => toggleParticipante(p)} style={styles.participanteSeleccionado}>
                          <Text style={styles.participanteTexto}>{p.nombre} (X)</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
              )}
              <Text style={styles.label}>Buscar y Seleccionar Participantes</Text>
              <TextInput
                  style={styles.input} // Input de búsqueda
                  placeholder="Buscar contacto por nombre..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
              />

              {/* --- FlatList (DENTRO del ScrollView) --- */}
              <FlatList
                  data={filteredContacts}
                  renderItem={renderContactoItem}
                  keyExtractor={(item) => item.id}
                  ListEmptyComponent={
                      <View style={styles.emptyListContainer}>
                        <Text style={styles.placeholderText}>
                          {searchQuery ? 'No se encontraron contactos con ese nombre.' : (contactos.length === 0 ? 'No hay contactos en el dispositivo.' : 'No se encontraron contactos.')}
                        </Text>
                      </View>
                  }
                  style={styles.listaContactosScrollView} // Estilo específico
                  scrollEnabled={false} 
              />
          </View>
      )}
    </ScrollView>
  );
}

// --- Estilos ---
const styles = StyleSheet.create({
  scrollViewContainer: {
      flex: 1, // Ocupa toda la pantalla
      backgroundColor: '#fff',
  },
  scrollViewContent: {
      paddingHorizontal: 20, // Padding lateral para todo
      paddingTop: 15,
      paddingBottom: 30, // Espacio extra al final
      flexGrow: 1, // Permite que el contenido crezca
  },
  mainContent:{ // Contenedor para cuando hay permiso
      // flex: 1, // Quitar flex: 1 aquí puede ayudar a que el ScrollView mida mejor el contenido
  },
  contenedorCentrado: { // Para estados de carga/error
      // flex: 1, // Quitar flex: 1 aquí
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
      minHeight: 200, // Dale una altura mínima
  },
  statusText: { // Texto para estados de carga/permiso
      marginTop: 10,
      fontSize: 16,
      color: '#6c757d',
      textAlign: 'center', // Centrar texto de estado
  },
  label: {
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 5,
      marginTop: 15,
      color: '#333',
  },
  input: {
      borderWidth: 1,
      borderColor: '#ccc',
      borderRadius: 5,
      paddingHorizontal: 15,
      paddingVertical: Platform.OS === 'ios' ? 12 : 10,
      fontSize: 16,
      backgroundColor: '#f8f8f8',
      marginBottom: 10,
  },
  textArea: {
      height: 80,
      textAlignVertical: 'top',
  },
  buttonContainer: {
      marginTop: 10,
      marginBottom: 15,
  },
  seleccionadosContainer: {
      marginTop: 15,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: '#eee',
      marginBottom: 10,
  },
  seleccionadosLabel: {
      fontWeight: 'bold',
      marginBottom: 8,
      color: '#555',
      fontSize: 14,
  },
  seleccionadosWrapper: {
      flexDirection: 'row',
      flexWrap: 'wrap',
  },
  participanteSeleccionado: {
      backgroundColor: '#007bff',
      borderRadius: 15,
      paddingVertical: 5,
      paddingHorizontal: 12,
      marginRight: 8,
      marginBottom: 8,
  },
  participanteTexto: {
      color: 'white',
      fontSize: 14,
  },
  listaContactosScrollView: { // Estilo para FlatList dentro de ScrollView
      marginTop: 10,
      borderTopWidth: 1,
      borderTopColor: '#eee',
      minHeight: 200, // Altura mínima para que siempre se vea un poco
      // NO flex: 1
      // Puedes darle maxHeight si quieres limitarla:
      // maxHeight: 400, // Por ejemplo, limita la altura máxima
  },
  contactoItem: {
      paddingVertical: 12,
      paddingHorizontal: 5,
      borderBottomWidth: 1,
      borderBottomColor: '#eee',
  },
  contactoSeleccionado: {
      backgroundColor: '#e7f3ff',
  },
  contactoNombre: {
      fontSize: 16,
  },
  emptyListContainer: {
      paddingVertical: 30,
      alignItems: 'center',
  },
  placeholderText: {
      color: '#6c757d',
      fontSize: 15,
      textAlign: 'center',
  },
  indicadorBoton: {
    marginTop: 10, // Espacio sobre el indicador
    // Se podría poner al lado del botón con position: 'absolute' o flexbox
},
});