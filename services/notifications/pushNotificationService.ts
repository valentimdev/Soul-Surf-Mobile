import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import api from '../api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

type DevicePlatform = 'android' | 'ios';

function getProjectId(): string | undefined {
  return (
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId
  );
}

async function ensureAndroidChannel() {
  if (Platform.OS !== 'android') {
    return;
  }

  await Notifications.setNotificationChannelAsync('default', {
    name: 'Notificações',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#5C9DB8',
  });
}

async function requestNotificationPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) {
    return true;
  }

  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

async function getExpoPushToken(): Promise<string | null> {
  if (Platform.OS !== 'android' && Platform.OS !== 'ios') {
    return null;
  }

  await ensureAndroidChannel();

  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) {
    return null;
  }

  const projectId = getProjectId();
  if (!projectId) {
    console.warn('[Push] EAS projectId não encontrado no app config.');
    return null;
  }

  const pushToken = await Notifications.getExpoPushTokenAsync({ projectId });
  return pushToken.data;
}

export const pushNotificationService = {
  syncPushTokenWithBackend: async (): Promise<string | null> => {
    try {
      const token = await getExpoPushToken();
      if (!token) {
        return null;
      }

      await api.post('/api/notifications/device-token', {
        token,
        platform: Platform.OS as DevicePlatform,
      });

      return token;
    } catch (error) {
      console.warn('[Push] Não foi possível sincronizar o token:', error);
      return null;
    }
  },
};
