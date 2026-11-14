import type { Locale } from "@/lib/content";

type BrandCopy = {
  nav: Record<"program" | "organizations" | "resources" | "about" | "coaching" | "courses" | "entry" | "library" | "account" | "menu" | "close" | "language" | "skip", string>;
  hero: Record<"title" | "lead" | "emphasis" | "description" | "action", string>;
  pages: Record<"program" | "organizations" | "resources" | "about", { title: string; intro: string }>;
};

// English follows the approved references. Arabic and French are review drafts.
export const brandCopy: Record<Locale, BrandCopy> = {
  en: {
    nav: { program: "The Program", organizations: "For Organizations", resources: "Resources", about: "About", coaching: "Coaching", courses: "Courses", entry: "Sign in / Register", library: "My Learning", account: "Account", menu: "Menu", close: "Close menu", language: "Language", skip: "Skip to main content" },
    hero: {
      title: "Human Intelligence",
      lead: "for Your",
      emphasis: "Professional Evolution.",
      description: "Develop your emotional intelligence, strengthen your communication, understand people and organizational dynamics, and turn your professional potential into meaningful influence.",
      action: "Explore the Program",
    },
    pages: {
      program: { title: "Human Intelligence for Your Professional Evolution", intro: "A six-hour online course to understand yourself, work better with others, and grow within your organization." },
      organizations: { title: "For Organizations", intro: "Develop human intelligence for modern professional life: relationships, management, and collective performance." },
      resources: { title: "Resources", intro: "Explore self-awareness, communication, organizational intelligence, and human judgment with AI." },
      about: { title: "About Ibrahim Ben Abdallah", intro: "Better tools do not automatically create better decisions, teams, or careers. Develop the human intelligence behind all three." },
    },
  },
  ar: {
    nav: { program: "البرنامج", organizations: "للمؤسسات", resources: "الموارد", about: "عن إبراهيم", coaching: "المرافقة الفردية", courses: "الدورات", entry: "دخول / تسجيل", library: "دروسي", account: "حسابي", menu: "القائمة", close: "إغلاق القائمة", language: "اللغة", skip: "انتقل إلى المحتوى الرئيسي" },
    hero: {
      title: "الذكاء الإنساني",
      lead: "من أجل",
      emphasis: "تطوّرك المهني.",
      description: "طوّر ذكاءك العاطفي، وعزّز تواصلك، وافهم الناس وديناميكيات المؤسسات، وحوّل إمكاناتك المهنية إلى تأثير فعّال.",
      action: "اكتشف البرنامج",
    },
    pages: {
      program: { title: "الذكاء الإنساني من أجل تطوّرك المهني", intro: "دورة عبر الإنترنت مدّتها 6 ساعات لتفهم نفسك، وتتعاون بشكل أفضل مع الآخرين، وتتطوّر داخل مؤسستك." },
      organizations: { title: "للمؤسسات", intro: "طوّر الذكاء الإنساني للحياة المهنية المعاصرة: العلاقات والإدارة والأداء الجماعي." },
      resources: { title: "الموارد", intro: "استكشف الوعي بالذات، والتواصل، والذكاء التنظيمي، والحكم الإنساني في التعامل مع الذكاء الاصطناعي." },
      about: { title: "عن إبراهيم بن عبد الله", intro: "الأدوات الأفضل لا تصنع تلقائيًا قرارات أو فرقًا أو مسارات مهنية أفضل. طوّر الذكاء الإنساني الذي يقف خلفها." },
    },
  },
  fr: {
    nav: { program: "Le programme", organizations: "Pour les organisations", resources: "Ressources", about: "À propos", coaching: "Coaching", courses: "Cours", entry: "Connexion / Inscription", library: "Mes cours", account: "Mon compte", menu: "Menu", close: "Fermer le menu", language: "Langue", skip: "Aller au contenu principal" },
    hero: {
      title: "L’intelligence humaine",
      lead: "pour votre",
      emphasis: "évolution professionnelle.",
      description: "Développez votre intelligence émotionnelle, renforcez votre communication, comprenez les personnes et les dynamiques organisationnelles, et transformez votre potentiel professionnel en une influence qui compte.",
      action: "Découvrir le programme",
    },
    pages: {
      program: { title: "L’intelligence humaine pour votre évolution professionnelle", intro: "Un cours en ligne de 6 heures pour mieux vous comprendre, mieux travailler avec les autres et évoluer au sein de votre organisation." },
      organizations: { title: "Pour les organisations", intro: "Développez l’intelligence humaine pour la vie professionnelle actuelle : relations, management et performance collective." },
      resources: { title: "Ressources", intro: "Explorez la conscience de soi, la communication, l’intelligence organisationnelle et le jugement humain face à l’IA." },
      about: { title: "À propos d’Ibrahim Ben Abdallah", intro: "De meilleurs outils ne produisent pas automatiquement de meilleures décisions, équipes ou carrières. Développez l’intelligence humaine qui les sous-tend." },
    },
  },
};
