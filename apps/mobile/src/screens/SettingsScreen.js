import React from 'react';
import { Text, View, StyleSheet, Switch } from 'react-native';
import Screen from '@/components/Screen';
import ListItem from '@/components/ListItem';
import Divider from '@/components/Divider';
import { useSettingsStore } from '@/store/settingsStore';
import { useTheme } from '@/theme';

const OPTIONS = ['light', 'dark', 'system'];

export default function SettingsScreen({ navigation }) {
  const t = useTheme();
  const themePref = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);

  return (
    <Screen contentStyle={{ paddingTop: 8 }}>
      <Text style={[styles.title, { color: t.colors.text }]}>Settings</Text>
      <Text style={[styles.section, { color: t.colors.textMuted }]}>Appearance</Text>
      <View style={[styles.card, { backgroundColor: t.colors.surface, borderColor: t.colors.border }]}>
        {OPTIONS.map((opt, i) => (
          <React.Fragment key={opt}>
            <ListItem
              title={opt.charAt(0).toUpperCase() + opt.slice(1)}
              left={<Switch value={themePref === opt} onValueChange={(v) => v && setTheme(opt)} accessibilityLabel={`${opt} theme`} trackColor={{ true: t.colors.primary }} />}
              chevron={false}
              onPress={() => setTheme(opt)}
            />
            {i < OPTIONS.length - 1 ? <Divider /> : null}
          </React.Fragment>
        ))}
      </View>
      <Text style={[styles.section, { color: t.colors.textMuted }]}>About</Text>
      <View style={[styles.card, { backgroundColor: t.colors.surface, borderColor: t.colors.border }]}>
        <ListItem title="SocialHub" subtitle="Version 1.0.0" chevron={false} />
        <Divider />
        <ListItem title="Built with Expo" subtitle="React Native · React Query · Zustand" chevron={false} />
      </View>
    </Screen>
  );
}
const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: '800', marginBottom: 20 },
  section: { fontSize: 13, fontWeight: '700', marginBottom: 8, textTransform: 'uppercase' },
  card: { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, marginBottom: 20, paddingHorizontal: 12 },
});
