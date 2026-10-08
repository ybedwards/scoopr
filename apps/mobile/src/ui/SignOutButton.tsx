import { Pressable, Text } from 'react-native';

import { useAuth } from '@/lib/auth';
import { colors } from './kit';

export function SignOutButton() {
  const { signOut } = useAuth();
  return (
    <Pressable accessibilityRole="button" onPress={signOut} hitSlop={8}>
      <Text style={{ color: colors.brand, fontSize: 16 }}>Sign out</Text>
    </Pressable>
  );
}
