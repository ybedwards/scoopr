import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { AuthProvider, useAuth } from '@/lib/auth';
import { colors, Loading } from '@/ui/kit';

function RootStack() {
  const { loading, session, profile } = useAuth();
  if (loading || (session && !profile)) return <Loading />;

  const role = profile?.role;
  return (
    <Stack
      screenOptions={{
        headerTintColor: colors.brand,
        headerTitleStyle: { color: colors.text },
        contentStyle: { backgroundColor: colors.background },
      }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Protected guard={!session}>
        <Stack.Screen name="sign-in" options={{ title: 'Welcome to Scoopr' }} />
      </Stack.Protected>
      <Stack.Protected guard={!!session && role === 'customer'}>
        <Stack.Screen name="customer" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={!!session && role === 'scooper'}>
        <Stack.Screen name="scooper" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <RootStack />
    </AuthProvider>
  );
}
