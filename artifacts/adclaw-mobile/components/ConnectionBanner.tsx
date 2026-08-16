import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { useConnectionStatus } from '@/hooks/useConnectionStatus';

/**
 * Slim banner that slides in from the top whenever all active queries have
 * failed.  Tapping "Retry" invalidates every query so React Query re-fires them
 * with the configured exponential back-off already reset.
 */
export function ConnectionBanner() {
  const { isUnreachable, errorKind } = useConnectionStatus();
  const queryClient = useQueryClient();
  const translateY = useRef(new Animated.Value(-60)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: isUnreachable ? 0 : -60,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: isUnreachable ? 1 : 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isUnreachable, translateY, opacity]);

  const handleRetry = () => {
    queryClient.invalidateQueries();
  };

  const isNetworkError = errorKind === 'network';
  const bannerColor = isNetworkError ? '#EF4444' : '#F97316';

  const message = isNetworkError
    ? 'No network — check your connection'
    : errorKind === 'server'
    ? 'Server is unavailable — retrying…'
    : 'Could not reach the API';

  const iconName: React.ComponentProps<typeof Feather>['name'] = isNetworkError
    ? 'wifi-off'
    : 'alert-circle';

  return (
    <Animated.View
      style={[
        styles.banner,
        { backgroundColor: bannerColor, transform: [{ translateY }], opacity },
      ]}
      pointerEvents={isUnreachable ? 'auto' : 'none'}
    >
      <View style={styles.content}>
        <Feather name={iconName} size={14} color="#fff" />
        <Text style={styles.text}>{message}</Text>
      </View>
      <Pressable onPress={handleRetry} style={styles.retryBtn}>
        <Text style={styles.retryText}>Retry</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  text: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  retryBtn: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  retryText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
});
