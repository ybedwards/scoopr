import { Stack } from 'expo-router';

import { colors } from '@/ui/kit';
import { SignOutButton } from '@/ui/SignOutButton';

export default function CustomerLayout() {
  return (
    <Stack screenOptions={{ headerTintColor: colors.brand, headerTitleStyle: { color: colors.text } }}>
      <Stack.Screen name="index" options={{ title: 'My yard', headerRight: () => <SignOutButton /> }} />
      <Stack.Screen name="property" options={{ title: 'Yard details' }} />
    </Stack>
  );
}
