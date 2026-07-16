import { Redirect, Stack } from 'expo-router';

import { useAuth } from '@/lib/auth-context';

export default function ProfileEditorLayout() {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;
  if (!user) return <Redirect href="/(auth)/login" />;

  return <Stack screenOptions={{ headerShown: false }} />;
}
