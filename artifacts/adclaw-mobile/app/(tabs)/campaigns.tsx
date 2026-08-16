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
import { useListCampaigns } from '@workspace/api-client-react';
import type { Campaign } from '@workspace/api-client-react';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  draft:       { color: '#7878A0', label: 'DRAFT' },
  review:      { color: '#EAB308', label: 'IN REVIEW' },
  approved:    { color: '#22C55E', label: 'APPROVED' },
  active:      { color: '#22C55E', label: 'ACTIVE' },
  learning:    { color: '#3B82F6', label: 'LEARNING' },
  optimizing:  { color: '#3B82F6', label: 'OPTIMIZING' },
  scaling:     { color: '#8B5CF6', label: 'SCALING' },
  paused:      { color: '#F97316', label: 'PAUSED' },
  completed:   { color: '#6B7280', label: 'COMPLETED' },
};

const PLATFORM_CONFIG: Record<string, { icon: string; label: string; color: string }> = {
  meta:     { icon: 'facebook', label: 'Meta', color: '#1877F2' },
  google:   { icon: 'search',   label: 'Google', color: '#EA4335' },
  tiktok:   { icon: 'music',    label: 'TikTok', color: '#EE1D52' },
  linkedin: { icon: 'linkedin', label: 'LinkedIn', color: '#0A66C2' },
};

function CampaignCard({ item, onPress }: { item: Campaign; onPress: () => void }) {
  const colors = useColors();
  const statusCfg = STATUS_CONFIG[item.status] ?? { color: colors.mutedForeground, label: item.status.toUpperCase() };
  const platformCfg = PLATFORM_CONFIG[item.platform] ?? { icon: 'globe', label: item.platform, color: colors.mutedForeground };

  const budget = item.dailyBudget != null
    ? `$${item.dailyBudget}/day`
    : item.lifetimeBudget != null
    ? `$${item.lifetimeBudget} total`
    : null;

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
      {/* Row 1: Status + Platform */}
      <View style={styles.cardRow}>
        <View style={[styles.pill, { backgroundColor: statusCfg.color + '22', borderColor: statusCfg.color + '55' }]}>
          <Text style={[styles.pillText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
        </View>
        <View style={[styles.platformBadge, { borderColor: platformCfg.color + '44' }]}>
          <Feather name={platformCfg.icon as any} size={11} color={platformCfg.color} />
          <Text style={[styles.platformText, { color: platformCfg.color }]}>{platformCfg.label}</Text>
        </View>
      </View>

      {/* Campaign name */}
      <Text style={[styles.cardTitle, { color: colors.foreground }]} numberOfLines={2}>
        {item.campaignName}
      </Text>

      {/* Footer */}
      <View style={styles.cardFooter}>
        <View style={styles.metaItem}>
          <Feather name="target" size={12} color={colors.mutedForeground} />
          <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{item.objective}</Text>
        </View>
        {budget && (
          <View style={styles.metaItem}>
            <Feather name="dollar-sign" size={12} color={colors.mutedForeground} />
            <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{budget}</Text>
          </View>
        )}
        {item.approvalStatus === 'pending' && (
          <View style={styles.metaItem}>
            <Feather name="clock" size={12} color="#EAB308" />
            <Text style={[styles.metaText, { color: '#EAB308' }]}>Awaiting approval</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

export default function CampaignsScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: campaigns, isLoading, isError, error, refetch, isFetching } = useListCampaigns();

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
        <Pressable onPress={handleRefresh} style={[styles.retryBtn, { backgroundColor: colors.primary }]}>
          <Text style={{ color: colors.primaryForeground, fontWeight: '600' }}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={campaigns ?? []}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={[
          styles.list,
          {
            paddingTop: topPad + 16,
            paddingBottom: Platform.OS === 'web' ? 84 + 16 : 16 + insets.bottom,
          },
        ]}
        renderItem={({ item }) => (
          <CampaignCard item={item} onPress={() => router.push(`/campaign/${item.id}` as any)} />
        )}
        scrollEnabled={!!campaigns && campaigns.length > 0}
        refreshControl={
          <RefreshControl
            refreshing={isFetching && !isLoading}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="radio" size={40} color={colors.border} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No campaigns yet</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Campaigns are created when a pipeline run completes
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  list: { paddingHorizontal: 16, gap: 12 },
  card: { borderRadius: 12, borderWidth: 1, padding: 16, gap: 8 },
  cardRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pill: {
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 6, borderWidth: 1,
  },
  pillText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  platformBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 6, borderWidth: 1,
  },
  platformText: { fontSize: 11, fontWeight: '600' },
  cardTitle: { fontSize: 15, fontWeight: '600', lineHeight: 22 },
  cardFooter: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 4 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12 },
  empty: { alignItems: 'center', justifyContent: 'center', gap: 10, paddingTop: 80 },
  emptyTitle: { fontSize: 18, fontWeight: '600', marginTop: 8 },
  emptyText: { fontSize: 14, textAlign: 'center', paddingHorizontal: 32 },
  retryBtn: { marginTop: 8, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
});
