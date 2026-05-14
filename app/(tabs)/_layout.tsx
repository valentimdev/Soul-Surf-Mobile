import { Colors } from '@/constants/theme';
import { NotificationProvider, useNotifications } from '@/contexts/NotificationContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Tabs } from 'expo-router';
import { Map, MessageCircle, Bell, User, Compass } from 'lucide-react-native';
import React from 'react';
import { View } from 'react-native';

function TabNavigator() {
  const colorScheme = useColorScheme();
  const { unreadCount } = useNotifications();

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
                    name="discover"
                    options={{
                        title: 'Descobrir',
                        tabBarIcon: ({ color, size }) => <Compass size={size} color={Colors.light.icon} />,
                    }}
                  />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color, size }) => (
            <MessageCircle size={size} color={Colors.light.icon} />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
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

export default function TabLayout() {
  return (
    <NotificationProvider>
      <TabNavigator />
    </NotificationProvider>
  );
}
