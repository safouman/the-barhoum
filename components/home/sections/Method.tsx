import clsx from "classnames";
import ReactMarkdown from "react-markdown";
import { Container } from "@/components/Container";
import { Section } from "@/components/Section";
import type { HomeThemeDefinition } from "../types";
import styles from "./Method.module.css";

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
      className={clsx("bg-surface", styles.methodSection)}
    >
      <Container className="px-0 md:px-sm">
        <div
          className={clsx(
            "mx-auto max-w-3xl md:max-w-4xl text-body-lg text-subtle md:text-[1.1rem] lg:text-[1.18rem] xl:text-[1.22rem] md:leading-relaxed",
            "space-y-6 px-6 py-6 md:px-0 md:py-0 md:space-y-5 lg:space-y-6",
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
              li: ({ children }) => <li>{children}</li>,
            }}
          >
            {markdown}
          </ReactMarkdown>
        </div>
      </Container>
    </Section>
  );
};
