import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Screen from '@/components/Screen';
import TextField from '@/components/TextField';
import Button from '@/components/Button';
import { resetPasswordSchema } from '@/schemas';
import { api, unwrap, extractMessage } from '@/services/api';
import { showToast } from '@/components/Toast';
import { useTheme } from '@/theme';

export default function ResetPasswordScreen({ navigation }) {
  const t = useTheme();
  const { handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token: '', newPassword: '' },
  });

  const onSubmit = async (values) => {
    try {
      await unwrap(api.post('/auth/reset-password', values));
      showToast('Password reset. Please log in.', 'success');
      navigation.navigate('Login');
    } catch (e) {
      showToast(extractMessage(e, 'Reset failed'), 'error');
    }
  };

  return (
    <Screen keyboard contentStyle={{ paddingTop: 12 }}>
      <Text style={[styles.title, { color: t.colors.text }]}>Reset password</Text>
      <Text style={[styles.sub, { color: t.colors.textMuted }]}>Paste the token from your email and set a new password.</Text>
      <TextField label="Reset token" value={watch('token')} onChangeText={(v) => setValue('token', v)} error={errors.token?.message} autoCapitalize="none" />
      <TextField label="New password" secure value={watch('newPassword')} onChangeText={(v) => setValue('newPassword', v)} error={errors.newPassword?.message} placeholder="At least 8 characters" />
      <Button title="Reset password" onPress={handleSubmit(onSubmit)} loading={isSubmitting} />
    </Screen>
  );
}
const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: '800', marginBottom: 4 },
  sub: { fontSize: 16, marginBottom: 24 },
});
