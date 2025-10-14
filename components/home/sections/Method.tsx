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
      title={
        <span
          className={clsx(
            !isRTL && "tracking-tight md:tracking-normal",
            isRTL && "tracking-normal"
          )}
        >
          {method.title[locale]}
        </span>
      }
      className="bg-surface"
    >
      <Container className="px-0 md:px-sm">
        <div
          className={clsx(
            "mx-auto max-w-3xl text-[1.05rem] leading-[1.85] text-subtle",
            "space-y-6 px-6 py-6 md:px-0 md:py-0 md:text-lg md:leading-relaxed md:space-y-4",
            isRTL ? "text-right" : "text-left"
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
              li: ({ children }) => (
                <li className="leading-[1.75] md:leading-relaxed">
                  {children}
                </li>
              ),
            }}
          >
            {markdown}
          </ReactMarkdown>
        </div>
      </Container>
    </Section>
  );
};
