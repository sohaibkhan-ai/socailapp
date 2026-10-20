import React from 'react';
import { Text, StyleSheet, ScrollView, View } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import TextField from '@/components/TextField';
import Button from '@/components/Button';
import { showToast } from '@/components/Toast';
import { useCreatePost } from '@/hooks/usePosts';
import { postCreateSchema } from '@/schemas';
import { extractMessage } from '@/services/api';
import { useTheme } from '@/theme';

export default function CreatePostScreen({ navigation }) {
  const t = useTheme();
  const createPost = useCreatePost();
  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(postCreateSchema),
    defaultValues: { title: '', content: '', tags: [] },
  });
  const [tagInput, setTagInput] = React.useState('');
  const [tags, setTags] = React.useState([]);
  const [apiError, setApiError] = React.useState(null);

  const addTag = () => {
    const tag = tagInput.trim().replace(/^#/, '').toLowerCase();
    if (!tag || tags.includes(tag) || tags.length >= 10) return;
    setTags([...tags, tag]);
    setTagInput('');
  };

  const onSubmit = async (values) => {
    setApiError(null);
    try {
      await createPost.mutateAsync({ ...values, tags });
      showToast('Post published', 'success');
      navigation.goBack();
    } catch (e) {
      setApiError(extractMessage(e, 'Could not publish post'));
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.background }} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Close" onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="close" size={26} color={t.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: t.colors.text }]}>New post</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
        <TextField label="Title" value={control._defaultValues.title || ''} onChangeText={() => {}} editable={false} style={{ display: 'none' }} />
        <Controller
          control={control}
          name="title"
          render={({ field: { onChange, value } }) => (
            <TextField label="Title" value={value} onChangeText={onChange} error={errors.title?.message} placeholder="Give it a title" />
          )}
        />
        <Controller
          control={control}
          name="content"
          render={({ field: { onChange, value } }) => (
            <TextField label="Content" value={value} onChangeText={onChange} error={errors.content?.message} placeholder="Write something…" multiline numberOfLines={6} style={{ minHeight: 140, textAlignVertical: 'top' }} />
          )}
        />
        <Text style={[styles.label, { color: t.colors.textMuted }]}>Tags</Text>
        <View style={styles.tagRow}>
          <TextField value={tagInput} onChangeText={setTagInput} placeholder="Add tag…" onSubmitEditing={addTag} returnKeyType="done" style={{ flex: 1, marginBottom: 0 }} containerStyle={{ flex: 1 }} />
          <Button title="Add" variant="secondary" onPress={addTag} />
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginVertical: 10 }}>
          {tags.map((tag) => (
            <View key={tag} style={[styles.tagChip, { backgroundColor: t.colors.primarySoft }]}>
              <Text style={{ color: t.colors.primary, fontWeight: '600', fontSize: 13 }}>#{tag}</Text>
              <TouchableOpacity accessibilityLabel={`Remove tag ${tag}`} onPress={() => setTags(tags.filter((x) => x !== tag))} hitSlop={6}>
                <Ionicons name="close" size={14} color={t.colors.primary} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
        {apiError ? <Text style={[styles.apiError, { color: t.colors.error }]} accessibilityRole="alert">{apiError}</Text> : null}
        <Button title="Publish" onPress={handleSubmit(onSubmit)} loading={isSubmitting || createPost.isPending} />
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14, minHeight: 56 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  label: { fontSize: 13, marginBottom: 6, fontWeight: '600' },
  tagRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  tagChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, marginRight: 8, marginBottom: 8 },
  apiError: { fontSize: 13, marginBottom: 10, textAlign: 'center' },
});
import { TouchableOpacity } from 'react-native';
