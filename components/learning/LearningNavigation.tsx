import Link from "next/link";

export function LearningNavigation({ signedIn, active }: { signedIn?: boolean; active?: "courses" | "library" | "account" }) {
  const className = "inline-flex min-h-11 items-center rounded-sm text-sm font-semibold text-[#12685f] underline-offset-4 hover:underline aria-[current=page]:underline";
  return (
    <nav aria-label="Learning" className="flex flex-wrap items-center gap-x-4">
      <Link href="/courses" aria-current={active === "courses" ? "page" : undefined} className={className}>Courses</Link>
      {signedIn ? (
        <>
          <Link href="/my-learning" aria-current={active === "library" ? "page" : undefined} className={className}>My Learning</Link>
          <Link href="/account" aria-current={active === "account" ? "page" : undefined} className={className}>Account</Link>
        </>
      ) : (
        <>
          <Link href="/login" className={className}>Sign in</Link>
          <Link href="/register" className={className}>Register</Link>
        </>
      )}
    </nav>
  );
}
