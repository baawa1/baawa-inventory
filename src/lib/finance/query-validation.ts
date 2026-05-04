import { z } from 'zod';

function parseOptionalDate(
  value: string | undefined,
  label: string,
  ctx: z.RefinementCtx
): Date | undefined {
  if (value === undefined) {
    return undefined;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Invalid ${label}`,
    });
    return z.NEVER;
  }

  return date;
}

export const optionalFinanceDateInputSchema = z
  .string()
  .trim()
  .min(1)
  .optional()
  .transform((value, ctx) => parseOptionalDate(value, 'date', ctx));

export const nullableOptionalFinanceDateInputSchema = z
  .string()
  .trim()
  .min(1)
  .nullable()
  .optional()
  .transform((value, ctx) =>
    parseOptionalDate(value ?? undefined, 'date', ctx)
  );

export function addFinanceDateRangeIssue(
  startDate: Date | undefined,
  endDate: Date | undefined,
  ctx: z.RefinementCtx,
  path: string[] = ['endDate']
) {
  if (startDate && endDate && startDate > endDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Start date must be before end date',
      path,
    });
  }
}

export function buildPositiveIntegerQuerySchema(
  fieldLabel: string,
  defaultValue: number,
  options?: { max?: number }
) {
  let schema = z.coerce
    .number({
      invalid_type_error: `${fieldLabel} must be a number`,
    })
    .int(`${fieldLabel} must be a whole number`)
    .min(1, `${fieldLabel} must be at least 1`);

  if (options?.max !== undefined) {
    schema = schema.max(
      options.max,
      `${fieldLabel} cannot exceed ${options.max}`
    );
  }

  return schema.default(defaultValue);
}

export function getZodErrorMessage(
  error: z.ZodError,
  fallback: string
): string {
  return error.issues[0]?.message || fallback;
}
