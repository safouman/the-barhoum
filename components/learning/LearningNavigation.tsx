import Link from "next/link";

export function LearningNavigation({ signedIn }: { signedIn?: boolean }) {
  const className = "inline-flex min-h-11 items-center text-sm font-semibold text-[#12685f] hover:underline";
  return (
    <nav aria-label="Learning" className="flex flex-wrap items-center gap-x-4">
      <Link href="/courses" className={className}>Courses</Link>
      <Link href="/my-learning" className={className}>My Learning</Link>
      {signedIn ? <Link href="/account" className={className}>Account</Link> : (
        <>
          <Link href="/login" className={className}>Sign in</Link>
          <Link href="/register" className={className}>Register</Link>
        </>
      )}
    </nav>
  );
}
