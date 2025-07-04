import React, { useState, useEffect, useRef } from 'react'; 
import {
    View,
    Text,
    ActivityIndicator,
    Alert,
    Button,
    ScrollView,
    TouchableOpacity,
    Modal,
    Image
} from 'react-native';
import { doc, onSnapshot, deleteDoc, addDoc, collection, increment, updateDoc, getDocs, writeBatch } from 'firebase/firestore'; // Añadir getDocs y writeBatch
import { db } from '../../firebaseConfig';
import { Ionicons } from '@expo/vector-icons';

import { GastosModal } from '../utils/gastos_rapidos';
import { styles } from './../styles'

import Constants from 'expo-constants';
import { useAuth } from './../../context/AuthContext';


const CloudName = Constants.expoConfig.Couldinary.CloudName;
const CloudPresets = Constants.expoConfig.Couldinary.CloudPresets;

// Función para subir imagen a Firebase Storage
async function subirImagenCloudinary(uri) {
    
    const data = new FormData();

    console.log("uri: ",uri);

    data.append('file', {
        uri,
        name: 'foto.jpg',
        type: 'image/jpeg',
    });

    data.append('upload_preset', CloudPresets);

    console.log("data: ",data);

    try {
        const res = await fetch(`https://api.cloudinary.com/v1_1/${CloudName}/image/upload`, {
            method: 'POST',
            body: data,
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        console.log("res: ",res);

        const result = await res.json();

        console.log("restultado: ",result);

        if (!res.ok) {
            throw new Error(result.error?.message || 'Error al subir la imagen');
        }

        return result.secure_url;
    } catch (error) {
        console.error("Error subiendo a Cloudinary:", error);
        throw error;
    }
}

export default function DetalleGrupoScreen({ route, navigation }) {

    const { usuarioAutenticado } = useAuth();
    
    console.log("name: ",CloudName);
    console.log("Preset actualizado es: ",CloudPresets);

    // --- Estados ---
    const [grupo, setGrupo] = useState(null); // Contendrá { id, nombre, descripcion, Cantidad, creadorUid, participantes: [{uid, nombreParaMostrar}] }
    const [loading, setLoading] = useState(true); // Carga general de la pantalla
    const [error, setError] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [mostrar_modal, setModal] = useState(false);
    const [gastos, setGasto] = useState('');
    const [totalGastos, setTotalGastos] = useState(0);

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

        const unsubscribeGrupo = onSnapshot(docRef, (docSnap) => {
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

        const gastosRef = collection(db, "grupos", grupoId, "gastos");
        const unsubscribeGasto = onSnapshot(gastosRef, async (snapshot) => {
            const gastosData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setGasto(gastosData);

            const total = gastosData.reduce((sum, gasto) => sum + (Number(gasto.cantidad) || 0), 0);
            setTotalGastos(total);

            try {
                const grupoRef = doc(db, "grupos", grupoId);
                await updateDoc(grupoRef, { Cantidad: total });
            } catch (error) {
                console.error("Error actualizando total del grupo:", error);
            }
        }, (err) => {
            console.error("Error al escuchar los gastos:", err);
        });

        return () => {
            isMountedRef.current = false;
            unsubscribeGrupo();
            unsubscribeGasto();
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
                        if (!isMountedRef.current) return;
                        setIsDeleting(true);
                        try {
                            const grupoRef = doc(db, "grupos", grupo.id);
                            const gastosRef = collection(db, "grupos", grupo.id, "gastos");

                            // 1. Obtener todos los documentos de la subcolección 'gastos'
                            const gastosSnapshot = await getDocs(gastosRef);
                            
                            // 2. Crear un batch para eliminar todos los gastos
                            const batch = writeBatch(db);
                            gastosSnapshot.forEach((gastoDoc) => {
                                batch.delete(gastoDoc.ref);
                            });
                            
                            // 3. Ejecutar el batch para eliminar los gastos
                            await batch.commit();
                            console.log(`DetalleGrupoScreen: Subcolección 'gastos' del grupo ${grupo.id} eliminada.`);

                            // 4. Eliminar el documento del grupo
                            await deleteDoc(grupoRef);
                            
                            Alert.alert("Éxito", "Grupo y todos sus gastos eliminados correctamente.");
                            navigation.goBack();

                        } catch (error) {
                            console.error("Error eliminando grupo y sus gastos:", error);
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

    const handleAgregarGasto = async (gastoData) => {
        try {
            console.log("datos del gasto", gastoData);
            let fotoURL = null;

            // Solo sube imagen si se proporcionó una
            if (gastoData.foto) {
                fotoURL = await subirImagenCloudinary(gastoData.foto);
            }

            const participantes = grupo.participantes.map(p => 
                typeof p === 'string' ? { uid: p, nombreParaMostrar: '' } : p
            );              
            
            const pagadoPor = usuarioAutenticado.uid;
            const cantidad = Number(gastoData.valor);
            const montoPorPersona = cantidad / participantes.length;

            console.log("Deudas:", deudas);


            const deudas = participantes
            .filter(uid => uid !== pagadoPor)
            .map(uid => ({
                deudor: uid,
                acreedor: pagadoPor,
                monto: montoPorPersona
            }));
    
            await addDoc(collection(db, 'grupos', grupo.id, 'gastos'), {
                nombre: gastoData.gasto,             // o descripcion
                cantidad: Number(gastoData.valor),   // asegúrate de que sea número
                fechaCreacion: new Date(),           // o gastoData.fecha si la eliges
                fotoURL: fotoURL || null,
                pagadoPor,
                participantes,
                deudas,
            });
    
            Alert.alert('Gasto agregado');
    
        } catch (err) {
            console.error("Error agregando gasto:", err);
            Alert.alert("Error", "No se pudo guardar el gasto.");
        }
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
        <ScrollView style={styles.scrollContenedor} contentContainerStyle={styles.scrollContent}>
            <View style={styles.grupoInfo}>
                <Text style={styles.titulo}>{grupo.nombre}</Text>
                {grupo.descripcion ? (<Text style={styles.descripcion}>{grupo.descripcion}</Text>) : (<Text style={styles.descripcion}>Sin descripción.</Text>)}

                <Text style={styles.label}>Total de gastos</Text>
                <Text style={styles.descripcion}>
                    {new Intl.NumberFormat('es-CO', {
                        style: 'currency',
                        currency: 'COP',
                        minimumFractionDigits: 0
                    }).format(totalGastos)}
                </Text>
            
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
            </View>

            <View style={styles.separador} />

            {/* Botones */}
            <View style={styles.botonesContainer}>
                <View style={styles.botonWrapper}><Button title="Editar Grupo" onPress={handleEditar} color="#007bff" disabled={isDeleting}/></View>
                <View style={styles.botonWrapper}><Button title={isDeleting ? "Eliminando..." : "Eliminar Grupo"} onPress={handleEliminar} color="#dc3545" disabled={isDeleting}/></View>
                {isDeleting && <ActivityIndicator size="small" color="#dc3545" style={{marginTop: 5, alignSelf: 'center'}}/>}
            </View>

            <View style={styles.separador} />

            <GastosModal visible={mostrar_modal} onClose={() => setModal(false)} onSubmit={handleAgregarGasto} participantes={grupo.participantes} usuarioAutenticado={usuarioAutenticado}/>
            
            <View style={styles.contenedorGastos}>
                <Text style={styles.label}>Gastos registrados: </Text>

                <TouchableOpacity style={styles.botonCircularDetalles} onPress={() => setModal(true)}>
                        <Ionicons name="add" size={20} color="#fff" />
                </TouchableOpacity>

                <View style={styles.separador} />

                {gastos.length > 0 ? (
                  gastos.map((gasto) => (
                    <View key={gasto.id} style={styles.gastoItem}>
                        <Text style={styles.descripcion}>
                            {gasto.nombre}
                        </Text>

                        <Text style={styles.descripcion}>
                            {new Intl.NumberFormat('es-CO', {
                            style: 'currency',
                            currency: 'COP',
                            minimumFractionDigits: 0
                            }).format(gasto.cantidad)}
                        </Text>

                        {gasto.fotoURL ? (
                        
                        <Image
                          source={{ uri: gasto.fotoURL }}
                          style={{ width: 50, height: 50, borderRadius: 5 }}
                        />
                        ) : null}

                        <View style={styles.separador} />

                    </View>
                  ))
                ) : (
                  <Text style={styles.noParticipantes}>Aún no se han registrado gastos.</Text>
                )}
            </View>

        </ScrollView>
    );
}
