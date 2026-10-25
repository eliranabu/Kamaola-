/** Currency formatting helpers. The product is Israeli: the shekel is the only currency. */

export const CURRENCY_SYMBOL = '₪' as const;

/** Formats a number to whole currency units. */
export function formatCurrency(amount: number, currency: string = CURRENCY_SYMBOL): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return `0 ${currency}`;
  }
  const formatted = Math.round(amount).toLocaleString('he-IL');
  return `${formatted} ${currency}`;
}

/** Formats currency with optional agorot / decimals for precise price per pack. */
export function formatCurrencyExact(amount: number, currency: string = CURRENCY_SYMBOL): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return `0.00 ${currency}`;
  }
  const formatted = amount.toLocaleString('he-IL', {
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2
  });
  return `${formatted} ${currency}`;
}
