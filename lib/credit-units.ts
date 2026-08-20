/** Whole-credit display helpers. Balances and costs are stored as floats (e.g. 1.5). */

export const DEFAULT_CREDIT_COST = 1;

/** Studio refund rate: £10 = 1 credit, £5 = 0.5 credit. */
export const PENCE_PER_CREDIT = 1000;

export function penceToCredits(pence: number) {
  if (!Number.isFinite(pence) || pence <= 0) return 0;
  return Math.round((pence / PENCE_PER_CREDIT) * 100) / 100;
}

export function formatCredits(amount: number) {
  const value = Number(amount);
  if (!Number.isFinite(value)) return "0";
  const rounded = Math.round(value * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2).replace(/0$/, "").replace(/\.0$/, "");
}

export function formatCreditLabel(amount: number) {
  const formatted = formatCredits(amount);
  return Number(formatted) === 1 ? "1 class credit" : `${formatted} class credits`;
}

export function parseCreditInput(value: unknown, fallback = DEFAULT_CREDIT_COST) {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim()
        ? Number.parseFloat(value)
        : Number.NaN;
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.round(parsed * 100) / 100;
}

export function hasEnoughCredits(balance: number, cost: number) {
  return Number(balance) + 1e-9 >= Number(cost);
}
