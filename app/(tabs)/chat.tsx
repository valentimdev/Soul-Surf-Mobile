import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';

type Conversation = {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread: boolean;
};

const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: '1',
    name: 'João Silva',
    avatar: 'https://randomuser.me/api/portraits/men/44.jpg',
    lastMessage: 'Valeu pela dica do pico!',
    time: '10:30',
    unread: true,
  },
  {
    id: '2',
    name: 'Maria Santos',
    avatar: 'https://randomuser.me/api/portraits/women/65.jpg',
    lastMessage: 'Vamos surfar amanhã?',
    time: 'Ontem',
    unread: true,
  },
  {
    id: '3',
    name: 'Pedro Costa',
    avatar: 'https://randomuser.me/api/portraits/men/22.jpg',
    lastMessage: 'Show! Até lá 🤙',
    time: 'Terça',
    unread: false,
  },
];

function ConversationItem({ item }: { item: Conversation }) {
  return (
    <TouchableOpacity style={styles.conversationCard} activeOpacity={0.7}>
      <Image source={{ uri: item.avatar }} style={styles.avatar} />
      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <Text style={styles.contactName}>{item.name}</Text>
          <Text style={[styles.timeText, item.unread && styles.timeTextUnread]}>
            {item.time}
          </Text>
        </View>
        <View style={styles.conversationFooter}>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {item.lastMessage}
          </Text>
          {item.unread && <View style={styles.unreadBadge} />}
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function ChatScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Mensagens</Text>
        <FlatList
          data={MOCK_CONVERSATIONS}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ConversationItem item={item} />}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F6F4EB',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F4A63',
    marginBottom: 20,
  },
  conversationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 14,
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  contactName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1F4A63',
  },
  timeText: {
    fontSize: 13,
    color: '#999',
  },
  timeTextUnread: {
    color: '#5C9DB8',
  },
  conversationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 14,
    color: '#5C9DB8',
    flex: 1,
    marginRight: 10,
  },
  unreadBadge: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#5C9DB8',
  },
  separator: {
    height: 1,
    backgroundColor: '#E2DEC3',
  },
});

