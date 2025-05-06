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
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  ScrollView
} from 'react-native';
import * as Contacts from 'expo-contacts';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig'; 

export default function EditarGrupoScreen({ route, navigation }) {
  // --- Estados ---
  const [nombreGrupo, setNombreGrupo] = useState('');
  const [descripcionGrupo, setDescripcionGrupo] = useState('');
  // Estado SIEMPRE contendrá objetos { id: string, name: string | null }
  const [participantesSeleccionados, setParticipantesSeleccionados] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [errorCargaInicial, setErrorCargaInicial] = useState(null);
  const [contactos, setContactos] = useState([]); // Lista completa de contactos [{id, name}]
  const [permisoContactos, setPermisoContactos] = useState(null);
  const [cargandoContactos, setCargandoContactos] = useState(false); // Carga de lista completa
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false); // Guardado de cambios

  const { grupoId } = route.params || {};

  // --- Efecto para Cargar Datos INICIALES y Contactos ---
  useEffect(() => {
    if (!grupoId) {
      setErrorCargaInicial("No se proporcionó ID de grupo para editar.");
      setInitialLoading(false);
      return;
    }

    let isMounted = true;
    setInitialLoading(true);
    setErrorCargaInicial(null);
    setParticipantesSeleccionados([]); // Limpiar estado inicial

    const cargarDatos = async () => {
      let grupoData = null;
      let idsParticipantesIniciales = [];

      try {
        // 1. Obtener datos del grupo
        const docRef = doc(db, "grupos", grupoId);
        const docSnap = await getDoc(docRef);

        if (!isMounted) return;

        if (docSnap.exists()) {
          grupoData = { id: docSnap.id, ...docSnap.data() };
          idsParticipantesIniciales = grupoData.participantes || [];
          setNombreGrupo(grupoData.nombre || '');
          setDescripcionGrupo(grupoData.descripcion || '');
        } else {
          throw new Error("No se encontró el grupo a editar.");
        }

        // 2. Cargar TODOS los contactos Y OBTENER NOMBRES de iniciales
        setCargandoContactos(true);
        const { status } = await Contacts.requestPermissionsAsync();
        if (isMounted) setPermisoContactos(status); else return;

        let infoInicialParticipantes = [];
        let listaCompletaContactos = [];

        if (status === 'granted') {
          const { data: allContactsData } = await Contacts.getContactsAsync({
            fields: [Contacts.Fields.Name, Contacts.Fields.ID], // Pedir ID y Name
          });
          // Filtrar y ordenar lista completa
          listaCompletaContactos = allContactsData
            .filter(c => c.name) // Asegurarse de que tiene nombre
            .sort((a, b) => a.name.localeCompare(b.name));

          // Mapear IDs iniciales a { id, name } usando la lista completa
          infoInicialParticipantes = idsParticipantesIniciales.map(idBuscado => {
            const contactoEncontrado = listaCompletaContactos.find(c => c.id === idBuscado);
            return {
              id: idBuscado,
              // Guarda en la propiedad 'name'
              name: contactoEncontrado?.name || `(ID: ${idBuscado} - No encontrado)`
            };
          }).sort((a, b) => (a.name || '').localeCompare(b.name || '')); // Ordenar por 'name'

        } else {
          // Fallback a IDs si no hay permiso
          infoInicialParticipantes = idsParticipantesIniciales.map(id => ({
            id: id,
            name: `(ID: ${id})` // Guarda en 'name'
          }));
        }

        if (isMounted) {
          setContactos(listaCompletaContactos);
          // Actualizar el estado con los objetos {id, name} correctos
          setParticipantesSeleccionados(infoInicialParticipantes);
        }

      } catch (err) {
        console.error("EditarGrupoScreen: Error cargando datos:", err);
        if (isMounted) setErrorCargaInicial(err.message || "Error al cargar datos.");
      } finally {
        if (isMounted) {
          setCargandoContactos(false);
          setInitialLoading(false);
        }
      }
    };

    cargarDatos();

    return () => { isMounted = false; }
  }, [grupoId]);


  // --- FUNCIÓN toggleParticipante (Estandarizada a 'name') ---
  const toggleParticipante = useCallback((contacto) => {
    if (!contacto || !contacto.id) {
      console.error("toggleParticipante llamado sin contacto válido:", contacto);
      return;
    }
    // Crea el objeto SIEMPRE con la propiedad 'name'
    const participanteSimple = {
      id: contacto.id,
      name: contacto.name || `(ID: ${contacto.id})` // Usa name, fallback a ID
    };

    setParticipantesSeleccionados((prevSeleccionados) => {
      const existeIndex = prevSeleccionados.findIndex(p => p.id === participanteSimple.id);
      let newState;
      if (existeIndex > -1) {
        newState = prevSeleccionados.filter((_, index) => index !== existeIndex);
      } else {
        newState = [...prevSeleccionados, participanteSimple];
        // Ordenar por 'name'
        newState.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      }
      return newState;
    });
  }, []);


  // --- FUNCIÓN PARA GUARDAR CAMBIOS ---
  const handleGuardarCambios = useCallback(async () => {
    Keyboard.dismiss();
    if (!grupoId || !nombreGrupo.trim() || participantesSeleccionados.length === 0) {
        Alert.alert("Error", "Asegúrate de que el grupo tenga nombre y al menos un participante.");
        return;
    }
    setIsSubmitting(true);
    try {
        const participantesIds = participantesSeleccionados.map(p => p.id);
        if (!participantesIds.every(id => typeof id === 'string')) { throw new Error("Error interno: formato de IDs incorrecto."); }
        const datosActualizados = { nombre: nombreGrupo.trim(), descripcion: descripcionGrupo.trim(), participantes: participantesIds };
        const docRef = doc(db, "grupos", grupoId);
        await updateDoc(docRef, datosActualizados);
        Alert.alert("Éxito", "Grupo actualizado.");
        navigation.goBack();
    } catch (error) {
        console.error("EditarGrupoScreen: Error al actualizar:", error);
        Alert.alert("Error", `No se pudo actualizar. ${error.message}`);
    } finally { setIsSubmitting(false); }
  }, [grupoId, nombreGrupo, descripcionGrupo, participantesSeleccionados, navigation]);


  // --- FILTRADO DE CONTACTOS ---
  const filteredContacts = useMemo(() => {
    if (!searchQuery) return contactos;
    return contactos.filter(contacto => contacto.name?.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [contactos, searchQuery]);

  // --- RENDERIZADO DE CADA CONTACTO ---
  const renderContactoItem = useCallback(({ item }) => {
    const isSelected = participantesSeleccionados.some(p => p.id === item.id);
    return (
      <TouchableOpacity
        style={[styles.contactoItem, isSelected ? styles.contactoSeleccionado : {}]}
        onPress={() => toggleParticipante(item)}
      >
        <Text style={styles.contactoNombre}>{item.name}</Text>
      </TouchableOpacity>
    );
  }, [participantesSeleccionados, toggleParticipante]);


  // --- RENDERIZADO PRINCIPAL ---

  if (initialLoading) {
    return ( <View style={[styles.container, styles.centerContent]}><ActivityIndicator size="large" color="#007bff" /><Text style={styles.statusText}>Cargando datos...</Text></View> );
  }
  if (errorCargaInicial) {
    return ( <View style={[styles.container, styles.centerContent]}><Text style={styles.errorText}>Error: {errorCargaInicial}</Text><Button title="Volver" onPress={() => navigation.goBack()} /></View> );
  }

  return (
    <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.kavContainer}
        keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
    >
      <ScrollView
          style={styles.scrollViewContainer}
          contentContainerStyle={styles.scrollViewContent}
          keyboardShouldPersistTaps="handled"
      >
        {/* Inputs y botón */}
        <Text style={styles.label}>Nombre del Grupo *</Text>
        <TextInput style={styles.input} value={nombreGrupo} onChangeText={setNombreGrupo}/>
        <Text style={styles.label}>Descripción (Opcional)</Text>
        <TextInput style={[styles.input, styles.textArea]} value={descripcionGrupo} onChangeText={setDescripcionGrupo} multiline/>
        <View style={styles.buttonContainer}>
            <Button
                title={isSubmitting ? "Guardando..." : "Guardar Cambios"}
                onPress={handleGuardarCambios}
                disabled={isSubmitting || !nombreGrupo.trim() || participantesSeleccionados.length === 0}
            />
            {isSubmitting && <ActivityIndicator style={styles.submitIndicator} size="small" color="#007bff"/>}
        </View>

        {/* Sección Participantes Seleccionados (Usa p.name) */}
        {participantesSeleccionados.length > 0 && (
            <View style={styles.seleccionadosContainer}>
               <Text style={styles.seleccionadosLabel}>Participantes Actuales:</Text>
               <View style={styles.seleccionadosWrapper}>
                   {participantesSeleccionados.map(p => ( // p es {id, name}
                       <TouchableOpacity key={p.id} onPress={() => toggleParticipante(p)} style={styles.participanteSeleccionado}>
                           {/* Referencia directa a p.name, con fallback a ID */}
                           <Text style={styles.participanteTexto}>
                               {p.name || `(ID: ${p.id})`} (X)
                           </Text>
                       </TouchableOpacity>
                   ))}
               </View>
            </View>
        )}

        {/* Sección Añadir/Quitar Participantes */}
        <Text style={styles.label}>Añadir/Quitar Participantes</Text>
        <TextInput style={styles.input} placeholder="Buscar contacto..." value={searchQuery} onChangeText={setSearchQuery}/>
        {cargandoContactos ? ( <ActivityIndicator size="small" color="#007bff" style={{marginVertical: 20}}/> )
         : permisoContactos === 'denied' ? ( <Text style={styles.permisoInfo}>Se necesita permiso para mostrar contactos.</Text> )
         : (
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
                style={styles.listaContactosScrollView}
                scrollEnabled={false}
            />
         )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// --- Estilos ---
const styles = StyleSheet.create({
    kavContainer:{
        flex: 1,
    },
    scrollViewContainer: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scrollViewContent: {
        paddingHorizontal: 20,
        paddingTop: 15,
        paddingBottom: 30,
        flexGrow: 1,
    },
    centerContent: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    statusText: {
        marginTop: 10,
        fontSize: 16,
        color: '#6c757d',
    },
    errorText: {
        fontSize: 16,
        color: 'red',
        textAlign: 'center',
        marginBottom: 15,
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
        marginTop: 15,
        marginBottom: 20,
    },
    submitIndicator: {
        marginTop: 10,
        alignSelf: 'center',
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
    seleccionadosWrapper:{
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
    listaContactosScrollView: {
        marginTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        minHeight: 150,
        // Si necesitas limitar la altura máxima porque el ScrollView padre
        // no funciona bien con listas muy largas + scrollEnabled=false:
        // maxHeight: 300,
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
    emptyListContainer:{
      paddingVertical: 20,
      alignItems: 'center',
    },
    placeholderText: {
        color: '#6c757d',
        fontSize: 15,
        textAlign: 'center',
    },
    permisoInfo:{
        fontStyle: 'italic',
        fontSize: 13,
        color: '#6c757d',
        textAlign: 'center',
        paddingVertical: 10,
    }
});