import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Screen from '@/components/Screen';
import TextField from '@/components/TextField';
import Button from '@/components/Button';
import { loginSchema } from '@/schemas';
import { useAuthStore } from '@/store/authStore';
import { extractMessage } from '@/services/api';
import { showToast } from '@/components/Toast';
import { useTheme } from '@/theme';

export default function LoginScreen({ navigation }) {
  const t = useTheme();
  const login = useAuthStore((s) => s.login);
  const { control, handleSubmit, formState: { errors, isSubmitting }, setValue, watch, setError } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });
  const [apiError, setApiError] = React.useState(null);

  const onSubmit = async (values) => {
    setApiError(null);
    try {
      await login(values);
      showToast('Welcome back!', 'success');
    } catch (e) {
      const msg = extractMessage(e, 'Login failed');
      setApiError(msg);
      if (e?.response?.status === 422 || msg.toLowerCase().includes('password')) {
        setError('password', { message: msg });
      }
    }
  };

  return (
    <Screen keyboard>
      <View style={styles.wrap}>
        <Text style={[styles.title, { color: t.colors.text }]}>Welcome back</Text>
        <Text style={[styles.sub, { color: t.colors.textMuted }]}>Log in to continue</Text>
        <TextField label="Email" value={watch('email')} onChangeText={(v) => setValue('email', v)} error={errors.email?.message} keyboardType="email-address" autoCapitalize="none" placeholder="you@example.com" />
        <TextField label="Password" secure value={watch('password')} onChangeText={(v) => setValue('password', v)} error={errors.password?.message} placeholder="Your password" />
        {apiError ? <Text style={[styles.apiError, { color: t.colors.error }]} accessibilityRole="alert">{apiError}</Text> : null}
        <Button title="Log in" onPress={handleSubmit(onSubmit)} loading={isSubmitting} style={{ marginTop: 8 }} />
        <Button title="Create an account" variant="ghost" onPress={() => navigation.navigate('Register')} />
        <Button title="Forgot password?" variant="ghost" onPress={() => navigation.navigate('ForgotPassword')} />
      </View>
    </Screen>
  );
}
const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'center', paddingHorizontal: 4 },
  title: { fontSize: 28, fontWeight: '800', marginBottom: 4 },
  sub: { fontSize: 16, marginBottom: 24 },
  apiError: { fontSize: 13, marginBottom: 10, textAlign: 'center' },
});
