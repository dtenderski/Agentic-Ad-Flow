import React from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';
import { useGetMetaTokenInfo, useValidateMeta } from '@workspace/api-client-react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : 0;

  const {
    data: metaValidation,
    isLoading: validationLoading,
    refetch: refetchValidation,
    isFetching: validationFetching,
  } = useValidateMeta();

  const {
    data: tokenInfo,
    isLoading: tokenLoading,
    refetch: refetchToken,
    isFetching: tokenFetching,
  } = useGetMetaTokenInfo();

  const handleRefresh = () => {
    refetchValidation();
    refetchToken();
  };

  const isFetching = validationFetching || tokenFetching;
  const isLoading = validationLoading || tokenLoading;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: topPad + 16,
          paddingBottom: Platform.OS === 'web' ? 84 + 24 : 24 + insets.bottom,
        },
      ]}
      refreshControl={
        <RefreshControl
          refreshing={isFetching && !isLoading}
          onRefresh={handleRefresh}
          tintColor={colors.primary}
        />
      }
    >
      {/* Section: Meta Ads */}
      <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>META ADS</Text>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {/* Connection status header */}
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Feather name="facebook" size={20} color="#1877F2" />
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>Meta Ads Manager</Text>
          </View>
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor: metaValidation?.valid ? '#22C55E' : '#EF4444',
                },
              ]}
            />
          )}
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {metaValidation && (
          <>
            <InfoRow
              label="Status"
              value={metaValidation.valid ? 'Connected' : 'Disconnected'}
              valueColor={metaValidation.valid ? '#22C55E' : '#EF4444'}
            />
            {metaValidation.adAccountName && (
              <InfoRow label="Account" value={metaValidation.adAccountName} />
            )}
            {metaValidation.accountId && (
              <InfoRow label="Account ID" value={metaValidation.accountId} />
            )}
            {metaValidation.currency && (
              <InfoRow label="Currency" value={metaValidation.currency} />
            )}
            {metaValidation.error && (
              <InfoRow
                label="Error"
                value={metaValidation.error}
                valueColor={colors.destructive}
              />
            )}
          </>
        )}

        {!isLoading && !metaValidation && (
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Could not load connection status
          </Text>
        )}
      </View>

      {/* Token info */}
      {tokenInfo && (
        <>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: 24 }]}>
            ACCESS TOKEN
          </Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <InfoRow
              label="Valid"
              value={tokenInfo.valid ? 'Yes' : 'No'}
              valueColor={tokenInfo.valid ? '#22C55E' : '#EF4444'}
            />
            {tokenInfo.expiresAt && (
              <InfoRow
                label="Expires"
                value={new Date(tokenInfo.expiresAt).toLocaleDateString()}
              />
            )}
            {tokenInfo.daysRemaining != null && (
              <InfoRow
                label="Days remaining"
                value={String(tokenInfo.daysRemaining)}
                valueColor={
                  tokenInfo.daysRemaining < 7
                    ? colors.destructive
                    : tokenInfo.daysRemaining < 30
                    ? '#EAB308'
                    : '#22C55E'
                }
              />
            )}
            {tokenInfo.scopes && tokenInfo.scopes.length > 0 && (
              <InfoRow label="Scopes" value={tokenInfo.scopes.join(', ')} />
            )}
          </View>
        </>
      )}

      {/* Refresh button */}
      <Pressable
        onPress={handleRefresh}
        style={({ pressed }) => [
          styles.refreshBtn,
          {
            backgroundColor: colors.secondary,
            borderColor: colors.border,
            opacity: pressed ? 0.7 : 1,
          },
        ]}
      >
        <Feather name="refresh-cw" size={16} color={colors.mutedForeground} />
        <Text style={[styles.refreshText, { color: colors.mutedForeground }]}>
          Refresh status
        </Text>
      </Pressable>

      {/* App info */}
      <Text style={[styles.appInfo, { color: colors.mutedForeground }]}>AdClaw AI · Mobile</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, gap: 12 },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 4 },
  card: { borderRadius: 12, borderWidth: 1, padding: 16, gap: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardTitle: { fontSize: 15, fontWeight: '600' },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  divider: { height: 1 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoLabel: { fontSize: 13 },
  infoValue: { fontSize: 13, fontWeight: '500', maxWidth: '60%', textAlign: 'right' },
  emptyText: { fontSize: 13, textAlign: 'center', paddingVertical: 4 },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 12,
    marginTop: 16,
  },
  refreshText: { fontSize: 14 },
  appInfo: { fontSize: 12, textAlign: 'center', marginTop: 24 },
});
