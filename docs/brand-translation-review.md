# Redesign translation review

## Approval status

The English hero copy follows the supplied desktop/mobile references. The English program introduction and core narrative follow the locked Brand & Course Team Brief.

Arabic and French strings in lib/brand-copy.ts and the catalog labels in components/learning/catalog-copy.ts are generated editorial drafts pending owner review. Review terminology, tone, line wrapping, accents and natural phrasing before final content acceptance. The six English module titles remain the approved course identities; authored lesson materials retain their original language.

## First visual checkpoint coverage

- New homepage hero, navigation and planned public-page titles/intros have English, Arabic and French entries.
- Arabic uses the existing Noto Naskh Arabic font and RTL direction.
- French and English use LTR direction.
- All numeric interface formatting must use Latin digits.
- Language switching preserves the current path, query parameters and fragment. The URL language wins over the stored locale and is handed to server-rendered layouts through a validated request header.
- A missing French field in legacy multilingual JSON falls back to its existing English field. Existing French UI/form/Markdown loaders explicitly use English legacy copy for this first visual checkpoint. This is incomplete French coverage, not reviewed French translation.
- Legacy coaching copy, legal-body content, account/recovery/email copy, footer strings and remaining learning controls require a complete inventory and owner-reviewed translations before wider multilingual acceptance. Checkout and payment confirmation remain English.

## Hero drafts

Arabic title: الذكاء الإنساني من أجل تطوّرك المهني.

Arabic description: طوّر ذكاءك العاطفي، وعزّز تواصلك، وافهم الناس وديناميكيات المؤسسات، وحوّل إمكاناتك المهنية إلى تأثير فعّال.

Arabic action: اكتشف البرنامج

French title: L’intelligence humaine pour votre évolution professionnelle.

French description: Développez votre intelligence émotionnelle, renforcez votre communication, comprenez les personnes et les dynamiques organisationnelles, et transformez votre potentiel professionnel en une influence qui compte.

French action: Découvrir le programme

## Metadata

The new hero dictionary follows the approved program narrative. Legacy English and Arabic SEO descriptions still require alignment during the wider rollout. French legal and AI reference titles/descriptions are draft translations. Legacy slogans that did not have translated source text retain their prior English fallback and are not newly approved claims.

## Route integration translation drafts

Owner review also covers lib/public-page-copy.ts, lib/student-copy.ts,
components/learning/learning-copy.ts and components/learning/catalog-copy.ts,
French purchase labels in components/commerce/PurchaseButton.tsx, and shared
footer labels. Authored course titles, questions, videos and files keep their
original language. Checkout and payment confirmation remain English.
