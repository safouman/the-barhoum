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
                    all Ibrahim Ben Abdallah experiences and touchpoints.
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
                <div className="space-y-3 rounded-xl bg-gray-50/70 p-6 text-sm leading-relaxed text-[#222]">
                    <h2 className="text-base font-semibold">
                        Cookies and local storage
                    </h2>
                    <p className="text-sm">
                        We use a small set of cookies and browser storage
                        entries. You can adjust your choice at any time through
                        the Cookie Preferences link in the footer.
                    </p>
                    <div className="space-y-2">
                        <div className="rounded-lg border border-gray-200 bg-white p-4">
                            <p className="font-medium">barhoum_locale</p>
                            <p className="text-xs text-[#222]/70">
                                Purpose: remember your language preference so
                                the site loads in Arabic or English. Expires
                                after 12 months. This cookie is essential for
                                providing the experience you select.
                            </p>
                        </div>
                        <div className="rounded-lg border border-gray-200 bg-white p-4">
                            <p className="font-medium">barhoum_consent</p>
                            <p className="text-xs text-[#222]/70">
                                Purpose: record whether you accepted or rejected
                                optional analytics. Expires after 12 months. We
                                only load Google Analytics (GA4) when this
                                consent is set to “accepted”.
                            </p>
                        </div>
                        <div className="rounded-lg border border-gray-200 bg-white p-4">
                            <p className="font-medium">
                                Google Analytics (GA4)
                            </p>
                            <p className="text-xs text-[#222]/70">
                                When enabled, GA4 sets cookies such as
                                <code className="mx-1 rounded bg-gray-100 px-1">
                                    _ga
                                </code>
                                and
                                <code className="mx-1 rounded bg-gray-100 px-1">
                                    _ga_*
                                </code>
                                to measure site usage. Lifetimes range from 24
                                hours to 12 months. These analytics cookies are
                                optional and are blocked until you grant
                                consent.
                            </p>
                        </div>
                    </div>
                </div>
                <p className="text-sm text-subtle/70">
                    Ibrahim Ben Abdallah operates as the public-facing brand of
                    Whispered Life OÜ.
                </p>
            </Container>
        </div>
    );
}
