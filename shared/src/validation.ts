import { z } from 'zod';

export const splitInputSchema = z.object({
  billAmount: z
    .union([z.number(), z.string()])
    .transform((val, ctx) => {
      const num = typeof val === 'string' ? parseFloat(val.trim()) : val;
      if (isNaN(num)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Bill amount must be a valid number.',
        });
        return z.NEVER;
      }
      if (typeof val === 'string' && val.trim() !== '') {
        const parts = val.trim().split('.');
        if (parts.length > 1 && parts[1].length > 2) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Bill amount cannot have more than 2 decimal places.',
          });
          return z.NEVER;
        }
      }
      return num;
    })
    .pipe(
      z
        .number({ invalid_type_error: 'Bill amount must be a valid number.' })
        .positive({ message: 'Bill amount must be greater than zero.' })
        .max(10000000, { message: 'Bill amount cannot exceed $10,000,000.' })
    ),
  tipPercentage: z
    .union([z.number(), z.string()])
    .transform((val, ctx) => {
      const num = typeof val === 'string' ? parseFloat(val.trim()) : val;
      if (isNaN(num)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Tip percentage must be a valid number.',
        });
        return z.NEVER;
      }
      return num;
    })
    .pipe(
      z
        .number({ invalid_type_error: 'Tip percentage must be a valid number.' })
        .min(0, { message: 'Tip percentage must be zero or greater.' })
        .max(1000, { message: 'Tip percentage cannot exceed 1000%.' })
    ),
  peopleCount: z
    .union([z.number(), z.string()])
    .transform((val, ctx) => {
      const num = typeof val === 'string' ? parseFloat(val.trim()) : val;
      if (isNaN(num) || !Number.isInteger(num)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Number of people must be a whole integer.',
        });
        return z.NEVER;
      }
      return num;
    })
    .pipe(
      z
        .number({ invalid_type_error: 'Number of people must be an integer.' })
        .int({ message: 'Number of people must be a whole integer.' })
        .min(1, { message: 'Number of people must be at least 1.' })
        .max(1000, { message: 'Number of people cannot exceed 1000.' })
    ),
});

export const splitCentsInputSchema = z.object({
  billCents: z
    .number({ invalid_type_error: 'Bill cents must be an integer.' })
    .int({ message: 'Bill cents must be an integer.' })
    .positive({ message: 'Bill cents must be greater than zero.' }),
  tipPercentage: z
    .number({ invalid_type_error: 'Tip percentage must be a number.' })
    .min(0, { message: 'Tip percentage must be zero or greater.' }),
  peopleCount: z
    .number({ invalid_type_error: 'Number of people must be an integer.' })
    .int({ message: 'Number of people must be an integer.' })
    .min(1, { message: 'Number of people must be at least 1.' }),
});

export type SplitFormInput = z.input<typeof splitInputSchema>;
export type SplitFormParsed = z.output<typeof splitInputSchema>;
export type SplitCentsInput = z.infer<typeof splitCentsInputSchema>;

export function dollarsToCents(amount: number | string): number {
  if (typeof amount === 'string') {
    const parsed = parseFloat(amount.trim());
    if (isNaN(parsed)) return 0;
    return Math.round(parsed * 100);
  }
  return Math.round(amount * 100);
}

export function centsToDollars(cents: number): string {
  return (cents / 100).toFixed(2);
}

export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}
