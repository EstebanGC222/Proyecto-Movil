import react from "react";
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  contenedorPrincipal: {
    flex: 1, // Ocupa todo el espacio disponible
    padding: 15,
    backgroundColor: '#f8f9fa', // Un fondo claro
  },
  contenedorCentrado: {
    flex: 1, // Ocupa todo el espacio
    justifyContent: 'center', // Centra verticalmente
    alignItems: 'center', // Centra horizontalmente
  },
  titulo: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#343a40',
  },
  textoVacio: {
    fontSize: 16,
    color: '#6c757d', // Un gris suave
    textAlign: 'center',
    marginBottom: 5,
  },
  lista: {
    flex: 1, // Permite que la lista ocupe el espacio restante
  },
  itemContainer: {
    backgroundColor: '#ffffff', // Fondo blanco para cada item
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dee2e6', // Un borde sutil
    shadowColor: "#000", // Sombra (opcional, para iOS)
    shadowOffset: {
        width: 0,
        height: 1,
    },
    shadowOpacity: 0.20,
    shadowRadius: 1.41,
    elevation: 2, // Sombra (opcional, para Android)
  },
  itemNombre: {
    fontSize: 18,
    fontWeight: '600', // Semi-bold
    color: '#495057',
  },
  itemDescripcion: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 4,
  },
  // Estilos para el botón flotante (descomentar si lo añades)
  
  botonFlotante: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: '#007bff',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  botonFlotanteTexto: {
    color: 'white',
    fontSize: 30,
    lineHeight: 30, // Ajuste para centrar el '+'
  },
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  contenedorCentrado: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    textAlign: 'center',
  },
  errorText: {
    textAlign: 'center',
    color: 'red',
    marginBottom: 10,
  },
  titulo: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingVertical: 20,
    color: '#343a40',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    marginBottom: 10,
  },
  seccion: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginHorizontal: 15,
    borderRadius: 8,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1, },
    shadowOpacity: 0.18,
    shadowRadius: 1.00,
    elevation: 1,
    marginTop: 20,
  },
  seccionEspaciada: {
    marginHorizontal: 15,
    marginTop: 20,
  },
  label: {
    fontSize: 16,
    color: '#495057',
    marginBottom: 8,
    fontWeight: '500',
  },
  subLabel: {
      fontSize: 13,
      color: '#6c757d',
      marginBottom: 10,
      fontStyle: 'italic',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 5,
    padding: 12,
    fontSize: 16,
    marginBottom: 15,
    backgroundColor: '#fff',
  },
  indicadorGuardado: {
      marginTop: 10,
      alignSelf: 'center',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contenedor: {
    flex: 1,
    padding: 20,
  },
  titulo: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    alignSelf: 'center',
    marginTop: 50,
  },
  resumenValores: {
    marginBottom: 30,
  },
  filaValor: {
    flexDirection: 'row',
    marginBottom: 10,
    justifyContent: 'center',
  },
  etiqueta: {
    fontSize: 18,
    fontWeight: '500',
  },
  valor: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  seccionesParalelas: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  seccionBoton: {
    padding: 10,
    backgroundColor: '#007bff',
    borderRadius: 5,
    width: '45%',
    alignItems: 'center',
  },
  seccionTexto: {
    color: '#fff',
    fontSize: 16,
  },
    botonCircularL: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    backgroundColor: '#007bff',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    left:300
  },
  botonCircularR: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    backgroundColor: '#007bff',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    right:200
  },
  contenedor: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titulo: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  contenedor: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titulo: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
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
  botonCircular: {
      backgroundColor: 'blue',
  },
  kavContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  titulo: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#343a40',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  spinner: {
    marginVertical: 10, 
    height: 40,
    alignSelf: 'center',
  },
  enlace: {
    marginTop: 20,
    color: '#007bff',
    textAlign: 'center',
    fontSize: 16,
  },
  enlaceDeshabilitado: {
    color: 'grey'
  },
});

console.log("estoy en style: ", styles);
