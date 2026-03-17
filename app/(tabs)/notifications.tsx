import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Star, MessageSquare, Waves, Clock } from 'lucide-react-native';

type NotificationType = 'review' | 'message' | 'alert';

type NotificationItem = {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  time: string;
  unread: boolean;
};

const MOCK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: '1',
    type: 'review',
    title: 'Nova avaliação',
    description: 'João avaliou o pico Praia do Norte que você adicionou',
    time: '5 min atrás',
    unread: true,
  },
  {
    id: '2',
    type: 'message',
    title: 'Nova mensagem',
    description: 'Maria enviou uma mensagem sobre o pico Praia do Leste',
    time: '1 hora atrás',
    unread: true,
  },
  {
    id: '3',
    type: 'alert',
    title: 'Alerta de condições',
    description: 'Ondas de 2-3m previstas para Praia do Norte amanhã',
    time: '3 horas atrás',
    unread: false,
  },
  {
    id: '4',
    type: 'review',
    title: 'Nova avaliação',
    description: 'Pedro deu 5 estrelas para Soul Surf Shop',
    time: '1 dia atrás',
    unread: false,
  },
];

const ICON_MAP: Record<NotificationType, { icon: React.ElementType; bg: string }> = {
  review: { icon: Star, bg: '#EDE8D6' },
  message: { icon: MessageSquare, bg: '#E0EFF5' },
  alert: { icon: Waves, bg: '#E0EFF5' },
};

function NotificationCard({ item }: { item: NotificationItem }) {
  const iconConfig = ICON_MAP[item.type];
  const IconComponent = iconConfig.icon;

  return (
    <View style={[styles.card, item.unread && styles.cardUnread]}>
      <View style={[styles.iconContainer, { backgroundColor: iconConfig.bg }]}>
        <IconComponent size={24} color="#5C9DB8" />
      </View>
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          {item.unread && <View style={styles.unreadDot} />}
        </View>
        <Text style={styles.cardDescription}>{item.description}</Text>
        <View style={styles.timeRow}>
          <Clock size={14} color="#999" />
          <Text style={styles.timeText}>{item.time}</Text>
        </View>
      </View>
    </View>
  );
}

export default function NotificationsScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Notificações</Text>
        {MOCK_NOTIFICATIONS.map((item) => (
          <NotificationCard key={item.id} item={item} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F6F4EB',
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F4A63',
    marginBottom: 20,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2DEC3',
    padding: 16,
    marginBottom: 14,
    alignItems: 'flex-start',
  },
  cardUnread: {
    backgroundColor: '#F0F7FA',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  cardContent: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F4A63',
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#5C9DB8',
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 12,
    color: '#999',
    marginLeft: 4,
  },
});

