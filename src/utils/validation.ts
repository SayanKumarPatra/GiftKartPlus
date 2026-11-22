export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateRequired(value: string, label: string): ValidationResult {
  if (!value || value.trim().length === 0) {
    return { valid: false, error: `${label} is required.` };
  }
  return { valid: true };
}

export function validateEmail(email: string): ValidationResult {
  const trimmed = email.trim();
  if (!trimmed) {
    return { valid: false, error: 'Email address is required.' };
  }
  const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
  return ok ? { valid: true } : { valid: false, error: 'Enter a valid email address.' };
}

export function validateIndianPhone(phone: string): ValidationResult {
  const digits = phone.replace(/\D/g, '');
  const normalized = digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits;
  if (!/^[6-9]\d{9}$/.test(normalized)) {
    return { valid: false, error: 'Enter a valid 10-digit Indian mobile number.' };
  }
  return { valid: true };
}

export function validateIndianPincode(pincode: string): ValidationResult {
  const trimmed = pincode.trim();
  if (!/^\d{6}$/.test(trimmed)) {
    return { valid: false, error: 'Enter a valid 6-digit Indian PIN code.' };
  }
  return { valid: true };
}

export function validatePositiveInr(amount: number, label: string): ValidationResult {
  if (Number.isNaN(amount) || amount < 0) {
    return { valid: false, error: `${label} must be 0 or greater.` };
  }
  return { valid: true };
}

export function validateSku(sku: string): ValidationResult {
  const trimmed = sku.trim();
  if (trimmed.length < 3) {
    return { valid: false, error: 'SKU must be at least 3 characters.' };
  }
  return { valid: true };
}
