export function requiresPayment(country: string, requestId?: string): boolean {
  const logPrefix = requestId ? `[${requestId}] [GEO]` : '[GEO]';

  console.log(`${logPrefix} 🌍 Checking payment requirement for country: "${country}"`);

  if (!country) {
    console.log(`${logPrefix} ⚠️ Country is empty or null, requiring payment`);
    return true;
  }

  const normalized = country.trim().toLowerCase();
  console.log(`${logPrefix} 📝 Original country: "${country}"`);
  console.log(`${logPrefix} 🔄 Normalized country: "${normalized}"`);

  // Include both English and Arabic variants for Tunisia
  const tunisiaVariants = ['tunisia', 'tn', 'تونس'];
  const isTunisia = tunisiaVariants.includes(normalized);

  console.log(`${logPrefix} 🔍 Checking against variants: ${tunisiaVariants.join(', ')}`);
  console.log(`${logPrefix} ${isTunisia ? '✅ MATCH' : '❌ NO MATCH'}: Is Tunisia: ${isTunisia ? 'YES' : 'NO'}`);
  console.log(`${logPrefix} 💰 Payment required: ${!isTunisia ? 'YES' : 'NO'}`);

  return !isTunisia;
}
