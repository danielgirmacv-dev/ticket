/**
 * Email validation utility for client-side professional email enforcement.
 * Complies with RFC 5322 standard email structure with domain and TLD checks.
 */

// Production-grade RFC 5322 regex requiring valid local part, @, domain name, and alphabetic TLD of 2+ chars
const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;

export interface EmailValidationResult {
  isValid: boolean;
  error: string | null;
}

/**
 * Validates an email string and returns a descriptive error message if invalid.
 */
export function validateEmail(
  rawEmail: string,
  options: { required?: boolean } = { required: true }
): EmailValidationResult {
  const email = (rawEmail || '').trim();

  if (!email) {
    if (options.required) {
      return { isValid: false, error: 'Email address is required.' };
    }
    return { isValid: true, error: null };
  }

  if (email.length > 254) {
    return { isValid: false, error: 'Email address cannot exceed 254 characters.' };
  }

  if (/\s/.test(email)) {
    return { isValid: false, error: 'Email address cannot contain spaces.' };
  }

  if (!email.includes('@')) {
    return { isValid: false, error: "Missing '@' in email address (e.g. name@company.com)." };
  }

  const atParts = email.split('@');
  if (atParts.length > 2) {
    return { isValid: false, error: "Email address cannot contain multiple '@' symbols." };
  }

  const [localPart, domainPart] = atParts;

  if (!localPart) {
    return { isValid: false, error: "Email missing username before '@'." };
  }

  if (!domainPart) {
    return { isValid: false, error: "Enter the domain name after '@' (e.g. company.com)." };
  }

  if (!domainPart.includes('.')) {
    return {
      isValid: false,
      error: 'Domain must include an extension (e.g. .com, .org, .net).',
    };
  }

  const domainLabels = domainPart.split('.');
  const tld = domainLabels[domainLabels.length - 1];

  if (tld.length < 2) {
    return {
      isValid: false,
      error: 'Domain extension must be at least 2 letters (e.g. .com, .et).',
    };
  }

  if (!/^[a-zA-Z]+$/.test(tld)) {
    return {
      isValid: false,
      error: 'Domain extension can only contain letters.',
    };
  }

  if (!EMAIL_REGEX.test(email)) {
    return {
      isValid: false,
      error: 'Please enter a valid email address format (e.g. name@company.com).',
    };
  }

  return { isValid: true, error: null };
}

/**
 * Returns true if the string is a syntactically valid email.
 */
export function isEmailValid(email: string): boolean {
  return validateEmail(email, { required: true }).isValid;
}

/**
 * Trims whitespace and normalizes email string to lowercase.
 */
export function normalizeEmail(email: string): string {
  return (email || '').trim().toLowerCase();
}
