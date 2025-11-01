const DEBUG_GEO_LOGS_ENABLED = process.env.ENABLE_DEBUG_LOGS === "true";

const geoDebugLog = (...args: Parameters<typeof console.log>) => {
  if (DEBUG_GEO_LOGS_ENABLED) {
    console.log(...args);
  }
};

export function requiresPayment(country: string, requestId?: string): boolean {
  const logPrefix = requestId ? `[${requestId}] [GEO]` : '[GEO]';

  geoDebugLog(`${logPrefix} 🌍 Checking payment requirement for country: "${country}"`);

  if (!country) {
    geoDebugLog(`${logPrefix} ⚠️ Country is empty or null, requiring payment`);
    return true;
  }

  const normalized = country.trim().toLowerCase();
  geoDebugLog(`${logPrefix} 📝 Original country: "${country}"`);
  geoDebugLog(`${logPrefix} 🔄 Normalized country: "${normalized}"`);

  // Include both English and Arabic variants for Tunisia
  const tunisiaVariants = ['tunisia', 'tn', 'تونس'];
  const isTunisia = tunisiaVariants.includes(normalized);

  geoDebugLog(`${logPrefix} 🔍 Checking against variants: ${tunisiaVariants.join(', ')}`);
  geoDebugLog(`${logPrefix} ${isTunisia ? '✅ MATCH' : '❌ NO MATCH'}: Is Tunisia: ${isTunisia ? 'YES' : 'NO'}`);
  geoDebugLog(`${logPrefix} 💰 Payment required: ${!isTunisia ? 'YES' : 'NO'}`);

  return !isTunisia;
}
