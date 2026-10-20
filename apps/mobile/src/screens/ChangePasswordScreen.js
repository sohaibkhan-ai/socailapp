import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Screen from '@/components/Screen';
import TextField from '@/components/TextField';
import Button from '@/components/Button';
import { showToast } from '@/components/Toast';
import { changePasswordSchema } from '@/schemas';
import { api, unwrap, extractMessage } from '@/services/api';
import { useTheme } from '@/theme';

export default function ChangePasswordScreen({ navigation }) {
  const t = useTheme();
  const [saving, setSaving] = React.useState(false);
  const { handleSubmit, setValue, watch, formState: { errors } } = useForm({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '' },
  });

  const onSubmit = async (values) => {
    setSaving(true);
    try {
      await unwrap(api.post('/auth/change-password', values));
      showToast('Password changed', 'success');
      navigation.goBack();
    } catch (e) {
      showToast(extractMessage(e, 'Could not change password'), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen keyboard contentStyle={{ padding: 20 }}>
      <Text style={[styles.title, { color: t.colors.text }]}>Change password</Text>
      <TextField label="Current password" secure value={watch('currentPassword')} onChangeText={(v) => setValue('currentPassword', v)} error={errors.currentPassword?.message} />
      <TextField label="New password" secure value={watch('newPassword')} onChangeText={(v) => setValue('newPassword', v)} error={errors.newPassword?.message} placeholder="At least 8 characters" />
      <Button title="Update password" onPress={handleSubmit(onSubmit)} loading={saving} />
    </Screen>
  );
}
const styles = StyleSheet.create({ title: { fontSize: 24, fontWeight: '800', marginBottom: 20 } });
