export function validateOptionalPhone(phone: string): string | null {
  const trimmed = phone.trim();
  if (!trimmed) {
    return null;
  }
  if (!/^\+?[0-9\s\-()]{7,24}$/.test(trimmed)) {
    return 'Enter a valid phone number (e.g. +251911223344) or leave blank.';
  }
  return null;
}

export function validateOptionalTelegram(username: string): string | null {
  const trimmed = username.trim().replace(/^@+/, '');
  if (!trimmed) {
    return null;
  }
  if (!/^[a-zA-Z0-9_]{3,32}$/.test(trimmed)) {
    return 'Telegram username must be 3–32 characters (letters, numbers, underscore).';
  }
  return null;
}

export function normalizeTelegram(username: string): string {
  return username.trim().replace(/^@+/, '');
}
