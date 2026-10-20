import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import Avatar from './Avatar';
import Card from './Card';
import Chip from './Chip';
import { typography } from '@/theme';

export default function PostCard({ post, onPress, onLike, onLongPress }) {
  const t = useTheme();
  const liked = !!post.likedByMe;
  return (
    <Card>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Open post ${post.title}`} onPress={onPress} onLongPress={onLongPress} activeOpacity={0.7}>
        <View style={styles.header}>
          <Avatar uri={post.author?.avatarUrl} name={post.author?.displayName} size={40} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={[styles.author, { color: t.colors.text }]} numberOfLines={1} ellipsizeMode="tail">{post.author?.displayName || 'Unknown'}</Text>
            <Text style={[styles.time, { color: t.colors.textMuted }]} numberOfLines={1}>
              {post.createdAt && !Number.isNaN(new Date(post.createdAt).getTime()) ? new Date(post.createdAt).toLocaleDateString() : ''}
            </Text>
          </View>
        </View>
        <Text style={[styles.title, { color: t.colors.text }]} numberOfLines={2} ellipsizeMode="tail">{post.title}</Text>
        <Text style={[styles.content, { color: t.colors.textMuted }]} numberOfLines={3}>{post.content}</Text>
      </TouchableOpacity>
      {post.tags?.length ? (
        <View style={[styles.tags, { flexDirection: 'row', flexWrap: 'wrap' }]}>
          {post.tags.slice(0, 5).map((tag) => (
            <Chip key={typeof tag === 'string' ? tag : tag.id} label={typeof tag === 'string' ? `#${tag}` : `#${tag.name}`} />
          ))}
        </View>
      ) : null}
      <View style={styles.footer}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={liked ? 'Unlike post' : 'Like post'}
          accessibilityState={{ selected: liked }}
          onPress={onLike}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={styles.likeBtn}
        >
          <Ionicons name={liked ? 'heart' : 'heart-outline'} size={22} color={liked ? t.colors.error : t.colors.textMuted} />
          <Text style={[styles.count, { color: liked ? t.colors.error : t.colors.textMuted }]}>{post.likeCount ?? 0}</Text>
        </TouchableOpacity>
        <View style={styles.likeBtn}>
          <Ionicons name="chatbubble-outline" size={20} color={t.colors.textMuted} />
          <Text style={[styles.count, { color: t.colors.textMuted }]}>{post.commentsCount ?? post.commentCount ?? 0}</Text>
        </View>
      </View>
    </Card>
  );
}
const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  author: { fontSize: 14, fontWeight: '600' },
  time: { fontSize: 12, marginTop: 1 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 6 },
  content: { fontSize: 15, lineHeight: 21, marginBottom: 10 },
  tags: { marginBottom: 10 },
  footer: { flexDirection: 'row', gap: 24, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(0,0,0,0.06)', paddingTop: 10 },
  likeBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44, justifyContent: 'center' },
  count: { fontSize: 14, fontWeight: '600' },
});
