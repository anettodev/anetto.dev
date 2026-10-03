# Decisions

Choices made while building the revamp, per spec §0.5. Newest phase at the bottom. Each entry: what, why, and the spec section it touches.

## Phase 0 — Scaffold (2026-10-03)

**Astro 7, not Astro 6 (§3).** Astro 7.0 shipped on 22 Jun 2026 (7.3.5 at scaffold time), so 6.x is already the previous major. The v7 upgrade guide has nothing that conflicts with the spec. Approved by Antonio.

**`compressHTML: true` (Astro 7 default is `'jsx'`).** JSX whitespace rules drop the space between adjacent inline elements (`<a>…</a> <em>…</em>` renders as one word). The site is mostly prose with inline links, so it keeps HTML whitespace rules.

**TypeScript 6.0.x, not 7.** `@astrojs/check` supports TypeScript ≤ 6 and `typescript-eslint` supports < 6.1. Dependabot is told to skip TypeScript minor and major bumps until both catch up.

**No `<ClientRouter />` (§8.2); page continuity comes from cross-document View Transitions (§8.7).** ClientRouter intercepts navigation, so the `@view-transition` rule would never run. It also ships JS against the 30 KB Home budget and needs custom focus and route-announcement handling. The island gets a fixed `view-transition-name` instead. Its only state, expanded or compact, resets on navigation anyway. Browsers without cross-document transitions (Firefox today) get a normal navigation. Approved by Antonio.

**Hugo removed from this branch; it stays on `main` until cutover (§0.3).** Favicons moved to `public/`. The portrait, logos and OG image are on `main`: `git show main:static/images/<file>`. The Hugo content is at `git show main:content/<file>.md`. The theme submodule checkouts stay on disk and are git-ignored (`/themes/`), so switching back to `main` and running `hugo server` still works.

**Locale codes (§9).** Astro's `i18n.locales` uses plain `["en", "pt", "es"]`, which keeps the URL segment `/pt/`. The BCP 47 tag `pt-BR` is mapped in `src/i18n/locales.ts` and used for `<html lang>`, hreflang and the sitemap. Astro's object form (`{ path, codes }`) only feeds `Accept-Language` matching on server-rendered pages, which a static site doesn't have.

