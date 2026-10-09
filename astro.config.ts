import sitemap from "@astrojs/sitemap";
import { defineConfig, fontProviders } from "astro/config";

import { DEFAULT_LOCALE, LANG_TAG, LOCALES } from "./src/i18n/locales";

export default defineConfig({
  site: "https://anetto.dev",
  output: "static",
  trailingSlash: "always",
  // Astro 7 defaults to JSX whitespace rules, which drop the space between
  // adjacent inline elements; prose with inline links needs HTML rules.
  compressHTML: true,
  // The Hugo site's pages (its whole sitemap, besides `/` and `/about/`)
  // land on their new homes. GitHub Pages can't send HTTP redirects, so Astro
  // writes a page for each that forwards at once (meta refresh + canonical).
  // `/contact/` goes Home: the identity card holds the email and "Book a call".
  redirects: {
    "/resume": "/experiences/",
    "/timeline": "/experiences/",
    "/sideprojects": "/projects/",
    "/gist": "/blog/",
    "/tags": "/blog/",
    "/categories": "/blog/",
    "/contact": "/",
  },
  i18n: {
    defaultLocale: DEFAULT_LOCALE,
    locales: [...LOCALES],
    routing: { prefixDefaultLocale: false },
  },
  // Nunito is the fallback for browsers without `ui-rounded` (spec §6.2): self-hosted, latin only.
  fonts: [
    {
      provider: fontProviders.fontsource(),
      name: "Nunito",
      cssVariable: "--font-nunito",
      weights: [400, 500, 600],
      styles: ["normal"],
      subsets: ["latin"],
      fallbacks: ["sans-serif"],
    },
  ],
  integrations: [
    sitemap({ i18n: { defaultLocale: DEFAULT_LOCALE, locales: LANG_TAG } }),
  ],
});
