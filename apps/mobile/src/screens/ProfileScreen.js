import React, { useState } from 'react';
import { View, Text, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '@/components/Screen';
import Avatar from '@/components/Avatar';
import Card from '@/components/Card';
import ListItem from '@/components/ListItem';
import PostCard from '@/components/PostCard';
import Button from '@/components/Button';
import Spinner from '@/components/Spinner';
import EmptyState from '@/components/EmptyState';
import ConfirmDialog from '@/components/ConfirmDialog';
import { showToast } from '@/components/Toast';
import { useAuthStore } from '@/store/authStore';
import { usePosts } from '@/hooks/usePosts';
import { api, unwrap, extractMessage } from '@/services/api';
import { useTheme } from '@/theme';

export default function ProfileScreen({ navigation }) {
  const t = useTheme();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { data, isLoading, refetch } = usePosts({ authorId: user?.id });

  const posts = data ? data.pages.flatMap((p) => p.items) : [];
  const totalLikes = posts.reduce((sum, p) => sum + (p.likeCount || 0), 0);

  const doLogout = async () => {
    setConfirmLogout(false);
    await logout();
    showToast('Logged out', 'success');
  };

  const doDelete = async () => {
    setConfirmDelete(false);
    try {
      await unwrap(api.delete('/users/me'));
      await logout();
      showToast('Account deleted', 'success');
    } catch (e) { showToast(extractMessage(e, 'Could not delete account'), 'error'); }
  };

  return (
    <Screen>
      <FlatList
        data={posts}
        keyExtractor={(item, i) => String(item.id ?? i)}
        showsVerticalScrollIndicator={false}
        onRefresh={refetch}
        refreshing={false}
        ListHeaderComponent={
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <Avatar uri={user?.avatarUrl} name={user?.displayName} size={64} />
              <View style={{ flex: 1, marginLeft: 16 }}>
                <Text style={{ color: t.colors.text, fontSize: 22, fontWeight: '800' }}>{user?.displayName}</Text>
                <Text style={{ color: t.colors.textMuted, fontSize: 14, marginTop: 2 }}>{user?.email}</Text>
              </View>
              <TouchableOpacity accessibilityRole="button" accessibilityLabel="Settings" onPress={() => navigation.navigate('Settings')} hitSlop={8}>
                <Ionicons name="settings-outline" size={24} color={t.colors.textMuted} />
              </TouchableOpacity>
            </View>
            {user?.bio ? <Text style={{ color: t.colors.text, fontSize: 15, marginBottom: 16, lineHeight: 22 }}>{user.bio}</Text> : null}
            <Card>
              <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
                <Stat label="Posts" value={data?.pages[0]?.total ?? posts.length} />
                <Stat label="Likes" value={totalLikes} />
                <Stat label="Role" value={user?.role || 'USER'} />
              </View>
            </Card>
            <ListItem title="Edit profile" onPress={() => navigation.navigate('EditProfile')} />
            <ListItem title="Change password" onPress={() => navigation.navigate('ChangePassword')} />
            <ListItem title="Log out" onPress={() => setConfirmLogout(true)} chevron={false} />
            <ListItem title="Delete account" onPress={() => setConfirmDelete(true)} chevron={false} />
            <View style={{ height: 20 }} />
          </View>
        }
        renderItem={({ item }) => <PostCard post={item} onPress={() => navigation.navigate('PostDetail', { postId: item.id })} />}
        ListEmptyComponent={isLoading ? <Spinner /> : <EmptyState icon="create-outline" title="No posts yet" message="Posts you write will appear here." />}
        contentContainerStyle={{ paddingBottom: 24 }}
      />
      <ConfirmDialog visible={confirmLogout} title="Log out?" message="You'll need to log in again to post." confirmLabel="Log out" onCancel={() => setConfirmLogout(false)} onConfirm={doLogout} />
      <ConfirmDialog visible={confirmDelete} title="Delete your account?" message="This permanently removes your account, posts and comments." confirmLabel="Delete account" destructive onCancel={() => setConfirmDelete(false)} onConfirm={doDelete} />
    </Screen>
  );
}

function Stat({ label, value }) {
  const t = useTheme();
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ color: t.colors.text, fontSize: 18, fontWeight: '800' }}>{String(value)}</Text>
      <Text style={{ color: t.colors.textMuted, fontSize: 12, marginTop: 2 }}>{label}</Text>
    </View>
  );
}
import { TouchableOpacity } from 'react-native';
