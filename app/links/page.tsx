import { LinksView } from "@/components/LinksView";
import { getLinksData, getUiStrings } from "@/lib/content";
import { getPageMetadata } from "@/lib/seo";

export const metadata = getPageMetadata("links");

export default async function LinksPage() {
  const [links, uiAr, uiEn] = await Promise.all([getLinksData(), getUiStrings("ar"), getUiStrings("en")]);
  return <LinksView links={links} ui={{ ar: uiAr, en: uiEn }} />;
}
