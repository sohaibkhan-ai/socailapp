import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '@/components/Screen';
import Avatar from '@/components/Avatar';
import Card from '@/components/Card';
import Chip from '@/components/Chip';
import Button from '@/components/Button';
import TextField from '@/components/TextField';
import Spinner from '@/components/Spinner';
import EmptyState from '@/components/EmptyState';
import ConfirmDialog from '@/components/ConfirmDialog';
import BottomSheet from '@/components/BottomSheet';
import Divider from '@/components/Divider';
import { showToast } from '@/components/Toast';
import { usePost, useToggleLike, useComments, useAddComment, useDeletePost } from '@/hooks/usePosts';
import { useAuthStore } from '@/store/authStore';
import { api, unwrap, extractMessage } from '@/services/api';
import { commentSchema } from '@/schemas';
import { useTheme } from '@/theme';

export default function PostDetailScreen({ navigation, route }) {
  const t = useTheme();
  const postId = route.params?.postId;
  const user = useAuthStore((s) => s.user);
  const { data: post, isLoading, isError, error, refetch } = usePost(postId);
  const { data: comments, isLoading: commentsLoading, refetch: refetchComments } = useComments(postId);
  const like = useToggleLike(postId);
  const addComment = useAddComment(postId);
  const deletePost = useDeletePost();
  const [commentText, setCommentText] = useState('');
  const [commentError, setCommentError] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (isLoading) return <Screen><Spinner /></Screen>;
  if (isError) return <Screen><EmptyState icon="cloud-offline-outline" title="Could not load post" message={error?.message} onRetry={refetch} /></Screen>;

  const isOwner = post.author?.id === user?.id;
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'MODERATOR';
  const canEdit = isOwner || user?.role === 'ADMIN';

  const submitComment = async () => {
    const parsed = commentSchema.safeParse({ content: commentText.trim() });
    if (!parsed.success) { setCommentError(parsed.error.issues[0].message); return; }
    setCommentError(null);
    try {
      await addComment.mutateAsync(parsed.data.content);
      setCommentText('');
      showToast('Comment added', 'success');
    } catch (e) { showToast(extractMessage(e, 'Could not add comment'), 'error'); }
  };

  const submitReport = async () => {
    if (reportReason.trim().length < 3) { showToast('Please describe the reason', 'error'); return; }
    try {
      await unwrap(api.post('/reports', { targetType: 'post', targetId: postId, reason: reportReason.trim() }));
      setReportOpen(false);
      setReportReason('');
      showToast('Report submitted', 'success');
    } catch (e) { showToast(extractMessage(e, 'Could not submit report'), 'error'); }
  };

  return (
    <Screen>
      <View style={styles.topBar}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Go back" onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={t.colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Report post" onPress={() => setReportOpen(true)} hitSlop={8}>
          <Ionicons name="flag-outline" size={22} color={t.colors.textMuted} />
        </TouchableOpacity>
        {(canEdit || isAdmin) ? (
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Post options" onPress={() => setMenuOpen(true)} hitSlop={8} style={{ marginLeft: 16 }}>
            <Ionicons name="ellipsis-vertical" size={22} color={t.colors.text} />
          </TouchableOpacity>
        ) : null}
      </View>
      <FlatList
        data={comments || []}
        keyExtractor={(c, i) => String(c.id ?? i)}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View>
            <View style={styles.authorRow}>
              <Avatar uri={post.author?.avatarUrl} name={post.author?.displayName} size={44} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.authorName, { color: t.colors.text }]}>{post.author?.displayName || 'Unknown'}</Text>
                <Text style={[styles.date, { color: t.colors.textMuted }]}>{post.createdAt ? new Date(post.createdAt).toLocaleString() : ''}</Text>
              </View>
            </View>
            <Text style={[styles.title, { color: t.colors.text }]}>{post.title}</Text>
            <Text style={[styles.body, { color: t.colors.text }]}>{post.content}</Text>
            {post.tags?.length ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 }}>
                {post.tags.map((tag) => <Chip key={typeof tag === 'string' ? tag : tag.id} label={`#${typeof tag === 'string' ? tag : tag.name}`} />)}
              </View>
            ) : null}
            <View style={styles.actions}>
              <TouchableOpacity accessibilityRole="button" accessibilityLabel={post.likedByMe ? 'Unlike' : 'Like'} onPress={() => like.mutate({ postId, currentlyLiked: post.likedByMe })} style={styles.actionBtn}>
                <Ionicons name={post.likedByMe ? 'heart' : 'heart-outline'} size={22} color={post.likedByMe ? t.colors.error : t.colors.textMuted} />
                <Text style={{ color: post.likedByMe ? t.colors.error : t.colors.textMuted, marginLeft: 6, fontWeight: '600' }}>{post.likeCount ?? 0}</Text>
              </TouchableOpacity>
              <View style={styles.actionBtn}>
                <Ionicons name="chatbubble-outline" size={20} color={t.colors.textMuted} />
                <Text style={{ color: t.colors.textMuted, marginLeft: 6, fontWeight: '600' }}>{comments?.length ?? 0}</Text>
              </View>
            </View>
            <Divider style={{ marginVertical: 12 }} />
            <Text style={[styles.commentsTitle, { color: t.colors.text }]}>Comments</Text>
            {commentsLoading ? <Spinner size="small" /> : null}
            {!commentsLoading && (!comments || comments.length === 0) ? (
              <Text style={[styles.noComments, { color: t.colors.textMuted }]}>No comments yet. Start the conversation.</Text>
            ) : null}
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.comment, { borderBottomColor: t.colors.border }]}>
            <Avatar uri={item.author?.avatarUrl} name={item.author?.displayName} size={32} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={[styles.commentAuthor, { color: t.colors.text }]}>{item.author?.displayName || 'Unknown'}</Text>
              <Text style={[styles.commentBody, { color: t.colors.text }]}>{item.content}</Text>
            </View>
          </View>
        )}
        ListFooterComponent={
          <View style={{ marginTop: 12 }}>
            <TextField label="Add a comment" value={commentText} onChangeText={setCommentText} error={commentError} placeholder="Share your thoughts…" multiline />
            <Button title="Post comment" onPress={submitComment} loading={addComment.isPending} />
          </View>
        }
        contentContainerStyle={{ paddingBottom: 32 }}
      />
      <BottomSheet visible={menuOpen} onClose={() => setMenuOpen(false)}>
        {canEdit ? <Button title="Edit post" variant="secondary" onPress={() => { setMenuOpen(false); navigation.navigate('EditPost', { postId }); }} style={{ marginBottom: 10 }} /> : null}
        {canEdit ? <Button title="Delete post" variant="danger" onPress={() => { setMenuOpen(false); setConfirmDelete(true); }} /> : null}
        {!canEdit && isAdmin ? <Button title="Moderate (resolve reports)" variant="secondary" onPress={() => { setMenuOpen(false); navigation.navigate('MainTabs', { screen: 'Reports' }); }} /> : null}
      </BottomSheet>
      <ConfirmDialog
        visible={confirmDelete}
        title="Delete this post?"
        message="This action cannot be undone."
        confirmLabel="Delete"
        destructive
        onCancel={() => setConfirmDelete(false)}
        onConfirm={async () => {
          setConfirmDelete(false);
          try {
            await deletePost.mutateAsync(postId);
            showToast('Post deleted', 'success');
            navigation.goBack();
          } catch (e) { showToast(extractMessage(e, 'Delete failed'), 'error'); }
        }}
      />
      <BottomSheet visible={reportOpen} onClose={() => setReportOpen(false)}>
        <Text style={[styles.commentsTitle, { color: t.colors.text, marginBottom: 12 }]}>Report this post</Text>
        <TextField label="Reason" value={reportReason} onChangeText={setReportReason} placeholder="Why are you reporting this?" multiline />
        <Button title="Submit report" onPress={submitReport} />
        <Button title="Cancel" variant="ghost" onPress={() => setReportOpen(false)} />
      </BottomSheet>
    </Screen>
  );
}
const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, minHeight: 44 },
  authorRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  authorName: { fontSize: 16, fontWeight: '700' },
  date: { fontSize: 13, marginTop: 2 },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 10, lineHeight: 30 },
  body: { fontSize: 16, lineHeight: 24, marginBottom: 14 },
  actions: { flexDirection: 'row', gap: 24, paddingVertical: 8 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', minHeight: 44 },
  commentsTitle: { fontSize: 18, fontWeight: '700' },
  noComments: { fontSize: 14, marginTop: 8, marginBottom: 4 },
  comment: { flexDirection: 'row', paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  commentAuthor: { fontSize: 13, fontWeight: '700' },
  commentBody: { fontSize: 15, marginTop: 2, lineHeight: 20 },
});
