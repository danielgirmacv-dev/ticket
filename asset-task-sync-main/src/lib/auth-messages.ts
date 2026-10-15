/**
 * Maps API/auth errors to user-facing copy (login & registration).
 */
export function toAuthUserMessage(raw: string): string {
  const message = raw.trim();
  const lower = message.toLowerCase();

  if (
    lower.includes('credentials are incorrect') ||
    lower.includes('invalid login credentials') ||
    lower.includes('invalid email or password')
  ) {
    return 'Invalid email or password.';
  }

  if (lower.includes('already been taken') || lower.includes('already registered')) {
    return 'An account with this email already exists.';
  }

  if (lower.includes('awaiting admin approval') || lower.includes('pending approval')) {
    return 'Your account is awaiting admin approval. Please try again after you are approved.';
  }

  if (lower.includes('not approved') || lower.includes('rejected')) {
    return 'Your account was not approved. Please contact IT support.';
  }

  if (lower.includes('email not confirmed')) {
    return 'Please confirm your email before signing in.';
  }

  if (lower.includes('password') && lower.includes('at least')) {
    return 'Password must be at least 8 characters.';
  }

  if (lower.includes('turnstile') || lower.includes('security verification')) {
    return message;
  }

  return message || 'Something went wrong. Please try again.';
}
