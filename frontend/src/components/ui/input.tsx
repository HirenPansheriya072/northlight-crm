'use client';

import * as React from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { cn } from '@/lib/utils';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'h-10 w-full rounded border border-line-strong bg-surface px-3 text-sm text-ink transition-colors',
        'placeholder:text-ink-faint hover:border-ink-faint',
        'focus:border-pine focus:outline-none focus:ring-2 focus:ring-pine/20 focus:ring-offset-0',
        'disabled:cursor-not-allowed disabled:bg-paper',
        className
      )}
      {...props}
    />
  )
);
Input.displayName = 'Input';

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      'w-full rounded border border-line-strong bg-surface px-3 py-2 text-sm text-ink transition-colors',
      'placeholder:text-ink-faint hover:border-ink-faint',
      'focus:border-pine focus:outline-none focus:ring-2 focus:ring-pine/20',
      className
    )}
    {...props}
  />
));
Textarea.displayName = 'Textarea';

export const Select = React.forwardRef<
  HTMLButtonElement,
  Omit<React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>, 'value' | 'onChange'> & {
    value?: string;
    onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    children?: React.ReactNode;
    placeholder?: string;
  }
>(({ className, value, onChange, children, placeholder, ...props }, ref) => {
  const options = React.Children.toArray(children).map((child) => {
    if (React.isValidElement(child) && child.type === 'option') {
      const rawValue = child.props.value ?? '';
      return {
        value: rawValue === '' ? '__EMPTY__' : String(rawValue),
        label: child.props.children ?? '',
        className: child.props.className ?? '',
      };
    }
    return null;
  }).filter(Boolean) as { value: string; label: string; className: string }[];

  const activeValue = (value === undefined || value === '') ? '__EMPTY__' : String(value);

  let activeLabel = '';
  const matched = options.find((o) => o.value === activeValue);
  if (matched) {
    activeLabel = matched.label;
  } else if (options.length > 0) {
    activeLabel = options[0].label;
  }

  const handleValueChange = (val: string) => {
    if (onChange) {
      const event = {
        target: {
          value: val === '__EMPTY__' ? '' : val,
          name: props.name || '',
        },
      } as any;
      onChange(event);
    }
  };

  return (
    <SelectPrimitive.Root value={activeValue} onValueChange={handleValueChange}>
      <SelectPrimitive.Trigger
        ref={ref}
        className={cn(
          'flex h-10 w-full items-center justify-between rounded border border-line-strong bg-surface px-3 text-sm text-ink transition-colors',
          'hover:border-ink-faint focus:border-pine focus:outline-none focus:ring-2 focus:ring-pine/20',
          className
        )}
        {...props}
      >
        <span className="truncate">{activeLabel || placeholder}</span>
        <SelectPrimitive.Icon asChild>
          <svg className="h-3.5 w-3.5 text-ink-muted shrink-0 ml-2" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="m6 9 6 6 6-6"/>
          </svg>
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={4}
          className="z-[9999] min-w-[var(--radix-select-trigger-width)] max-h-[300px] overflow-y-auto rounded-lg border border-line bg-surface p-1 shadow-lift data-[side=bottom]:translate-y-1 data-[side=top]:-translate-y-1 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none outline-none"
        >
          <SelectPrimitive.Viewport className="p-1">
            {options.map((opt) => (
              <SelectPrimitive.Item
                key={opt.value}
                value={opt.value}
                className={cn(
                  'relative flex w-full cursor-pointer select-none items-center rounded py-1.5 pl-8 pr-2 text-[13px] outline-none transition-colors',
                  'focus:bg-paper focus:text-ink data-[disabled]:pointer-events-none data-[disabled]:opacity-50 text-ink',
                  opt.className
                )}
              >
                <span className="absolute left-2.5 flex h-3.5 w-3.5 items-center justify-center">
                  <SelectPrimitive.ItemIndicator>
                    <svg className="h-3 w-3 text-pine" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path d="M20 6 9 17l-5-5"/>
                    </svg>
                  </SelectPrimitive.ItemIndicator>
                </span>
                <SelectPrimitive.ItemText>{opt.label}</SelectPrimitive.ItemText>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
});
Select.displayName = 'Select';

export function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[13px] font-medium text-ink">{label}</label>
      {children}
      {error ? (
        <p className="text-[12px] text-clay">{error}</p>
      ) : hint ? (
        <p className="text-[12px] text-ink-faint">{hint}</p>
      ) : null}
    </div>
  );
}
