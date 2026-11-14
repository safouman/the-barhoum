import type { Locale } from "@/lib/content";

type PublicPageSection = {
  title: string;
  paragraphs: string[];
};

type PublicPageCopy = {
  organizations: { eyebrow: string; sections: PublicPageSection[]; action: string };
  about: { eyebrow: string; sections: PublicPageSection[]; action: string };
  resources: {
    eyebrow: string;
    sections: PublicPageSection[];
    preview: { title: string; description: string };
    introduction: { title: string; description: string };
    socialDescription: string;
    linkLabel: string;
  };
};

// EN uses the locked Brand & Course Team Brief and existing biography.
// AR and FR are owner-review translation drafts.
export const publicPageCopy: Record<Locale, PublicPageCopy> = {
  en: {
    organizations: {
      eyebrow: "Human intelligence at work",
      sections: [
        {
          title: "Same tools. Different decisions.",
          paragraphs: [
            "AI makes powerful technical capabilities widely accessible. Yet the same tool does not produce the same decisions or outcomes. Context, judgment, emotions, creativity, and human collaboration still make the difference.",
            "As we make our tools more intelligent, are we also developing the intelligence of the people who use, direct, and depend on them?",
          ],
        },
        {
          title: "Human ↔ Human",
          paragraphs: ["Understand others, manage and be managed, communicate under pressure, build trust, contribute in meetings, and navigate organizations."],
        },
        {
          title: "Human ↔ AI",
          paragraphs: ["Define objectives, challenge outputs, assess feasibility, and retain independent judgment and original thinking."],
        },
        {
          title: "Human ↔ Human + AI",
          paragraphs: ["Align expectations: managers request, teams assess, and everyone negotiates scope, deadlines, quality, and accountability."],
        },
        {
          title: "From impressive demos to shared decisions",
          paragraphs: [
            "A manager sees an AI-generated prototype and assumes a complete product will be easy to deliver. An engineer knows the difference between an impressive demo and a reliable, secure, maintainable solution.",
            "The real challenge becomes human: explain constraints without conflict, negotiate priorities, and decide together.",
          ],
        },
      ],
      action: "Start a conversation",
    },
    about: {
      eyebrow: "Ibrahim Ben Abdallah",
      sections: [
        {
          title: "The future is artificial. The difference is human.",
          paragraphs: ["We teach human intelligence for modern professional life. AI opens the conversation; relationships, management, and collective performance are the core of the offering."],
        },
        {
          title: "Clarity, judgment, and human relationships",
          paragraphs: [
            "I guide leaders and creatives through a quiet journey of discovery, where strategy meets intuition.",
            "The focus is practical: understand yourself, work better with others, and grow within your organization.",
          ],
        },
        {
          title: "From awareness to impact",
          paragraphs: ["The six-hour online course explores self-awareness, organizational dynamics, communication, meetings, pressure, and professional growth."],
        },
      ],
      action: "Explore the Program",
    },
    resources: {
      eyebrow: "Explore and reflect",
      sections: [
        {
          title: "The questions behind the work",
          paragraphs: [
            "Self-awareness and emotional regulation. Relational and organizational intelligence. Communication and managing up. Human judgment with AI. Influence and professional growth.",
            "Begin with the available public course previews, the existing introduction, and Ibrahim’s public channels.",
          ],
        },
      ],
      preview: { title: "Free course previews", description: "Browse the course catalog and open the lessons marked as free previews." },
      introduction: { title: "Watch the introduction", description: "The existing public introduction video, in its original language." },
      socialDescription: "Visit the existing public channel.",
      linkLabel: "Open resource",
    },
  },
  ar: {
    organizations: {
      eyebrow: "الذكاء الإنساني في العمل",
      sections: [
        {
          title: "الأدوات نفسها. قرارات مختلفة.",
          paragraphs: [
            "يتيح الذكاء الاصطناعي قدرات تقنية متقدمة للجميع، لكن الأداة نفسها لا تنتج القرارات أو النتائج نفسها. يظلّ السياق والحكم والعواطف والإبداع والتعاون الإنساني عوامل تصنع الفرق.",
            "بينما نطوّر ذكاء أدواتنا، هل نطوّر أيضًا ذكاء الأشخاص الذين يستخدمونها ويوجّهونها ويعتمدون عليها؟",
          ],
        },
        { title: "الإنسان ↔ الإنسان", paragraphs: ["افهم الآخرين، وتعلّم الإدارة والعمل تحت إدارة الآخرين، وتواصل تحت الضغط، وابنِ الثقة، وساهم في الاجتماعات، وافهم المؤسسات."] },
        { title: "الإنسان ↔ الذكاء الاصطناعي", paragraphs: ["حدّد الأهداف، وناقش المخرجات، وقيّم قابلية التنفيذ، وحافظ على استقلالية حكمك وتفكيرك الأصيل."] },
        { title: "الإنسان ↔ الإنسان + الذكاء الاصطناعي", paragraphs: ["وحّد التوقّعات: يطلب المديرون، وتقيّم الفرق، ويتفاوض الجميع حول النطاق والمواعيد والجودة والمسؤولية."] },
        {
          title: "من النماذج المبهرة إلى القرارات المشتركة",
          paragraphs: [
            "يرى مدير نموذجًا أوليًا أنتجه الذكاء الاصطناعي، فيفترض أن تسليم منتج متكامل سيكون سهلًا. ويعرف المهندس الفرق بين عرض مبهر وحل موثوق وآمن وقابل للصيانة.",
            "يصبح التحدّي إنسانيًا: شرح القيود دون صراع، والتفاوض حول الأولويات، واتّخاذ القرار معًا.",
          ],
        },
      ],
      action: "ابدأ محادثة",
    },
    about: {
      eyebrow: "إبراهيم بن عبد الله",
      sections: [
        { title: "المستقبل اصطناعي. والفرق إنساني.", paragraphs: ["نعلّم الذكاء الإنساني للحياة المهنية المعاصرة. يفتح الذكاء الاصطناعي الحوار، بينما تبقى العلاقات والإدارة والأداء الجماعي في صميم ما نقدّمه."] },
        {
          title: "الوضوح والحكم والعلاقات الإنسانية",
          paragraphs: [
            "أرافق القادة والمبدعين في رحلة هادئة من الاكتشاف، حيث تلتقي الاستراتيجية بالحدس.",
            "التركيز عملي: أن تفهم نفسك، وتتعاون بشكل أفضل مع الآخرين، وتتطوّر داخل مؤسستك.",
          ],
        },
        { title: "من الوعي إلى الأثر", paragraphs: ["تستكشف الدورة عبر الإنترنت، ومدّتها 6 ساعات، الوعي بالذات وديناميكيات المؤسسات والتواصل والاجتماعات والضغط والنمو المهني."] },
      ],
      action: "اكتشف البرنامج",
    },
    resources: {
      eyebrow: "اكتشف وتأمّل",
      sections: [
        {
          title: "الأسئلة التي تقف خلف هذا العمل",
          paragraphs: [
            "الوعي بالذات وتنظيم العواطف. الذكاء العلاقي والتنظيمي. التواصل والتعامل مع الإدارة. الحكم الإنساني مع الذكاء الاصطناعي. التأثير والنمو المهني.",
            "ابدأ بمعاينات الدورات المجانية المتاحة، والفيديو التعريفي الحالي، وقنوات إبراهيم العامة.",
          ],
        },
      ],
      preview: { title: "معاينات الدورات المجانية", description: "تصفّح الدورات وافتح الدروس التي تحمل علامة المعاينة المجانية." },
      introduction: { title: "شاهد الفيديو التعريفي", description: "الفيديو التعريفي العام الحالي بلغته الأصلية." },
      socialDescription: "تفضّل بزيارة القناة العامة الحالية.",
      linkLabel: "افتح المورد",
    },
  },
  fr: {
    organizations: {
      eyebrow: "L’intelligence humaine au travail",
      sections: [
        {
          title: "Les mêmes outils. Des décisions différentes.",
          paragraphs: [
            "L’IA rend largement accessibles des capacités techniques puissantes. Pourtant, un même outil ne produit pas les mêmes décisions ni les mêmes résultats. Le contexte, le jugement, les émotions, la créativité et la collaboration humaine font toujours la différence.",
            "À mesure que nous rendons nos outils plus intelligents, développons-nous aussi l’intelligence des personnes qui les utilisent, les dirigent et en dépendent ?",
          ],
        },
        { title: "Humain ↔ Humain", paragraphs: ["Comprendre les autres, manager et être managé, communiquer sous pression, instaurer la confiance, contribuer aux réunions et comprendre les organisations."] },
        { title: "Humain ↔ IA", paragraphs: ["Définir les objectifs, remettre en question les résultats, évaluer la faisabilité et conserver un jugement indépendant et une pensée originale."] },
        { title: "Humain ↔ Humain + IA", paragraphs: ["Aligner les attentes : les managers demandent, les équipes évaluent et chacun négocie le périmètre, les délais, la qualité et la responsabilité."] },
        {
          title: "Des démonstrations impressionnantes aux décisions communes",
          paragraphs: [
            "Un manager voit un prototype généré par l’IA et suppose qu’un produit complet sera facile à livrer. Un ingénieur connaît la différence entre une démonstration impressionnante et une solution fiable, sûre et maintenable.",
            "Le véritable défi devient humain : expliquer les contraintes sans conflit, négocier les priorités et décider ensemble.",
          ],
        },
      ],
      action: "Engager la conversation",
    },
    about: {
      eyebrow: "Ibrahim Ben Abdallah",
      sections: [
        { title: "L’avenir est artificiel. La différence est humaine.", paragraphs: ["Nous enseignons l’intelligence humaine pour la vie professionnelle actuelle. L’IA ouvre la discussion ; les relations, le management et la performance collective sont au cœur de l’offre."] },
        {
          title: "Clarté, jugement et relations humaines",
          paragraphs: [
            "J’accompagne les leaders et les créatifs dans un cheminement paisible de découverte, où la stratégie rencontre l’intuition.",
            "L’approche est pratique : mieux se comprendre, mieux travailler avec les autres et évoluer au sein de son organisation.",
          ],
        },
        { title: "De la prise de conscience à l’impact", paragraphs: ["Le cours en ligne de 6 heures explore la conscience de soi, les dynamiques organisationnelles, la communication, les réunions, la pression et l’évolution professionnelle."] },
      ],
      action: "Découvrir le programme",
    },
    resources: {
      eyebrow: "Explorer et réfléchir",
      sections: [
        {
          title: "Les questions au cœur de notre travail",
          paragraphs: [
            "Conscience de soi et régulation émotionnelle. Intelligence relationnelle et organisationnelle. Communication et relation avec son manager. Jugement humain face à l’IA. Influence et évolution professionnelle.",
            "Commencez par les aperçus de cours gratuits disponibles, la vidéo de présentation existante et les chaînes publiques d’Ibrahim.",
          ],
        },
      ],
      preview: { title: "Aperçus gratuits des cours", description: "Parcourez le catalogue et ouvrez les leçons indiquées comme aperçus gratuits." },
      introduction: { title: "Voir la présentation", description: "La vidéo de présentation publique existante, dans sa langue d’origine." },
      socialDescription: "Visitez la chaîne publique existante.",
      linkLabel: "Ouvrir la ressource",
    },
  },
};
