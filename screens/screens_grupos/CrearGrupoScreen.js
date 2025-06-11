// En screens/screens_grupos/CrearGrupoScreen.js

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
  ScrollView,
  Keyboard
} from 'react-native';
import { collection, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import * as Contacts from 'expo-contacts';
import { useAuth } from '../../context/AuthContext';
import { styles } from './../styles';

export default function CrearGrupoScreen({ navigation }) {
  const { usuarioAutenticado, perfilUsuarioActual } = useAuth();

  // --- ESTADOS ---
  const [nombreGrupo, setNombreGrupo] = useState('');
  const [descripcionGrupo, setDescripcionGrupo] = useState('');
  const [participantesSeleccionados, setParticipantesSeleccionados] = useState([]); // Guarda [{ uid, nombreParaMostrar }]
  const [contactosDelTelefono, setContactosDelTelefono] = useState([]);
  const [permisoContactos, setPermisoContactos] = useState(null);
  const [cargandoContactosTelefono, setCargandoContactosTelefono] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [usuariosRegistrados, setUsuariosRegistrados] = useState([]);
  const [cargandoUsuarios, setCargandoUsuarios] = useState(true);

  // --- EFECTO PARA CARGAR CONTACTOS DEL TELÉFONO ---
  useEffect(() => {
    (async () => {
      setPermisoContactos(null);
      setCargandoContactosTelefono(true);
      const { status } = await Contacts.requestPermissionsAsync();
      setPermisoContactos(status);
      if (status === 'granted') {
        console.log('Permiso concedido, leyendo contactos del teléfono...');
        try {
          const { data } = await Contacts.getContactsAsync({
            fields: [Contacts.Fields.Name, Contacts.Fields.ID, Contacts.Fields.PhoneNumbers],
          });
          if (data.length > 0) {
            const contactosConInfoNecesaria = data
              .filter(c => c.name && c.phoneNumbers && c.phoneNumbers.length > 0)
              .map(c => ({
                  id: c.id,
                  name: c.name,
                  phoneNumber: c.phoneNumbers[0].number
              }))
              .sort((a, b) => a.name.localeCompare(b.name));
            setContactosDelTelefono(contactosConInfoNecesaria);
            console.log(`Leídos ${contactosConInfoNecesaria.length} contactos con nombre y teléfono.`);
          } else {
            console.log('No se encontraron contactos con números de teléfono.');
            setContactosDelTelefono([]);
          }
        } catch (error) {
          console.error("Error leyendo contactos del teléfono: ", error);
          Alert.alert("Error", "No se pudieron cargar los contactos del teléfono.");
          setContactosDelTelefono([]);
        }
      } else {
        console.log('Permiso de contactos denegado.');
        setContactosDelTelefono([]);
      }
      setCargandoContactosTelefono(false);
    })();
  }, []);

  // --- EFECTO PARA CARGAR USUARIOS REGISTRADOS DE FIRESTORE ---
  useEffect(() => {
    const fetchUsuariosRegistrados = async () => {
      setCargandoUsuarios(true);
      try {
        const querySnapshot = await getDocs(collection(db, "usuarios"));
        const listaUsuarios = [];
        querySnapshot.forEach((doc) => {
          listaUsuarios.push({ uid: doc.id, ...doc.data() });
        });
        setUsuariosRegistrados(listaUsuarios);
        console.log("CrearGrupoScreen: Usuarios registrados cargados:", listaUsuarios.length);
      } catch (error) {
        console.error("CrearGrupoScreen: Error cargando usuarios registrados:", error);
        Alert.alert("Error de Carga", "No se pudieron cargar los usuarios de la app.");
      }
      setCargandoUsuarios(false);
    };
    fetchUsuariosRegistrados();
  }, []);

  // --- FUNCIÓN PARA NORMALIZAR NÚMEROS (SOLO DÍGITOS) ---
  const normalizarNumeroSoloDigitos = (numero) => {
    if (!numero || typeof numero !== 'string') return '';
    return numero.replace(/\D/g, '');
  };

  // --- FUNCIÓN toggleParticipante ---
  const toggleParticipante = useCallback((contactoDelTelefonoSeleccionado) => {
    if (!contactoDelTelefonoSeleccionado.phoneNumber) {
      Alert.alert("Sin Número", `El contacto ${contactoDelTelefonoSeleccionado.name} no tiene un número de teléfono.`);
      return;
    }
    if (cargandoUsuarios) {
        Alert.alert("Cargando", "Aún se están cargando los usuarios de la app, por favor espera.");
        return;
    }
    const numeroContactoLimpio = normalizarNumeroSoloDigitos(contactoDelTelefonoSeleccionado.phoneNumber);
    if (!numeroContactoLimpio) {
      Alert.alert("Número Inválido", `El número del contacto ${contactoDelTelefonoSeleccionado.name} no parece válido.`);
      return;
    }
    let usuarioEncontrado = null;
    for (const usr of usuariosRegistrados) {
      const numeroRegistradoLimpio = usr.numeroTelefono; // Asumimos ya está limpio (solo dígitos)
      if (numeroRegistradoLimpio) {
        if (numeroRegistradoLimpio.endsWith(numeroContactoLimpio) || numeroContactoLimpio.endsWith(numeroRegistradoLimpio)) {
          if (Math.min(numeroRegistradoLimpio.length, numeroContactoLimpio.length) >= 7) {
            usuarioEncontrado = usr;
            break;
          }
        }
      }
    }
    if (usuarioEncontrado) {
      setParticipantesSeleccionados((prevSeleccionados) => {
        const yaEstaSeleccionado = prevSeleccionados.some(p => p.uid === usuarioEncontrado.uid);
        if (yaEstaSeleccionado) {
          return prevSeleccionados.filter(p => p.uid !== usuarioEncontrado.uid);
        } else {
          return [...prevSeleccionados, { uid: usuarioEncontrado.uid, nombreParaMostrar: contactoDelTelefonoSeleccionado.name }];
        }
      });
    } else {
      Alert.alert(
        "Usuario no Registrado",
        `El contacto ${contactoDelTelefonoSeleccionado.name} (${contactoDelTelefonoSeleccionado.phoneNumber}) no está registrado en la app con un número coincidente.`
      );
    }
  }, [usuariosRegistrados, cargandoUsuarios]);

  // --- FUNCIÓN handleCrearGrupo (CON AJUSTE PARA "TÚ") ---
  const handleCrearGrupo = useCallback(async () => {
    Keyboard.dismiss();

    if (!nombreGrupo.trim()) {
      Alert.alert("Error", "El nombre del grupo no puede estar vacío.");
      return;
    }

    let participantesFinales = [...participantesSeleccionados]; // Copia de [{uid, nombreParaMostrar}]

    if (usuarioAutenticado) {
      const indiceCreador = participantesFinales.findIndex(p => p.uid === usuarioAutenticado.uid);
      if (indiceCreador !== -1) {
        // Si el creador ya está (porque se seleccionó a sí mismo desde contactos),
        // actualizamos su nombreParaMostrar a "Tú"
        participantesFinales[indiceCreador] = { ...participantesFinales[indiceCreador], nombreParaMostrar: "Tú" };
      } else {
        // Si el creador no estaba, lo añadimos con nombreParaMostrar "Tú"
        participantesFinales.push({ uid: usuarioAutenticado.uid, nombreParaMostrar: "Tú" });
      }
    } else {
      Alert.alert("Error", "No se pudo identificar al creador. Por favor, inicia sesión de nuevo.");
      return;
    }

    if (participantesFinales.length === 0) { // Aunque con la lógica anterior, esto es casi imposible
      Alert.alert("Error", "El grupo debe tener al menos un participante.");
      return;
    }

    setIsSubmitting(true);
    try {
      // 'participantesFinales' ya es el array de objetos { uid, nombreParaMostrar }
      const nuevoGrupoData = {
        nombre: nombreGrupo.trim(),
        descripcion: descripcionGrupo.trim(),
        participantes: participantesFinales, // GUARDA EL ARRAY DE OBJETOS
        fechaCreacion: serverTimestamp(),
        creadorUid: usuarioAutenticado.uid, // UID del creador
      };

      console.log('Guardando en Firestore:', nuevoGrupoData);
      await addDoc(collection(db, "grupos"), nuevoGrupoData);
      Alert.alert("Éxito", `Grupo "${nombreGrupo.trim()}" creado correctamente.`);
      navigation.goBack();
    } catch (error) {
      console.error("Error al crear grupo en Firestore: ", error);
      Alert.alert("Error", "No se pudo crear el grupo. Inténtalo de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  }, [
    nombreGrupo,
    descripcionGrupo,
    participantesSeleccionados,
    navigation,
    usuarioAutenticado, // Solo para uid y asegurar inclusión
    // Ya no se necesita perfilUsuarioActual ni contactosDelTelefono aquí si el nombre del creador es "Tú"
  ]);

  // --- FILTRADO DE CONTACTOS DEL TELÉFONO ---
  const filteredContactsDelTelefono = useMemo(() => {
    if (!searchQuery) {
      return contactosDelTelefono;
    }
    return contactosDelTelefono.filter(contacto =>
      contacto.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [contactosDelTelefono, searchQuery]);

  // --- RENDERIZADO DE CADA CONTACTO DEL TELÉFONO ---
  const renderContactoItem = useCallback(({ item: contactoDelTelefono }) => {
    let estaVisualmenteSeleccionado = false;
    if (usuariosRegistrados.length > 0 && contactoDelTelefono.phoneNumber) {
        const numeroContactoLimpioVisual = normalizarNumeroSoloDigitos(contactoDelTelefono.phoneNumber);
        for (const usr of usuariosRegistrados) {
            const numeroRegistradoLimpioVisual = usr.numeroTelefono;
            if (numeroRegistradoLimpioVisual && (numeroRegistradoLimpioVisual.endsWith(numeroContactoLimpioVisual) || numeroContactoLimpioVisual.endsWith(numeroRegistradoLimpioVisual))) {
                if (Math.min(numeroRegistradoLimpioVisual.length, numeroContactoLimpioVisual.length) >= 7) {
                    if (participantesSeleccionados.some(p => p.uid === usr.uid)) {
                        estaVisualmenteSeleccionado = true;
                        break;
                    }
                }
            }
        }
    }
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
  }, [participantesSeleccionados, cargandoContactosTelefono, cargandoUsuarios, toggleParticipante, usuariosRegistrados]);

  // --- RENDERIZADO PRINCIPAL ---
  if (cargandoUsuarios || (permisoContactos === null && cargandoContactosTelefono)) {
    return (
      <View style={styles.contenedorCentrado}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.statusText}>
          {cargandoUsuarios ? "Cargando usuarios de la app..." :
           (permisoContactos === null ? "Solicitando permiso de contactos..." : "Cargando contactos del teléfono...")}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
        style={styles.scrollViewContainer}
        contentContainerStyle={styles.scrollViewContent}
        keyboardShouldPersistTaps="handled"
    >
      {permisoContactos === 'denied' && !cargandoContactosTelefono && (
          <View style={styles.contenedorCentradoPermisoDenegado}>
              <Text style={styles.placeholderText}>Permiso de contactos denegado.</Text>
              <Text style={styles.placeholderText}>No puedes seleccionar participantes desde tus contactos.</Text>
          </View>
      )}

      <View style={styles.mainContent}>
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

          <View style={styles.buttonContainer}>
              <Button
                title={isSubmitting ? "Creando..." : "Crear Grupo"}
                onPress={handleCrearGrupo}
                disabled={
                    !nombreGrupo.trim() ||
                    // participantesSeleccionados.length === 0 || // Ya no se necesita si el creador se añade siempre
                    isSubmitting ||
                    cargandoUsuarios ||
                    cargandoContactosTelefono
                }
              />
              {isSubmitting && <ActivityIndicator style={styles.indicadorBoton} size="small" color="#007bff" />}
          </View>

          {participantesSeleccionados.length > 0 && (
              <View style={styles.seleccionadosContainer}>
                <Text style={styles.seleccionadosLabel}>Participantes del Grupo ({participantesSeleccionados.length}):</Text>
                <View style={styles.seleccionadosWrapper}>
                  {participantesSeleccionados.map(p => (
                    <TouchableOpacity
                        key={p.uid}
                        onPress={() => {
                            setParticipantesSeleccionados(prev => prev.filter(sel => sel.uid !== p.uid));
                        }}
                        style={styles.participanteSeleccionado}
                    >
                      <Text style={styles.participanteTexto}>{p.nombreParaMostrar} (X)</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
          )}

          {permisoContactos === 'granted' && (
            <>
              <Text style={styles.label}>Buscar y Seleccionar Participantes de Contactos</Text>
              <TextInput
                  style={styles.input}
                  placeholder="Buscar contacto por nombre..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
              />
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
            </>
          )}
      </View>
    </ScrollView>
  );
}