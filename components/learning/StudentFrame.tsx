import { SiteHeader } from "@/components/SiteHeader";

export function StudentFrame({ children, signedIn, brandLabel, fontClassName }: {
  children: React.ReactNode;
  signedIn: boolean;
  brandLabel: string;
  fontClassName: string;
}) {
  return (
    <html lang="en" dir="ltr" className={fontClassName}>
      <body className="min-h-screen bg-[#f2f8f6]">
        <SiteHeader locale="en" signedIn={signedIn} brandLabel={brandLabel} />
        <main>{children}</main>
      </body>
    </html>
  );
}
