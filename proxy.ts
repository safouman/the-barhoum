import { NextRequest, NextResponse } from "next/server";
import { isLocale } from "@/lib/i18n";

// Pass the validated URL choice to layouts, which do not receive searchParams.
export function proxy(request: NextRequest) {
  const headers = new Headers(request.headers);
  headers.delete("x-barhoum-locale");
  const locale = request.nextUrl.searchParams.get("lang");
  if (isLocale(locale)) headers.set("x-barhoum-locale", locale);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ["/((?!api(?:/|$)|admin(?:/|$)|_next(?:/|$)|.*\\.).*)"],
};
