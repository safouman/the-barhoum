export function requiresPayment(country: string): boolean {
  console.log(`[GEO] 🌍 Checking payment requirement for country: "${country}"`);

  if (!country) {
    console.log(`[GEO] ⚠️ Country is empty or null, requiring payment`);
    return true;
  }

  const normalized = country.trim().toLowerCase();
  console.log(`[GEO] Normalized country: "${normalized}"`);

  const tunisiaVariants = ['tunisia', 'tn'];
  const isTunisia = tunisiaVariants.includes(normalized);

  console.log(`[GEO] Is Tunisia: ${isTunisia ? '✅ YES' : '❌ NO'}, Payment required: ${!isTunisia ? '✅ YES' : '❌ NO'}`);

  return !isTunisia;
}
