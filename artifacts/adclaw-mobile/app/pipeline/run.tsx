import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';
import {
  useListBusinesses,
  useListProducts,
  useRunPipeline,
  useListPipelineRuns,
  getListProductsQueryKey,
  getListPipelineRunsQueryKey,
} from '@workspace/api-client-react';
import type { Business, Product } from '@workspace/api-client-react';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';

const CAMPAIGN_GOALS = [
  { value: 'leads', label: 'Leads', icon: 'users' },
  { value: 'sales', label: 'Sales', icon: 'shopping-cart' },
  { value: 'awareness', label: 'Awareness', icon: 'eye' },
  { value: 'traffic', label: 'Traffic', icon: 'trending-up' },
] as const;

type CampaignGoal = (typeof CAMPAIGN_GOALS)[number]['value'];

// ─── Picker Row ───────────────────────────────────────────────────────────────

function SectionLabel({ label }: { label: string }) {
  const colors = useColors();
  return (
    <Text style={[styles.label, { color: colors.mutedForeground }]}>{label}</Text>
  );
}

function PickerOption<T>({
  item,
  selected,
  onPress,
  label,
  sublabel,
}: {
  item: T;
  selected: boolean;
  onPress: () => void;
  label: string;
  sublabel?: string;
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.option,
        {
          backgroundColor: selected ? colors.primary + '18' : colors.card,
          borderColor: selected ? colors.primary : colors.border,
          opacity: pressed ? 0.75 : 1,
        },
      ]}
    >
      <View style={styles.optionInner}>
        <View style={{ flex: 1 }}>
          <Text
            style={[
              styles.optionLabel,
              { color: selected ? colors.primary : colors.foreground },
            ]}
            numberOfLines={1}
          >
            {label}
          </Text>
          {sublabel ? (
            <Text style={[styles.optionSub, { color: colors.mutedForeground }]} numberOfLines={1}>
              {sublabel}
            </Text>
          ) : null}
        </View>
        {selected && <Feather name="check" size={16} color={colors.primary} />}
      </View>
    </Pressable>
  );
}

// ─── Status Banner ────────────────────────────────────────────────────────────

