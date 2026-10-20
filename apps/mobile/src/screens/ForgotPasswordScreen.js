import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Screen from '@/components/Screen';
import TextField from '@/components/TextField';
import Button from '@/components/Button';
import { forgotPasswordSchema } from '@/schemas';
import { api, unwrap, extractMessage } from '@/services/api';
import { showToast } from '@/components/Toast';
import { useTheme } from '@/theme';

export default function ForgotPasswordScreen({ navigation }) {
  const t = useTheme();
  const { handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (values) => {
    try {
      await unwrap(api.post('/auth/forgot-password', values));
      showToast('If that email exists, a reset link was sent', 'success');
      navigation.navigate('ResetPassword');
    } catch (e) {
      showToast(extractMessage(e, 'Could not send reset email'), 'error');
    }
  };

  return (
    <Screen keyboard contentStyle={{ padding: 20 }}>
      <Text style={[styles.title, { color: t.colors.text }]}>Forgot password</Text>
      <Text style={[styles.sub, { color: t.colors.textMuted }]}>Enter your email and we'll send a reset link.</Text>
      <TextField label="Email" value={watch('email')} onChangeText={(v) => setValue('email', v)} error={errors.email?.message} keyboardType="email-address" autoCapitalize="none" />
      <Button title="Send reset link" onPress={handleSubmit(onSubmit)} loading={isSubmitting} />
      <Button title="Back to login" variant="ghost" onPress={() => navigation.goBack()} />
    </Screen>
  );
}
const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: '800', marginBottom: 4 },
  sub: { fontSize: 16, marginBottom: 24 },
});
