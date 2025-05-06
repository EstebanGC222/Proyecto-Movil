import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import Grupos from '../Grupos'; 
import CrearGrupoScreen from './CrearGrupoScreen'; 
import DetalleGrupoScreen from './DetalleGrupoScreen';
import EditarGrupoScreen from './EditarGrupoScreen';

const Stack = createNativeStackNavigator();

export default function NavegacionGrupos() {
    return (
      <Stack.Navigator initialRouteName="ListaGrupos">
        <Stack.Screen
          name="ListaGrupos"
          component={Grupos}
          options={{ title: 'Mis Grupos' }}
        />
        <Stack.Screen
          name="CrearGrupo"
          component={CrearGrupoScreen}
          options={{
            title: 'Crear Nuevo Grupo',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
        name="DetalleGrupo" 
        component={DetalleGrupoScreen}
        options={{ title: 'Detalles del Grupo' }} 
        />
        <Stack.Screen
        name="EditarGrupo" 
        component={EditarGrupoScreen}
        options={{ title: 'Editar Grupo' }} 
        />
      </Stack.Navigator>
    );
  }