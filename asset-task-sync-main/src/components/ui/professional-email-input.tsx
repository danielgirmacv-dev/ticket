import React, { useState, useId, useEffect } from 'react';
import { Mail, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { validateEmail, normalizeEmail } from '@/lib/email-validation';

export interface ProfessionalEmailInputProps {
  id?: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
  labelClassName?: string;
  hint?: string;
  autoFocus?: boolean;
  onBlur?: () => void;
  onValidationChange?: (isValid: boolean, error: string | null) => void;
}

export const ProfessionalEmailInput: React.FC<ProfessionalEmailInputProps> = ({
  id: providedId,
  name = 'email',
  value,
  onChange,
  label,
  placeholder = 'name@company.com',
  required = true,
  disabled = false,
  className,
  inputClassName,
  labelClassName,
  hint,
  autoFocus = false,
  onBlur,
  onValidationChange,
}) => {
  const generatedId = useId();
  const inputId = providedId || generatedId;

  const [touched, setTouched] = useState(false);

  const validation = validateEmail(value, { required });
  const hasValue = value.trim().length > 0;
  const isInvalid = touched && hasValue && !validation.isValid;
  const isValid = hasValue && validation.isValid;

  useEffect(() => {
    if (onValidationChange) {
      onValidationChange(validation.isValid, validation.error);
    }
  }, [validation.isValid, validation.error, onValidationChange]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!touched) setTouched(true);
    onChange(e.target.value);
  };

  const handleBlur = () => {
    setTouched(true);
    // Auto-normalize on blur if user typed something
    if (value && value !== normalizeEmail(value)) {
      onChange(normalizeEmail(value));
    }
    if (onBlur) onBlur();
  };

  return (
    <div className={cn('space-y-1.5 w-full', className)}>
      {label && (
        <label
          htmlFor={inputId}
          className={cn(
            'text-xs font-medium uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center justify-between',
            labelClassName
          )}
        >
          <span className="flex items-center gap-1">
            {label}
            {required && <span className="text-destructive font-bold ml-0.5">*</span>}
          </span>
          {isValid && (
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 normal-case animate-in fade-in duration-200">
              <CheckCircle2 className="h-3 w-3 stroke-[2.5]" />
              Valid email
            </span>
          )}
        </label>
      )}

      <div className="relative">
        {/* Left Mail Icon */}
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-slate-500 transition-colors">
          <Mail className={cn('h-4 w-4 transition-colors', isValid && 'text-emerald-500', isInvalid && 'text-rose-500')} />
        </div>

        <input
          id={inputId}
          name={name}
          type="email"
          autoComplete="email"
          inputMode="email"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck="false"
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={disabled}
          autoFocus={autoFocus}
          className={cn(
            'flex h-11 w-full rounded-xl border bg-background pl-10 pr-10 text-sm transition-all duration-200',
            'placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            // Default border state
            !isInvalid && !isValid && 'border-input focus-visible:border-teal-500 focus-visible:ring-teal-500/20',
            // Valid state
            isValid && 'border-emerald-500/60 bg-emerald-500/[0.02] focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20 text-slate-900 dark:text-slate-100',
            // Invalid state
            isInvalid && 'border-rose-400 bg-rose-500/[0.02] text-rose-950 dark:text-rose-200 focus-visible:border-rose-500 focus-visible:ring-rose-500/20',
            inputClassName
          )}
        />

        {/* Right Status Indicator */}
        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none flex items-center">
          {isValid && (
            <div className="text-emerald-500 animate-in zoom-in-75 duration-200">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          )}
          {isInvalid && (
            <div className="text-rose-500 animate-in zoom-in-75 duration-200">
              <AlertCircle className="h-4 w-4" />
            </div>
          )}
        </div>
      </div>

      {/* Real-time Inline Feedback */}
      {isInvalid && validation.error && (
        <div className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 pt-0.5 animate-in fade-in slide-in-from-top-1 duration-150">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{validation.error}</span>
        </div>
      )}

      {!isInvalid && hint && (
        <p className="text-[11px] text-muted-foreground pt-0.5">{hint}</p>
      )}
    </div>
  );
};
