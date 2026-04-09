import { ChatMessageResponse, chatService } from '@/services/chat/chatService';
import { userService } from '@/services/users/userService';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

function parseStringParam(value?: string | string[]): string {
  if (!value) return '';
  if (Array.isArray(value)) return value[0] || '';
  return value;
}

function toTimeLabel(value?: string): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function sortMessages(items: ChatMessageResponse[]): ChatMessageResponse[] {
  return [...items].sort((a, b) => {
    const first = new Date(a.createdAt).getTime();
    const second = new Date(b.createdAt).getTime();

    const safeFirst = Number.isNaN(first) ? 0 : first;
    const safeSecond = Number.isNaN(second) ? 0 : second;
    return safeFirst - safeSecond;
  });
}

function MessageBubble({
  message,
  isMine,
}: {
  message: ChatMessageResponse;
  isMine: boolean;
}) {
  return (
    <View style={[styles.messageRow, isMine ? styles.messageRowMine : styles.messageRowOther]}>
      <View style={[styles.messageBubble, isMine ? styles.messageBubbleMine : styles.messageBubbleOther]}>
        <Text style={[styles.messageText, isMine && styles.messageTextMine]}>{message.content}</Text>
        <Text style={[styles.messageTime, isMine && styles.messageTimeMine]}>{toTimeLabel(message.createdAt)}</Text>
      </View>
    </View>
  );
}

export default function ChatConversationScreen() {
  const params = useLocalSearchParams<{
    id?: string | string[];
    name?: string | string[];
  }>();
  const navigation = useNavigation();

  const conversationId = useMemo(() => parseStringParam(params.id), [params.id]);
  const conversationName = useMemo(() => parseStringParam(params.name), [params.name]);

  const [messages, setMessages] = useState<ChatMessageResponse[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const listRef = useRef<FlatList<ChatMessageResponse>>(null);

  useEffect(() => {
    if (!navigation || !(navigation as any).setOptions) return;
    (navigation as any).setOptions({
      title: conversationName || 'Conversa',
    });
  }, [conversationName, navigation]);

  const loadCurrentUser = useCallback(async () => {
    try {
      const me = await userService.getMyProfile();
      setCurrentUserId(String(me.id));
    } catch (e) {
      console.error('Erro ao carregar usuario atual no chat:', e);
      setCurrentUserId('');
    }
  }, []);

  const loadMessages = useCallback(
    async (isRefresh = false) => {
      if (!conversationId) {
        setError('Conversa invalida.');
        setLoading(false);
        setRefreshing(false);
        return;
      }

      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      try {
        setError(null);
        const response = await chatService.getMessages(conversationId, 0, 50);
        setMessages(sortMessages(response));
      } catch (e) {
        console.error('Erro ao carregar mensagens:', e);
        setError('Nao foi possivel carregar as mensagens desta conversa.');
      } finally {
        if (isRefresh) setRefreshing(false);
        else setLoading(false);
      }
    },
    [conversationId]
  );

  useEffect(() => {
    loadCurrentUser();
  }, [loadCurrentUser]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    if (messages.length === 0) return;
    listRef.current?.scrollToEnd({ animated: true });
  }, [messages.length]);

  const handleSend = useCallback(async () => {
    if (!conversationId) return;

    const content = draft.trim();
    if (!content) return;

    setSending(true);
    try {
      const sentMessage = await chatService.sendMessage(conversationId, content);
      setMessages((prev) => sortMessages([...prev, sentMessage]));
      setDraft('');
    } catch (e) {
      console.error('Erro ao enviar mensagem:', e);
      setError('Nao foi possivel enviar sua mensagem agora.');
    } finally {
      setSending(false);
    }
  }, [conversationId, draft]);

  const isInitialError = !!error && !loading && messages.length === 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
      >
        {loading && messages.length === 0 ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color="#5C9DB8" />
            <Text style={styles.centerStateText}>Carregando mensagens...</Text>
          </View>
        ) : isInitialError ? (
          <View style={styles.centerState}>
            <Text style={styles.centerStateText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => loadMessages()}>
              <Text style={styles.retryButtonText}>Tentar novamente</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item, index) => item.id || `${item.createdAt}-${index}`}
            renderItem={({ item }) => (
              <MessageBubble message={item} isMine={!!currentUserId && String(item.senderId) === currentUserId} />
            )}
            contentContainerStyle={[
              styles.listContent,
              messages.length === 0 && styles.listContentEmpty,
            ]}
            showsVerticalScrollIndicator={false}
            refreshing={refreshing}
            onRefresh={() => loadMessages(true)}
            ListEmptyComponent={
              <View style={styles.emptyStateContainer}>
                <Text style={styles.emptyStateText}>Nenhuma mensagem ainda. Comece a conversa.</Text>
              </View>
            }
          />
        )}

        <View style={styles.composerContainer}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            style={styles.input}
            placeholder="Digite uma mensagem..."
            placeholderTextColor="#8B8B8B"
            multiline
          />
          <TouchableOpacity
            style={[styles.sendButton, (sending || !draft.trim()) && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={sending || !draft.trim()}
          >
            <Text style={styles.sendButtonText}>{sending ? 'Enviando...' : 'Enviar'}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F6F4EB',
  },
  flex: {
    flex: 1,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 24,
  },
  centerStateText: {
    color: '#5C9DB8',
    fontSize: 14,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#5C9DB8',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
    gap: 8,
  },
  listContentEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyStateContainer: {
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#5C9DB8',
    textAlign: 'center',
  },
  messageRow: {
    width: '100%',
    marginBottom: 8,
  },
  messageRowMine: {
    alignItems: 'flex-end',
  },
  messageRowOther: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '82%',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  messageBubbleMine: {
    backgroundColor: '#5C9DB8',
    borderTopRightRadius: 6,
  },
  messageBubbleOther: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2DEC3',
    borderTopLeftRadius: 6,
  },
  messageText: {
    fontSize: 14,
    color: '#1F4A63',
    lineHeight: 20,
  },
  messageTextMine: {
    color: '#FFFFFF',
  },
  messageTime: {
    marginTop: 6,
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'right',
  },
  messageTimeMine: {
    color: '#E5F0F5',
  },
  composerContainer: {
    borderTopWidth: 1,
    borderTopColor: '#E2DEC3',
    backgroundColor: '#F6F4EB',
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D7D2B6',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#1F4A63',
    fontSize: 14,
    textAlignVertical: 'top',
  },
  sendButton: {
    backgroundColor: '#5C9DB8',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minWidth: 74,
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});
