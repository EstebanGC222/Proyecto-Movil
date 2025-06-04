import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View, Text, TextInput, Button, StyleSheet, FlatList,
  TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView,
  Platform, Keyboard, ScrollView
} from 'react-native';
import * as Contacts from 'expo-contacts';
import { doc, getDoc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useAuth } from '../../context/AuthContext';

import { styles } from '../styles';

export default function EditarGrupoScreen({ route, navigation }) {
  const { usuarioAutenticado } = useAuth();

  // --- Estados ---
  const [nombreGrupo, setNombreGrupo] = useState('');
  const [descripcionGrupo, setDescripcionGrupo] = useState('');
  // participantesSeleccionados almacenará [{ uid, nombreParaMostrar }] EXCLUYENDO al usuarioAutenticado
  const [participantesSeleccionados, setParticipantesSeleccionados] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [errorCargaInicial, setErrorCargaInicial] = useState(null);
  const [contactosDelTelefono, setContactosDelTelefono] = useState([]);
  const [permisoContactos, setPermisoContactos] = useState(null);
  const [cargandoContactosTelefono, setCargandoContactosTelefono] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cantidad, setCantidad] = useState('');

  const [usuariosRegistrados, setUsuariosRegistrados] = useState([]);
  const [cargandoUsuarios, setCargandoUsuarios] = useState(true);

  const { grupoId } = route.params || {};
  const isMounted = useRef(true); // Usar useRef para isMounted

  // --- FUNCIÓN PARA NORMALIZAR NÚMEROS (SOLO DÍGITOS) ---
  const normalizarNumeroSoloDigitos = (numero) => {
    if (!numero || typeof numero !== 'string') return '';
    return numero.replace(/\D/g, '');
  };

  // --- Efecto para Cargar Datos INICIALES ---
  useEffect(() => {
    isMounted.current = true; // Establecer al montar

    if (!grupoId) {
      if (isMounted.current) setErrorCargaInicial("No se proporcionó ID de grupo para editar.");
      if (isMounted.current) setInitialLoading(false);
      return;
    }

    if (isMounted.current) {
        setInitialLoading(true);
        setErrorCargaInicial(null);
        setParticipantesSeleccionados([]); // Resetear
    }

    const cargarTodosLosDatos = async () => {
      try {
        // 1. Cargar Usuarios Registrados
        if (isMounted.current) setCargandoUsuarios(true);
        const querySnapshotUsuarios = await getDocs(collection(db, "usuarios"));
        const listaUsuariosTemp = [];
        querySnapshotUsuarios.forEach((doc) => {
          listaUsuariosTemp.push({ uid: doc.id, ...doc.data() });
        });
        if (!isMounted.current) return; // Comprobar antes de setState
        setUsuariosRegistrados(listaUsuariosTemp);
        if (isMounted.current) setCargandoUsuarios(false);


        // 2. Cargar Datos del Grupo Específico
        const docRefGrupo = doc(db, "grupos", grupoId);
        const docSnapGrupo = await getDoc(docRefGrupo);
        if (!isMounted.current) return;

        if (docSnapGrupo.exists()) {
          const grupoData = { id: docSnapGrupo.id, ...docSnapGrupo.data() };
          setNombreGrupo(grupoData.nombre || '');
          setDescripcionGrupo(grupoData.descripcion || '');
          setCantidad(grupoData.Cantidad !== undefined ? String(grupoData.Cantidad) : '');

          // Filtramos al usuarioAutenticado de la lista de participantes que cargamos del grupo
          // para que `participantesSeleccionados` solo contenga a los OTROS miembros.
          const otrosParticipantes = (grupoData.participantes || []).filter(
            p => p.uid !== usuarioAutenticado?.uid
          );
          setParticipantesSeleccionados(otrosParticipantes);
          console.log("EditarGrupoScreen: Datos del grupo cargados. Otros Participantes para UI:", otrosParticipantes);
        } else {
          throw new Error("No se encontró el grupo a editar.");
        }

        // 3. Cargar Contactos del Teléfono
        if (isMounted.current) setCargandoContactosTelefono(true);
        const { status } = await Contacts.requestPermissionsAsync();
        if (!isMounted.current) return;
        setPermisoContactos(status);

        let listaCompletaContactos = [];
        if (status === 'granted') {
          const { data: allContactsData } = await Contacts.getContactsAsync({
            fields: [Contacts.Fields.Name, Contacts.Fields.ID, Contacts.Fields.PhoneNumbers],
          });
          if (allContactsData.length > 0) {
              listaCompletaContactos = allContactsData
              .filter(c => c.name && c.phoneNumbers && c.phoneNumbers.length > 0)
              .map(c => ({
                  id: c.id, name: c.name, phoneNumber: c.phoneNumbers[0].number
              }))
              .sort((a, b) => a.name.localeCompare(b.name));
          }
        }
        if (isMounted.current) {
          setContactosDelTelefono(listaCompletaContactos);
          setCargandoContactosTelefono(false);
        }

      } catch (err) {
        console.error("EditarGrupoScreen: Error cargando datos iniciales:", err);
        if (isMounted.current) setErrorCargaInicial(err.message || "Error al cargar datos.");
      } finally {
        if (isMounted.current) setInitialLoading(false);
      }
    };

    cargarTodosLosDatos();

    return () => { isMounted.current = false; } // Cleanup
  }, [grupoId, usuarioAutenticado]); // usuarioAutenticado en dependencias por si cambia (logout/login)


  // --- FUNCIÓN toggleParticipante ---
  const toggleParticipante = useCallback((contactoDelTelefonoSeleccionado) => {
    if (!contactoDelTelefonoSeleccionado.phoneNumber) { Alert.alert("Sin Número", `El contacto ${contactoDelTelefonoSeleccionado.name} no tiene número.`); return; }
    if (cargandoUsuarios) { Alert.alert("Cargando", "Usuarios cargando..."); return; }
    const numeroContactoLimpio = normalizarNumeroSoloDigitos(contactoDelTelefonoSeleccionado.phoneNumber);
    if (!numeroContactoLimpio) { Alert.alert("Número Inválido", `Número de ${contactoDelTelefonoSeleccionado.name} inválido.`); return; }

    let usuarioEncontrado = null;
    for (const usr of usuariosRegistrados) {
      const numeroRegistradoLimpio = usr.numeroTelefono;
      if (numeroRegistradoLimpio) {
        if (numeroRegistradoLimpio.endsWith(numeroContactoLimpio) || numeroContactoLimpio.endsWith(numeroRegistradoLimpio)) {
          if (Math.min(numeroRegistradoLimpio.length, numeroContactoLimpio.length) >= 7) {
            usuarioEncontrado = usr; break;
          }
        }
      }
    }

    if (usuarioEncontrado) {
      // NO AÑADIR al usuarioAutenticado (editor) a través de este método
      if (usuarioAutenticado && usuarioEncontrado.uid === usuarioAutenticado.uid) {
        Alert.alert("Información", "Como editor del grupo, ya estás incluido y no puedes añadirte/quitarte desde esta lista.");
        return;
      }

      setParticipantesSeleccionados((prevSeleccionados) => {
        const yaEstaSeleccionado = prevSeleccionados.some(p => p.uid === usuarioEncontrado.uid);
        if (yaEstaSeleccionado) {
          return prevSeleccionados.filter(p => p.uid !== usuarioEncontrado.uid);
        } else {
          return [...prevSeleccionados, { uid: usuarioEncontrado.uid, nombreParaMostrar: contactoDelTelefonoSeleccionado.name }];
        }
      });
    } else {
      Alert.alert("Usuario no Registrado", `El contacto ${contactoDelTelefonoSeleccionado.name} (${contactoDelTelefonoSeleccionado.phoneNumber}) no está registrado.`);
    }
  }, [usuariosRegistrados, cargandoUsuarios, usuarioAutenticado]);

  // --- FUNCIÓN PARA GUARDAR CAMBIOS ---
  const handleGuardarCambios = useCallback(async () => {
    Keyboard.dismiss();
    if (!grupoId || !nombreGrupo.trim()) { /* ... alerta ... */ return; }
    const cantidadLimpia = String(cantidad).replace(/\./g, '');
    const cantidadNumerica = Number(cantidadLimpia);
    if (String(cantidad).trim() === '' || isNaN(cantidadNumerica) || cantidadNumerica <= 0) { /* ... alerta ... */ return; }

    // Construir la lista final de participantes para Firestore
    // Siempre incluye al editor (usuarioAutenticado) con el nombre "Tú"
    // y luego los otros participantes que están en 'participantesSeleccionados'
    let participantesFinalesParaGuardar = [];
    if (usuarioAutenticado) {
      participantesFinalesParaGuardar.push({ uid: usuarioAutenticado.uid, nombreParaMostrar: "Tú" });
    }
    // Añadimos los otros, asegurándonos de no duplicar al editor si por alguna razón
    // su UID estuviera en participantesSeleccionados (aunque toggleParticipante debería prevenirlo)
    participantesSeleccionados.forEach(p => {
      if (p.uid !== usuarioAutenticado?.uid) {
        participantesFinalesParaGuardar.push(p);
      }
    });

    // Validar que haya al menos un participante (el creador/editor)
    if (participantesFinalesParaGuardar.length === 0 && usuarioAutenticado) {
         Alert.alert("Error", "El editor debe estar en el grupo."); // Caso extremo
         return;
    } else if (participantesFinalesParaGuardar.length === 0) {
        Alert.alert("Error", "El grupo debe tener al menos un participante.");
        return;
    }

    setIsSubmitting(true);
    try {
      const datosActualizados = {
        nombre: nombreGrupo.trim(),
        descripcion: descripcionGrupo.trim(),
        participantes: participantesFinalesParaGuardar,
        Cantidad: cantidadNumerica,
      };
      const docRef = doc(db, "grupos", grupoId);
      await updateDoc(docRef, datosActualizados);
      Alert.alert("Éxito", "Grupo actualizado correctamente.");
      navigation.goBack();
    } catch (error) {
      console.error("EditarGrupoScreen: Error al actualizar:", error);
      Alert.alert("Error", `No se pudo actualizar el grupo. ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  }, [grupoId, nombreGrupo, descripcionGrupo, participantesSeleccionados, cantidad, navigation, usuarioAutenticado]);

  // --- FILTRADO DE CONTACTOS ---
  const filteredContactsDelTelefono = useMemo(() => {
    if (!searchQuery) return contactosDelTelefono;
    return contactosDelTelefono.filter(contacto => contacto.name?.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [contactosDelTelefono, searchQuery]);

  // --- RENDERIZADO DE CADA CONTACTO ---
  const renderContactoItem = useCallback(({ item: contactoDelTelefono }) => {
    let estaVisualmenteSeleccionado = false;
    let esElEditor = false;

    if (usuariosRegistrados.length > 0 && contactoDelTelefono.phoneNumber && usuarioAutenticado) {
        const numeroContactoLimpioVisual = normalizarNumeroSoloDigitos(contactoDelTelefono.phoneNumber);
        const usuarioMatch = usuariosRegistrados.find(usr => {
            const numeroRegistradoLimpioVisual = usr.numeroTelefono;
            return numeroRegistradoLimpioVisual &&
                   (numeroRegistradoLimpioVisual.endsWith(numeroContactoLimpioVisual) || numeroContactoLimpioVisual.endsWith(numeroRegistradoLimpioVisual)) &&
                   Math.min(numeroRegistradoLimpioVisual.length, numeroContactoLimpioVisual.length) >= 7;
        });

        if (usuarioMatch) {
            if (usuarioMatch.uid === usuarioAutenticado.uid) {
                esElEditor = true; // Este contacto es el editor
            } else {
                estaVisualmenteSeleccionado = participantesSeleccionados.some(p => p.uid === usuarioMatch.uid);
            }
        }
    }
    // No mostrar al propio editor en la lista de contactos a añadir/quitar
    if (esElEditor) return null;

    return (
      <TouchableOpacity
        style={[styles.contactoItem, estaVisualmenteSeleccionado ? styles.contactoSeleccionado : {}]}
        onPress={() => toggleParticipante(contactoDelTelefono)}
        disabled={cargandoContactosTelefono || cargandoUsuarios}
      >
        <Text style={styles.contactoNombre}>{contactoDelTelefono.name}</Text>
        <Text style={styles.contactoNumero}>{contactoDelTelefono.phoneNumber}</Text>
      </TouchableOpacity>
    );
  }, [participantesSeleccionados, toggleParticipante, cargandoContactosTelefono, cargandoUsuarios, usuariosRegistrados, usuarioAutenticado]);


  // --- RENDERIZADO PRINCIPAL ---
  if (initialLoading || cargandoUsuarios) {
    return ( <View style={styles.centerContent}><ActivityIndicator size="large" color="#007bff" /><Text style={styles.statusText}>Cargando datos...</Text></View> );
  }
  if (errorCargaInicial) {
    return ( <View style={styles.centerContent}><Text style={styles.errorText}>Error: {errorCargaInicial}</Text><Button title="Volver" onPress={() => navigation.goBack()} /></View> );
  }

  return (
    <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.kavContainer}
        keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0} // Ajusta según altura de tu header si es necesario
    >
      <ScrollView
          style={styles.scrollViewContainer}
          contentContainerStyle={styles.scrollViewContent}
          keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.label}>Nombre del Grupo *</Text>
        <TextInput style={styles.input} value={nombreGrupo} onChangeText={setNombreGrupo}/>
        <Text style={styles.label}>Descripción (Opcional)</Text>
        <TextInput style={[styles.input, styles.textArea]} value={descripcionGrupo} onChangeText={setDescripcionGrupo} multiline/>

        <Text style={styles.label}>Cantidad</Text>
        <TextInput style={styles.input}
          value={cantidad.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}
          onChangeText={(text) => {
            const numericValue = text.replace(/[^0-9]/g, '');
            setCantidad(numericValue);
          }}
          keyboardType="number-pad"
          placeholder="Cantidad actual"
        />

        <View style={styles.buttonContainer}>
            <Button
                title={isSubmitting ? "Guardando..." : "Guardar Cambios"}
                onPress={handleGuardarCambios}
                disabled={isSubmitting || !nombreGrupo.trim() || cargandoContactosTelefono || cargandoUsuarios }
            />
            {isSubmitting && <ActivityIndicator style={styles.submitIndicator} size="small" color="#007bff"/>}
        </View>

        {/* Sección Participantes Actuales */}
        <View style={styles.seleccionadosContainer}>
            <Text style={styles.seleccionadosLabel}>Participantes del Grupo:</Text>
            
            {/* Mostrar OTROS participantes (los que están en `participantesSeleccionados`) con opción de eliminar */}
            {participantesSeleccionados.length > 0 ? (
               <View style={styles.seleccionadosWrapper}>
                   {participantesSeleccionados.map(p => (
                       <TouchableOpacity
                           key={p.uid}
                           onPress={() => {
                               // Filtra directamente participantesSeleccionados para quitar por UID
                               // Asegurándose de no quitar al editor si por error estuviera aquí
                               if (p.uid !== usuarioAutenticado?.uid) {
                                   setParticipantesSeleccionados(prev => prev.filter(sel => sel.uid !== p.uid));
                               }
                           }}
                           style={styles.participanteSeleccionado}
                       >
                           <Text style={styles.participanteTexto}>
                               {p.nombreParaMostrar} (X)
                           </Text>
                       </TouchableOpacity>
                   ))}
               </View>
            ) : (
                <Text style={styles.placeholderTextPequeño}>Nadie más añadido al grupo.</Text>
            )}
        </View>


        {/* Sección Añadir/Quitar Participantes de Contactos del Teléfono */}
        {permisoContactos === 'granted' && (
            <>
                <Text style={styles.label}>Añadir/Quitar Otros Participantes</Text>
                <TextInput style={styles.input} placeholder="Buscar contacto..." value={searchQuery} onChangeText={setSearchQuery}/>
                {cargandoContactosTelefono ? ( <ActivityIndicator size="small" color="#007bff" style={{marginVertical: 20}}/> )
                : (
                    <FlatList
                        data={filteredContactsDelTelefono}
                        renderItem={renderContactoItem}
                        keyExtractor={(item) => item.id}
                        ListEmptyComponent={
                            <View style={styles.emptyListContainer}>
                                <Text style={styles.placeholderText}>
                                {searchQuery ? 'No se encontraron contactos con ese nombre.' : (contactosDelTelefono.length === 0 ? 'No hay contactos en el dispositivo.' : 'No se encontraron contactos.')}
                                </Text>
                            </View>
                        }
                        style={styles.listaContactosScrollView}
                        scrollEnabled={false}
                    />
                )}
            </>
        )}
        {permisoContactos === 'denied' && !cargandoContactosTelefono && (
            <View style={styles.contenedorCentradoPermisoDenegado}>
                <Text style={styles.placeholderText}>Permiso de contactos denegado.</Text>
            </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
