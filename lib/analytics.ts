export type EventName =
  | "video_play"
  | "pdf_download"
  | "category_view"
  | "package_click"
  | "form_open"
  | "form_submit"
  | "lang_switch"
  | "theme_switch"
  | "pay_page_view";

type EventProps = Record<string, string | number | boolean | undefined>;

export function event(name: EventName, props?: EventProps) {
  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.log("[event]", name, props);
  }
  // future provider hook
}
