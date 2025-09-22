import { Container } from "./Container";
import type { Locale, UIStrings } from "@/lib/content";

interface FooterProps {
  ui: Record<Locale, UIStrings>;
  brand: { ar: string; en: string };
  locale: Locale;
}

export function Footer({ ui, brand, locale }: FooterProps) {
  const strings = ui[locale];
  const brandLabel = brand[locale];
  const isRtl = locale === "ar";

  const navLinks = [
    { href: "#about", label: locale === "ar" ? "حول" : "About" },
    { href: "#categories", label: locale === "ar" ? "المنهج" : "Approach" },
    { href: "#testimonials", label: strings.testimonials },
    { href: "#lead-form", label: locale === "ar" ? "تواصل" : "Contact" },
  ];

  const socialLinks = [
    { href: "https://instagram.com/barhoum", label: "Instagram", icon: "📷" },
    { href: "https://x.com/barhoum", label: "X", icon: "𝕏" },
    { href: "https://linkedin.com/in/barhoum", label: "LinkedIn", icon: "💼" },
    { href: "https://youtube.com/@barhoum", label: "YouTube", icon: "📺" },
    { href: "https://newsletter.barhoum.coach", label: "Newsletter", icon: "📧" },
  ];

  return (
    <footer className="bg-white border-t border-gray-100">
      <Container className="py-12">
        <div className="text-center space-y-8">
          {/* Brand and Tagline */}
          <div className="space-y-2">
            <h3 className="text-2xl font-heading font-semibold text-[#222]">
              {brandLabel}
            </h3>
            <p className="text-sm text-[#222] opacity-80">
              {locale === "ar" ? "من أجل عالم أفضل" : "For a Better World"}
            </p>
          </div>

          {/* Divider */}
          <div className="w-16 h-px bg-[#222] opacity-20 mx-auto"></div>

          {/* Navigation Links */}
          <nav
            className={`flex flex-wrap items-center justify-center gap-6 text-sm ${
              isRtl ? "flex-row-reverse" : ""
            }`}
            dir={isRtl ? "rtl" : "ltr"}
          >
            {navLinks.map((link, index) => (
              <span key={link.href} className="flex items-center gap-6">
                <a
                  href={link.href}
                  className="text-[#222] hover:text-[#2AD6CA] transition-colors duration-200"
                >
                  {link.label}
                </a>
                {index < navLinks.length - 1 && (
                  <span className="text-[#222] opacity-30">·</span>
                )}
              </span>
            ))}
          </nav>

          {/* Social Icons */}
          <div className="flex items-center justify-center gap-4">
            {socialLinks.map((social) => (
              <a
                key={social.href}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-gray-50 hover:bg-[#2AD6CA] hover:text-white flex items-center justify-center text-[#222] transition-all duration-200 hover:scale-105"
                aria-label={social.label}
              >
                <span className="text-lg" aria-hidden="true">
                  {social.icon}
                </span>
              </a>
            ))}
          </div>

          {/* Copyright */}
          <div className="text-xs text-[#222] opacity-60">
            © 2025 {brandLabel}
          </div>
        </div>
      </Container>
    </footer>
  );
}