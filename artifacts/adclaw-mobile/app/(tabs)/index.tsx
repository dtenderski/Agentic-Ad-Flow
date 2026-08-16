import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useColors } from '@/hooks/useColors';
import { classifyError } from '@/hooks/useConnectionStatus';
import { Feather } from '@expo/vector-icons';
import { useListPipelineRuns } from '@workspace/api-client-react';
import type { PipelineRun } from '@workspace/api-client-react';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const STATUS_COLORS: Record<string, string> = {
  pending: '#7878A0',
  running: '#3B82F6',
  completed: '#22C55E',
  failed: '#EF4444',
};

function PipelineCard({ item, onPress }: { item: PipelineRun; onPress: () => void }) {
  const colors = useColors();
  const statusColor = STATUS_COLORS[item.status] ?? colors.mutedForeground;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: pressed ? 0.75 : 1,
        },
      ]}
    >
      <View style={styles.cardRow}>
        <View style={[styles.statusPill, { backgroundColor: statusColor + '22', borderColor: statusColor + '44' }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>{item.status.toUpperCase()}</Text>
        </View>
        <Text style={[styles.cardMeta, { color: colors.mutedForeground }]}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>

      <Text style={[styles.cardTitle, { color: colors.foreground }]}>
        {item.campaignGoal
          ? item.campaignGoal.charAt(0).toUpperCase() + item.campaignGoal.slice(1)
          : 'Pipeline Run'}{' '}
        #{item.id}
      </Text>

      <View style={styles.cardFooter}>
        <View style={styles.metaItem}>
          <Feather name="briefcase" size={12} color={colors.mutedForeground} />
          <Text style={[styles.metaText, { color: colors.mutedForeground }]}>Business #{item.businessId}</Text>
        </View>
        {item.budget != null && (
          <View style={styles.metaItem}>
            <Feather name="dollar-sign" size={12} color={colors.mutedForeground} />
            <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{item.budget}/day</Text>
          </View>
        )}
        {item.blueprintId && (
          <View style={styles.metaItem}>
            <Feather name="file-text" size={12} color={colors.accent} />
            <Text style={[styles.metaText, { color: colors.accent }]}>Blueprint ready</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

export default function PipelinesScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: pipelines, isLoading, isError, error, refetch, isFetching } = useListPipelineRuns();

  const handleRefresh = useCallback(() => { refetch(); }, [refetch]);

  const topPad = Platform.OS === 'web' ? 67 : 0;

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background, paddingTop: topPad }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (isError) {
    const kind = classifyError(error);
    const icon: React.ComponentProps<typeof Feather>['name'] =
      kind === 'network' ? 'wifi-off' : kind === 'server' ? 'server' : 'alert-circle';
    const title =
      kind === 'network'
        ? 'No network connection'
        : kind === 'server'
        ? 'Server unavailable'
        : 'Something went wrong';
    const detail =
      kind === 'network'
        ? 'Check your internet connection and try again.'
        : kind === 'server'
        ? 'The API server is down or restarting. It will retry automatically.'
        : 'An unexpected error occurred. Tap Retry to try again.';

    return (
      <View style={[styles.center, { backgroundColor: colors.background, paddingTop: topPad }]}>
        <Feather name={icon} size={32} color={colors.mutedForeground} />
        <Text style={[styles.emptyTitle, { color: colors.foreground }]}>{title}</Text>
        <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>{detail}</Text>
        <Pressable
          onPress={handleRefresh}
          style={[styles.retryBtn, { backgroundColor: colors.primary }]}
        >
          <Text style={{ color: colors.primaryForeground, fontWeight: '600' }}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={pipelines ?? []}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={[
          styles.list,
          {
            paddingTop: topPad + 16,
            paddingBottom: Platform.OS === 'web' ? 84 + 16 : 16 + insets.bottom,
          },
        ]}
        renderItem={({ item }) => (
          <PipelineCard item={item} onPress={() => router.push(`/pipeline/${item.id}` as any)} />
        )}
        scrollEnabled={!!pipelines && pipelines.length > 0}
        refreshControl={
          <RefreshControl
            refreshing={isFetching && !isLoading}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="zap" size={40} color={colors.border} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No pipelines yet</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Tap the button below to run your first AI pipeline
            </Text>
          </View>
        }
      />

      {/* Floating Action Button */}
      <Pressable
        onPress={() => router.push('/pipeline/run' as any)}
        style={({ pressed }) => [
          styles.fab,
          {
            backgroundColor: colors.primary,
            bottom: Platform.OS === 'web' ? 84 + 16 : 16 + insets.bottom,
            opacity: pressed ? 0.85 : 1,
          },
        ]}
      >
        <Feather name="zap" size={20} color={colors.primaryForeground} />
        <Text style={[styles.fabText, { color: colors.primaryForeground }]}>Run Pipeline</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  list: { paddingHorizontal: 16, gap: 12 },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    gap: 8,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  cardMeta: { fontSize: 12 },
  cardTitle: { fontSize: 16, fontWeight: '600' },
  cardFooter: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 4 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12 },
  empty: { alignItems: 'center', justifyContent: 'center', gap: 10, paddingTop: 80 },
  emptyTitle: { fontSize: 18, fontWeight: '600', marginTop: 8 },
  emptyText: { fontSize: 14, textAlign: 'center', paddingHorizontal: 32 },
  retryBtn: { marginTop: 8, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  fab: {
    position: 'absolute',
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: { fontSize: 15, fontWeight: '700' },
});