function StatusBanner({
  status,
  pipelineId,
  onViewDetails,
}: {
  status: 'pending' | 'running' | 'completed' | 'failed';
  pipelineId: number;
  onViewDetails: () => void;
}) {
  const colors = useColors();
  const STATUS_MAP = {
    pending: { color: '#7878A0', icon: 'clock', text: 'Pipeline queued…' },
    running: { color: '#3B82F6', icon: 'zap', text: 'AI agents running…' },
    completed: { color: '#22C55E', icon: 'check-circle', text: 'Pipeline complete!' },
    failed: { color: '#EF4444', icon: 'alert-circle', text: 'Pipeline failed' },
  };
  const s = STATUS_MAP[status];
  return (
    <View style={[styles.banner, { backgroundColor: s.color + '18', borderColor: s.color + '44' }]}>
      <View style={styles.bannerRow}>
        <Feather name={s.icon as any} size={18} color={s.color} />
        <Text style={[styles.bannerText, { color: s.color }]}>{s.text}</Text>
        {(status === 'running' || status === 'pending') && (
          <ActivityIndicator size="small" color={s.color} style={{ marginLeft: 4 }} />
        )}
      </View>
      {(status === 'completed' || status === 'failed') && (
        <Pressable onPress={onViewDetails} style={[styles.viewBtn, { borderColor: s.color }]}>
          <Text style={[styles.viewBtnText, { color: s.color }]}>View Details</Text>
        </Pressable>
      )}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function RunPipelineScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : 0;

  // Form state
  const [selectedBusinessId, setSelectedBusinessId] = useState<number | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<CampaignGoal | null>(null);
  const [budget, setBudget] = useState('');

  // Pipeline status tracking
  const [submittedRunId, setSubmittedRunId] = useState<number | null>(null);
  const [runStatus, setRunStatus] = useState<'pending' | 'running' | 'completed' | 'failed' | null>(null);
  const [pollingEnabled, setPollingEnabled] = useState(false);

  // Data fetching
  const { data: businesses, isLoading: bizLoading } = useListBusinesses();
  const { data: products, isLoading: prodLoading } = useListProducts(
    selectedBusinessId ?? 0,
    {
      query: {
        queryKey: getListProductsQueryKey(selectedBusinessId ?? 0),
        enabled: selectedBusinessId != null,
      },
    }
  );

  // Refresh pipeline list query key so the tab updates on completion
  const { refetch: refetchPipelines } = useListPipelineRuns({
    query: { queryKey: getListPipelineRunsQueryKey() },
  });

  // Mutation
  const { mutate: runPipeline, isPending: isSubmitting } = useRunPipeline();

  // Poll status via pipeline list
  const { data: allRuns } = useListPipelineRuns({
    query: {
      queryKey: getListPipelineRunsQueryKey(),
      enabled: pollingEnabled,
      refetchInterval: pollingEnabled ? 3000 : false,
    },
  });

  // Watch for status change on submitted run
  useEffect(() => {
    if (!submittedRunId || !allRuns) return;
    const run = allRuns.find((r) => r.id === submittedRunId);
    if (!run) return;
    const newStatus = run.status as 'pending' | 'running' | 'completed' | 'failed';
    if (newStatus === runStatus) return;
    setRunStatus(newStatus);

    if (newStatus === 'completed') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setPollingEnabled(false);
      refetchPipelines();
    } else if (newStatus === 'failed') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setPollingEnabled(false);
      refetchPipelines();
    }
  }, [allRuns, submittedRunId, runStatus, refetchPipelines]);

  // Reset product when business changes
  const handleSelectBusiness = useCallback((id: number) => {
    setSelectedBusinessId(id);
    setSelectedProductId(null);
  }, []);

  const handleSubmit = useCallback(() => {
    if (!selectedBusinessId || !selectedProductId || !selectedGoal || !budget) return;
    const budgetNum = parseFloat(budget);
    if (isNaN(budgetNum) || budgetNum <= 0) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    runPipeline(
      {
        data: {
          businessId: selectedBusinessId,
          productId: selectedProductId,
          campaignGoal: selectedGoal,
          budget: budgetNum,
        },
      },
      {
        onSuccess: (run) => {
          setSubmittedRunId(run.id);
          setRunStatus(run.status as 'pending' | 'running' | 'completed' | 'failed');
          setPollingEnabled(true);
        },
        onError: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        },
      }
    );
  }, [selectedBusinessId, selectedProductId, selectedGoal, budget, runPipeline]);

  const canSubmit =
    selectedBusinessId != null &&
    selectedProductId != null &&
    selectedGoal != null &&
    budget.trim() !== '' &&
    parseFloat(budget) > 0 &&
    !isSubmitting &&
    runStatus == null;

  return (
    <KeyboardAwareScrollViewCompat
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: topPad + 16,
          paddingBottom: 24 + insets.bottom,
        },
      ]}
    >
      {/* Status banner */}
      {runStatus != null && submittedRunId != null && (
        <StatusBanner
          status={runStatus}
          pipelineId={submittedRunId}
          onViewDetails={() => router.push(`/pipeline/${submittedRunId}` as any)}
        />
      )}

      {/* Business */}
      <SectionLabel label="BUSINESS" />
      {bizLoading ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : !businesses?.length ? (
        <Text style={[styles.emptyHint, { color: colors.mutedForeground }]}>
          No businesses found. Create one in the web app first.
        </Text>
      ) : (
        <View style={styles.optionGroup}>
          {businesses.map((biz: Business) => (
            <PickerOption
              key={biz.id}
              item={biz}
              selected={selectedBusinessId === biz.id}
              onPress={() => handleSelectBusiness(biz.id)}
              label={biz.businessName}
              sublabel={biz.industry ?? undefined}
            />
          ))}
        </View>
      )}

      {/* Product */}
      <SectionLabel label="PRODUCT" />
      {selectedBusinessId == null ? (
        <Text style={[styles.emptyHint, { color: colors.mutedForeground }]}>
          Select a business first
        </Text>
      ) : prodLoading ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : !products?.length ? (
        <Text style={[styles.emptyHint, { color: colors.mutedForeground }]}>
          No products for this business
        </Text>
      ) : (
        <View style={styles.optionGroup}>
          {products.map((prod: Product) => (
            <PickerOption
              key={prod.id}
              item={prod}
              selected={selectedProductId === prod.id}
              onPress={() => setSelectedProductId(prod.id)}
              label={prod.productName}
              sublabel={prod.description ?? undefined}
            />
          ))}
        </View>
      )}

      {/* Goal */}
      <SectionLabel label="CAMPAIGN GOAL" />
      <View style={styles.goalRow}>
        {CAMPAIGN_GOALS.map((g) => (
          <Pressable
            key={g.value}
            onPress={() => setSelectedGoal(g.value)}
            style={({ pressed }) => [
              styles.goalChip,
              {
                backgroundColor:
                  selectedGoal === g.value ? colors.primary : colors.card,
                borderColor:
                  selectedGoal === g.value ? colors.primary : colors.border,
                opacity: pressed ? 0.75 : 1,
              },
            ]}
          >
            <Feather
              name={g.icon as any}
              size={14}
              color={selectedGoal === g.value ? colors.primaryForeground : colors.mutedForeground}
            />
            <Text
              style={[
                styles.goalLabel,
                {
                  color:
                    selectedGoal === g.value
                      ? colors.primaryForeground
                      : colors.foreground,
                },
              ]}
            >
              {g.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Budget */}
      <SectionLabel label="DAILY BUDGET" />
      <View
        style={[
          styles.budgetRow,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
        ]}
      >
        <Feather name="dollar-sign" size={16} color={colors.mutedForeground} />
        <TextInput
          style={[styles.budgetInput, { color: colors.foreground }]}
          placeholder="e.g. 50"
          placeholderTextColor={colors.mutedForeground}
          keyboardType="decimal-pad"
          value={budget}
          onChangeText={setBudget}
          returnKeyType="done"
        />
        <Text style={[styles.budgetUnit, { color: colors.mutedForeground }]}>/day</Text>
      </View>

      {/* Submit */}
      <Pressable
        onPress={handleSubmit}
        disabled={!canSubmit}
        style={({ pressed }) => [
          styles.submitBtn,
          {
            backgroundColor: canSubmit ? colors.primary : colors.border,
            opacity: pressed ? 0.8 : 1,
          },
        ]}
      >
        {isSubmitting ? (
          <ActivityIndicator color={colors.primaryForeground} size="small" />
        ) : (
          <>
            <Feather name="zap" size={16} color={colors.primaryForeground} />
            <Text style={[styles.submitText, { color: colors.primaryForeground }]}>
              {runStatus != null ? 'Pipeline Started' : 'Run Pipeline'}
            </Text>
          </>
        )}
      </Pressable>

      {runStatus === 'completed' && submittedRunId != null && (
        <Pressable
          onPress={() => {
            setSubmittedRunId(null);
            setRunStatus(null);
            setSelectedGoal(null);
            setBudget('');
          }}
          style={[styles.resetBtn, { borderColor: colors.border }]}
        >
          <Text style={[styles.resetText, { color: colors.mutedForeground }]}>Start Another</Text>
        </Pressable>
      )}
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
    gap: 10,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginTop: 8,
    marginBottom: 2,
  },
  optionGroup: { gap: 8 },
  option: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
  },
  optionInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  optionLabel: { fontSize: 15, fontWeight: '600' },
  optionSub: { fontSize: 12, marginTop: 2 },
  goalRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  goalChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
  },
  goalLabel: { fontSize: 14, fontWeight: '500' },
  budgetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
  },
  budgetInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    paddingVertical: 0,
  },
  budgetUnit: { fontSize: 13 },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 12,
  },
  submitText: { fontSize: 16, fontWeight: '700' },
  resetBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  resetText: { fontSize: 14, fontWeight: '500' },
  banner: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 10,
    marginBottom: 4,
  },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bannerText: { fontSize: 15, fontWeight: '600', flex: 1 },
  viewBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  viewBtnText: { fontSize: 13, fontWeight: '600' },
  loader: { marginVertical: 8 },
  emptyHint: { fontSize: 13, marginBottom: 4 },
});
