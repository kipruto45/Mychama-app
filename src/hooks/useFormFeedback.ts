import { useCallback, useState } from 'react';
import { parseApiFormError, type ParsedFormError } from '@/utils/apiErrorParser';

export type FieldErrorMap<TField extends string> = Partial<Record<TField, string>>;

export function useFormFeedback<TField extends string = string>() {
  const [fieldErrors, setFieldErrors] = useState<FieldErrorMap<TField>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const clearAll = useCallback(() => {
    setFieldErrors({});
    setFormError(null);
    setFormSuccess(null);
  }, []);

  const clearFieldError = useCallback((field: TField) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      return { ...prev, [field]: undefined };
    });
  }, []);

  const setSuccess = useCallback((message: string | null) => {
    setFormSuccess(message);
    if (message) {
      setFormError(null);
    }
  }, []);

  const setError = useCallback((message: string | null) => {
    setFormError(message);
    if (message) {
      setFormSuccess(null);
    }
  }, []);

  const applyApiError = useCallback(
    (
      error: unknown,
      opts?: Parameters<typeof parseApiFormError<TField>>[1]
    ): ParsedFormError<TField> => {
      const parsed = parseApiFormError<TField>(error, opts);
      if (Object.keys(parsed.fieldErrors).length > 0) {
        setFieldErrors((prev) => ({ ...prev, ...parsed.fieldErrors }));
      }
      setError(parsed.formError ?? null);
      return parsed;
    },
    [setError]
  );

  return {
    fieldErrors,
    formError,
    formSuccess,
    setFieldErrors,
    setFormError: setError,
    setFormSuccess: setSuccess,
    clearFieldError,
    clearAll,
    applyApiError,
  };
}

