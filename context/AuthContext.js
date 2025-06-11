import React, { createContext, useState, useEffect, useContext } from 'react';
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { app, db } from '../firebaseConfig'; 
import { ActivityIndicator, Alert } from 'react-native'; // Alert para updateUserPhoneNumber

const auth = getAuth(app);
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [usuarioAutenticado, setUsuarioAutenticado] = useState(null);
  const [perfilUsuarioActual, setPerfilUsuarioActual] = useState(null);
  const [cargandoAutenticacion, setCargandoAutenticacion] = useState(true); 
  const [cargandoPerfil, setCargandoPerfil] = useState(false);

  const obtenerPerfilUsuario = async (objetoUsuarioAuth) => {
    // código de obtenerPerfilUsuario 
    if (!objetoUsuarioAuth) {
        setPerfilUsuarioActual(null);
        return;
    }
    // Solo activa cargandoPerfil si no estamos ya en la carga inicial de autenticación
    // para evitar doble spinner si el perfil se carga rápido.
    if (!cargandoAutenticacion) setCargandoPerfil(true);

    console.log("AuthContext: Buscando perfil para UID:", objetoUsuarioAuth.uid);
    const referenciaDocumentoUsuario = doc(db, "usuarios", objetoUsuarioAuth.uid);
    try {
        const docSnapshot = await getDoc(referenciaDocumentoUsuario);
        if (docSnapshot.exists()) {
            console.log("AuthContext: Perfil encontrado:", docSnapshot.data());
            setPerfilUsuarioActual({ uid: objetoUsuarioAuth.uid, ...docSnapshot.data() });
        } else {
            console.warn("AuthContext: No se encontró perfil en Firestore para UID:", objetoUsuarioAuth.uid);
            setPerfilUsuarioActual({
                uid: objetoUsuarioAuth.uid,
                email: objetoUsuarioAuth.email,
                numeroTelefono: null
            });
        }
    } catch (error) {
        console.error("AuthContext: Error al obtener perfil de usuario:", error);
        setPerfilUsuarioActual(null);
    } finally {
        // Solo desactiva cargandoPerfil si se activó en esta función
        if (!cargandoAutenticacion) setCargandoPerfil(false);
    }
  };

  useEffect(() => {
    const desuscribir = onAuthStateChanged(auth, async (usuarioFirebase) => {
      console.log("AuthContext: Estado de autenticación cambiado, UID Firebase:", usuarioFirebase ? usuarioFirebase.uid : null);
      if (usuarioFirebase) {
        setUsuarioAutenticado({
          uid: usuarioFirebase.uid,
          email: usuarioFirebase.email,
        });
        await obtenerPerfilUsuario(usuarioFirebase);
      } else {
        setUsuarioAutenticado(null);
        setPerfilUsuarioActual(null);
      }
      // Este es el punto principal donde la carga inicial de autenticación termina
      setCargandoAutenticacion(false);
    });
    return () => desuscribir();
  }, []);

  const registrarConCorreo = async (email, password) => {
    // La pantalla de Registro manejará su propio estado de "cargando registro"
    try {
      const credencialUsuario = await createUserWithEmailAndPassword(auth, email, password);
      const usuarioFirebase = credencialUsuario.user;
      console.log("AuthContext: Usuario registrado en Firebase Auth:", usuarioFirebase.uid);

      const referenciaDocumentoUsuario = doc(db, "usuarios", usuarioFirebase.uid);
      await setDoc(referenciaDocumentoUsuario, {
        uid: usuarioFirebase.uid,
        email: usuarioFirebase.email,
        numeroTelefono: null,
        fechaCreacion: serverTimestamp()
      });
      console.log("AuthContext: Documento de usuario creado en Firestore.");
      // onAuthStateChanged hará el resto
      return { exito: true, usuario: usuarioFirebase };
    } catch (error) {
      console.error("AuthContext: Error en registrarConCorreo:", error);
      return { exito: false, error: error.message };
    }
  };

  const iniciarSesionConCorreo = async (email, password) => {
    // La pantalla de Login manejará su propio estado de "cargando login"
    try {
      const credencialUsuario = await signInWithEmailAndPassword(auth, email, password);
      console.log("AuthContext: Usuario inició sesión:", credencialUsuario.user.uid);

      

      // onAuthStateChanged hará el resto
      return { exito: true, usuario: credencialUsuario.user };
    } catch (error) {
      console.error("AuthContext: Error en iniciarSesionConCorreo:", error.code, error.message);
      return { exito: false, error: error.message };
    }
  };

  const cerrarSesion = async () => {
    try {
      await signOut(auth);
      console.log("AuthContext: Sesión cerrada.");
      // onAuthStateChanged hará el resto
    } catch (error) {
      console.error("AuthContext: Error en cerrarSesion:", error);
    }
  };

  const actualizarNumeroTelefonoUsuario = async (uidUsuario, numeroInput) => {
    // ... (código igual que antes, pero maneja su propio 'setCargandoPerfil' si es necesario
    // o la pantalla de Configuración maneja su propio 'guardandoNumero')
    if (!uidUsuario) {
        console.error("AuthContext: UID no proporcionado para actualizar teléfono.");
        return { exito: false, error: "Usuario no identificado." };
      }
      const normalizarNumero = (cadenaNumero) => {
        if (!cadenaNumero || typeof cadenaNumero !== 'string') return '';
        return cadenaNumero.replace(/\D/g, '');
      };
      const numeroNormalizado = normalizarNumero(numeroInput);
      if (!numeroNormalizado || numeroNormalizado.length < 7) {
        Alert.alert("Número Inválido", "Por favor, ingresa un número de teléfono válido (solo dígitos).");
        return { exito: false, error: "Número inválido." };
      }

      // La pantalla de Configuración manejará su estado "guardandoNumero"
      // setCargandoPerfil(true); // Opcional, si quieres un indicador global de perfil actualizándose
      const referenciaDocumentoUsuario = doc(db, "usuarios", uidUsuario);
      try {
        await updateDoc(referenciaDocumentoUsuario, {
          numeroTelefono: numeroNormalizado
        });
        console.log("AuthContext: Número de teléfono actualizado en Firestore.");
        setPerfilUsuarioActual(perfilPrevio => ({
            ...perfilPrevio,
            numeroTelefono: numeroNormalizado
        }));
        Alert.alert("Éxito", "Número de teléfono guardado.");
        return { exito: true };
      } catch (error) {
        console.error("AuthContext: Error al actualizar número de teléfono:", error);
        Alert.alert("Error", "No se pudo guardar el número. Intenta de nuevo.");
        return { exito: false, error: error.message };
      } finally {
        // setCargandoPerfil(false);
      }
  };

  const valorDelContexto = {
    usuarioAutenticado,
    perfilUsuarioActual,
    cargandoAutenticacion, // Principalmente para la carga inicial de la app
    cargandoPerfil,       // Para cuando se carga el perfil específicamente (puede ser redundante con la pantalla)
    registrarConCorreo,
    iniciarSesionConCorreo,
    cerrarSesion,
    actualizarNumeroTelefonoUsuario,
  };

  return (
    <AuthContext.Provider value={valorDelContexto}>
      {!cargandoAutenticacion ? children : <ActivityIndicator style={{flex: 1, justifyContent: 'center', alignItems: 'center'}} size="large" color="#007bff" />}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const contexto = useContext(AuthContext);
  if (contexto === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return contexto;
};