import React, { createContext, useState, useContext, useEffect } from 'react';
import { collection, getDocs, onSnapshot, query } from 'firebase/firestore';

import { db } from '../firebaseConfig'; // 

// 1. Crear el Context
const GruposContext = createContext();

// 2. Crear el Componente "Proveedor" 
// Este componente contendrá los datos y las funciones.
export const GruposProvider = ({ children }) => {
  // 3. Definir los "Estados" 
  //    a) La lista de grupos. Empieza como un array vacío.
  const [grupos, setGrupos] = useState([]);
  //    b) Un indicador para saber si estamos cargando los grupos desde Firebase. Empieza en 'false'.
  const [loading, setLoading] = useState(false); 


 
  
  // Función para escuchar los grupos en tiempo real
  useEffect(() => {
    setLoading(true); // Empezamos a cargar
    console.log("GruposContext: Iniciando escucha de grupos...");
  
    // Creamos una consulta a la colección 'grupos'
    const q = query(collection(db, "grupos")); // Podríamos añadir orderBy, where, etc. aquí
  
    // onSnapshot establece un "oyente" en tiempo real
    // Se ejecutará INMEDIATAMENTE con los datos actuales,
    // y luego OTRA VEZ cada vez que algo cambie en la colección 'grupos' en Firestore.
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      console.log("GruposContext: Datos recibidos/actualizados de Firestore.");
      const gruposLeidos = [];
      querySnapshot.forEach((doc) => {
        // Creamos un objeto por cada grupo, incluyendo su ID y sus datos internos
        gruposLeidos.push({ id: doc.id, ...doc.data() });
      });
      // Actualizamos el estado 'grupos' con la nueva lista leída
      setGrupos(gruposLeidos);
      setLoading(false); // Terminamos de cargar
    }, (error) => {
      // Manejo básico de errores si la escucha falla
      console.error("GruposContext: Error al escuchar grupos: ", error);
      setLoading(false); // Asegurarse de quitar el loading incluso si hay error
    });
  
    // Función de limpieza: Se ejecuta cuando el Provider se "desmonta"
    // Sirve para dejar de escuchar y evitar fugas de memoria.
    return () => {
      console.log("GruposContext: Dejando de escuchar grupos.");
      unsubscribe();
    };
  }, []); // El array vacío [] asegura que este useEffect se ejecute solo una vez (al montar el Provider)


  // 4. Definir qué "Valor" compartirá este Provider
  //    Le decimos qué información y funciones estarán disponibles.
  const value = {
    grupos,    // La lista actual de grupos
    loading,   // Si se están cargando o no
  };

  // 5. Retornar el Provider "Envolviendo" a sus Hijos
  //    Todo lo que esté dentro de <GruposProvider>...</GruposProvider> 
  //    tendrá acceso al 'value' que definimos arriba.
  //    'children' representa cualquier componente que pongas dentro del Provider.
  return (
    <GruposContext.Provider value={value}>
      {children}
    </GruposContext.Provider>
  );
};

// "Hook" personalizado para usar el Context fácilmente
// En lugar de importar 'useContext' y 'GruposContext' en cada componente,
// simplemente importarán y usarán 'useGrupos'.
export const useGrupos = () => {
  const context = useContext(GruposContext);
  if (context === undefined) {
    throw new Error('useGrupos debe ser usado dentro de un GruposProvider');
  }
  return context;
};