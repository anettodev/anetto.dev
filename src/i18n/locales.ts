// Imported by astro.config.ts, so this module must not import from `astro:*`.

export const LOCALES = ["en", "pt", "es"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

/** BCP 47 tag for `<html lang>`, hreflang and the sitemap. The URL segment stays `/pt/`. */
export const LANG_TAG: Record<Locale, string> = {
  en: "en",
  pt: "pt-BR",
  es: "es",
};

/** Open Graph locale (language_TERRITORY). Spanish is Latin American, as on the old About page. */
export const OG_LOCALE: Record<Locale, string> = {
  en: "en_US",
  pt: "pt_BR",
  es: "es_LA",
};

/** Language switcher label, always written in its own language. */
export const LOCALE_LABEL: Record<Locale, string> = {
  en: "English",
  pt: "Português (BR)",
  es: "Español",
};
