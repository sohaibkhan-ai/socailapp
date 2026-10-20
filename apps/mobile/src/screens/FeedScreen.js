import React from 'react';
import { FlatList, View, Text } from 'react-native';
import Screen from '@/components/Screen';
import PostCard from '@/components/PostCard';
import EmptyState from '@/components/EmptyState';
import ErrorState from '@/components/ErrorState';
import SkeletonList from '@/components/Skeleton';
import Spinner from '@/components/Spinner';
import { usePosts, useToggleLike } from '@/hooks/usePosts';
import { useAuthStore } from '@/store/authStore';
import { useTheme } from '@/theme';

export default function FeedScreen({ navigation }) {
  const t = useTheme();
  const user = useAuthStore((s) => s.user);
  const { data, isLoading, isError, error, refetch, isRefetching, fetchNextPage, hasNextPage, isFetchingNextPage } = usePosts({ sort: 'newest' });
  const like = useToggleLike();
  const posts = data ? data.pages.flatMap((p) => p.items) : [];

  if (isLoading) return <Screen><SkeletonList /></Screen>;
  if (isError) return <Screen><ErrorState message={error?.message} onRetry={refetch} /></Screen>;

  return (
    <Screen>
      <FlatList
        data={posts}
        keyExtractor={(item, i) => String(item.id ?? i)}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            onPress={() => navigation.navigate('PostDetail', { postId: item.id })}
            onLike={() => like.mutate({ postId: item.id, currentlyLiked: item.likedByMe })}
          />
        )}
        refreshControl={<Refresh refreshing={isRefetching} onRefresh={refetch} color={t.colors.primary} />}
        onEndReached={() => hasNextPage && !isFetchingNextPage && fetchNextPage()}
        onEndReachedThreshold={0.4}
        ListFooterComponent={isFetchingNextPage ? <Spinner size="small" /> : null}
        ListEmptyComponent={<EmptyState icon="newspaper-outline" title="No posts yet" message="Be the first to share something." onRetry={refetch} />}
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  );
}

import { RefreshControl } from 'react-native';
function Refresh(props) { return <RefreshControl {...props} />; }
