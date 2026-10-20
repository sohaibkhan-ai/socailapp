import React from 'react';
import { Text, StyleSheet, View, TouchableOpacity, Image } from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Screen from '@/components/Screen';
import TextField from '@/components/TextField';
import Button from '@/components/Button';
import Avatar from '@/components/Avatar';
import { showToast } from '@/components/Toast';
import { profileSchema } from '@/schemas';
import { useAuthStore } from '@/store/authStore';
import { api, unwrap, extractMessage, mediaUrl } from '@/services/api';
import { useTheme } from '@/theme';

export default function EditProfileScreen({ navigation }) {
  const t = useTheme();
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const [avatar, setAvatar] = React.useState(mediaUrl(user?.avatarUrl));
  const [saving, setSaving] = React.useState(false);
  const { handleSubmit, setValue, watch, formState: { errors } } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: { displayName: user?.displayName || '', bio: user?.bio || '' },
  });

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7, allowsEditing: true, aspect: [1, 1] });
    if (!res.canceled && res.assets?.[0]) setAvatar(res.assets[0].uri);
  };

  const onSubmit = async (values) => {
    setSaving(true);
    try {
      await unwrap(api.patch('/users/me', values));
      await updateUser(values);
      if (avatar && avatar !== mediaUrl(user?.avatarUrl)) {
        const form = new FormData();
        form.append('file', { uri: avatar, name: 'avatar.jpg', type: 'image/jpeg' });
        const res = await unwrap(api.post('/users/me/avatar', form, { headers: { 'Content-Type': 'multipart/form-data' } }));
        await updateUser({ avatarUrl: res?.avatarUrl || user?.avatarUrl });
      }
      showToast('Profile updated', 'success');
      navigation.goBack();
    } catch (e) {
      showToast(extractMessage(e, 'Could not update profile'), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen keyboard contentStyle={{ paddingTop: 12 }}>
      <Text style={[styles.title, { color: t.colors.text }]}>Edit profile</Text>
      <View style={{ alignItems: 'center', marginBottom: 20 }}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Change profile photo" onPress={pickImage}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={{ width: 88, height: 88, borderRadius: 44 }} />
          ) : (
            <Avatar name={user?.displayName} size={88} />
          )}
          <View style={[styles.editBadge, { backgroundColor: t.colors.primary }]}>
            <Ionicons name="camera" size={14} color="#fff" />
          </View>
        </TouchableOpacity>
      </View>
      <TextField label="Display name" value={watch('displayName')} onChangeText={(v) => setValue('displayName', v)} error={errors.displayName?.message} />
      <TextField label="Bio" value={watch('bio')} onChangeText={(v) => setValue('bio', v)} error={errors.bio?.message} multiline numberOfLines={3} placeholder="Tell people about yourself" />
      <Button title="Save" onPress={handleSubmit(onSubmit)} loading={saving} />
    </Screen>
  );
}
const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: '800', marginBottom: 20 },
  editBadge: { position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
