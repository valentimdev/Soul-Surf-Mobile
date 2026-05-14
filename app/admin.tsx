import { useAppAlert } from '@/components/AppAlert';
import { adminService, AdminAuditLogDTO, AdminMetricsDTO } from '@/services/admin/adminService';
import { userService } from '@/services/users/userService';
import { CommentDTO, PostDTO, UserDTO } from '@/types/api';
import { Ionicons } from '@expo/vector-icons';
import { Stack, router, useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const AVATAR_FALLBACK = 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y';
const POST_FALLBACK = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800';

type AdminTab = 'users' | 'posts' | 'comments' | 'audits';
type IconName = React.ComponentProps<typeof Ionicons>['name'];
type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

type ActionButtonProps = {
  icon: IconName;
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  compact?: boolean;
};

type FlatComment = {
  comment: CommentDTO;
  depth: number;
};

const tabs: { key: AdminTab; label: string; icon: IconName }[] = [
  { key: 'users', label: 'Usuarios', icon: 'people-outline' },
  { key: 'posts', label: 'Posts', icon: 'images-outline' },
  { key: 'comments', label: 'Comentarios', icon: 'chatbubbles-outline' },
  { key: 'audits', label: 'Auditoria', icon: 'document-text-outline' },
];

function parseId(value: string): number | null {
  const parsed = Number.parseInt(value.trim(), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function formatDate(value?: string): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function actionLabel(action: string): string {
  const labels: Record<string, string> = {
    DELETE_USER: 'Usuario apagado',
    DELETE_POST: 'Post apagado',
    DELETE_COMMENT: 'Comentario apagado',
    PROMOTE_TO_ADMIN: 'Admin concedido',
    DEMOTE_FROM_ADMIN: 'Admin removido',
    BAN_USER: 'Usuario banido',
    UNBAN_USER: 'Usuario liberado',
  };

  return labels[action] ?? action;
}

function flattenComments(comments: CommentDTO[], depth = 0): FlatComment[] {
  return comments.flatMap((comment) => [
    { comment, depth },
    ...flattenComments(comment.replies ?? [], depth + 1),
  ]);
}

function removeComment(comments: CommentDTO[], commentId: number): CommentDTO[] {
  return comments
    .filter((comment) => comment.id !== commentId)
    .map((comment) => ({
      ...comment,
      replies: comment.replies ? removeComment(comment.replies, commentId) : undefined,
    }));
}

function ActionButton({
  icon,
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  compact = false,
}: ActionButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      activeOpacity={0.82}
      onPress={onPress}
      disabled={isDisabled}
      style={[
        styles.actionButton,
        compact && styles.compactButton,
        variant === 'secondary' && styles.secondaryButton,
        variant === 'danger' && styles.dangerButton,
        variant === 'ghost' && styles.ghostButton,
        isDisabled && styles.disabledButton,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variant === 'secondary' || variant === 'ghost' ? '#1F4A63' : '#FFF'} />
      ) : (
        <Ionicons
          name={icon}
          size={compact ? 16 : 18}
          color={variant === 'secondary' || variant === 'ghost' ? '#1F4A63' : '#FFF'}
        />
      )}
      <Text
        style={[
          styles.actionButtonText,
          (variant === 'secondary' || variant === 'ghost') && styles.secondaryButtonText,
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export default function AdminScreen() {
  const { showAlert } = useAppAlert();
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<AdminTab>('users');

  const [metrics, setMetrics] = useState<AdminMetricsDTO | null>(null);
  const [audits, setAudits] = useState<AdminAuditLogDTO[]>([]);
  const [loadingDashboard, setLoadingDashboard] = useState(false);

  const [users, setUsers] = useState<UserDTO[]>([]);
  const [userQuery, setUserQuery] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userActionId, setUserActionId] = useState<number | null>(null);

  const [postIdInput, setPostIdInput] = useState('');
  const [postPreview, setPostPreview] = useState<PostDTO | null>(null);
  const [loadingPost, setLoadingPost] = useState(false);
  const [deletingPost, setDeletingPost] = useState(false);

  const [commentPostIdInput, setCommentPostIdInput] = useState('');
  const [directCommentIdInput, setDirectCommentIdInput] = useState('');
  const [comments, setComments] = useState<CommentDTO[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentActionId, setCommentActionId] = useState<number | null>(null);

  const flatComments = useMemo(() => flattenComments(comments), [comments]);

  const loadDashboard = useCallback(async () => {
    setLoadingDashboard(true);
    try {
      const [nextMetrics, nextAudits] = await Promise.all([
        adminService.getMetrics(),
        adminService.getAudits(0, 12),
      ]);
      setMetrics(nextMetrics);
      setAudits(nextAudits.content ?? []);
    } catch (error) {
      console.error('Erro ao carregar gestao:', error);
      showAlert('Erro', 'Nao foi possivel carregar os dados de gestao.');
    } finally {
      setLoadingDashboard(false);
    }
  }, [showAlert]);

  const loadUsers = useCallback(async (query = '') => {
    setLoadingUsers(true);
    try {
      const normalized = query.trim();
      const nextUsers = normalized.length >= 2
        ? await userService.searchUsers(normalized)
        : await userService.getUsers(0, 30);
      setUsers(nextUsers);
    } catch (error) {
      console.error('Erro ao carregar usuarios:', error);
      showAlert('Erro', 'Nao foi possivel carregar usuarios.');
    } finally {
      setLoadingUsers(false);
    }
  }, [showAlert]);

  const verifyAccess = useCallback(async () => {
    setCheckingAccess(true);
    try {
      const me = await userService.getMyProfile();
      setCurrentUserId(me.id);
      if (!me.admin) {
        setIsAdmin(false);
        return;
      }

      setIsAdmin(true);
      await Promise.all([loadDashboard(), loadUsers()]);
    } catch (error) {
      console.error('Erro ao validar admin:', error);
      setIsAdmin(false);
      showAlert('Erro', 'Nao foi possivel validar seu acesso.');
    } finally {
      setCheckingAccess(false);
    }
  }, [loadDashboard, loadUsers, showAlert]);

  useFocusEffect(
    useCallback(() => {
      void verifyAccess();
    }, [verifyAccess])
  );

  const updateUserRow = (userId: number, updates: Partial<UserDTO>) => {
    setUsers((current) =>
      current.map((user) => (user.id === userId ? { ...user, ...updates } : user))
    );
  };

  const confirmUserAction = (
    user: UserDTO,
    title: string,
    message: string,
    label: string,
    action: () => Promise<void>
  ) => {
    showAlert(title, message, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: label,
        style: 'destructive',
        onPress: async () => {
          setUserActionId(user.id);
          try {
            await action();
            await loadDashboard();
            showAlert('Pronto', 'Acao aplicada com sucesso.');
          } catch (error) {
            console.error('Erro na acao de usuario:', error);
            showAlert('Erro', 'Nao foi possivel concluir a acao.');
          } finally {
            setUserActionId(null);
          }
        },
      },
    ]);
  };

  const handleBanToggle = (user: UserDTO) => {
    const nextBanned = !user.banned;
    confirmUserAction(
      user,
      nextBanned ? 'Banir usuario' : 'Liberar usuario',
      `@${user.username} ${nextBanned ? 'perdera o acesso ao app.' : 'tera o acesso restaurado.'}`,
      nextBanned ? 'Banir' : 'Liberar',
      async () => {
        if (nextBanned) {
          await adminService.banUser(user.id);
        } else {
          await adminService.unbanUser(user.id);
        }
        updateUserRow(user.id, { banned: nextBanned });
      }
    );
  };

  const handleAdminToggle = (user: UserDTO) => {
    const nextAdmin = !user.admin;
    confirmUserAction(
      user,
      nextAdmin ? 'Dar admin' : 'Remover admin',
      `@${user.username} ${nextAdmin ? 'tera acesso a gestao.' : 'perdera acesso a gestao.'}`,
      nextAdmin ? 'Dar admin' : 'Remover',
      async () => {
        if (nextAdmin) {
          await adminService.promoteUser(user.id);
        } else {
          await adminService.demoteUser(user.id);
        }
        updateUserRow(user.id, { admin: nextAdmin });
      }
    );
  };

  const handleFindPost = async () => {
    const postId = parseId(postIdInput);
    if (!postId) {
      showAlert('Aviso', 'Informe um ID de post valido.');
      return;
    }

    setLoadingPost(true);
    try {
      const post = await adminService.getPostById(postId);
      setPostPreview(post);
    } catch (error) {
      console.error('Erro ao buscar post:', error);
      setPostPreview(null);
      showAlert('Erro', 'Post nao encontrado.');
    } finally {
      setLoadingPost(false);
    }
  };

  const confirmDeletePost = (postId: number) => {
    showAlert('Apagar post', `Post #${postId} sera removido da plataforma.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Apagar',
        style: 'destructive',
        onPress: async () => {
          setDeletingPost(true);
          try {
            await adminService.deletePost(postId);
            setPostPreview(null);
            setPostIdInput('');
            await loadDashboard();
            showAlert('Pronto', 'Post removido.');
          } catch (error) {
            console.error('Erro ao apagar post:', error);
            showAlert('Erro', 'Nao foi possivel apagar o post.');
          } finally {
            setDeletingPost(false);
          }
        },
      },
    ]);
  };

  const handleFindComments = async () => {
    const postId = parseId(commentPostIdInput);
    if (!postId) {
      showAlert('Aviso', 'Informe um ID de post valido.');
      return;
    }

    setLoadingComments(true);
    try {
      const nextComments = await adminService.getPostComments(postId);
      setComments(nextComments);
    } catch (error) {
      console.error('Erro ao buscar comentarios:', error);
      setComments([]);
      showAlert('Erro', 'Nao foi possivel carregar os comentarios.');
    } finally {
      setLoadingComments(false);
    }
  };

  const confirmDeleteComment = (commentId: number) => {
    showAlert('Apagar comentario', `Comentario #${commentId} sera removido.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Apagar',
        style: 'destructive',
        onPress: async () => {
          setCommentActionId(commentId);
          try {
            await adminService.deleteComment(commentId);
            setComments((current) => removeComment(current, commentId));
            setDirectCommentIdInput('');
            await loadDashboard();
            showAlert('Pronto', 'Comentario removido.');
          } catch (error) {
            console.error('Erro ao apagar comentario:', error);
            showAlert('Erro', 'Nao foi possivel apagar o comentario.');
          } finally {
            setCommentActionId(null);
          }
        },
      },
    ]);
  };

  const renderMetrics = () => {
    const stats = [
      { label: 'Usuarios', value: metrics?.totalUsers ?? 0, icon: 'people-outline' as IconName },
      { label: 'Admins', value: metrics?.totalAdmins ?? 0, icon: 'shield-checkmark-outline' as IconName },
      { label: 'Banidos', value: metrics?.totalBannedUsers ?? 0, icon: 'ban-outline' as IconName },
      { label: 'Posts', value: metrics?.totalPosts ?? 0, icon: 'images-outline' as IconName },
      { label: 'Comentarios', value: metrics?.totalComments ?? 0, icon: 'chatbubbles-outline' as IconName },
      { label: 'Autores', value: metrics?.activeAuthors ?? 0, icon: 'pulse-outline' as IconName },
    ];

    return (
      <View style={styles.metricGrid}>
        {stats.map((stat) => (
          <View key={stat.label} style={styles.metricCard}>
            <Ionicons name={stat.icon} size={18} color="#5C9DB8" />
            <Text style={styles.metricValue}>{stat.value}</Text>
            <Text style={styles.metricLabel} numberOfLines={1}>{stat.label}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderUsers = () => (
    <View style={styles.section}>
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={18} color="#5C9DB8" />
        <TextInput
          value={userQuery}
          onChangeText={setUserQuery}
          placeholder="Buscar usuario"
          placeholderTextColor="#8BA1AA"
          style={styles.searchInput}
          autoCapitalize="none"
          returnKeyType="search"
          onSubmitEditing={() => void loadUsers(userQuery)}
        />
        <TouchableOpacity onPress={() => void loadUsers(userQuery)} style={styles.searchIconButton}>
          <Ionicons name="arrow-forward" size={18} color="#FFF" />
        </TouchableOpacity>
      </View>

      {loadingUsers ? (
        <ActivityIndicator color="#5C9DB8" style={styles.inlineLoader} />
      ) : users.length === 0 ? (
        <Text style={styles.emptyText}>Nenhum usuario encontrado.</Text>
      ) : (
        users.map((user) => {
          const isSelf = user.id === currentUserId;
          return (
            <View key={user.id} style={styles.userCard}>
              <Image source={{ uri: user.fotoPerfil || AVATAR_FALLBACK }} style={styles.avatar} />
              <View style={styles.userBody}>
                <View style={styles.rowBetween}>
                  <View style={styles.flexOne}>
                    <Text style={styles.cardTitle} numberOfLines={1}>@{user.username}</Text>
                    <Text style={styles.cardMeta} numberOfLines={1}>{user.email || `ID ${user.id}`}</Text>
                  </View>
                  <Text style={styles.idPill}>#{user.id}</Text>
                </View>

                <View style={styles.badgeRow}>
                  {user.admin ? <Text style={styles.badge}>ADMIN</Text> : null}
                  {user.banned ? <Text style={[styles.badge, styles.badgeDanger]}>BANIDO</Text> : null}
                  {isSelf ? <Text style={[styles.badge, styles.badgeMuted]}>VOCE</Text> : null}
                </View>

                <View style={styles.actionRow}>
                  <ActionButton
                    compact
                    icon={user.banned ? 'lock-open-outline' : 'ban-outline'}
                    label={user.banned ? 'Liberar' : 'Banir'}
                    variant={user.banned ? 'secondary' : 'danger'}
                    loading={userActionId === user.id}
                    onPress={() => handleBanToggle(user)}
                  />
                  <ActionButton
                    compact
                    icon={user.admin ? 'remove-circle-outline' : 'shield-checkmark-outline'}
                    label={user.admin ? 'Tirar admin' : 'Dar admin'}
                    variant="secondary"
                    disabled={isSelf && user.admin}
                    loading={userActionId === user.id}
                    onPress={() => handleAdminToggle(user)}
                  />
                </View>
              </View>
            </View>
          );
        })
      )}
    </View>
  );

  const renderPosts = () => (
    <View style={styles.section}>
      <View style={styles.formRow}>
        <TextInput
          value={postIdInput}
          onChangeText={setPostIdInput}
          placeholder="ID do post"
          placeholderTextColor="#8BA1AA"
          keyboardType="number-pad"
          style={styles.idInput}
        />
        <ActionButton icon="search-outline" label="Buscar" onPress={() => void handleFindPost()} loading={loadingPost} compact />
      </View>

      {postPreview ? (
        <View style={styles.postCard}>
          <Image source={{ uri: postPreview.caminhoFoto || POST_FALLBACK }} style={styles.postImage} />
          <View style={styles.postBody}>
            <View style={styles.rowBetween}>
              <Text style={styles.cardTitle}>Post #{postPreview.id}</Text>
              <Text style={styles.idPill}>{postPreview.publico ? 'Publico' : 'Privado'}</Text>
            </View>
            <Text style={styles.cardMeta} numberOfLines={1}>
              @{postPreview.usuario?.username || 'usuario'} - {postPreview.beach?.nome || 'sem praia'}
            </Text>
            <Text style={styles.postDescription} numberOfLines={3}>{postPreview.descricao || 'Sem descricao'}</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoText}>{postPreview.likesCount || 0} likes</Text>
              <Text style={styles.infoText}>{postPreview.commentsCount || 0} comentarios</Text>
            </View>
            <ActionButton
              icon="trash-outline"
              label="Apagar post"
              variant="danger"
              loading={deletingPost}
              onPress={() => confirmDeletePost(postPreview.id)}
            />
          </View>
        </View>
      ) : (
        <Text style={styles.emptyText}>Busque um post pelo ID para moderar.</Text>
      )}
    </View>
  );

  const renderComments = () => (
    <View style={styles.section}>
      <View style={styles.formRow}>
        <TextInput
          value={directCommentIdInput}
          onChangeText={setDirectCommentIdInput}
          placeholder="ID do comentario"
          placeholderTextColor="#8BA1AA"
          keyboardType="number-pad"
          style={styles.idInput}
        />
        <ActionButton
          icon="trash-outline"
          label="Apagar"
          variant="danger"
          compact
          onPress={() => {
            const commentId = parseId(directCommentIdInput);
            if (!commentId) {
              showAlert('Aviso', 'Informe um ID de comentario valido.');
              return;
            }
            confirmDeleteComment(commentId);
          }}
          loading={commentActionId === parseId(directCommentIdInput)}
        />
      </View>

      <View style={styles.formRow}>
        <TextInput
          value={commentPostIdInput}
          onChangeText={setCommentPostIdInput}
          placeholder="ID do post"
          placeholderTextColor="#8BA1AA"
          keyboardType="number-pad"
          style={styles.idInput}
        />
        <ActionButton
          icon="chatbubbles-outline"
          label="Listar"
          compact
          onPress={() => void handleFindComments()}
          loading={loadingComments}
        />
      </View>

      {loadingComments ? (
        <ActivityIndicator color="#5C9DB8" style={styles.inlineLoader} />
      ) : flatComments.length === 0 ? (
        <Text style={styles.emptyText}>Nenhum comentario carregado.</Text>
      ) : (
        flatComments.map(({ comment, depth }) => (
          <View key={comment.id} style={[styles.commentCard, { marginLeft: Math.min(depth * 14, 36) }]}>
            <View style={styles.rowBetween}>
              <Text style={styles.cardTitle} numberOfLines={1}>#{comment.id} @{comment.usuario?.username || 'usuario'}</Text>
              <Text style={styles.cardMeta}>{formatDate(comment.data)}</Text>
            </View>
            <Text style={styles.commentText}>{comment.texto}</Text>
            <ActionButton
              icon="trash-outline"
              label="Apagar comentario"
              variant="danger"
              compact
              loading={commentActionId === comment.id}
              onPress={() => confirmDeleteComment(comment.id)}
            />
          </View>
        ))
      )}
    </View>
  );

  const renderAudits = () => (
    <View style={styles.section}>
      <ActionButton
        icon="refresh-outline"
        label="Atualizar auditoria"
        variant="secondary"
        loading={loadingDashboard}
        onPress={() => void loadDashboard()}
      />
      {audits.length === 0 ? (
        <Text style={styles.emptyText}>Nenhuma acao registrada.</Text>
      ) : (
        audits.map((audit) => (
          <View key={audit.id} style={styles.auditRow}>
            <View style={styles.auditIcon}>
              <Ionicons name="radio-button-on" size={14} color="#5C9DB8" />
            </View>
            <View style={styles.flexOne}>
              <Text style={styles.cardTitle}>{actionLabel(audit.action)}</Text>
              <Text style={styles.cardMeta} numberOfLines={1}>
                {audit.targetType} #{audit.targetId} - {audit.actorEmail}
              </Text>
            </View>
            <Text style={styles.cardMeta}>{formatDate(audit.createdAt)}</Text>
          </View>
        ))
      )}
    </View>
  );

  const renderActiveTab = () => {
    if (activeTab === 'users') return renderUsers();
    if (activeTab === 'posts') return renderPosts();
    if (activeTab === 'comments') return renderComments();
    return renderAudits();
  };

  if (checkingAccess) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#5C9DB8" />
        </View>
      </SafeAreaView>
    );
  }

  if (!isAdmin) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
            <Ionicons name="arrow-back" size={22} color="#1F4A63" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Gestao</Text>
        </View>
        <View style={styles.center}>
          <Ionicons name="lock-closed-outline" size={38} color="#5C9DB8" />
          <Text style={styles.restrictedTitle}>Acesso restrito</Text>
          <Text style={styles.emptyText}>Sua conta nao tem permissao de admin.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
          <Ionicons name="arrow-back" size={22} color="#1F4A63" />
        </TouchableOpacity>
        <View style={styles.flexOne}>
          <Text style={styles.headerTitle}>Gestao</Text>
          <Text style={styles.headerSubtitle}>Moderacao e seguranca</Text>
        </View>
        <TouchableOpacity onPress={() => void loadDashboard()} style={styles.iconButton}>
          <Ionicons name="refresh-outline" size={22} color="#1F4A63" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {renderMetrics()}

        <View style={styles.tabBar}>
          {tabs.map((tab) => {
            const active = tab.key === activeTab;
            return (
              <TouchableOpacity
                key={tab.key}
                activeOpacity={0.82}
                onPress={() => setActiveTab(tab.key)}
                style={[styles.tabButton, active && styles.activeTabButton]}
              >
                <Ionicons name={tab.icon} size={17} color={active ? '#FFF' : '#1F4A63'} />
                <Text style={[styles.tabText, active && styles.activeTabText]} numberOfLines={1}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {renderActiveTab()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F6F4EB' },
  content: { padding: 18, paddingBottom: 36, gap: 14 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 28 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2DEC3',
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2DEC3',
  },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#1F4A63' },
  headerSubtitle: { color: '#6E8792', fontSize: 12, fontWeight: '700' },
  restrictedTitle: { fontSize: 20, fontWeight: '900', color: '#1F4A63' },
  flexOne: { flex: 1 },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metricCard: {
    width: '31.8%',
    minHeight: 86,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7E2D3',
    padding: 10,
    gap: 4,
  },
  metricValue: { color: '#1F4A63', fontSize: 20, fontWeight: '900', fontVariant: ['tabular-nums'] },
  metricLabel: { color: '#6E8792', fontSize: 11, fontWeight: '800' },
  tabBar: {
    flexDirection: 'row',
    gap: 6,
    backgroundColor: '#E7E2D3',
    padding: 5,
    borderRadius: 8,
  },
  tabButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingHorizontal: 4,
  },
  activeTabButton: { backgroundColor: '#1F4A63' },
  tabText: { color: '#1F4A63', fontSize: 10, fontWeight: '900' },
  activeTabText: { color: '#FFF' },
  section: { gap: 12 },
  searchBar: {
    minHeight: 50,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D7CDB9',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 12,
    gap: 8,
  },
  searchInput: { flex: 1, color: '#1F4A63', fontSize: 15, fontWeight: '700' },
  searchIconButton: {
    width: 42,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1F4A63',
    borderTopRightRadius: 7,
    borderBottomRightRadius: 7,
  },
  formRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  idInput: {
    flex: 1,
    minHeight: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D7CDB9',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    color: '#1F4A63',
    fontSize: 15,
    fontWeight: '800',
  },
  userCard: {
    flexDirection: 'row',
    gap: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E7E2D3',
    backgroundColor: '#FFFFFF',
    padding: 12,
  },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#E2DEC3' },
  userBody: { flex: 1, gap: 8 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  cardTitle: { color: '#1F4A63', fontSize: 15, fontWeight: '900' },
  cardMeta: { color: '#6E8792', fontSize: 12, fontWeight: '700' },
  idPill: {
    color: '#1F4A63',
    backgroundColor: '#E7F1F4',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 11,
    fontWeight: '900',
  },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  badge: {
    color: '#1F4A63',
    backgroundColor: '#E7F1F4',
    borderRadius: 5,
    paddingHorizontal: 7,
    paddingVertical: 3,
    fontSize: 10,
    fontWeight: '900',
  },
  badgeDanger: { color: '#7D2C2C', backgroundColor: '#F7D8D8' },
  badgeMuted: { color: '#6E8792', backgroundColor: '#EFEBDD' },
  actionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  actionButton: {
    minHeight: 44,
    borderRadius: 8,
    backgroundColor: '#1F4A63',
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 7,
  },
  compactButton: { minHeight: 38, paddingHorizontal: 10 },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#BBD5DE',
  },
  dangerButton: { backgroundColor: '#7D2C2C' },
  ghostButton: { backgroundColor: 'transparent' },
  disabledButton: { opacity: 0.55 },
  actionButtonText: { color: '#FFF', fontSize: 12, fontWeight: '900' },
  secondaryButtonText: { color: '#1F4A63' },
  inlineLoader: { paddingVertical: 18 },
  emptyText: { color: '#6E8792', textAlign: 'center', fontSize: 14, fontWeight: '700', lineHeight: 20 },
  postCard: {
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E7E2D3',
    backgroundColor: '#FFFFFF',
  },
  postImage: { width: '100%', height: 190, backgroundColor: '#E2DEC3' },
  postBody: { padding: 12, gap: 10 },
  postDescription: { color: '#254B57', fontSize: 14, lineHeight: 20, fontWeight: '600' },
  infoRow: { flexDirection: 'row', gap: 12 },
  infoText: { color: '#5C9DB8', fontSize: 12, fontWeight: '900' },
  commentCard: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E7E2D3',
    backgroundColor: '#FFFFFF',
    padding: 12,
    gap: 10,
  },
  commentText: { color: '#254B57', fontSize: 14, lineHeight: 20, fontWeight: '600' },
  auditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2DEC3',
    paddingVertical: 12,
  },
  auditIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E7F1F4',
  },
});
