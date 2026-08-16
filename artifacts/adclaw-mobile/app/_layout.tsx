import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ConnectionBanner } from '@/components/ConnectionBanner';
import { useColors } from '@/hooks/useColors';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { setBaseUrl, setAuthTokenGetter } from '@workspace/api-client-react';

// Set the API base URL so Expo (which runs outside the web proxy) can reach the API server.
setBaseUrl(`https://${process.env.EXPO_PUBLIC_DOMAIN}`);

// Attach bearer token so the API server can verify this is an authorised client.
const apiKey = process.env.EXPO_PUBLIC_API_ACCESS_KEY;
if (apiKey) {
  setAuthTokenGetter(() => apiKey);
}

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Keep data fresh for 60 s — avoids redundant refetches on tab switches.
      staleTime: 60_000,
      // Garbage-collect unused queries after 5 minutes so cached data survives
      // brief server restarts while the user stays on a screen.
      gcTime: 5 * 60_000,
      // Retry up to 3 times so a momentary server restart self-heals.
      retry: 3,
      // Exponential back-off: 1 s → 2 s → 4 s, capped at 30 s.
      retryDelay: (attempt) => Math.min(1_000 * 2 ** attempt, 30_000),
    },
  },
});

function RootLayoutNav() {
  const colors = useColors();

  return (
    <>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.foreground,
          headerShadowVisible: false,
          headerBackTitle: 'Back',
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="pipeline/run"
          options={{ title: 'Run Pipeline', headerBackTitle: 'Pipelines' }}
        />
        <Stack.Screen
          name="pipeline/[id]"
          options={{ title: 'Pipeline', headerBackTitle: 'Pipelines' }}
        />
        <Stack.Screen
          name="campaign/[id]"
          options={{ title: 'Campaign', headerBackTitle: 'Campaigns' }}
        />
        <Stack.Screen name="+not-found" />
      </Stack>
      {/* Global connection banner — slides in when all queries are failing */}
      <ConnectionBanner />
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <KeyboardProvider>
              <RootLayoutNav />
            </KeyboardProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
