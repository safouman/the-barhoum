import clsx from "classnames";
import { Container } from "@/components/Container";
import { Section } from "@/components/Section";
import type { HomeThemeDefinition } from "../types";

export const HomeMethod: HomeThemeDefinition["Method"] = ({ locale, method }) => {
  const isRTL = locale === "ar";
  const body = method.body[locale];

  const paragraphs = body
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return (
    <Section
      id="method"
      title={method.title[locale]}
      className="bg-surface"
    >
      <Container>
        <div
          className={clsx(
            "mx-auto max-w-3xl text-lg leading-relaxed text-subtle",
            isRTL ? "text-right space-y-4" : "text-left space-y-4"
          )}
          dir={isRTL ? "rtl" : "ltr"}
        >
          {paragraphs.length > 0
            ? paragraphs.map((paragraph, index) => {
                const lines = paragraph.split(/\n/);
                return (
                  <p key={index} className="m-0">
                    {lines.map((line, lineIndex) => (
                      <span key={lineIndex}>
                        {line}
                        {lineIndex < lines.length - 1 && <br />}
                      </span>
                    ))}
                  </p>
                );
              })
            : (
              <p className="m-0">{body}</p>
            )}
        </div>
      </Container>
    </Section>
  );
};
