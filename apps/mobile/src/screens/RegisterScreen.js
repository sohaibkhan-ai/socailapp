import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Screen from '@/components/Screen';
import TextField from '@/components/TextField';
import Button from '@/components/Button';
import { registerSchema } from '@/schemas';
import { useAuthStore } from '@/store/authStore';
import { extractMessage } from '@/services/api';
import { showToast } from '@/components/Toast';
import { useTheme } from '@/theme';

export default function RegisterScreen({ navigation }) {
  const t = useTheme();
  const register = useAuthStore((s) => s.register);
  const { handleSubmit, setValue, watch, formState: { errors, isSubmitting }, setError } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: '', password: '', displayName: '' },
  });
  const [apiError, setApiError] = React.useState(null);

  const onSubmit = async (values) => {
    setApiError(null);
    try {
      await register(values);
      showToast('Account created!', 'success');
    } catch (e) {
      const msg = extractMessage(e, 'Registration failed');
      if (e?.response?.status === 409 || msg.toLowerCase().includes('exist')) {
        setError('email', { message: msg });
      } else setApiError(msg);
    }
  };

  return (
    <Screen scroll keyboard contentStyle={{ padding: 20 }}>
      <Text style={[styles.title, { color: t.colors.text }]}>Create account</Text>
      <Text style={[styles.sub, { color: t.colors.textMuted }]}>Join SocialHub today</Text>
      <TextField label="Display name" value={watch('displayName')} onChangeText={(v) => setValue('displayName', v)} error={errors.displayName?.message} placeholder="Jane Doe" autoCapitalize="words" />
      <TextField label="Email" value={watch('email')} onChangeText={(v) => setValue('email', v)} error={errors.email?.message} keyboardType="email-address" autoCapitalize="none" placeholder="you@example.com" />
      <TextField label="Password" secure value={watch('password')} onChangeText={(v) => setValue('password', v)} error={errors.password?.message} placeholder="At least 8 characters" />
      {apiError ? <Text style={[styles.apiError, { color: t.colors.error }]} accessibilityRole="alert">{apiError}</Text> : null}
      <Button title="Sign up" onPress={handleSubmit(onSubmit)} loading={isSubmitting} />
      <Button title="Already have an account? Log in" variant="ghost" onPress={() => navigation.goBack()} />
    </Screen>
  );
}
const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: '800', marginBottom: 4 },
  sub: { fontSize: 16, marginBottom: 24 },
  apiError: { fontSize: 13, marginBottom: 10, textAlign: 'center' },
});
