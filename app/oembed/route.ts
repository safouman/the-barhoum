import { NextRequest, NextResponse } from "next/server";
import { seoConfig } from "@/config/seo";
import { siteUrl } from "@/lib/seo";

const brand = seoConfig.brand;
const providerName = brand.organization.name;
const providerUrl = brand.domains.primary.replace(/\/+$/, "");

const allowedHosts = [
    new URL(providerUrl).host,
    ...brand.domains.secondary.map((domain) => new URL(domain).host),
];

function toAbsolute(path: string): string {
    if (path.startsWith("http://") || path.startsWith("https://")) {
        return path;
    }
    if (path.startsWith("/")) {
        return `${siteUrl}${path}`;
    }
    return `${siteUrl}/${path}`;
}

function buildHtmlSnippet(targetUrl: string) {
    return `
<blockquote class="barhoum-coaching-embed">
  <p><strong>${brand.person.name}</strong> — ${brand.person.jobTitle}</p>
  <p>${brand.person.description}</p>
  <p><a href="${targetUrl}" rel="noopener" target="_blank">${providerName}</a></p>
</blockquote>
`.trim();
}

function buildXmlResponse(data: ReturnType<typeof buildJsonPayload>): string {
    const escape = (value: string | number) =>
        String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&apos;");

    return `<?xml version="1.0" encoding="UTF-8"?>
<oembed>
  <version>${escape(data.version)}</version>
  <type>${escape(data.type)}</type>
  <provider_name>${escape(data.provider_name)}</provider_name>
  <provider_url>${escape(data.provider_url)}</provider_url>
  <title>${escape(data.title)}</title>
  <author_name>${escape(data.author_name)}</author_name>
  <author_url>${escape(data.author_url)}</author_url>
  <html>${escape(data.html)}</html>
  <width>${escape(data.width)}</width>
  <height>${escape(data.height)}</height>
  <thumbnail_url>${escape(data.thumbnail_url)}</thumbnail_url>
  <thumbnail_width>${escape(data.thumbnail_width)}</thumbnail_width>
  <thumbnail_height>${escape(data.thumbnail_height)}</thumbnail_height>
  <cache_age>${escape(data.cache_age)}</cache_age>
</oembed>`;
}

function buildJsonPayload(targetUrl: string) {
    const thumbnailUrl = toAbsolute(seoConfig.openGraphImage.url);
    return {
        version: "1.0",
        type: "rich" as const,
        provider_name: providerName,
        provider_url: providerUrl,
        title: brand.person.name,
        author_name: brand.person.name,
        author_url: providerUrl,
        html: buildHtmlSnippet(targetUrl),
        width: 600,
        height: 200,
        thumbnail_url: thumbnailUrl,
        thumbnail_width: seoConfig.openGraphImage.width,
        thumbnail_height: seoConfig.openGraphImage.height,
        cache_age: 3600,
    };
}

export function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const targetUrl = searchParams.get("url");
    const format = (searchParams.get("format") ?? "json").toLowerCase();

    if (!targetUrl) {
        return NextResponse.json(
            { error: "Missing required query parameter 'url'." },
            { status: 400 }
        );
    }

    let parsedUrl: URL;
    try {
        parsedUrl = new URL(targetUrl);
    } catch {
        return NextResponse.json(
            { error: "Invalid URL supplied." },
            { status: 400 }
        );
    }

    if (!allowedHosts.includes(parsedUrl.host)) {
        return NextResponse.json(
            { error: "URL must belong to Ibrahim Ben Abdallah domains." },
            { status: 422 }
        );
    }

    const payload = buildJsonPayload(parsedUrl.toString());

    if (format === "json") {
        return NextResponse.json(payload, {
            status: 200,
            headers: {
                "Cache-Control":
                    "public, max-age=600, stale-while-revalidate=86400",
            },
        });
    }

    if (format === "xml") {
        const xml = buildXmlResponse(payload);
        return new NextResponse(xml, {
            status: 200,
            headers: {
                "Content-Type": "text/xml; charset=utf-8",
                "Cache-Control":
                    "public, max-age=600, stale-while-revalidate=86400",
            },
        });
    }

    return NextResponse.json(
        { error: "Unsupported format. Use json or xml." },
        { status: 501 }
    );
}
