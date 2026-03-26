import type { AuthUser } from '../hooks/useAuth';

export function needsOnboarding(user: AuthUser | null | undefined) {
  if (!user) {
    return false;
  }

  return !user.onboardingCompleted;
}
