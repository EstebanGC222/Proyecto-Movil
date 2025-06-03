import { initializeApp } from 'firebase/app'; // Herramienta para establecer la conexión inicial
import { getFirestore } from 'firebase/firestore'; // Herramienta para obtener acceso a la base de datos Firestore
import { getStorage } from 'firebase/storage';

import Constants from 'expo-constants';

ApiKey = Constants.expoConfig.Env.ApiKey;

const firebaseConfig = {
    apiKey: ApiKey,
    authDomain: "proyecto-movil-86702.firebaseapp.com",
    projectId: "proyecto-movil-86702",
    storageBucket: "proyecto-movil-86702.firebasestorage.app",
    messagingSenderId: "357169372263",
    appId: "1:357169372263:web:c9846532f98477306d88c2",
    measurementId: "G-9BW4QYCLVQ"
  };

// (Inicializar la app Firebase)
// Esta línea usa las claves para decirle a Firebase: "Hola, soy yo, la app 'MiAppExpoCliente'"
const app = initializeApp(firebaseConfig);

// (Inicializar Firestore)
// Esto nos da un objeto 'db' que usaremos siempre que queramos leer o escribir en Firestore.
const db = getFirestore(app);
const storage = getStorage(app);

// Hacer que 'db' esté disponible para otras partes de tu app
export { db, storage };