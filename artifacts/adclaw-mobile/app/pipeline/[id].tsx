import React from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';
import { useGetPipelineRun } from '@workspace/api-client-react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const STATUS_COLORS: Record<string, string> = {
  pending: '#7878A0',
  running: '#3B82F6',
  completed: '#22C55E',
  failed: '#EF4444',
};

function ScoreCard({ label, value, color }: { label: string; value: number | null | undefined; color: string }) {
  const colors = useColors();
  const pct = value ?? 0;
  return (
    <View style={[styles.scoreCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.scoreValue, { color }]}>{value != null ? value : '—'}</Text>
      <View style={[styles.scoreBar, { backgroundColor: colors.border }]}>
        <View style={[styles.scoreBarFill, { width: `${pct}%` as any, backgroundColor: color }]} />
      </View>
      <Text style={[styles.scoreLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

function BlueprintSection({ title, icon, jsonStr }: { title: string; icon: string; jsonStr: string | null | undefined }) {
  const colors = useColors();
  if (!jsonStr) return null;

  let parsed: Record<string, unknown> = {};
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    return null;
  }

  const entries = Object.entries(parsed).slice(0, 5);
  if (entries.length === 0) return null;

  return (
    <View style={[styles.blueprintCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.blueprintHeader}>
        <Feather name={icon as any} size={16} color={colors.primary} />
        <Text style={[styles.blueprintTitle, { color: colors.foreground }]}>{title}</Text>
      </View>
      {entries.map(([key, val]) => (
        <View key={key} style={styles.blueprintRow}>
          <Text style={[styles.blueprintKey, { color: colors.mutedForeground }]}>
            {key.replace(/([A-Z])/g, ' $1').trim()}
          </Text>
          <Text style={[styles.blueprintVal, { color: colors.foreground }]} numberOfLines={2}>
            {typeof val === 'object' ? JSON.stringify(val) : String(val ?? '')}
          </Text>
        </View>
      ))}
    </View>
  );
}

export default function PipelineDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const pipelineId = Number(id);
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : 0;

  const { data: pipeline, isLoading, isError, refetch } = useGetPipelineRun(pipelineId);

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background, paddingTop: topPad + insets.top }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (isError || !pipeline) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background, paddingTop: topPad + insets.top }]}>
        <Feather name="alert-circle" size={32} color={colors.destructive} />
        <Text style={[styles.errorTitle, { color: colors.foreground }]}>Pipeline not found</Text>
        <Pressable onPress={() => refetch()} style={[styles.retryBtn, { backgroundColor: colors.primary }]}>
          <Text style={{ color: colors.primaryForeground, fontWeight: '600' }}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  const statusColor = STATUS_COLORS[pipeline.status] ?? colors.mutedForeground;
  const bp = pipeline.blueprint;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: topPad + 16, paddingBottom: 40 + insets.bottom },
      ]}
    >
      {/* Status banner */}
      <View style={[styles.banner, { backgroundColor: statusColor + '22', borderColor: statusColor + '44' }]}>
        <View style={[styles.bannerDot, { backgroundColor: statusColor }]} />
        <Text style={[styles.bannerText, { color: statusColor }]}>
          {pipeline.status.toUpperCase()}
        </Text>
        <Text style={[styles.bannerDate, { color: statusColor + 'AA' }]}>
          {new Date(pipeline.createdAt).toLocaleString()}
        </Text>
      </View>

      {/* Info card */}
      <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>Goal</Text>
          <Text style={[styles.infoValue, { color: colors.foreground }]}>
            {pipeline.campaignGoal ?? '—'}
          </Text>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>Budget</Text>
          <Text style={[styles.infoValue, { color: colors.foreground }]}>
            {pipeline.budget != null ? `$${pipeline.budget}/day` : '—'}
          </Text>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>Business</Text>
          <Text style={[styles.infoValue, { color: colors.foreground }]}>#{pipeline.businessId}</Text>
        </View>
        {pipeline.completedAt && (
          <>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>Completed</Text>
              <Text style={[styles.infoValue, { color: colors.foreground }]}>
                {new Date(pipeline.completedAt).toLocaleString()}
              </Text>
            </View>
          </>
        )}
      </View>

      {/* Scores */}
      {bp && (
        <>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>SCORES</Text>
          <View style={styles.scoresGrid}>
            <ScoreCard label="Conversion" value={bp.conversionReadinessScore} color="#22C55E" />
            <ScoreCard label="Policy Risk" value={bp.policyRiskScore} color="#EF4444" />
            <ScoreCard label="Creative" value={bp.creativeStrengthScore} color="#F97316" />
            <ScoreCard label="Funnel Fit" value={bp.funnelFitScore} color="#3B82F6" />
          </View>
        </>
      )}

      {/* Blueprint sections */}
      {bp && (
        <>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>BLUEPRINT</Text>
          <BlueprintSection title="Business Context" icon="briefcase" jsonStr={bp.businessContext} />
          <BlueprintSection title="Campaign Strategy" icon="target" jsonStr={bp.campaignStrategy} />
          <BlueprintSection title="Audience Plan" icon="users" jsonStr={bp.audiencePlan} />
          <BlueprintSection title="Offer Strategy" icon="gift" jsonStr={bp.offerStrategy} />
          <BlueprintSection title="Creative Blueprint" icon="image" jsonStr={bp.creativeBlueprint} />
          <BlueprintSection title="Budget Plan" icon="dollar-sign" jsonStr={bp.budgetPlan} />
          <BlueprintSection title="Policy Review" icon="shield" jsonStr={bp.policyReview} />
        </>
      )}

      {/* Agent log */}
      {pipeline.agentLog && (
        <>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>AGENT LOG</Text>
          <View style={[styles.logCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.logText, { color: colors.mutedForeground }]}>{pipeline.agentLog}</Text>
          </View>
        </>
      )}

      {/* CTA: navigate to campaign if blueprint exists */}
      {bp?.approvalStatus && pipeline.blueprintId && (
        <Pressable
          onPress={() => router.push(`/campaign/${pipeline.blueprintId}` as any)}
          style={[styles.ctaBtn, { backgroundColor: colors.primary }]}
        >
          <Feather name="radio" size={18} color={colors.primaryForeground} />
          <Text style={[styles.ctaText, { color: colors.primaryForeground }]}>View Campaign</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  content: { paddingHorizontal: 16, gap: 16 },
  errorTitle: { fontSize: 18, fontWeight: '600' },
  retryBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },

  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  bannerDot: { width: 8, height: 8, borderRadius: 4 },
  bannerText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5, flex: 1 },
  bannerDate: { fontSize: 11 },

  infoCard: { borderRadius: 12, borderWidth: 1, padding: 16, gap: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoLabel: { fontSize: 13 },
  infoValue: { fontSize: 13, fontWeight: '500' },
  divider: { height: 1 },

  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1, marginTop: 4 },

  scoresGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  scoreCard: {
    flex: 1,
    minWidth: '45%',
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
    gap: 6,
  },
  scoreValue: { fontSize: 28, fontWeight: '700' },
  scoreBar: { width: '100%', height: 4, borderRadius: 2, overflow: 'hidden' },
  scoreBarFill: { height: '100%', borderRadius: 2 },
  scoreLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 0.3 },

  blueprintCard: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 10 },
  blueprintHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  blueprintTitle: { fontSize: 14, fontWeight: '600' },
  blueprintRow: { gap: 2 },
  blueprintKey: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  blueprintVal: { fontSize: 13 },

  logCard: { borderRadius: 10, borderWidth: 1, padding: 12 },
  logText: { fontSize: 12, lineHeight: 18 },

  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  ctaText: { fontSize: 15, fontWeight: '700' },
});
