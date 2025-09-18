import { LinksView } from "@/components/LinksView";
import { getLinksData, getUiStrings } from "@/lib/content";

export default async function LinksPage() {
  const [links, uiAr, uiEn] = await Promise.all([getLinksData(), getUiStrings("ar"), getUiStrings("en")]);
  return <LinksView links={links} ui={{ ar: uiAr, en: uiEn }} />;
}
