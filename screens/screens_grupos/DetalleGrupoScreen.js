import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    Alert,
    Button,
    ScrollView
} from 'react-native';
import { doc, onSnapshot, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig'; // Ajusta la ruta
import * as Contacts from 'expo-contacts';

export default function DetalleGrupoScreen({ route, navigation }) {
    // --- Estados ---
    const [grupo, setGrupo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [permisoContactos, setPermisoContactos] = useState(null);
    const [participantesInfo, setParticipantesInfo] = useState([]);
    const [loadingParticipantes, setLoadingParticipantes] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const [Cantidad, setCantidad] = useState(0);

    const { grupoId } = route.params || {};
    const unsubscribeRef = useRef(null);
    const isMountedRef = useRef(true);
    const isLoadingNames = useRef(false);

    // --- Función para Cargar Nombres (Definida como función normal async) ---
    
    const cargarNombresParticipantes = async (participanteIds) => {
        // Evita ejecuciones concurrentes y post-desmontaje
        if (isLoadingNames.current || !isMountedRef.current) return;
        isLoadingNames.current = true;
        // Solo activamos el loading de participantes si no estamos ya en loading general
        if (!loading) setLoadingParticipantes(true);
        console.log("DetalleGrupoScreen: Iniciando carga de nombres...");

        let currentStatus = permisoContactos;
        if (currentStatus === null) {
            console.log("DetalleGrupoScreen: Verificando/Pidiendo permiso...");
            const { status } = await Contacts.requestPermissionsAsync();
            // Actualizar estado si sigue montado
            if (isMountedRef.current) setPermisoContactos(status);
            currentStatus = status;
        }

        let infoMapeada = [];
        if (currentStatus === 'granted') {
            console.log("DetalleGrupoScreen: Permiso concedido, buscando...");
            try {
                const promises = participanteIds.map(id => Contacts.getContactByIdAsync(id, [Contacts.Fields.Name]));
                const results = await Promise.all(promises);
                infoMapeada = results.map((contact, index) => ({
                    id: participanteIds[index],
                    name: contact?.name || `(ID: ${participanteIds[index]} - No encontrado)`
                })).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
            } catch (err) {
                console.error("Error buscando nombres:", err);
                if (isMountedRef.current) setError("Error al cargar nombres.");
                infoMapeada = participanteIds.map(id => ({ id, name: `(ID: ${id})` }));
            }
        } else {
            console.log("DetalleGrupoScreen: Permiso denegado, usando fallback.");
            infoMapeada = participanteIds.map(id => ({ id, name: `(ID: ${id})` }));
        }

        if (isMountedRef.current) {
            console.log("DetalleGrupoScreen: Nombres cargados, actualizando estado.");
            setParticipantesInfo(infoMapeada);
            setLoadingParticipantes(false); // Termina carga de nombres
            setLoading(false); // Termina carga general AHORA
        }
        isLoadingNames.current = false;
    };

    // --- Efecto Principal: Escuchar Grupo (Dependencia SOLO en grupoId) ---
    useEffect(() => {
        isMountedRef.current = true; // Marcar como montado al inicio
        if (!grupoId) {
            if (isMountedRef.current) { setError("No se especificó un ID de grupo."); setLoading(false); }
            return;
        }

        // Resetear estados importantes al inicio o si cambia grupoId
        setLoading(true); setError(null); setGrupo(null); setParticipantesInfo([]);
        setPermisoContactos(null); setIsDeleting(false); isLoadingNames.current = false;
        console.log(`DetalleGrupoScreen: useEffect Montando/Escuchando grupo ID: ${grupoId}`);

        const docRef = doc(db, "grupos", grupoId);
        Cantidad
        Cantidad
        Cantidad
        unsubscribeRef.current = onSnapshot(docRef, (docSnap) => {
            if (!isMountedRef.current) {
                 console.log("DetalleGrupoScreen: Recibido snapshot pero desmontado.");
                 return;
            }
            console.log("DetalleGrupoScreen: Recibido snapshot.");

            if (docSnap.exists()) {
                const grupoData = { id: docSnap.id, ...docSnap.data() };
                const participantesNuevos = grupoData.participantes || [];

                console.log("DetalleGrupoScreen: Grupo recibido:", grupoData);

                // Compara con el estado ACTUAL usando una función en setGrupo
                setGrupo(currentGrupo => {
                    const participantesActuales = currentGrupo?.participantes || [];
                    const necesitaCargarNombres = !currentGrupo || JSON.stringify(participantesActuales) !== JSON.stringify(participantesNuevos);

                    if (necesitaCargarNombres) {
                        console.log("DetalleGrupoScreen: Participantes cambiaron o primera carga.");
                         if (participantesNuevos.length > 0) {
                            // Llama a la función (la versión más reciente estará en scope)
                            cargarNombresParticipantes(participantesNuevos);
                        } else {
                            setParticipantesInfo([]);
                            // Termina loading general si no hay participantes y no se está cargando nada más
                            if(!loadingParticipantes) setLoading(false);
                            setLoadingParticipantes(false);
                        }
                    } else {
                        console.log("DetalleGrupoScreen: Participantes no cambiaron.");
                        // Si no necesita cargar nombres, asegurarse que loading general se quite
                        if (!loadingParticipantes && loading) setLoading(false);
                    }

                    console.log("DetalleGrupoScreen" + grupoData);

                     // Siempre actualizar el grupo con los últimos datos del snapshot
                    return grupoData;
                });
                 // Limpiar error si el documento existe ahora (fuera del setter)
                 if(error) setError(null);

            } else {
                console.log("DetalleGrupoScreen: Snapshot indica que grupo ya no existe.");
                setGrupo(null); setParticipantesInfo([]); setLoading(false); setLoadingParticipantes(false);
                setError("Este grupo ya no existe.");
            }
        }, (err) => {
            if (!isMountedRef.current) return;
            console.error("Error en onSnapshot:", err);
            setError("Error al cargar los datos del grupo."); setGrupo(null); setParticipantesInfo([]);
            setLoading(false); setLoadingParticipantes(false);
        });

        // Función de limpieza
        return () => {
            isMountedRef.current = false; // Marcar como desmontado
            if (unsubscribeRef.current) {
                console.log("DetalleGrupoScreen: Dejando de escuchar (cleanup).");
                unsubscribeRef.current();
                unsubscribeRef.current = null;
            }
        };
    // Dependencia ÚNICA Y ESTABLE: grupoId
    }, [grupoId]);


    // --- Funciones Handler para Botones (Sin cambios) ---
    const handleEditar = () => { if (!grupo || isDeleting) return; navigation.navigate('EditarGrupo', { grupoId: grupo.id }); };
    const handleEliminar = () => { /* ... (lógica igual que antes, con unsubscribeRef.current()) ... */
        if (!grupo || isDeleting) return;
        Alert.alert( "Confirmar Eliminación", `¿Seguro...?`, [
            { text: "Cancelar", style: "cancel" },
            { text: "Eliminar", onPress: async () => {
                setIsDeleting(true);
                try {
                    if (unsubscribeRef.current) { unsubscribeRef.current(); unsubscribeRef.current = null; }
                    const docRef = doc(db, "grupos", grupo.id);
                    await deleteDoc(docRef);
                    Alert.alert("Éxito", "Grupo Eliminado.");
                    navigation.goBack();
                } catch (error) { console.error("Error eliminando:", error); Alert.alert("Error", "No se pudo eliminar."); setIsDeleting(false); }
               }, style: "destructive"
            }
        ], { cancelable: true });
    };


    // --- Lógica de Renderizado  ---

    if (loading && !error) { // Muestra loading si está activo Y no hay error aún
        return ( <View style={[styles.container, styles.centerContent]}><ActivityIndicator size="large" color="#007bff" /><Text style={styles.loadingText}>Cargando...</Text></View> );
    }

    if (error && !grupo) { // Si hay error Y no se pudo cargar el grupo
        return ( <View style={[styles.container, styles.centerContent]}><Text style={styles.errorText}>Error: {error}</Text><Button title="Volver" onPress={() => navigation.goBack()} /></View> );
    }

    if (!grupo && !loading) { // Si no está cargando Y grupo es null (eliminado o no encontrado)
        return ( <View style={[styles.container, styles.centerContent]}><Text style={styles.errorText}>{error || "Este grupo ya no existe."}</Text><Button title="Volver" onPress={() => navigation.goBack()} /></View> );
    }

    // Fallback por si grupo es null inesperadamente
    if (!grupo) {
        return <View style={[styles.container, styles.centerContent]}><Text>Grupo no disponible.</Text></View>;
    }

    // --- Renderizado de Detalles ---
    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
            <Text style={styles.titulo}>{grupo.nombre}</Text>
            {grupo.descripcion ? (<Text style={styles.descripcion}>{grupo.descripcion}</Text>) : (<Text style={styles.descripcion}>Sin descripción.</Text>)}
            
            <Text style={styles.label}>Valor ingresado</Text>
            
            <Text style={styles.descripcion}>
                {new Intl.NumberFormat().format(grupo.Cantidad)}
            </Text>

            <View style={styles.separador} />

            <Text style={styles.label}>Participantes:</Text>
            {loadingParticipantes ? ( <View style={styles.loadingParticipantesContainer}><ActivityIndicator size="small" color="#007bff" /><Text style={styles.loadingText}> Cargando nombres...</Text></View> )
             : participantesInfo.length > 0 ? (
                 <View style={styles.participantesContainer}>
                   {participantesInfo.map((p) => ( <Text key={p.id} style={styles.participanteItem}>{p.name}</Text> ))}
                   {permisoContactos === 'denied' && (<Text style={styles.permisoInfo}>(Permiso denegado, mostrando IDs)</Text>)}
                   {error && permisoContactos === 'granted' && participantesInfo.every(p=>p.name.includes('ID:')) && (<Text style={[styles.permisoInfo, styles.errorColor]}>(Error al cargar nombres)</Text>)}
                 </View>
               )
             : (<Text style={styles.noParticipantes}>{grupo.participantes?.length > 0 ? 'No se pudieron cargar.' : 'No hay participantes.'}</Text>
                )}

            <View style={styles.separador} />

            {/* Botones */}
            <View style={styles.botonesContainer}>
                <View style={styles.botonWrapper}><Button title="Editar Grupo" onPress={handleEditar} color="#007bff" disabled={isDeleting}/></View>
                <View style={styles.botonWrapper}><Button title={isDeleting ? "Eliminando..." : "Eliminar Grupo"} onPress={handleEliminar} color="#dc3545" disabled={isDeleting}/></View>
                {isDeleting && <ActivityIndicator size="small" color="#dc3545" style={{marginTop: 5, alignSelf: 'center'}}/>}
            </View>
        </ScrollView>
    );
}

// --- Estilos ---
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scrollContent: {
        paddingBottom: 30,
        flexGrow: 1, // Importante para centrar contenido si es corto
    },
    centerContent: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#6c757d',
        marginLeft: 5,
    },
    errorText: {
        fontSize: 16,
        color: 'red',
        textAlign: 'center',
        marginBottom: 15,
    },
    titulo: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 15,
        paddingHorizontal: 20,
        paddingTop: 20,
        color: '#343a40',
    },
    descripcion: {
        fontSize: 16,
        marginBottom: 20,
        paddingHorizontal: 20,
        color: '#495057',
        lineHeight: 22,
    },
    separador: {
        height: 1,
        backgroundColor: '#e0e0e0',
        marginVertical: 15,
        marginHorizontal: 20,
    },
    label: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 10,
        paddingHorizontal: 20,
        color: '#343a40',
    },
    loadingParticipantesContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
        marginBottom: 10,
        minHeight: 40,
    },
    participantesContainer: {
        paddingHorizontal: 20,
        marginBottom: 10,
    },
    participanteItem: {
        fontSize: 16,
        backgroundColor: '#f8f9fa',
        paddingVertical: 10,
        paddingHorizontal: 15,
        marginBottom: 8,
        borderRadius: 6,
        color: '#343a40',
        overflow: 'hidden', // Para asegurar bordes redondeados
    },
    noParticipantes: {
        fontStyle: 'italic',
        color: '#6c757d',
        paddingHorizontal: 20,
        marginBottom: 20,
        textAlign: 'center', // Centrar si no hay participantes
    },
    permisoInfo: {
        fontStyle: 'italic',
        fontSize: 13,
        color: '#6c757d',
        paddingHorizontal: 20,
        marginTop: 10,
        textAlign: 'center',
    },
    errorColor: { // Para resaltar errores específicos de nombres
        color: 'orange',
    },
    botonesContainer: {
        paddingHorizontal: 20,
        paddingTop: 15,
        paddingBottom: 20,
    },
    botonWrapper: {
        marginBottom: 15, // Espacio entre botones si están en columna
    },
});