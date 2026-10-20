import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Screen from '@/components/Screen';
import TextField from '@/components/TextField';
import Button from '@/components/Button';
import Spinner from '@/components/Spinner';
import { showToast } from '@/components/Toast';
import { usePost, useUpdatePost } from '@/hooks/usePosts';
import { postCreateSchema } from '@/schemas';
import { extractMessage } from '@/services/api';
import { useTheme } from '@/theme';

export default function EditPostScreen({ navigation, route }) {
  const t = useTheme();
  const postId = route.params?.postId;
  const { data: post, isLoading } = usePost(postId);
  const updatePost = useUpdatePost();
  const { control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(postCreateSchema),
    defaultValues: { title: '', content: '', tags: [] },
  });

  React.useEffect(() => {
    if (post) {
      reset({
        title: post.title || '',
        content: post.content || '',
        tags: (post.tags || []).map((tg) => (typeof tg === 'string' ? tg : tg.name)),
      });
    }
  }, [post, reset]);

  if (isLoading) return <Screen><Spinner /></Screen>;

  const onSubmit = async (values) => {
    try {
      await updatePost.mutateAsync({ id: postId, ...values });
      showToast('Post updated', 'success');
      navigation.goBack();
    } catch (e) {
      showToast(extractMessage(e, 'Update failed'), 'error');
    }
  };

  return (
    <Screen keyboard contentStyle={{ padding: 20 }}>
      <Text style={[styles.title, { color: t.colors.text }]}>Edit post</Text>
      <Controller control={control} name="title" render={({ field: { onChange, value } }) => <TextField label="Title" value={value} onChangeText={onChange} error={errors.title?.message} />} />
      <Controller control={control} name="content" render={({ field: { onChange, value } }) => <TextField label="Content" value={value} onChangeText={onChange} error={errors.content?.message} multiline style={{ minHeight: 140, textAlignVertical: 'top' }} />} />
      <Button title="Save changes" onPress={handleSubmit(onSubmit)} loading={isSubmitting || updatePost.isPending} />
    </Screen>
  );
}
const styles = StyleSheet.create({ title: { fontSize: 24, fontWeight: '800', marginBottom: 20 } });
import { Controller } from 'react-hook-form';