**Spanish stays in for now (§14 #2 open).** Dropping it means removing `"es"` from `LOCALES` and deleting `src/i18n/es.ts`.

**One route file per page under `src/pages/[...lang]/`.** `getStaticPaths` emits every locale, with `lang` undefined for English at the root. This avoids three copies of every page.

**`/contact/` not scaffolded (§14 #4 open).** Adding it is one file once the decision is made.

**`trailingSlash: "always"`.** It matches the §4 route table and the directory-style output, so canonical URLs, hreflang and sitemap entries all agree.

**`site: "https://anetto.dev"`.** Hugo's `baseURL` was `https://anettodev.github.io/`; canonical URLs should use the real domain.

**English-only `404.astro`, with no canonical or hreflang.** Static hosts serve `404.html` for unknown paths.

**Lint and format: ESLint 10 (flat config) + Prettier.**

- ESLint uses `typescript-eslint`, `eslint-plugin-astro` and its `jsx-a11y-recommended` preset.
- The a11y rules come from `eslint-plugin-jsx-a11y-x`, because `eslint-plugin-jsx-a11y` doesn't support ESLint 10.
- Prettier uses `prettier-plugin-astro`.
- `npm run build` runs `astro check` first, so type errors fail the build.
- Pre-revamp docs (`README.md`, `CLAUDE.md`, `memory-bank/`, `.cursor/`) and the existing workflows are excluded from formatting until cutover.

**Redirects deferred to Phase 7 (§4).** The old Hugo build also published `/timeline/`, `/gist/`, `/tags/`, `/categories/` and the RSS feed at `/index.xml`, so they need redirects or a decision too. The spec's `/about/` → `/about/` row is a no-op and will be dropped.

**Workflows untouched.** `hugo.yml` only deploys from `main`, so this branch can't trigger a deploy. Both it and `super-linter.yml` get replaced in Phase 7. `.github/dependabot.yml` is added now; Dependabot reads it from the default branch only, so it starts working at cutover.

**Node.** `engines.node` is `>=24` and `.nvmrc` is `24`, as the spec says. The dev machine runs Node 26.10, which satisfies the range.

**npm 11 install-script gating.** npm skipped the `esbuild` and `fsevents` install scripts because they aren't in `allowScripts`. The build doesn't need them. If a future dependency does, approve it with `npm install-scripts approve <pkg>` rather than turning gating off.

## Phase 1 — Tokens, layout, static pages (2026-10-03)

**Copy comes from the design canvas, checked against §2.** Where the canvas and the spec disagree on layout, the spec wins.

- **One canvas sentence changed.** About's third paragraph said "I still ship my own apps; Nutria is the current one." That implies earlier indie apps, but §2 says Nutria is the only one. It now reads "Nutria, my indie iOS app, is in progress."
- **"Since 2007" kept from the canvas** where §2 says "about 2007". The old About page says the same ("I started my career in 2007").

**Facts taken from the Hugo content on `main`, as §13.2 allows.**

- "Before Inter" roles and years come from `content/resume.md`:
  - Avenue Code, Senior iOS Engineer, 2016–2019.
  - MadeinWeb, Senior iOS Engineer, 2014–2016.
  - Daccord, iOS Engineer, 2013–2014.
- The Nutria link (`https://azklepio.com/nutria/`) comes from `content/sideprojects.md`.
- Resume PDF uses the Proton Drive link the Hugo site has today (`LINKS.resume`). It is interim until a current PDF is supplied.
- The resume's pre-2013 entries are not used. One links to `example.com` and another reads like filler, so they aren't reliable facts.

**No `/contact/` page (§14 #4 open).** Contact is the island's "Say hello" `mailto:` plus the card's icons. Adding the page later is one file.

**No second portrait on About.** §5.4 puts a portrait in About's header, but the identity card (§5.1) already shows it on every page, so About would show two. That header portrait is left out until confirmed.

**Home's `<h1>` is the positioning sentence**, with the name in a visually hidden prefix ("Antonio Netto. Executive Tech Manager at Inter. …"). The name on the identity card is not a heading, so the page keeps one `<h1>` inside `<main>`. Phase 3's intro card shows the name as a large title but must not add a second `<h1>`.

**Untranslated pages fall back to English.** PT and ES pages render English copy until Phase 5 and mark `<main lang="en">` so screen readers switch voice. Nav, card and status strings are translated now; those translations are drafts for review.

**Content model.**

- `pages`: one Markdown file per page per locale, with a schema chosen by its `page` field.
- `roles`: Inter roles, ordered.
- `projects`: products and systems.
- Missing facts are written as `[PLACEHOLDER: …]` and render as a highlighted `<mark>` until replaced.
- The dashed Projects entry renders in dev builds only.

**Tokens.**

- `--on-accent` is added for text on the accent fill (dark `#0D0E10`, 9.25:1; light `#FFFFFF`, 6.47:1). It wasn't in §6.1.
- `--card-fill` is added as defined in §6.7.
- H1 tops out at 80px, inside §6.2's 56–96 range, because the content column is only 900px wide.
- Fluid type runs from the phone size at 390px to the desktop size at 1440px.

**Dark without JavaScript.** As §6.1 says, `:root` is dark and `data-theme="light"` switches. Visitors without JavaScript who prefer light still get dark. Phase 2's head script applies the system preference for everyone else.

**Phase 1 nav is a plain solid pill with no JavaScript.** It shows every link at every width and scrolls sideways inside itself on phones. Phase 2 replaces it with the glass `<site-island>` and its compact and expanded states.

**Components respond to the content column, not the viewport.** `<main>` is a size container, so Home's lanes and About's facts row go three across when the column is at least 45rem wide.

**Fonts.**

- Nunito comes from Fontsource through the Fonts API, in weights 400, 500 and 600, Latin subset, `font-display: swap`, with Astro's size-adjusted Arial fallback.
- It is not preloaded: Apple platforms match `ui-rounded` first and never download it.

**Portrait (interim).** `src/assets/portrait.jpeg` is the 350×350 `me.jpeg` from `main`, served as AVIF and WebP at 184 and 350px wide. Replace it with the ≥800×800 original (§13.1).

**LinkedIn icon.** Simple Icons dropped LinkedIn in v14, so its path comes from `simple-icons@13.21.0` (same CC0 license). GitHub, X and Medium come from the current release.

## Phase 2 — Island, theme toggle, language switcher (2026-10-03)

**Defaults taken for open decisions.** Mastodon stays out (§14 #3); the card and island show only the four profiles §5.2 lists. Spanish stays in (§14 #2).

**Island without JavaScript is the expanded form.** The server renders every link. The head script sets `<html data-js>` before first paint, so with JavaScript the island is compact from the first frame, with no visible switch. Without JavaScript the menu button and theme toggle are hidden, since they would do nothing.

**The expanded island has a close button.** The canvas shows none. Touch and keyboard users need a visible way back, so the menu button stays and turns into ×. Escape, a click outside and scrolling down also collapse it (§7, §8.2).

**Keyboard.** Opening the menu from the keyboard moves focus to the first link. Escape collapses the island and returns focus to the menu button. The language menu handles its own Escape and leaves the island as it is.

**Below 960px the expanded island opens as a panel**: name, language and close on top, the four links two by two, then a full-width "Say hello". The single row no longer fits there, and the canvas only shows desktop.

**Below 600px the theme toggle moves into the expanded island.** §7 allows this at ≤400px. The threshold is higher because the compact island and the floating toggle start to overlap below about 500px.

**Island text uses `--fg`, not `--muted`** as on the canvas. Large headlines scroll under the 55% glass, and the blurred ink lowers the contrast of muted text to about 3.6:1 (dark) and 3.8:1 (light), below §6.1's 4.5:1. Hierarchy comes from weight and the current-page chip instead. Hover shows a chip rather than accent text, for the same reason.

**The compact ↔ expanded morph is hand-built, not a View Transition.**

- The glass layer is clipped from the old shape to the new one with `clip-path`, and the name, language pill and menu button slide with a FLIP transform. Nothing animates `width` (§8.2).
- A View Transition was rejected for two reasons. Its snapshots stretch the pill's text while the width changes. And naming an element makes it a backdrop root, which blinds any `backdrop-filter` inside it.
- Known cost: the glass's drop shadow is clipped during the 350ms morph.
- With reduced motion the switch is instant.

**Page and theme transitions use View Transitions.**

- Cross-document transitions (§8.7) are on for visitors who haven't asked for reduced motion.
- The transition name sits on the glass layer and on the floating toggle button, not on `<site-island>`, for the backdrop-root reason above.
- Theme switches crossfade for 300ms through `document.startViewTransition` (§8.5). They are instant without support or with reduced motion.

**Theme.**

- The theme is saved under `anetto:theme` and applied before paint by the inline head script.
- Until the visitor picks a theme, it follows the system setting, including live changes.

**Language switcher.**

- It is a native `<details>` of real links to the same page in each locale, so it works and can be crawled without JavaScript.
- With JavaScript it adds Escape (focus back to the pill) and click-outside closing.
- It saves the choice under `anetto:lang` and never redirects. There is no "switch language?" suggestion either, since §9 allows one at most.

**Flags** are the canvas's simplified SVGs. Their colors are imagery, the one exception to the tokens-only color rule.

**Glass refraction deferred.** The Chromium-only SVG refraction (§6.4) waits for Phase 4, when the mesh gives it something to refract. Until then the glass is blur plus edge in every engine.

**Contrast "over the mesh" waits for Phase 4.** The mesh doesn't exist yet. For now, glass legibility was checked with the About headline scrolled under the island, in both themes.

**JavaScript on Home: about 2.6 KB gzipped**, against the §12 budget of 30 KB.
