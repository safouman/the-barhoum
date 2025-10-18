export function requiresPayment(country: string): boolean {
  if (!country) {
    return true;
  }

  const normalized = country.trim().toLowerCase();

  const tunisiaVariants = ['tunisia', 'tn'];

  return !tunisiaVariants.includes(normalized);
}
