import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { notificationService } from '@/services/notifications/notificationService';
import { Tabs, useFocusEffect } from 'expo-router';
import { Map, MessageCircle, Bell, User } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { View } from 'react-native';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [unreadCount, setUnreadCount] = useState(0);

  const loadUnreadCount = useCallback(async () => {
    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Erro ao carregar badge de notificacoes:', error);
      setUnreadCount(0);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadUnreadCount();
    }, [loadUnreadCount])
  );

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#F6F4EB',
          borderTopColor: '#E2DEC3',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Mapa',
          tabBarIcon: ({ color, size }) => <Map size={size} color={Colors.light.icon} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
            href: null,
          title: 'Chat',
          tabBarIcon: ({ color, size }) => (
            <MessageCircle size={size} color={Colors.light.icon} />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
            href: null,
          title: 'Notificações',
          tabBarIcon: ({ color, size }) => (
            <View>
              <Bell size={size} color={Colors.light.icon} />
              {unreadCount > 0 && (
                <View
                  style={{
                    position: 'absolute',
                    top: -2,
                    right: -4,
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: '#E74C3C',
                  }}
                />
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => <User size={size} color={Colors.light.icon} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          href: null,
          headerShown: false
        }}
      />
    </Tabs>
  );
}
