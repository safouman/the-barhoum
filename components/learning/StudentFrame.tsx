import Image from "next/image";
import Link from "next/link";
import { LearningNavigation } from "./LearningNavigation";

export function StudentFrame({ children, signedIn, fontClassName }: {
  children: React.ReactNode;
  signedIn: boolean;
  fontClassName: string;
}) {
  return (
    <html lang="en" dir="ltr" className={fontClassName}>
      <body className="min-h-screen bg-[#f2f8f6]">
        <header className="border-b border-border bg-white">
          <div className="mx-auto flex min-h-16 max-w-screen-xl flex-wrap items-center justify-between gap-x-4 px-4 py-2 sm:px-6">
            <Link href="/" aria-label="Barhoum home" className="inline-flex min-h-11 items-center">
              <Image src="/images/logo.png" alt="Barhoum" width={96} height={96} className="h-10 w-auto object-contain" />
            </Link>
            <LearningNavigation signedIn={signedIn} />
          </div>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
