export type CourseOffer = {
  id: number;
  moduleId: number | null;
  amountMinor: number;
  currency: string;
};

export type CourseCommerce = {
  offers: CourseOffer[];
  ownership: { base: boolean; moduleIds: number[] };
  signedIn: boolean;
  signInHref?: string;
};

const zeroDecimal = new Set(["BIF", "CLP", "DJF", "GNF", "JPY", "KMF", "KRW", "MGA", "PYG", "RWF", "VND", "VUV", "XAF", "XOF", "XPF"]);
const wholeUnit = new Set(["ISK", "UGX"]);

export function formatOfferPrice({ amountMinor, currency }: CourseOffer): string {
  const code = currency.toUpperCase();
  // Stripe represents ISK and UGX in hundredths for backward compatibility.
  const divisor = zeroDecimal.has(code) ? 1 : 100;
  const fractionDigits = divisor === 1 || wholeUnit.has(code) ? 0 : 2;
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency: code,
    currencyDisplay: "code",
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(amountMinor / divisor);
}

export function stripeCheckoutHref(value: unknown): string | undefined {
  if (typeof value !== "string") return;
  const url = URL.parse(value);
  if (url?.origin === "https://checkout.stripe.com" && !url.username && !url.password) {
    return url.href;
  }
}

export function isOrderId(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value) && value.length === 36;
}

export function orderSignInHref(orderId: string) {
  const order = new URLSearchParams({ orderId });
  const query = new URLSearchParams({ returnTo: "/checkout/return?" + order });
  return "/login?" + query;
}
