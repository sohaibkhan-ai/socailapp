import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, unwrap } from '@/services/api';
import { useAuthStore } from '@/store/authStore';

function normalizePage(data) {
  if (!data) return { items: [], total: 0, totalPages: 1 };
  if (Array.isArray(data)) return { items: data, total: data.length, totalPages: 1 };
  if (Array.isArray(data.items)) return data;
  if (Array.isArray(data.data)) return { items: data.data, total: data.total ?? 0, totalPages: data.totalPages ?? 1 };
  return { items: [], total: 0, totalPages: 1 };
}

export function usePosts({ search, tag, sort, authorId } = {}) {
  return useInfiniteQuery({
    queryKey: ['posts', { search, tag, sort, authorId }],
    initialPageParam: 1,
    queryFn: async ({ pageParam = 1 }) => {
      const res = await api.get('/posts', {
        params: { page: pageParam, limit: 10, ...(search ? { search } : {}), ...(tag ? { tag } : {}), ...(sort ? { sort } : {}), ...(authorId ? { authorId } : {}) },
      });
      return normalizePage(unwrap(res));
    },
    getNextPageParam: (last, all) => {
      const totalPages = last?.totalPages ?? 1;
      return all.length < totalPages ? all.length + 1 : undefined;
    },
  });
}

export function usePost(id) {
  return useQuery({
    queryKey: ['post', id],
    enabled: !!id,
    queryFn: async () => unwrap(await api.get(`/posts/${id}`)),
  });
}

export function useCreatePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => unwrap(await api.post('/posts', payload)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['posts'] }),
  });
}

export function useUpdatePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }) => unwrap(await api.patch(`/posts/${id}`, payload)),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['posts'] });
      if (data?.id) qc.invalidateQueries({ queryKey: ['post', data.id] });
    },
  });
}

export function useDeletePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => unwrap(await api.delete(`/posts/${id}`)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['posts'] }),
  });
}

export function useToggleLike(postId) {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  return useMutation({
    mutationFn: async (currentlyLiked) => {
      if (currentlyLiked) return unwrap(await api.delete(`/posts/${postId}/like`));
      return unwrap(await api.post(`/posts/${postId}/like`));
    },
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ['post', postId] });
      const prev = qc.getQueryData(['post', postId]);
      if (prev) {
        qc.setQueryData(['post', postId], {
          ...prev,
          likedByMe: !prev.likedByMe,
          likeCount: (prev.likeCount || 0) + (prev.likedByMe ? -1 : 1),
        });
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(['post', postId], ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['post', postId] });
      qc.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}

export function useComments(postId) {
  return useQuery({
    queryKey: ['comments', postId],
    enabled: !!postId,
    queryFn: async () => {
      const data = unwrap(await api.get(`/posts/${postId}/comments`));
      return Array.isArray(data) ? data : data?.items || [];
    },
  });
}

export function useAddComment(postId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (content) => unwrap(await api.post(`/posts/${postId}/comments`, { content })),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comments', postId] });
      qc.invalidateQueries({ queryKey: ['post', postId] });
    },
  });
}

export function useProfile() {
  return useQuery({
    queryKey: ['me'],
    queryFn: async () => unwrap(await api.get('/users/me')),
  });
}

export function useReports() {
  return useQuery({
    queryKey: ['reports'],
    queryFn: async () => {
      const data = unwrap(await api.get('/reports'));
      return Array.isArray(data) ? data : data?.items || [];
    },
  });
}
