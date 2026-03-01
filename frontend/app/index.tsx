import { Redirect } from 'expo-router';
import { useAppSelector } from '@/store';

export default function Index() {
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);

  if (isAuthenticated) {
    return <Redirect href="/(tabs)/gallery" />;
  }
  return <Redirect href="/(auth)/login" />;
}
