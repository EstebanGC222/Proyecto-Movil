# Gestor de Gastos Compartidos "Cuentas Claras" 🧮💸

[![Estado del Proyecto](https://img.shields.io/badge/Estado-En%20Desarrollo-red)]() 
[![Lenguaje](https://img.shields.io/badge/Lenguaje-JavaScript-orange.svg)](https://developer.mozilla.org/es/docs/Web/JavaScript)
[![Framework](https://img.shields.io/badge/Framework-React%20Native-blue.svg)](https://reactnative.dev/)
[![Base de Datos](https://img.shields.io/badge/Bases%20De%20Datos-Firebase-lightgrey.svg)](https://firebase.google.com/?hl=es-419)

**Cuentas Claras** es una aplicación móvil desarrollada con React Native y Expo, diseñada para simplificar la gestión de gastos entre amigos, compañeros de piso, o en cualquier situación donde se compartan costos. Olvídate de las complicadas hojas de cálculo y las discusiones sobre quién debe cuánto; nuestra app lo hace por ti.


## 🌟 Visión General

En un mundo donde las experiencias compartidas son cada vez más valiosas, la gestión de los gastos comunes puede volverse una tarea tediosa y, a veces, conflictiva. Cuentas Claras nace con la misión de simplificar este proceso, proporcionando una plataforma centralizada donde los usuarios pueden registrar gastos, asignar participantes, y visualizar de forma instantánea quién debe qué a quién, facilitando una liquidación justa y oportuna.

## ✨ Características Principales Detalladas

La aplicación se estructura en torno a un conjunto de características intuitivas diseñadas para cubrir todas las facetas de la gestión de gastos en grupo:

1.  **Autenticación Segura y Gestión de Perfil Personalizado:**
    *   **Registro e Inicio de Sesión por Email/Contraseña:** Un sistema de autenticación estándar y seguro.
    *   **Gestión de Número de Teléfono (Opcional):** Los usuarios pueden añadir su número a su perfil, facilitando la adición a grupos mediante la lista de contactos del creador.
    *   **Pantalla de Configuración:** Espacio para gestionar el número de teléfono y cerrar sesión.

2.  **Gestión Avanzada y Flexible de Grupos:**
    *   **Creación Intuitiva:** Especifica nombre y descripción opcional.
    *   **Adición Inteligente de Participantes:** Selección desde contactos del teléfono con búsqueda de usuarios registrados en Cuentas Claras. El creador se identifica como **"Tú"**.
    *   **Visualización Filtrada:** Cada usuario ve solo los grupos en los que participa.
    *   **Edición Completa:** Modifica detalles y participantes del grupo.
    *   **Eliminación Segura:** Con confirmación previa.

3.  **Registro Detallado de Gastos dentro de Grupos:**
    *   **Formulario Específico por Grupo:** Añade gastos desde la pantalla de detalles del grupo.
    *   **Campos del Gasto:**
        *   Descripción del gasto.
        *   Monto total.
        *   *Pagado Por:* Se asume que es el usuario registrador por defecto.
        *   *Participantes del Gasto:* Selección de un subconjunto de miembros del grupo.
        *   *División Equitativa:* Por defecto, los gastos se dividen por igual entre los seleccionados.
        *   *Foto de Factura (Opcional):* Captura o selección desde galería, almacenada en Cloudinary.
    *   **Listado de Gastos por Grupo:** Visible en la pantalla de detalles del grupo.

4.  **Cálculo Automático y Transparente de Saldos (Funcionalidad Clave):**
    *   **Pantalla de Resumen Personalizada:**
        *   Dashboard con "Te Deben", "Debes", y "Balance General" actualizados dinámicamente.
        *   Cálculos basados en todos los gastos de los grupos del usuario.

5.  **Liquidación de Deudas y Seguimiento (Funcionalidad Clave - En Desarrollo):**
    *   **Pantalla "Lista de D/A" (Deudores/Acreedores):** Desglose de saldos pendientes con otros usuarios.
    *   **Saldar Cuentas:** Funcionalidad para registrar pagos y liquidar deudas.

6.  **Historial de Movimientos (Funcionalidad Clave):**
    *   **Pantalla "Movimientos":** Listado cronológico de todas las transacciones relevantes.

## 🛠️ Tecnologías y Arquitectura Utilizadas

*   **Framework:** React Native (con Expo)
*   **Backend (BaaS):** Firebase
    *   **Autenticación:** Firebase Authentication (Email/Contraseña)
    *   **Base de Datos:** Firestore Database (NoSQL, en tiempo real)
        *   *Colecciones Principales:* `usuarios`, `grupos` (con subcolección `gastos`).
*   **Almacenamiento de Imágenes:** Cloudinary
*   **Lenguaje:** JavaScript (ES6+)
*   **Gestión de Estado:**
    *   React Hooks (`useState`, `useEffect`, `useContext`, `useCallback`, `useMemo`, `useRef`)
    *   React Context API (`AuthContext`, `GruposContext`)
*   **Navegación:** React Navigation (Tab Navigator, Stack Navigators)
*   **Expo SDKs:**
    *   `expo-contacts`
    *   `expo-camera`
    *   `expo-media-library` (Opcional, para guardar/leer de galería)
    *   `expo-constants`
    *   `expo-notifications` (Para notificaciones locales)

## 💡 Flujos de Usuario Clave Implementados

*   **Autenticación:** Registro, Inicio de sesión, Cierre de sesión.
*   **Gestión de Perfil:** Actualización del número de teléfono.
*   **Gestión de Grupos:** Crear, Ver lista (filtrada), Ver detalles, Editar, Eliminar.
*   **Registro de Gastos:** Añadir gasto a un grupo (con detalles, participantes, foto). Visualizar gastos de un grupo.

## 🚀 Próximos Pasos y Mejoras Futuras

*   **Implementación del Gasto Rápido Global:** Desde la pantalla de Resumen.
*   **Funcionalidad Completa de Liquidación de Deudas.**
*   **Divisiones de Gastos Personalizadas:** Porcentajes, montos fijos, etc.
*   **Optimización de Consultas a Firestore:** Especialmente para el cálculo de saldos en aplicaciones con gran volumen de datos.
*   **Mejoras UI/UX:** Refinamiento continuo, animaciones.
*   **Pruebas:** Unitarias y de integración.

---

