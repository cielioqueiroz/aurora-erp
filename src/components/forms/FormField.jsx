import * as React from 'react';
import { cn } from '@/lib/cn';
import { Label } from '@/components/ui/label';

/**
 * FormField — wrapper de campo com label, descrição e mensagem de erro.
 * Trabalha em conjunto com react-hook-form (recebe register/error externamente).
 *
 * <FormField label="E-mail" error={errors.email?.message}>
 *   <Input {...register('email')} />
 * </FormField>
 */
export const FormField = React.forwardRef(
  ({ label, description, error, htmlFor, required, className, children }, ref) => {
    const id = React.useId();
    const inputId = htmlFor ?? id;
    const child = React.Children.only(children);
    const cloned = React.cloneElement(child, {
      id: inputId,
      'aria-invalid': error ? true : undefined,
      'aria-describedby': error ? `${inputId}-error` : description ? `${inputId}-desc` : undefined,
    });

    return (
      <div ref={ref} className={cn('grid gap-1.5', className)}>
        {label && (
          <Label htmlFor={inputId} className={cn(error && 'text-destructive')}>
            {label}
            {required && <span className="ml-1 text-destructive">*</span>}
          </Label>
        )}
        {cloned}
        {description && !error && (
          <p id={`${inputId}-desc`} className="text-xs text-muted-foreground">
            {description}
          </p>
        )}
        {error && (
          <p id={`${inputId}-error`} className="text-xs text-destructive">
            {error}
          </p>
        )}
      </div>
    );
  },
);
FormField.displayName = 'FormField';
