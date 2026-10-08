import { Stack } from 'expo-router';

import { colors } from '@/ui/kit';
import { SignOutButton } from '@/ui/SignOutButton';

export default function ScooperLayout() {
  return (
    <Stack screenOptions={{ headerTintColor: colors.brand, headerTitleStyle: { color: colors.text } }}>
      <Stack.Screen name="index" options={{ title: 'Scooper', headerRight: () => <SignOutButton /> }} />
      <Stack.Screen name="apply" options={{ title: 'Apply to scoop' }} />
    </Stack>
  );
}
