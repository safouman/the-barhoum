import { SiteHeader } from "@/components/SiteHeader";

export function StudentFrame({ children, signedIn, brandLabel, fontClassName }: {
  children: React.ReactNode;
  signedIn: boolean;
  brandLabel: string;
  fontClassName: string;
}) {
  return (
    <html lang="ar" dir="rtl" className={fontClassName}>
      <body className="min-h-screen bg-[#f2f8f6]">
        <SiteHeader locale="ar" signedIn={signedIn} brandLabel={brandLabel} />
        <main id="main-content" tabIndex={-1}>{children}</main>
      </body>
    </html>
  );
}
