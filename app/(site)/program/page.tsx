import { redirect } from "next/navigation";
import { resolveLocale } from "@/lib/i18n.server";
import { MAIN_PROGRAM_HREF } from "@/lib/learning/main-program";

export const dynamic = "force-dynamic";

export default async function ProgramPage() {
  const locale = await resolveLocale();
  redirect(MAIN_PROGRAM_HREF + "?" + new URLSearchParams({ lang: locale }));
}
