import 'server-only';

import type { FlowCondition } from './types';

// Engine-internal type — not exported to types.ts
interface UserProfileForConditions {
  role: string;
  onboarding_complete: boolean;
  avatar_url: string | null;
  subscription_status: string | null;
  birthday: string | null; // ISO date
  completed_flow_ids: string[];
}

/**
 * Evaluate all flow conditions against a user profile.
 * All conditions are AND-ed — every condition must pass.
 * Empty conditions array = always match (true).
 * Unknown condition types fail safe (return false).
 */
export function evaluateConditions(
  conditions: FlowCondition[],
  userProfile: UserProfileForConditions
): boolean {
  if (conditions.length === 0) return true;

  for (const condition of conditions) {
    const passes = evaluateSingleCondition(condition, userProfile);
    if (!passes) return false;
  }

  return true;
}

function evaluateSingleCondition(
  condition: FlowCondition,
  userProfile: UserProfileForConditions
): boolean {
  switch (condition.type) {
    case 'role': {
      if (condition.operator === 'equals') {
        return userProfile.role === condition.value;
      }
      if (condition.operator === 'in') {
        return (condition.value as string[]).includes(userProfile.role);
      }
      return false;
    }

    case 'onboarding_status': {
      if (condition.operator === 'equals') {
        return userProfile.onboarding_complete === (condition.value === 'complete');
      }
      return false;
    }

    case 'has_profile_picture': {
      if (condition.operator === 'equals') {
        return (!!userProfile.avatar_url) === condition.value;
      }
      return false;
    }

    case 'subscription_status': {
      if (condition.operator === 'equals') {
        return userProfile.subscription_status === condition.value;
      }
      if (condition.operator === 'in') {
        return (condition.value as string[]).includes(userProfile.subscription_status ?? '');
      }
      return false;
    }

    case 'birthday': {
      if (condition.operator === 'is_today') {
        if (!userProfile.birthday) return false;
        const today = new Date();
        const birthday = new Date(userProfile.birthday);
        return (
          birthday.getUTCMonth() === today.getUTCMonth() &&
          birthday.getUTCDate() === today.getUTCDate()
        );
      }
      return false;
    }

    case 'flow_completed': {
      if (condition.operator === 'completed') {
        return userProfile.completed_flow_ids.includes(condition.value as string);
      }
      if (condition.operator === 'not_completed') {
        return !userProfile.completed_flow_ids.includes(condition.value as string);
      }
      return false;
    }

    default:
      // Fail-safe: unknown condition types never match
      return false;
  }
}
