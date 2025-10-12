import clsx from "classnames";
import ReactMarkdown from "react-markdown";
import { Container } from "@/components/Container";
import { Section } from "@/components/Section";
import type { HomeThemeDefinition } from "../types";

export const HomeMethod: HomeThemeDefinition["Method"] = ({ locale, method, markdown }) => {
  const isRTL = locale === "ar";

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
          <ReactMarkdown
            components={{
              p: ({ children }) => <p className="m-0">{children}</p>,
              strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
              em: ({ children }) => <em className="italic">{children}</em>,
              ol: ({ children }) => (
                <ol
                  className={clsx(
                    "list-decimal space-y-3 pl-6",
                    isRTL && "pl-0 pr-6"
                  )}
                  dir={isRTL ? "rtl" : "ltr"}
                >
                  {children}
                </ol>
              ),
              ul: ({ children }) => (
                <ul
                  className={clsx(
                    "list-disc space-y-3 pl-6",
                    isRTL && "pl-0 pr-6"
                  )}
                  dir={isRTL ? "rtl" : "ltr"}
                >
                  {children}
                </ul>
              ),
              li: ({ children }) => <li className="leading-relaxed">{children}</li>,
            }}
          >
            {markdown}
          </ReactMarkdown>
        </div>
      </Container>
    </Section>
  );
};
