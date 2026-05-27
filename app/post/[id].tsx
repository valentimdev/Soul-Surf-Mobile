import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useNavigation, useRouter, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHeaderHeight } from '@react-navigation/elements';

import { PostDTO, CommentDTO } from '@/types/api';
import { commentService } from '@/services/posts/commentService';
import { postService } from '@/services/posts/postService';
import api from '@/services/api';
import { useAppAlert } from '@/components/AppAlert';
import { getUserAvatarResizeMode, getUserAvatarSource, getUserAvatarZoomStyle } from '@/constants/defaultImages';
import { formatDate, formatDateTimeWithYear } from '@/utils/formatters';

function normalizeCounter(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

interface FlatComment {
  comment: CommentDTO;
  depth: number;
}

function flattenComments(commentsList: CommentDTO[], depth = 0): FlatComment[] {
  return commentsList.flatMap((comment) => [
    { comment, depth },
    ...flattenComments(comment.replies ?? [], depth + 1),
  ]);
}

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const router = useRouter();
  const { showAlert } = useAppAlert();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();

  const [post, setPost] = useState<PostDTO | null>(null);
  const [comments, setComments] = useState<CommentDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCommentText, setNewCommentText] = useState('');
  const [sendingComment, setSendingComment] = useState(false);
  const [replyingTo, setReplyingTo] = useState<CommentDTO | null>(null);

  // Estados dos Likes
  const [liked, setLiked] = useState<boolean>(false);
  const [likesCount, setLikesCount] = useState<number>(0);
  const [isLiking, setIsLiking] = useState(false);

  useEffect(() => {
    navigation.setOptions({
      title: 'Registro',
      headerBackTitleVisible: false,
    });
  }, [navigation]);

  const loadPostAndComments = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);

      const [postResponse, commentsData, likeStatus, likeCountData] = await Promise.all([
        api.get(`/api/posts/${id}`),
        commentService.getPostComments(Number(id)),
        postService.getLikeStatus(Number(id)),
        postService.getLikesCount(Number(id))
      ]);

      setPost(postResponse.data);
      setComments(commentsData);
      setLiked(likeStatus.liked);
      setLikesCount(normalizeCounter(likeCountData.count));

    } catch (error) {
      console.error('Erro ao carregar post:', error);
      showAlert('Erro', 'Não foi possível carregar os detalhes deste registro.');
      router.back();
    } finally {
      setLoading(false);
    }
  }, [id, showAlert, router]);

  useEffect(() => {
    loadPostAndComments();
  }, [loadPostAndComments]);

  const handleToggleLike = async () => {
    if (isLiking || !post) return;

    const previousLiked = liked;
    const previousCount = likesCount;

    setLiked(!previousLiked);
    setLikesCount(prev => prev + (!previousLiked ? 1 : -1));
    setIsLiking(true);

    try {
      const res = await postService.toggleLike(post.id);
      setLiked(res.liked);
      setLikesCount(normalizeCounter(res.likesCount));
    } catch (error) {
      console.error('Erro ao curtir:', error);
      setLiked(previousLiked);
      setLikesCount(previousCount);
      showAlert('Erro', 'Não foi possível curtir o post.');
    } finally {
      setIsLiking(false);
    }
  };

  const handleAddComment = async () => {
    if (!newCommentText.trim() || !post) return;

    setSendingComment(true);
    try {
      await commentService.addComment(post.id, newCommentText.trim(), replyingTo?.id);
      const commentsData = await commentService.getPostComments(post.id);
      setComments(commentsData);
      setNewCommentText('');
      setReplyingTo(null);
    } catch (error) {
      console.error('Erro ao comentar:', error);
      showAlert('Erro', 'Não foi possível enviar seu comentário.');
    } finally {
      setSendingComment(false);
    }
  };

  const renderHeader = () => {
    if (!post) return null;

    const authorName = post.usuario?.username || 'Surfista';

    return (
      <View style={styles.postHeaderContainer}>
        <TouchableOpacity
          style={styles.postHeaderInfo}
          onPress={() => post.usuario?.id && router.push(`/user/${post.usuario.id}` as Href)}
          activeOpacity={0.7}
        >
          <Image
            source={getUserAvatarSource(post.usuario?.fotoPerfil)}
            style={[styles.postAvatar, getUserAvatarZoomStyle(post.usuario?.fotoPerfil)]}
            resizeMode={getUserAvatarResizeMode(post.usuario?.fotoPerfil)}
          />
          <View>
            <Text style={styles.postAuthor}>{authorName}</Text>
            <Text style={styles.postDate}>{formatDateTimeWithYear(post.data)}</Text>
          </View>
        </TouchableOpacity>

        {post.beach && (
          <TouchableOpacity
            style={styles.beachBadge}
            onPress={() => router.push(`/beach/${post.beach.id}` as Href)}
            activeOpacity={0.7}
          >
            <Ionicons name="location" size={14} color="#2F6F86" />
            <Text style={styles.beachBadgeText}>{post.beach.nome}</Text>
          </TouchableOpacity>
        )}

        {post.caminhoFoto && (
          <Image source={{ uri: post.caminhoFoto }} style={styles.postImage} />
        )}

        {post.descricao && (
          <Text style={styles.postDescription}>{post.descricao}</Text>
        )}

        {/* Barra de Ações (Likes e Comentários) */}
        <View style={styles.postActions}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={handleToggleLike}
              disabled={isLiking}
            >
              <Ionicons
                name={liked ? "heart" : "heart-outline"}
                size={22}
                color={liked ? "#C54A54" : "#6B7280"}
              />
              <Text style={[styles.actionText, liked && styles.actionTextLiked]}>
                {likesCount}
              </Text>
            </TouchableOpacity>

            <View style={styles.actionBtn}>
               <Ionicons name="chatbubble-outline" size={20} color="#6B7280" />
               <Text style={styles.actionText}>{comments.length}</Text>
            </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5C9DB8" />
        <Text style={styles.loadingText}>Carregando registro...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? headerHeight : 0}
    >
      <FlatList
        data={flattenComments(comments)}
        keyExtractor={(item) => String(item.comment.id)}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyStateContainer}>
            <Ionicons name="chatbubbles-outline" size={32} color="#8AB7C3" />
            <Text style={styles.emptyStateText}>Seja o primeiro a comentar!</Text>
          </View>
        }
        renderItem={({ item }) => {
          const { comment, depth } = item;
          const isReply = depth > 0;

          return (
            <View style={[
              styles.commentItemContainer,
              isReply && {
                paddingLeft: Math.min(depth, 2) * 24 + 16,
                borderLeftWidth: 2,
                borderLeftColor: '#E7E2D3',
                marginLeft: 16,
                paddingVertical: 4,
              }
            ]}>
              <View style={styles.commentItem}>
                <TouchableOpacity
                  onPress={() => comment.usuario?.id && router.push(`/user/${comment.usuario.id}` as Href)}
                  activeOpacity={0.7}
                >
                  <Image
                    source={getUserAvatarSource(comment.usuario?.fotoPerfil)}
                    style={[styles.commentAvatar, getUserAvatarZoomStyle(comment.usuario?.fotoPerfil)]}
                    resizeMode={getUserAvatarResizeMode(comment.usuario?.fotoPerfil)}
                  />
                </TouchableOpacity>
                <View style={styles.commentBody}>
                  <View style={styles.commentHeaderRow}>
                    <TouchableOpacity
                      onPress={() => comment.usuario?.id && router.push(`/user/${comment.usuario.id}` as Href)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.commentAuthorName}>{comment.usuario?.username || 'Surfista'}</Text>
                    </TouchableOpacity>
                    <Text style={styles.commentDate}>{formatDateTimeWithYear(comment.data)}</Text>
                  </View>
                  <Text style={styles.commentText}>{comment.texto}</Text>

                  <TouchableOpacity
                    style={styles.commentReplyButton}
                    onPress={() => setReplyingTo(comment)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="arrow-undo-outline" size={12} color="#2F6F86" />
                    <Text style={styles.commentReplyButtonText}>Responder</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        }}
      />

      {replyingTo && (
        <View style={styles.replyingBanner}>
          <Text style={styles.replyingText} numberOfLines={1}>
            Respondendo a <Text style={styles.replyingUser}>@{replyingTo.usuario?.username}</Text>
          </Text>
          <TouchableOpacity
            onPress={() => setReplyingTo(null)}
            style={styles.cancelReplyButton}
          >
            <Ionicons name="close-circle" size={18} color="#6B7280" />
          </TouchableOpacity>
        </View>
      )}

      <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <TextInput
          style={styles.textInput}
          placeholder={replyingTo ? `Responder @${replyingTo.usuario?.username}...` : "Escreva um comentário..."}
          placeholderTextColor="#8B8B8B"
          value={newCommentText}
          onChangeText={setNewCommentText}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!newCommentText.trim() || sendingComment) && styles.sendButtonDisabled]}
          onPress={handleAddComment}
          disabled={!newCommentText.trim() || sendingComment}
        >
          {sendingComment ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Ionicons name="send" size={18} color="#FFF" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F4EB',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F6F4EB',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#5C9DB8',
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 24,
  },
  postHeaderContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E7E2D3',
  },
  postHeaderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  postAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E8E5D4',
  },
  postAvatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E7F1F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: {
    color: '#2F6F86',
    fontSize: 16,
    fontWeight: '800',
  },
  postAuthor: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F4A63',
  },
  postDate: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  postImage: {
    width: '100%',
    height: 300,
    borderRadius: 14,
    marginBottom: 14,
    backgroundColor: '#E8E5D4',
  },
  postDescription: {
    fontSize: 15,
    color: '#273846',
    lineHeight: 22,
    marginBottom: 16,
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F1EA',
    paddingTop: 16,
    marginTop: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  actionTextLiked: {
    color: '#C54A54',
    fontWeight: '800',
  },
  commentItem: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F6F4EB',
    gap: 12,
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  commentAvatarFallback: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E7F1F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentAvatarText: {
    color: '#2F6F86',
    fontSize: 14,
    fontWeight: '800',
  },
  commentBody: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E7E2D3',
  },
  commentHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  commentAuthorName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F4A63',
  },
  commentDate: {
    fontSize: 11,
    color: '#5C7A85',
    fontWeight: '600',
  },
  commentText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyStateText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E7E2D3',
    gap: 10,
  },
  textInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E7E2D3',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 14,
    color: '#1F4A63',
    textAlignVertical: 'top',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2F6F86',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#A0B9C6',
  },
  beachBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E7F1F4',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
    gap: 4,
    marginBottom: 12,
  },
  beachBadgeText: {
    fontSize: 12,
    color: '#2F6F86',
    fontWeight: '600',
  },
  commentItemContainer: {
    backgroundColor: '#F6F4EB',
  },
  commentReplyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    marginTop: 8,
    paddingVertical: 2,
  },
  commentReplyButtonText: {
    fontSize: 12,
    color: '#2F6F86',
    fontWeight: '700',
  },
  replyingBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#E7F1F4',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#C4DEE5',
  },
  replyingText: {
    fontSize: 13,
    color: '#1F4A63',
  },
  replyingUser: {
    fontWeight: '700',
    color: '#2F6F86',
  },
  cancelReplyButton: {
    padding: 2,
  },
});
