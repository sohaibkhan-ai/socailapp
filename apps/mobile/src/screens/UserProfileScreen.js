import React from 'react';
import { View, Text, FlatList } from 'react-native';
import Screen from '@/components/Screen';
import Avatar from '@/components/Avatar';
import Card from '@/components/Card';
import PostCard from '@/components/PostCard';
import Spinner from '@/components/Spinner';
import EmptyState from '@/components/EmptyState';
import { useQuery } from '@tanstack/react-query';
import { api, unwrap } from '@/services/api';
import { usePosts, useToggleLike } from '@/hooks/usePosts';
import { useTheme } from '@/theme';

export default function UserProfileScreen({ navigation, route }) {
  const t = useTheme();
  const userId = route.params?.userId;
  const like = useToggleLike();
  const { data: profile, isLoading: pLoading, isError: pError, refetch: refetchProfile } = useQuery({
    queryKey: ['user', userId],
    enabled: !!userId,
    queryFn: async () => unwrap(await api.get(`/users/${userId}`)),
  });
  const { data, isLoading, refetch } = usePosts({ authorId: userId });
  const posts = data ? data.pages.flatMap((p) => p.items) : [];

  if (pLoading) return <Screen><Spinner /></Screen>;
  if (pError) return <Screen><EmptyState icon="person-outline" title="Could not load profile" onRetry={refetchProfile} /></Screen>;

  return (
    <Screen>
      <FlatList
        data={posts}
        keyExtractor={(item, i) => String(item.id ?? i)}
        onRefresh={refetch}
        refreshing={false}
        ListHeaderComponent={
          <View style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Avatar uri={profile?.avatarUrl} name={profile?.displayName} size={64} />
              <View style={{ flex: 1, marginLeft: 16 }}>
                <Text style={{ color: t.colors.text, fontSize: 22, fontWeight: '800' }}>{profile?.displayName}</Text>
                <Text style={{ color: t.colors.textMuted, fontSize: 14, marginTop: 2 }}>{profile?.role || 'USER'}</Text>
              </View>
            </View>
            {profile?.bio ? <Text style={{ color: t.colors.text, fontSize: 15, marginTop: 12, lineHeight: 22 }}>{profile.bio}</Text> : null}
            <Card style={{ marginTop: 16 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ color: t.colors.text, fontSize: 18, fontWeight: '800' }}>{String(data?.pages[0]?.total ?? posts.length)}</Text>
                  <Text style={{ color: t.colors.textMuted, fontSize: 12 }}>Posts</Text>
                </View>
              </View>
            </Card>
          </View>
        }
        renderItem={({ item }) => <PostCard post={item} onPress={() => navigation.navigate('PostDetail', { postId: item.id })} onLike={() => like.mutate(item.id, item.likedByMe)} />}
        ListEmptyComponent={isLoading ? <Spinner /> : <EmptyState icon="newspaper-outline" title="No posts yet" />}
        contentContainerStyle={{ paddingBottom: 24 }}
      />
    </Screen>
  );
}
