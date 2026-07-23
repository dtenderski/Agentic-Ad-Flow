import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';
import {
  getGetCampaignInterestPreviewQueryKey,
  useApproveCampaign,
  useGetCampaign,
  useGetCampaignInterestPreview,
  usePushToMeta,
} from '@workspace/api-client-react';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const STATUS_COLORS: Record<string, string> = {
  draft:      '#7878A0',
  review:     '#EAB308',
  approved:   '#22C55E',
  active:     '#22C55E',
  learning:   '#3B82F6',
  optimizing: '#3B82F6',
  scaling:    '#8B5CF6',
  paused:     '#F97316',
  completed:  '#6B7280',
};

function InfoRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  const colors = useColors();
  return (
    <View style={styles.infoRow}>
      <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: valueColor ?? colors.foreground }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

export default function CampaignDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const campaignId = Number(id);
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const topPad = Platform.OS === 'web' ? 67 : 0;

  const [previewEnabled, setPreviewEnabled] = useState(false);

  const { data: campaign, isLoading, isError, refetch } = useGetCampaign(campaignId);

  const { data: interestPreview, isLoading: previewLoading } = useGetCampaignInterestPreview(
    campaignId,
    {
      query: {
        queryKey: getGetCampaignInterestPreviewQueryKey(campaignId),
        enabled: previewEnabled,
      },
    }
  );

  const approveMutation = useApproveCampaign({
    mutation: {
      onSuccess: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        queryClient.invalidateQueries({ queryKey: [`/api/campaigns/${campaignId}`] });
        queryClient.invalidateQueries({ queryKey: ['/api/campaigns'] });
        refetch();
      },
      onError: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('Approval failed', 'Could not approve campaign. Please try again.');
      },
    },
  });

  const pushMutation = usePushToMeta({
    mutation: {
      onSuccess: (data) => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        queryClient.invalidateQueries({ queryKey: [`/api/campaigns/${campaignId}`] });
        queryClient.invalidateQueries({ queryKey: ['/api/campaigns'] });
        refetch();
        if (data?.message) {
          Alert.alert('Pushed to Meta', data.message);
        }
      },
      onError: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('Push failed', 'Could not push to Meta Ads Manager. Check your Meta credentials in Settings.');
      },
    },
  });

  const handleApprove = () => {
    Alert.alert(
      'Approve Campaign',
      'This will mark the campaign as approved and ready to push to Meta.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          style: 'default',
          onPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            approveMutation.mutate({ campaignId, data: { decision: 'approved' } });
          },
        },
      ]
    );
  };

  const handlePushToMeta = () => {
    Alert.alert(
      'Push to Meta',
      'This will create the campaign, ad sets, and creatives in Meta Ads Manager (as PAUSED). You can activate them from the Meta Ads Manager.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Push',
          style: 'default',
          onPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            pushMutation.mutate({ campaignId });
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (isError || !campaign) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Feather name="alert-circle" size={32} color={colors.destructive} />
        <Text style={[styles.errorTitle, { color: colors.foreground }]}>Campaign not found</Text>
        <Pressable onPress={() => refetch()} style={[styles.btn, { backgroundColor: colors.primary }]}>
          <Text style={{ color: colors.primaryForeground, fontWeight: '600' }}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  const statusColor = STATUS_COLORS[campaign.status] ?? colors.mutedForeground;
  const alreadyPushed = !!campaign.metaCampaignId;
  const canApprove = campaign.approvalStatus === 'pending' &&
    (campaign.status === 'draft' || campaign.status === 'review');
  const canPush = campaign.approvalStatus === 'approved' && !alreadyPushed;

  const budget = campaign.dailyBudget != null
    ? `$${campaign.dailyBudget}/day`
    : campaign.lifetimeBudget != null
    ? `$${campaign.lifetimeBudget} total`
    : 'Not set';

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
        <Text style={[styles.bannerStatus, { color: statusColor }]}>{campaign.status.toUpperCase()}</Text>
        {campaign.approvalStatus === 'approved' && (
          <View style={styles.approvedBadge}>
            <Feather name="check-circle" size={12} color="#22C55E" />
            <Text style={[styles.approvedText, { color: '#22C55E' }]}>Approved</Text>
          </View>
        )}
        {alreadyPushed && (
          <View style={styles.pushedBadge}>
            <Feather name="upload-cloud" size={12} color="#3B82F6" />
            <Text style={[styles.pushedText, { color: '#3B82F6' }]}>Live on Meta</Text>
          </View>
        )}
      </View>

      {/* Campaign name */}
      <Text style={[styles.campaignName, { color: colors.foreground }]}>{campaign.campaignName}</Text>

      {/* Info card */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <InfoRow label="Objective" value={campaign.objective} />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <InfoRow label="Platform" value={campaign.platform} />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <InfoRow label="Placement" value={campaign.placement} />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <InfoRow label="Budget" value={budget} />
        {campaign.startDate && (
          <>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <InfoRow label="Start date" value={new Date(campaign.startDate).toLocaleDateString()} />
          </>
        )}
        {campaign.endDate && (
          <>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <InfoRow label="End date" value={new Date(campaign.endDate).toLocaleDateString()} />
          </>
        )}
        {alreadyPushed && (
          <>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <InfoRow label="Meta Campaign ID" value={campaign.metaCampaignId!} valueColor="#3B82F6" />
          </>
        )}
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <InfoRow label="Created" value={new Date(campaign.createdAt).toLocaleDateString()} />
      </View>

      {/* Interest preview */}
      <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>INTEREST PREVIEW</Text>
      {!previewEnabled ? (
        <Pressable
          onPress={() => setPreviewEnabled(true)}
          style={({ pressed }) => [
            styles.previewBtn,
            {
              backgroundColor: colors.secondary,
              borderColor: colors.border,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <Feather name="search" size={16} color={colors.mutedForeground} />
          <Text style={[styles.previewBtnText, { color: colors.mutedForeground }]}>
            Check Meta interest matching
          </Text>
        </Pressable>
      ) : previewLoading ? (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, alignItems: 'center', padding: 20 }]}>
          <ActivityIndicator color={colors.primary} />
          <Text style={[styles.previewBtnText, { color: colors.mutedForeground, marginTop: 8 }]}>
            Resolving interests…
          </Text>
        </View>
      ) : interestPreview ? (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {/* Summary row */}
          <View style={styles.previewSummary}>
            <View style={styles.metaItem}>
              <Feather
                name={interestPreview.canApprove ? 'check-circle' : 'x-circle'}
                size={16}
                color={interestPreview.canApprove ? '#22C55E' : '#EF4444'}
              />
              <Text style={{ color: interestPreview.canApprove ? '#22C55E' : '#EF4444', fontWeight: '600', fontSize: 13 }}>
                {interestPreview.matchedCount}/{interestPreview.totalInterests} interests matched
              </Text>
            </View>
            {!interestPreview.canApprove && (
              <Text style={[styles.previewWarning, { color: '#EF4444' }]}>
                All interests must match before you can approve
              </Text>
            )}
          </View>

          {/* Per-adset breakdown */}
          {interestPreview.adsets.map((adset) => (
            <View key={adset.adsetId} style={styles.adsetBlock}>
              <View style={[styles.divider, { backgroundColor: colors.border, marginVertical: 8 }]} />
              <Text style={[styles.adsetName, { color: colors.foreground }]}>{adset.adsetName}</Text>
              {adset.interests.map((interest) => (
                <View key={interest.query} style={styles.interestRow}>
                  <Feather
                    name={interest.matched ? 'check' : 'x'}
                    size={13}
                    color={interest.matched ? '#22C55E' : '#EF4444'}
                  />
                  <Text style={[styles.interestQuery, { color: colors.foreground }]}>{interest.query}</Text>
                  {interest.matched && (
                    <Text style={[styles.interestId, { color: colors.mutedForeground }]}>
                      #{interest.matched.id}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          ))}
        </View>
      ) : null}

      {/* Action buttons */}
      {canApprove && (
        <Pressable
          onPress={handleApprove}
          disabled={approveMutation.isPending}
          style={({ pressed }) => [
            styles.actionBtn,
            { backgroundColor: '#22C55E', opacity: pressed || approveMutation.isPending ? 0.7 : 1 },
          ]}
        >
          {approveMutation.isPending ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Feather name="check-circle" size={20} color="#FFFFFF" />
              <Text style={styles.actionBtnText}>Approve Campaign</Text>
            </>
          )}
        </Pressable>
      )}

      {canPush && (
        <Pressable
          onPress={handlePushToMeta}
          disabled={pushMutation.isPending}
          style={({ pressed }) => [
            styles.actionBtn,
            { backgroundColor: '#1877F2', opacity: pressed || pushMutation.isPending ? 0.7 : 1 },
          ]}
        >
          {pushMutation.isPending ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Feather name="upload-cloud" size={20} color="#FFFFFF" />
              <Text style={styles.actionBtnText}>Push to Meta</Text>
            </>
          )}
        </Pressable>
      )}

      {alreadyPushed && (
        <View style={[styles.pushedNotice, { backgroundColor: '#1877F222', borderColor: '#1877F244' }]}>
          <Feather name="check-circle" size={16} color="#1877F2" />
          <Text style={[styles.pushedNoticeText, { color: '#1877F2' }]}>
            Live on Meta · ID {campaign.metaCampaignId}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  content: { paddingHorizontal: 16, gap: 14 },
  errorTitle: { fontSize: 18, fontWeight: '600' },
  btn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },

  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    flexWrap: 'wrap',
  },
  bannerDot: { width: 8, height: 8, borderRadius: 4 },
  bannerStatus: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  approvedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  approvedText: { fontSize: 11, fontWeight: '600' },
  pushedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  pushedText: { fontSize: 11, fontWeight: '600' },

  campaignName: { fontSize: 22, fontWeight: '700', lineHeight: 28 },

  card: { borderRadius: 12, borderWidth: 1, padding: 16, gap: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoLabel: { fontSize: 13 },
  infoValue: { fontSize: 13, fontWeight: '500', maxWidth: '60%', textAlign: 'right' },
  divider: { height: 1 },

  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1 },

  previewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 14,
  },
  previewBtnText: { fontSize: 14 },

  previewSummary: { gap: 6 },
  previewWarning: { fontSize: 12 },
  adsetBlock: { gap: 6 },
  adsetName: { fontSize: 13, fontWeight: '600' },
  interestRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 2 },
  interestQuery: { fontSize: 13, flex: 1 },
  interestId: { fontSize: 11 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },

  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 12,
  },
  actionBtnText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },

  pushedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  pushedNoticeText: { fontSize: 13, fontWeight: '600' },
});
