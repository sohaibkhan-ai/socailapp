import React, { useEffect, useState } from 'react';
import { FlatList, View } from 'react-native';
import Screen from '@/components/Screen';
import SearchBar from '@/components/SearchBar';
import Chip from '@/components/Chip';
import PostCard from '@/components/PostCard';
import EmptyState from '@/components/EmptyState';
import ErrorState from '@/components/ErrorState';
import SkeletonList from '@/components/Skeleton';
import { usePosts, useToggleLike } from '@/hooks/usePosts';
import { useDebounce } from '@/hooks/useDebounce';
import { useTheme } from '@/theme';

const SORTS = ['newest', 'oldest'];

export default function SearchScreen({ navigation }) {
  const t = useTheme();
  const [query, setQuery] = useState('');
  const [tag, setTag] = useState(null);
  const [sort, setSort] = useState('newest');
  const search = useDebounce(query.trim(), 400);
  const { data, isLoading, isError, error, refetch, isRefetching, fetchNextPage, hasNextPage, isFetchingNextPage } = usePosts({ search: search || undefined, tag: tag || undefined, sort });
  const like = useToggleLike();
  const posts = data ? data.pages.flatMap((p) => p.items) : [];

  return (
    <Screen>
      <SearchBar value={query} onChangeText={setQuery} placeholder="Search posts…" />
      <View style={{ flexDirection: 'row', marginVertical: 10 }}>
        {SORTS.map((s) => (
          <Chip key={s} label={s === 'newest' ? 'Newest' : 'Oldest'} active={sort === s} onPress={() => setSort(s)} />
        ))}
      </View>
      {tag ? <Chip label={`#${tag} ✕`} active onPress={() => setTag(null)} style={{ alignSelf: 'flex-start' }} /> : null}
      {isLoading ? <SkeletonList /> : isError ? (
        <ErrorState message={error?.message} onRetry={refetch} />
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item, i) => String(item.id ?? i)}
          renderItem={({ item }) => (
            <PostCard post={item} onPress={() => navigation.navigate('PostDetail', { postId: item.id })} onLike={() => like.mutate({ postId: item.id, currentlyLiked: item.likedByMe })} />
          )}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={t.colors.primary} />}
          onEndReached={() => hasNextPage && !isFetchingNextPage && fetchNextPage()}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={<EmptyState icon="search-outline" title={search ? 'No results' : 'Nothing here yet'} message={search ? `No posts match "${search}"` : 'Try a search or browse the feed.'} onRetry={refetch} />}
          contentContainerStyle={{ paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </Screen>
  );
}
import { RefreshControl } from 'react-native';
