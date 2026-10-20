import React from 'react';
import { Text, View, StyleSheet, FlatList } from 'react-native';
import Screen from '@/components/Screen';
import Card from '@/components/Card';
import Badge from '@/components/Badge';
import Button from '@/components/Button';
import EmptyState from '@/components/EmptyState';
import ErrorState from '@/components/ErrorState';
import Spinner from '@/components/Spinner';
import { showToast } from '@/components/Toast';
import { useReports } from '@/hooks/usePosts';
import { api, unwrap, extractMessage } from '@/services/api';
import { useTheme } from '@/theme';

export default function AdminReportsScreen() {
  const t = useTheme();
  const { data: reports, isLoading, isError, error, refetch } = useReports();

  const act = async (id, action) => {
    try {
      await unwrap(api.post(`/reports/${id}/${action === 'resolve' ? 'resolve' : 'dismiss'}`));
      showToast(`Report ${action}d`, 'success');
      refetch();
    } catch (e) {
      showToast(extractMessage(e, `Could not ${action} report`), 'error');
    }
  };

  return (
    <Screen>
      <Text style={[styles.title, { color: t.colors.text }]}>Reports</Text>
      {isLoading ? <Spinner /> : isError ? <ErrorState message={error?.message} onRetry={refetch} /> : (
        <FlatList
          data={reports || []}
          keyExtractor={(r, i) => String(r.id ?? i)}
          onRefresh={refetch}
          refreshing={false}
          ListEmptyComponent={<EmptyState icon="shield-checkmark-outline" title="No reports" message="All clear — nothing needs review." />}
          renderItem={({ item }) => (
            <Card>
              <View style={styles.row}>
                <Badge color={item.status === 'RESOLVED' ? t.colors.success : item.status === 'DISMISSED' ? t.colors.textMuted : t.colors.warning}>
                  {item.status || 'PENDING'}
                </Badge>
                <Text style={[styles.target, { color: t.colors.textMuted }]}>{item.targetType} · #{item.targetId}</Text>
              </View>
              <Text style={[styles.reason, { color: t.colors.text }]}>{item.reason}</Text>
              {item.status === 'PENDING' ? (
                <View style={styles.actions}>
                  <Button title="Resolve" onPress={() => act(item.id, 'resolve')} style={{ flex: 1 }} />
                  <Button title="Dismiss" variant="secondary" onPress={() => act(item.id, 'dismiss')} style={{ flex: 1 }} />
                </View>
              ) : null}
            </Card>
          )}
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      )}
    </Screen>
  );
}
const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: '800', marginBottom: 16 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  target: { fontSize: 13 },
  reason: { fontSize: 15, lineHeight: 21, marginBottom: 12 },
  actions: { flexDirection: 'row', gap: 10 },
});
