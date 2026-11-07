const studentDestinations = new Set(["/account", "/my-learning", "/courses"]);
const coursePath = /^\/courses\/[a-z0-9-]+(?:\/lessons\/[a-zA-Z0-9_-]+)?$/;

const checkoutReturn = /^\/checkout\/return\?orderId=[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function safeReturnTo(input: unknown, fallback = "/my-learning"): string {
  return typeof input === "string" && input === input.trim() && (studentDestinations.has(input) || coursePath.test(input) || checkoutReturn.test(input)) ? input : fallback;
}

