import type { Metadata } from "next";
import { Container } from "@/components/Container";
import { getPageMetadata } from "@/lib/seo";
import { resolveLocale } from "@/lib/i18n.server";

export async function generateMetadata(): Promise<Metadata> {
    const locale = resolveLocale();
    return getPageMetadata("terms", locale);
}

export default function TermsPage() {
    return (
        <div
            className="py-[clamp(var(--space-lg),18vh,var(--space-xl))]"
            dir="ltr"
            lang="en"
        >
            <Container className="max-w-3xl space-y-sm">
                <h1>Terms of Service</h1>
                <p className="text-subtle text-lg leading-relaxed">
                    These Terms of Service outline how you can engage with
                    Barhoum Coaching offerings and the commitments we make in
                    return.
                </p>
                <div className="space-y-4 text-base leading-relaxed">
                    <p>
                        Services are provided with mutual respect, clear
                        communication, and a shared focus on your goals. When
                        you schedule sessions or workshops, you agree to show up
                        on time and prepared, and we agree to provide a safe,
                        thoughtful space for exploration and growth.
                    </p>
                    <p>
                        Payments are processed through trusted providers. Please
                        review pricing and cancellation windows before booking.
                        If you need to reschedule, contact us as soon as
                        possible so we can support you effectively.
                    </p>
                    <p>
                        By working with Barhoum Coaching, you acknowledge that
                        coaching is a collaborative, non-clinical practice.
                        These terms may evolve over time; continuing to use our
                        services signifies your acceptance of the latest
                        updates.
                    </p>
                </div>
                <p className="text-sm text-subtle/70">
                    Barhoum Coaching operates as the public-facing brand of Whispered Life OÜ.
                </p>
            </Container>
        </div>
    );
}
