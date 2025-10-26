import { NextResponse } from "next/server";
import { seoConfig } from "@/config/seo";
import { siteUrl } from "@/lib/seo";

function toAbsoluteUrl(path: string): string {
    if (path.startsWith("http://") || path.startsWith("https://")) {
        return path;
    }
    if (path.startsWith("/")) {
        return `${siteUrl}${path}`;
    }
    return `${siteUrl}/${path}`;
}

export function GET() {
    const brand = seoConfig.brand;
    const organizationId = `${siteUrl}#organization`;
    const personId = `${siteUrl}#ibrahim-ben-abdallah`;

    const payload = {
        "@context": "https://schema.org",
        "@type": "Person",
        "@id": personId,
        name: brand.person.name,
        alternateName: brand.person.alternateName,
        description: brand.person.description,
        jobTitle: brand.person.jobTitle,
        url: brand.domains.primary,
        image: toAbsoluteUrl(brand.person.image),
        sameAs: brand.socials,
        knowsLanguage: brand.availableLanguages,
        areaServed: brand.areaServed,
        worksFor: {
            "@type": "Organization",
            "@id": organizationId,
            name: brand.organization.name,
            legalName: brand.organization.legalName,
            url: brand.domains.primary,
            sameAs: brand.socials,
        },
        providerOf: [
            {
                "@type": "Service",
                name: brand.organization.name,
                serviceType: "Coaching Program",
                areaServed: brand.areaServed,
                availableLanguage: brand.availableLanguages,
                provider: {
                    "@id": personId,
                },
                url: brand.domains.primary,
            },
        ],
    };

    return new NextResponse(JSON.stringify(payload, null, 2), {
        status: 200,
        headers: {
            "Content-Type": "application/ld+json; charset=utf-8",
            "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
        },
    });
}
