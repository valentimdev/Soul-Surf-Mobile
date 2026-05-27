import { Colors } from '@/constants/theme';
import { NotificationProvider, useNotifications } from '@/contexts/NotificationContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Tabs } from 'expo-router';
import { Map, MessageCircle, Bell, User, Compass } from 'lucide-react-native';
import React from 'react';
import { View } from 'react-native';

// Wrapper criado para dar o efeito de aba ativa
const TabIconWrapper = ({ focused, children }: { focused: boolean; children: React.ReactNode }) => (
  <View
    style={{
      paddingVertical: 6,
      paddingHorizontal: 16,
      borderRadius: 20,
      backgroundColor: focused ? 'rgba(92, 157, 184, 0.15)' : 'transparent',
      borderColor: focused ? 'rgba(92, 157, 184, 0.4)' : 'transparent',
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    }}>
    {children}
  </View>
);

function TabNavigator() {
  const colorScheme = useColorScheme();
  const { unreadCount } = useNotifications();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarShowLabel: true, // Garantindo que as labels possam aparecer (ou false, se preferir só ícones)
        tabBarStyle: {
          backgroundColor: '#F6F4EB',
          borderTopColor: '#E2DEC3',
          paddingBottom: 4,
          paddingTop: 4,
          height: 60,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Mapa',
          tabBarIcon: ({ size, focused }) => (
            <TabIconWrapper focused={focused}>
              <Map size={size} color={Colors.light.icon} />
            </TabIconWrapper>
          ),
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          title: 'Descobrir',
          headerShown: false,
          tabBarIcon: ({ size, focused }) => (
            <TabIconWrapper focused={focused}>
              <Compass size={size} color={Colors.light.icon} />
            </TabIconWrapper>
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarIcon: ({ size, focused }) => (
            <TabIconWrapper focused={focused}>
              <MessageCircle size={size} color={Colors.light.icon} />
            </TabIconWrapper>
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Notificações',
          tabBarIcon: ({ size, focused }) => (
            <TabIconWrapper focused={focused}>
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
            </TabIconWrapper>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ size, focused }) => (
            <TabIconWrapper focused={focused}>
              <User size={size} color={Colors.light.icon} />
            </TabIconWrapper>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          href: null,
          headerShown: false,
        }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  return <TabNavigator />;
}