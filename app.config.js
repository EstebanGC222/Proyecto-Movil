import 'dotenv/config';

export default {
  "expo": {
    "name": "Proyecto_React",
    "slug": "Proyecto_React",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "newArchEnabled": true,
    "splash": {
      "image": "./assets/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "ios": {
      "supportsTablet": true
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      }
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "Env":{
      ApiKey: process.env.API_KEY
    },
    "Couldinary":{
      CloudName:process.env.CLOUD_NAME,
      /* CloudPreset:process.env.UPLOAD_PRESET, */
      CloudPresets:process.env.CLOUD_PRESET,
    }
  }
}