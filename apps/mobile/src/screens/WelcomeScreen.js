import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import Button from '@/components/Button';

export default function WelcomeScreen({ navigation }) {
  const t = useTheme();
  return (
    <SafeAreaView style={[styles.fill, { backgroundColor: t.colors.background }]}>
      <View style={styles.center}>
        <View style={[styles.logo, { backgroundColor: t.colors.primary }]}>
          <Ionicons name="people" size={48} color="#fff" />
        </View>
        <Text style={[styles.title, { color: t.colors.text }]}>SocialHub</Text>
        <Text style={[styles.sub, { color: t.colors.textMuted }]}>Connect, share, and discover with your community.</Text>
        <Button title="Get started" onPress={() => navigation.navigate('Register')} style={styles.btn} />
        <Button title="Log in" variant="ghost" onPress={() => navigation.navigate('Login')} style={styles.btn} />
      </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  fill: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  logo: { width: 96, height: 96, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  title: { fontSize: 32, fontWeight: '800', marginBottom: 8 },
  sub: { fontSize: 16, textAlign: 'center', marginBottom: 40 },
  btn: { alignSelf: 'stretch', marginBottom: 12 },
});
