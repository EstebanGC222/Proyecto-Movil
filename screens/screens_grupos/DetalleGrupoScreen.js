import React, { useState, useEffect, useRef } from 'react'; 
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
import { db } from '../../firebaseConfig'; 


export default function DetalleGrupoScreen({ route, navigation }) {
    // --- Estados ---
    const [grupo, setGrupo] = useState(null); // Contendrá { id, nombre, descripcion, Cantidad, creadorUid, participantes: [{uid, nombreParaMostrar}] }
    const [loading, setLoading] = useState(true); // Carga general de la pantalla
    const [error, setError] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);


    const { grupoId } = route.params || {};
    const isMountedRef = useRef(true);

    // --- EFECTO PRINCIPAL: ESCUCHAR CAMBIOS EN EL DOCUMENTO DEL GRUPO ---
    useEffect(() => {
        isMountedRef.current = true;
        if (!grupoId) {
            if (isMountedRef.current) {
                setError("No se especificó un ID de grupo.");
                setLoading(false);
            }
            return;
        }

        setLoading(true);
        setError(null);
        setGrupo(null); // Resetear grupo al cambiar de grupoId o al montar
        setIsDeleting(false);

        console.log(`DetalleGrupoScreen: Iniciando escucha para grupo ID: ${grupoId}`);
        const docRef = doc(db, "grupos", grupoId);

        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (!isMountedRef.current) {
                console.log("DetalleGrupoScreen: Snapshot recibido pero componente desmontado.");
                return;
            }
            if (docSnap.exists()) {
                const grupoData = { id: docSnap.id, ...docSnap.data() };
                console.log("DetalleGrupoScreen: Datos del grupo actualizados desde Firestore:", grupoData);
                setGrupo(grupoData); // Guardamos el grupo completo
                setError(null);
            } else {
                console.log("DetalleGrupoScreen: Grupo no encontrado por onSnapshot (quizás eliminado).");
                setGrupo(null);
                setError("Este grupo ya no existe o no fue encontrado.");
            }
            setLoading(false); // La carga principal termina aquí
        }, (err) => {
            if (!isMountedRef.current) return;
            console.error("DetalleGrupoScreen: Error en onSnapshot del grupo:", err);
            if (isMountedRef.current) {
                setError("Error al cargar los datos del grupo.");
                setGrupo(null);
                setLoading(false);
            }
        });

        return () => {
            isMountedRef.current = false;
            console.log("DetalleGrupoScreen: Dejando de escuchar grupo (cleanup).");
            unsubscribe();
        };
    }, [grupoId]); // Solo depende de grupoId


    // --- Funciones Handler para Botones (Lógica de Editar/Eliminar sin cambios) ---
    const handleEditar = () => {
        if (!grupo || isDeleting) return;
        navigation.navigate('EditarGrupo', { grupoId: grupo.id });
    };

    const handleEliminar = () => {
        if (!grupo || isDeleting) return;
        Alert.alert(
            "Confirmar Eliminación",
            `¿Estás seguro de que quieres eliminar el grupo "${grupo.nombre}"? Esta acción no se puede deshacer.`,
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Eliminar",
                    onPress: async () => {
                        setIsDeleting(true);
                        try {
                            const docRefToDelete = doc(db, "grupos", grupo.id);
                            await deleteDoc(docRefToDelete);
                            Alert.alert("Éxito", "Grupo eliminado correctamente.");
                            navigation.goBack();
                        } catch (error) {
                            console.error("Error eliminando grupo:", error);
                            Alert.alert("Error", "No se pudo eliminar el grupo. Inténtalo de nuevo.");
                            if(isMountedRef.current) setIsDeleting(false);
                        }
                    },
                    style: "destructive"
                }
            ],
            { cancelable: true }
        );
    };

    // --- Lógica de Renderizado ---
    if (loading) { // Simplificado: solo un estado de carga general
        return ( <View style={styles.centerContent}><ActivityIndicator size="large" color="#007bff" /><Text style={styles.loadingText}>Cargando detalles del grupo...</Text></View> );
    }

    if (error) { // Si hay error (y por ende, grupo podría ser null o no confiable)
        return ( <View style={styles.centerContent}><Text style={styles.errorText}>{error}</Text><Button title="Volver a la lista" onPress={() => navigation.goBack()} /></View> );
    }

    if (!grupo) { // Si no está cargando, no hay error, pero grupo es null
        return ( <View style={styles.centerContent}><Text style={styles.errorText}>Este grupo no pudo ser cargado o ya no existe.</Text><Button title="Volver a la lista" onPress={() => navigation.goBack()} /></View> );
    }

    // --- Renderizado de Detalles del Grupo ---
    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
            <Text style={styles.titulo}>{grupo.nombre}</Text>
            {grupo.descripcion ? (<Text style={styles.descripcion}>{grupo.descripcion}</Text>) : (<Text style={styles.descripcion}>Sin descripción.</Text>)}

            {/* Mostrar Cantidad (sin cambios en esta parte) */}
            {typeof grupo.Cantidad === 'number' ? (
                <>
                    <Text style={styles.label}>Valor ingresado</Text>
                    <Text style={styles.descripcion}>
                        {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(grupo.Cantidad)}
                    </Text>
                </>
            ) : (
                 grupo.Cantidad !== undefined && grupo.Cantidad !== null ?
                    <Text style={styles.descripcion}>Valor: {String(grupo.Cantidad)} (Formato no numérico)</Text> :
                    <Text style={styles.descripcion}>Cantidad no especificada.</Text>
            )}

            <View style={styles.separador} />

            {/* Mostrar Participantes directamente desde grupo.participantes */}
            <Text style={styles.label}>Participantes ({grupo.participantes?.length || 0}):</Text>
            {grupo.participantes && grupo.participantes.length > 0 ? (
                <View style={styles.participantesContainer}>
                    {/* Ahora grupo.participantes es [{ uid, nombreParaMostrar }] */}
                    {grupo.participantes.map((participante) => (
                        <Text key={participante.uid} style={styles.participanteItem}>
                            {participante.nombreParaMostrar || `Usuario (ID: ${participante.uid.substring(0,5)}...)`}
                        </Text>
                    ))}
                </View>
            ) : (
                 <Text style={styles.noParticipantes}>No hay participantes asignados a este grupo.</Text>
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
        flexGrow: 1, 
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
        justifyContent: 'flex-start',
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
        overflow: 'hidden',
    },
    noParticipantes: {
        fontStyle: 'italic',
        color: '#6c757d',
        paddingHorizontal: 20,
        marginBottom: 20,
        textAlign: 'left',
    },
    botonesContainer: {
        paddingHorizontal: 20,
        paddingTop: 15,
        paddingBottom: 20,
    },
    botonWrapper: {
        marginBottom: 15,
    },
});