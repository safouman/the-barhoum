import { CvView } from "@/components/CvView";
import { getCvData, getUiStrings } from "@/lib/content";

export default async function CvPage() {
  const [cv, uiAr, uiEn] = await Promise.all([getCvData(), getUiStrings("ar"), getUiStrings("en")]);
  return <CvView cv={cv} ui={{ ar: uiAr, en: uiEn }} />;
}
