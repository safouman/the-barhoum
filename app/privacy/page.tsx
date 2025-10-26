import type { Metadata } from "next";
import { Container } from "@/components/Container";
import { getPageMetadata } from "@/lib/seo";
import { resolveLocale } from "@/lib/i18n.server";

export async function generateMetadata(): Promise<Metadata> {
    const locale = resolveLocale();
    return getPageMetadata("privacy", locale);
}

export default function PrivacyPage() {
    return (
        <div
            className="py-[clamp(var(--space-lg),18vh,var(--space-xl))]"
            dir="ltr"
            lang="en"
        >
            <Container className="max-w-3xl space-y-sm">
                <h1>Privacy Policy</h1>
                <p className="text-subtle text-lg leading-relaxed">
                    This Privacy Policy explains how we handle your data across
                    all Barhoum Coaching experiences and touchpoints.
                </p>
                <div className="space-y-4 text-base leading-relaxed">
                    <p>
                        We collect only the information needed to deliver
                        personalized coaching, provide requested services, and
                        maintain a secure digital environment. Examples include
                        contact details you share through forms and insights
                        from sessions that help us tailor our support.
                    </p>
                    <p>
                        Your data stays private. We never sell personal
                        information and only work with trusted partners who meet
                        strict security standards. When third-party tools help
                        us deliver services—for example, scheduling, payments,
                        or analytics—we limit access to what is essential.
                    </p>
                    <p>
                        You are in control. Reach out anytime if you would like
                        to review, update, or delete your information, or to ask
                        questions about our privacy practices. We are committed
                        to transparent communication and evolving protections as
                        our services grow.
                    </p>
                </div>
            </Container>
        </div>
    );
}
