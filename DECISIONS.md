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

**No `/contact/` page (§14 #4 open).** Contact is the identity card's email link and icons, plus the footer's email. (The island's "Say hello" was removed later; see "Island: taller, opens on hover".) Adding the page later is one file.

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

**The expanded island has a close button** (on wide screens, removed later at Antonio's request; see "Island: taller, opens on hover"). The canvas shows none. Touch and keyboard users need a visible way back, so the menu button stays and turns into ×. Escape, a click outside and scrolling down also collapse it (§7, §8.2).

**Keyboard.** Opening the menu from the keyboard moves focus to the first link. Escape collapses the island and returns focus to the menu button. The language menu handles its own Escape and leaves the island as it is.

**Below 960px the expanded island opens as a panel**: name, language and close on top, the four links two by two, then a full-width "Say hello" (since removed). The single row no longer fits there, and the canvas only shows desktop.

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

## Phase 3 — Intro card, floating card, island on scroll (2026-10-03)

**The island now follows scroll position (requested by Antonio; overrides §7/§8.2 "expands on tap/click/keyboard" and Phase 2's "scrolling down collapses it").**

- At the top of the page the island is expanded; scrolled down, it is compact.
- A change only happens once the new position has held for 0.5s, so quick scrolls don't flicker it. (First 1s; halved at Antonio's request.)
- This applies from 960px up. Below that, the expanded state is a tall panel that would cover the top of the page, so phones only collapse automatically and never expand on their own.
- At the top of a wide screen, a click outside doesn't collapse the island, since expanded is its resting state there. The menu button and Escape still work at any position.
- Pages load at the top, so wide screens draw the expanded row from first paint. CSS guesses the state until the script sets `<html data-island-ready>`, so nothing jumps on load.

**How the intro is built.**

- On Home, the docked identity card is wrapped by `<intro-card>`. The docked card is the real, accessible content and the flip's back face.
- The front face is a decorative duplicate: `aria-hidden`, with no links. The name on it is not a heading; Home's only `<h1>` stays the positioning sentence.
- Opacity, translate and scale run on an outer "stage". The 3D flip runs on an inner "flipper" with `perspective()` in its own transform. Opacity on a 3D element would flatten it and break the faces' hidden backs.
- The front face is a true 320×460 card centred over the docked one. The two faces swap at 90°, so nothing is scaled unevenly.

**Whether it plays is decided before first paint** by the head script:

- only on Home (`<html data-intro-page>`);
- only if `anetto:intro-seen` isn't in session storage;
- never with reduced motion;
- never when storage is blocked, since the intro would then replay on every visit.

Otherwise the intro's front face, cover and skip button are not drawn at all.

**LCP: the page is painted from the first frame, under a cover.**

- During the intro an opaque `--bg` cover hides the page, and it fades out at 2.9s. Nothing is ever `display: none`.
- Measured in Chrome: LCP fired at 232ms, together with the first paint, on the Home headline.
- Caveat: LCP doesn't account for elements covered by others. On a first visit, people still see the page content at about 3.6s, by the spec's design. The portrait card is visible from 0.15s.

**Any input ends the intro immediately**: any key, a click or tap, the wheel, or focus moving into the page. Ending the intro jumps to the final state. The spec's "Skip intro" button was removed later at Antonio's request (see below).

**Failsafe.** If the intro script never runs, CSS uncovers the page and drops the front face after 6s.

**Deferred to Phase 4.**

- The halo (§6.6, §8.4).
- The cover is a flat `--bg` and would hide the mesh during the intro, so it has to be revisited when the mesh arrives.

**JavaScript on Home: about 3.8 KB gzipped.** Astro inlines the 1 KB intro script into Home only.

## Phase 4 — Mesh, veil, halo, feature cards (2026-10-03)

**The mesh is dimmed whenever page content is on screen (Antonio's call; overrides §5.3 and §8.3, where the veil comes in only after 120px of scroll).**

- The spec's wave puts its brightest part in the bottom ~30% of the screen, under page text, on every page at load.
- Text there would fail contrast, and the spec's 72% veil only lifts muted text to 3.3:1. The veil is now 90% (`--veil-opacity`): muted text over the brightest part of the wave reaches 6.1:1 in dark and 4.9:1 in light.
- The full, undimmed mesh plays behind the Home intro card. At the reveal it drops behind the page and the veil fades in.

**The mesh only animates during the intro.** §8.3 pauses the mesh while the veil is up, which is now all the time outside the intro.

- The SMIL animations use `begin="indefinite"` and the drift waits for `data-live`; the intro script starts both and pauses them at the end.
- Elsewhere the mesh is static: no ongoing cost on phones, and nothing to pause when the tab is hidden.

**The mesh replaces Phase 3's flat cover.** During the intro the mesh rises over the page (`z-index` 35, under the card's 40), still hiding the fully painted page so LCP isn't held back. At 2.9s the mesh drops back and the page fades in. Re-measured: LCP fired at 220ms, together with the first paint.

**Halo.** It is a registered `--halo-angle` turning every 9s, at 0.7 during the intro and fading to 0.35 over 900ms as the card docks. It is still with reduced motion. It sits on the intro's stage, so it travels with the card but doesn't flip. On other pages it sits behind the docked card.

**The sticky card no longer clips its overflow.** `overflow-y: auto` cut off the halo's glow. The compact variant keeps the card shorter than the screen down to about 480px tall.

**Feature cards on Home's three lanes (decision #7).**

- Gradients and icons: pink/briefcase for Now, cyan/layers for Depth, violet/smartphone for Craft.
- Built in Astro and CSS; the React prototype was only a visual reference.
- Three across, square, but free to grow taller when the copy needs it, once the content column is ≥45rem. Stacked below that.
- They enter on scroll with a 0.1s stagger (§8.6). On a first Home visit they wait for the intro's reveal. They show immediately with reduced motion, and a 6s failsafe applies.

**Feature cards highlight on hover (requested by Antonio).**

- Hovering a card grows it and its glow by 3% and brightens the glow from 0.6 to 0.85, over 250ms. Keyboard focus on the card's link does the same.
- Pointer hover only applies where the device has hover, so a tap on a phone doesn't leave a card stuck enlarged.
- With reduced motion the glow still brightens, but the size doesn't change.
- The effect sits on the card's inner layers, because the outer element's transition carries the entrance stagger delay.

**Glass refraction dropped.** The Chromium-only refraction (§6.4) would refract a 90% veil, which is nearly flat, and the island is hidden during the intro, the only time the full mesh shows. The glass stays blur plus edge everywhere.

**Performance.**

- Measured on the dev machine (unthrottled desktop Chrome): 60fps, with no frame over 17.7ms during the intro (mesh, filters, flip) or afterwards (halo).
- Not yet measured on a mid-range Android or with 4× CPU throttling; that is Phase 6.
- About 5 KB of gzipped JavaScript on Home.

## Phase 5 — Localization and content (2026-10-03)

**Portuguese and Spanish copy is a draft for Antonio's review (§9).** Every pt/es content file starts with a YAML comment saying so.

- Home uses §9's draft sentences and the canvas prototype's phrasing ("do Super App do Inter", "em desenvolvimento", "Pular intro" / "Saltar intro"). The other pages are new translations.
- Job titles stay in English in every locale: Executive Tech Manager, iOS Engineering Manager, Senior iOS Engineer, iOS Engineer. Company names are untouched.
- The Investments role title is translated as a description ("Especialista iOS e chapter lead em Investimentos"), since it isn't a formal title.
- Spanish is neutral Latin American, matching the old About page's es-419; its Open Graph locale is `es_LA`.
- Placeholders are translated too, so each page reads in its own language while waiting for copy. They still all start with `[PLACEHOLDER:`.

**No more English fallback.** Every page exists in all three locales, so `<main>` no longer carries `lang="en"`. The fallback code stays for pages added later.

**Meta descriptions per page and locale** come only from the allowed claims (§2), with Home using the positioning sentence (§13.2).

**Social metadata.** `og:type`, `og:site_name`, `og:title`, `og:description`, `og:url`, `og:locale` with alternates, and `twitter:card` summary. There is no `og:image` until the new 1200×630 image exists (§13.1); the old cover shows the old title.

**The name in the island replays the intro (Antonio's request; extends §8.1's once-per-session rule).**

- The island's "Antonio Netto" link goes to the locale's Home with `?intro`.
- With that parameter, the head script plays the intro even if this session has already seen it, and even when storage is blocked.
- It still never plays with reduced motion.
- The script removes `?intro` from the address before first paint, so a reload, the back button or a shared link doesn't replay it. The canonical URL stays `/`.

**Checked over the built site:**

- 15 pages, each with the right `lang` and a self-referencing canonical.
- Reciprocal hreflang for en, pt-BR and es, with `x-default` pointing to English.
- Three crawlable switcher links per page.
- No `navigator.language` and no meta refresh anywhere.
- The same placeholder count in every locale: Home 9, About 1, Experiences 4, Projects 2, Blog 8.

## Animated logo in the island (2026-10-03)

**The island shows Antonio's animated logo instead of his name (requested by Antonio; overrides §7, where the compact island starts with the name).**

- It is an app-icon tile with 22.5% corners. First a 44px tile inside the pill's rounded end; now a 60px tile beside the pill (see "Island: taller, opens on hover").
- The tile takes the clip's container colour (`--logo-tile`, per theme), with a faint hairline edge so it doesn't melt into the glass (`--logo-hairline`).
- The link keeps its `/?intro` replay, and its accessible name stays "Antonio Netto" (visually hidden text; the video is `aria-hidden`).
- The identity card still shows the name.

**Assets come from `scripts/encode-logo.sh dark|light <master>`**, one run per theme (re-run it with a new master; don't hand-encode). The current masters are Antonio's 1080×1080, 6.6s clips of the whole app icon, one dark and one light:

- The script measures the container colour, fills the black outside the icon's rounded corners with it, and speeds the clip up just enough that one play lasts 4.9s (1.34× for these masters). Motion that starts by itself and runs longer than 5s needs a pause control (WCAG 2.2.2).
- The corner fill runs at full resolution, before scaling. Scaling first left a faint ring along the corner arc (lanczos overshoot at the black edge).
- Island tile, 144px: AV1 WebM 18–22 KB, H.264 MP4 27–34 KB, WebP poster 1.5 KB, per theme.
- Intro card, 640px: AV1 WebM 146–171 KB, H.264 MP4 227–244 KB, WebP poster 13–15 KB, per theme. (Posters were JPEG until Phase 6; see there.)
- In each pair the AV1 file comes first, with H.264 for browsers without AV1 (most Safari). Audio is removed.
- Transparency was rejected for the first master. A version with the black keyed out washed out on the light theme, and needed two browser-specific encodes at 116–171 KB.

**Playback in the island.**

- The clip plays once on load and again on mouse hover or keyboard focus. Otherwise it rests on its first frame, which matches its last.
- After the Home intro it stays still, since the card has just played it.
- It never loops, and never plays with reduced motion. If autoplay is refused (iOS Low Power Mode, for one), the poster stays.

**Side effects.**

- The compact island is narrower: 246px on a 390px phone, down from 315px.
- Island padding is now 4px all round, so the tile mirrors the menu button on the other end. (Since raised to 8px with a 60px pill; see "Island: taller, opens on hover".)

## Intro: logo, then info, then dock (2026-10-03)

**The intro card now opens on the animated logo (requested by Antonio; extends §8.1's timeline).**

- One card has three faces: the logo on the front, the info face (photo, name, title, "at Inter", profiles) on the back, and the docked card.
- The docked card takes the logo face's place on the front side while that side faces away, so the second turn lands on it.

| When                     | What happens                                                               |
| ------------------------ | -------------------------------------------------------------------------- |
| 0.15s                    | The card fades in centred on the logo face (scale 0.94→1, 600ms)           |
| when the clip ends (~5s) | The card turns in place to the info face (800ms)                           |
| +1.2s                    | The card turns again into the docked card while moving into place (1000ms) |
| docked                   | The reveal (700ms)                                                         |

The whole intro takes about 8.8s. Any input still ends it.

**Under the logo, "Loading..." is typed after a caret** (requested by Antonio). It is localized ("Carregando...", "Cargando...") like the rest of the UI, and stays `aria-hidden` with the rest of the face.

- The caret blinks for the first second while the card fades in. The text then types one character every 90ms with the caret solid, and the caret blinks again until the card turns. The face is gone after about 5.4s, so the blinking stays under WCAG 2.2.2's five seconds.
- The text is the system monospace (`--font-mono`, no download), so every character is exactly 1ch wide. A stepped `clip-path` reveals it and the caret moves 1ch per step, both in pure CSS and timed from `--chars`, which is set from the string's length.
- Colours are theme tokens on the card's container colour: text `--muted` (7.3:1 dark, 5.8:1 light), caret `--accent`.

**The first turn waits for the clip to end**, capped at 1.5s past its expected end. If the clip errors or autoplay is refused, the card shows the poster for about 1.2s and moves on, so a slow network never holds the page.

**The 640px clip loads only when the intro plays.** An inline script next to the `<video>` sets its poster and `preload="auto"` while the page is still parsing, so return visits to Home don't download it.

**LCP is unchanged.** Re-measured with the logo face: LCP fired at 116ms, together with the first paint, on the Home headline. The page still sits fully painted under the raised mesh.

**Failsafe** moved from 6s to 12s, past the longer intro.

## The logo follows the theme (2026-10-03)

**Each theme has its own animated logo, from Antonio's dark and light app-icon clips** (requested by Antonio). His still icons (`src/assets/brand/logo-dark.png`, `logo-light.png`) are the colour reference.

- **Dark:** `public/brand/logo-dark.*` and `logo-intro-dark.*`, on #0F161C (`--logo-tile` in the dark theme).
- **Light:** `public/brand/logo-light.*` and `logo-intro-light.*`, on #EFF1EC (`--logo-tile` in the light theme).
- The containers are the clips' own colours as `scripts/encode-logo.sh` measures them. They are a little darker (dark) and a little greyer (light) than the still icons (#161E24, #F5F5F5); the tile and the card match the clip so the two never meet at a visible edge.
- This replaces the first version, where the light theme showed the still icon with a CSS sheen until a light clip existed. The sheen is gone.

**Where it applies.**

- The island tile and the intro card's logo face both play the current theme's clip. `styles/logo.css` shows `.logo-dark` or `.logo-light`; `themedLogo()` in `scripts/logo.ts` picks the clip to play.
- The intro holds the logo for one play (4.9s) in both themes.
- On the intro card the clip's edges fade into the card over the outer 8% (a CSS mask). The container in the clips drifts by up to about 4 levels over their frames, which would otherwise show as a faint square on the flat card. The mark stays clear of that band.

**Downloads.**

- Only the current theme's clips load. The island videos are `preload="none"` and started by script. The intro clip's poster and `preload` are set by the inline script for the current theme only, and only when the intro plays.
- Both island posters load (3 KB each), since a hidden `<video>` still fetches its poster. That was accepted rather than adding code to avoid it.
- After a theme switch the other theme's island clip shows its poster, and plays on the next hover or focus.

**Without JavaScript** there is no `data-theme`, so the dark logo shows, which matches the dark default.

## Island: taller, opens on hover (2026-10-03)

**Requested by Antonio; overrides §7's 52px island, its "Say hello" button and its close button on wide screens.**

**The pill is 60px tall with 8px padding (was 52px with 4px).**

- The 44px logo tile's rounded corners poked past the pill's rounded end, which is why the pill grew.
- **Then the logo moved out of the pill** (also requested by Antonio): it is its own 60px tile just left of the glass pill, 8px apart, with the same shadow as the glass. The two stay centred together and move as one when the pill changes size. The divider between logo and section name went with it.
- The pill kept its 60px height, so the tile, the pill and the floating theme toggle are all 60px tall.
- Below 960px the open panel sits to the tile's right, its width reduced by the tile's.
- `--island-height`, `--island-radius` and `--nav-clearance` (now 104px) follow, and so does the floating theme toggle, which uses the island height.
- The morph reads the radius from the glass's computed style instead of a constant.

**No "Say hello" in the island, in any width.** Contact stays on the identity card (email link and profile icons) and in the footer. The `sayHello` string was removed from the three locales.

**From 960px up the island also expands on hover and on keyboard focus.**

- A mouse resting on the pill for 120ms expands it, and it collapses 400ms after the pointer leaves (if the page is scrolled down). The delays stop a pointer passing by from flickering it.
- Keyboard focus inside the island (`:focus-visible`, so not mouse clicks) expands it the same way, and leaving with Tab collapses it. Shift+Tab onto the compact menu button lands on the language pill instead, since the button disappears as the island expands.
- Scrolling still sets the resting state: expanded at the top, compact further down. Hover and focus win while they last.

**No close button when expanded on wide screens.** Scrolling down, moving the pointer away or tabbing out collapses it.

- The menu button stays in the compact state there, for touch screens at 960px and up (tablets in landscape), which can't hover. Opened that way, a tap outside, Escape or scrolling closes it.
- Escape no longer collapses an island held open by hover or focus, or its resting state at the top.

**Below 960px nothing changes except the height:** no hover (the expanded state is a panel that would cover the page), and the menu button still opens and closes it with the ×.

## No "Skip intro" button (2026-10-03)

**Removed at Antonio's request; overrides §8.1, which has a Skip button for the whole intro.**

- Any key, click, tap, wheel or focus move still ends the intro at once, so it can always be stopped.
- The intro never plays with reduced motion, plays unasked only once per session, and covers the page while it runs rather than moving alongside content.
- Trade-off: nothing on screen says how to stop it. WCAG 2.2.2 asks for a way to stop motion that runs longer than 5s next to other content. Any input ending it is that way, but it isn't visible, so a Phase 6 audit may flag it.
- The "Skip intro" strings were removed from the three locales.

## Theme toggle during the intro (2026-10-03)

**The floating theme toggle stays on screen during the Home intro (requested by Antonio; §8.1 hides it until the reveal).**

- Clicking it changes the theme without ending the intro; every other input still ends it.
- The logo carries on in the new theme's clip from the same moment: the old clip pauses, and the new one gets its poster and `preload` and plays from the old one's `currentTime`.
- The card, mesh, halo and "Loading..." line follow the theme through their tokens.
- After the logo has played, a theme change only recolours.
- Below 600px the toggle normally lives in the island, which is hidden during the intro. The floating toggle stands in there and fades out at the reveal, as the island fades in.

## Island links hover with the intelligence palette (2026-10-03)

**Hovering a link in the pill shows the brand halo (requested by Antonio; replaces the plain grey hover chip).**

- The link becomes a solid `--surface` chip with a blurred conic glow behind it, turning once every 4s like the identity card's halo.
- The glow uses the **intelligence palette**: the feature cards' pink, cyan and violet stops (§6.7). The first version used the identity halo's copper/pearl/blue (§6.6) by mistake, and Phase 6 corrected it.
- Keyboard focus (`:focus-visible`) shows the same, next to the focus ring.
- The text stays `--fg` on the solid chip, so the halo's colours never affect its contrast (about 15:1 dark, 18:1 light).
- The current page keeps its grey chip until hovered. With reduced motion the halo doesn't turn.

## Company link on the identity card (2026-10-03)

**"Inter" on the identity card links to https://inter.co/ (requested by Antonio).** That is the `companyURL` the Hugo site used.

- It's in the accent, semibold, with a soft underline that turns solid on hover. The underline keeps it recognisable as a link without relying on colour (WCAG 1.4.1). The accent is 8.4:1 on the dark card and 6.5:1 on the light one.
- `COMPANY` and `PERSON.city` live in `src/lib/site.ts`. Only the preposition is translated (`card.at`: at / no / en), and the intro's info face uses the same word.
- The link's text is set with `set:text`, because Prettier's Astro plugin reflows inline content onto separate lines. That put spaces inside the link and stretched its underline past the name.

## Phase 6 — QA (2026-10-03)

**Budgets (§12), measured on the production build.**

| Budget                       | Limit                                 | Result                                                              |
| ---------------------------- | ------------------------------------- | ------------------------------------------------------------------- |
| JS on Home, gzip             | ≤ 30 KB                               | 4.5 KB (other pages 3.0 KB)                                         |
| Portrait                     | ≤ 60 KB                               | 1.5–16 KB per variant (AVIF 5.7 KB at 2×)                           |
| Fonts                        | Nunito latin, swap, adjusted fallback | latin subset, `font-display: swap`, fallback `size-adjust: 101.39%` |
| LCP (lab, Lighthouse mobile) | < 2.5s                                | 1.65s inner pages, 1.80s Home with the intro                        |
| CLS (lab)                    | < 0.1                                 | 0 on every page                                                     |
| INP                          | < 200ms                               | TBT 0ms in the lab; INP needs field data after launch               |

**Lighthouse 12** (headless Brave, mobile preset unless noted): performance 98–100, accessibility, best practices and SEO 100 on Home (light, dark, desktop, reduced motion), About, Experiences, Projects, Blog and pt Home. Lighthouse is for debugging only (§12); field data after launch decides.

**Fixed during Phase 6.**

- **Home's LCP image during the intro.** The intro's logo poster (320×320) is larger than the headline, so it is Home's LCP while the intro plays. It was a JPEG set late by the card's inline script. Now the posters are WebP (intro 13–15 KB, was 27–33 KB; island 1.5 KB, was 3 KB), written by `scripts/encode-logo.sh` through sharp. The head script preloads the current theme's intro poster with high priority as soon as it decides the intro will play. Lighthouse's "LCP request discovery" and "modern image formats" findings are gone, and Speed Index dropped to 1.35s.
- **Link hover palette:** corrected to the intelligence palette (see above).

**Deviations, accepted.**

- **Home's LCP element is the logo poster while the intro plays**, not the H1 or portrait as §12 states. That follows from the logo-first intro Antonio asked for, and LCP stays under budget (1.80s). Without the intro (return visits, reduced motion) it's the portrait or the headline again.
- **The intro poster is 640px for a 320px box.** Lighthouse estimates 10 KB of savings on 1× screens, but a video poster can't be responsive, and 640px is what 2× screens need.
- **The stylesheets are render-blocking** (about 6 KB gzip per page). Inlining them all would cost caching across pages. Not worth it at these scores.
- **No visible way to stop the intro** (see "No 'Skip intro' button"). Any input still stops it.

**Accessibility (§11), checked by hand.**

- **Keyboard:** the skip link is the first stop. Then the logo, the four links, the language pill and the theme toggle, then the identity card's Inter link, profiles and email, then the page. Every stop shows the 2px `--accent` ring at 2px offset. The language menu opens with Enter, Tab walks its three links, and Escape closes it and returns focus to the pill.
- **Contrast of island text over content under the glass,** measured from screenshots with the H1 scrolled right under the pill: 10.2:1 dark, 13.3:1 light, at the worst backdrop pixel next to the label.
- **Reduced motion:** a run with `--force-prefers-reduced-motion` loads no intro assets and doesn't play the island logo; LCP is the portrait. In code, the mesh, halo, link glow, feature-card entrance, island morph, logo playback, page transitions and theme crossfade are all off with reduced motion.
- **Reduced transparency** makes the island glass and the floating toggle solid (Chromium only, per §6.4).

**Site-wide checks.** All 401 internal references across the 16 built pages resolve. The i18n check passes on all 15 localized pages: reciprocal hreflang, self canonicals, three crawlable switcher links each, no fallback.

**Left for Antonio (they can't be done from here).**

- VoiceOver on macOS Safari and iOS Safari (§11).
- A mid-range Android phone, for the glass and mesh cost (§12).
- Open decision #9: three.js on Projects, yes or no.
- Field data (CrUX / Search Console) after launch decides INP and real LCP.

## GitHub Activity (2026-10-03)

**A GitHub contribution chart on Home, as its last section (first between Projects and Writing, then above Experiences, then moved last at Antonio's request), and on Projects, under the page header and above the project grid (first at the end of the page, moved at Antonio's request) (requested by Antonio, modelled on a chart he shared).** It shows the total for the last year, a week-by-day calendar with month labels, a tooltip per day ("23 contributions on Jun 28, 2026"), the snapshot date, and a "Top Public Contributions in:" row with up to five repositories.

**Data: a committed snapshot, not a live call.**

- `npm run github:refresh` (`scripts/fetch-github-activity.mjs`) queries GitHub's GraphQL API and rewrites `src/data/github-activity.json`. The token comes from `GITHUB_TOKEN`, or else `gh auth token`.
- The build reads only the JSON, so it needs no network or token and stays reproducible.
- The page shows "Updated {date}" so the snapshot's age is honest.
- **Refresh before each deploy.** At cutover (Phase 7) the deploy workflow should run it with the Actions token, ideally on a daily schedule. Until then it's manual.
- **Privacy.** The calendar counts private contributions the way GitHub's public profile does (counts only; 911 of 957 today). Repositories are kept only when public, so a private repository's name never reaches the site, whatever token runs the script.

**Look.**

- The squares use the **intelligence palette** (Antonio's choice over GitHub green and the accent blue). Each week takes a colour from a sweep across the year (orange, pink, lilac, blue, cyan), blended in OKLCH so it stays vivid. Activity levels 1–4 mix 45/65/85/100% of that colour into the empty-square colour. The light theme uses deeper pink, lilac and cyan stops.
- The tooltip is a pill in the inverse colours.
- A centred footer below a hairline shows the GitHub mark and "@anettodev" (the snapshot's login), linking to the profile.
- The snapshot date is the local date when the script runs. UTC would read a day ahead late in the evening in Brazil.
- **Top Public Contributions** (refined at Antonio's request): up to five public repositories with commits in the year, most commits first. With none, the row isn't drawn at all. Each is a glossy orb (pink, cyan, violet, orange, blue) showing its commit count inside. The count is at most three characters at 0.7rem; 1,000 and up become "1k"…"99k".
  - Each orb is a link to the repository. On hover or keyboard focus, the stack fans out and the repository name slides out to the orb's right in a pill. The width animates through a 0fr → 1fr grid track.
  - On narrow cards the orbs take a full row. If a long name needs more room while it's open, the orbs after it wrap to a second line.
  - A chevron button (`aria-expanded`) shows the full list with names and counts. Without JavaScript the list stays open.
  - This replaced a `<details>`, because links can't sit inside its `<summary>`, which behaves as a button.
- On cards narrower than 34rem (phones) the calendar shows the last 26 weeks. The whole year would shrink each day to about 4px.

**Accessibility.**

- The calendar is one `role="img"` labelled with its date range. The total, snapshot date and repositories are real text. Orb links are named like "github-planner, 22 commits", which includes their visible text, and the list's counts carry a visually hidden "commits".
- The days aren't focusable, so 371 tab stops aren't added. The tooltip is a hover extra.
- Lighthouse: accessibility 100 on Home and Projects. Text sizes use the existing tokens, and month labels are `--muted` on `--surface`.

**Cost.** One small inline script for the tooltip (about 0.7 KB gzip). Home's JavaScript is 5.1 KB of the 30 KB budget, and the calendar markup adds about 3.5 KB gzipped HTML. LCP and CLS are unchanged.

## Project cards (2026-10-03)

**Projects are cards in a two-column grid (requested by Antonio):** one row of two on Home (the first two by `order`), and every project on the Projects page. They drop to one column when the content column is under 40rem. This replaces the device-frame entry (`ProjectEntry`).

- **Each card:** a 16:10 cover, the title, a status dot, the description clamped to three lines, up to five stack pills, then buttons. A missing cover shows `[PLACEHOLDER: <title> cover image]` (§13.1).
- **Statuses:** `todo` / `wip` / `done`, with dots in cyan / orange / green (`--status-todo/-wip/-done`, deeper shades in light mode). This **replaces spec §4's shipping / in progress / past**. The labels read Planned / In progress / Shipped (pt: Planejado / Em desenvolvimento / Publicado; es: Planeado / En desarrollo / Publicado). Nutria is `wip`.
- **Buttons:** `links.appStore` ("App Store"), `links.demo` ("Live demo") and `links.source` ("Source code", with the GitHub mark). Each shows only when set, and they wrap two to a row on phones, three on desktop.
  - **A fourth, `links.website` ("Website"), was added** so Nutria keeps its product-page link (azklepio.com/nutria). It isn't an App Store page, a demo or source code. It replaces the old free-text `link` and its label.
  - Buttons are named "Live demo: Nutria" and so on, so they stay distinct out of context.
- **The schema enforces** five stack items at most (`.max(5)`) and URLs for the links. Content that breaks either fails the build.
- **One project exists today**, so Home's row has one card in the left column. Dev builds show the dashed "Dev only" card after the projects on the Projects page, as before. **A second project (cover, one-line description, stack, links) is content Antonio still owes.**
- Lighthouse: 100 in every category on Home and Projects; CLS 0.

## Experience timeline on Home (2026-10-03)

**Home's Experiences is a collapsible timeline of the latest three employers (requested by Antonio, modelled on his Hugo resume's timeline).** It replaces the three Inter role rows.

- **Entries are companies**, not Inter roles (Antonio's choice): Inter&Co, Avenue Code, MadeinWeb e Mobile. A new `companies` collection holds one Markdown file per company and locale: `order`, `company`, `title` (latest role, shown under the name), `logo`, `start` / `end` as `YYYY-MM` (no `end` while current), `url`.
- **Each entry:** a node on a vertical line with its dates beside it in short months, newest first like the timeline: the end over the start, with no dash, separated by a thin rule as wide as the wider date ("Present" / "Oct 2019"; pt "Atual" / "out. de 2019"). Screen readers still get "Present – Oct 2019" from a visually hidden dash. The label is 13px in a 6.25rem column, sized to the widest case. Above the card on narrow screens, both share one line, split by a thin upright rule.
  - **Time at each company** (all its positions together) is a pill beside the company's name: Inter&Co "7 years", then 3 years, 2 years and 7 months. Beside the role it read as time in that role, which is wrong for Inter. Name and pill stay on one line; on narrow cards a long name wraps within its own space and the pill stays level with its first line. It counts whole years, or months under a year, through `Intl.NumberFormat` units; a current job counts to the build date.
  - **Each position has its own pill** beside its title, from a `positions` frontmatter list matched to the `####` headings by title (`start`, `end`, `current`). A company with a single position uses the company's dates.
    - Positions without dates show a visible placeholder pill: `[PLACEHOLDER: start date]` for a current position, `[PLACEHOLDER: years]` otherwise. Today that's all four Inter positions; iOS Dev Specialist II has its Oct 2019 start but no end.
    - Inter's separate "[PLACEHOLDER: start date] – present" and "[PLACEHOLDER: years]" lines moved into these pills, so each is stated once.
  - The card is a native `<details>`. Its header holds the logo, the company (an `<h3>`) with its length pill, and the latest role; the dates appear on the node and nowhere else (Antonio's request, to avoid showing them twice).
  - On Home all entries start closed (Antonio's request); on the Experiences page the newest starts open (`openFirst`). Home passes `companies.slice(0, 3)`.
  - Below a 34rem content column the date moves above its card and the line runs down a slim gutter, so cards keep nearly the full width.
- **The body copy is migrated from the Hugo resume** (`git show main:content/resume.md`). Spec §0.3 names the Hugo content as the migration source, and §13.2 says to copy the earlier roles from it. Changes:
  - Role titles became `####` headings and sections `#####`, under the company `<h3>`.
  - The old 8-space-indented skill lists (which rendered as code blocks) became real lists.
  - A broken App Store URL lost its stray "Activities" suffix, and "informations" became "information".
  - Inter&Co's body opens with Executive Tech Manager, still the same `[PLACEHOLDER]` as before.
- **pt and es bodies are drafts**, marked with the usual comment, with job titles kept in English.
- **Positions laid out one by one** (Antonio's follow-up). The rendered Markdown is cut at build time before each `<h4>` (a position) and each `<h5>` (a section).
  - Each position sits on a rail inside the card, with a dot by its title. The current one (first position of a company with no `end`) has a filled accent dot.
  - The quote under a title is the position's **highlight**: a tinted callout with an accent edge, upright text.
  - Each section gets a small uppercase label over compact lists.
  - **Skills are tags.** In the Markdown they're inline code, one span per original item, wording unchanged, and they render as pills.
  - **Each tag has its own colour** (Antonio's request): a hue derived at build time from the tag's text, so the same skill gets the same colour on every page and in every row. It's shown as a coloured border and a light tint, with the text kept in `--fg` for contrast. Within one row, a hue closer than 24° to an earlier one moves to the middle of the widest free arc of the wheel; every row in all locales keeps at least 25° between hues.
  - Company-level links (Inter's App Store page) moved from the end of the body into a `links` frontmatter list, shown beside the website. Before, the App Store link read as part of the last position.
  - The current position's class is `now` and the links row's is `company-links`. The island stylesheet's global `.current` and `.links` rules would otherwise add its padding, hover chip and halo glow.
- **Logos** come from the Hugo site's `static/images/` (Inter, Avenue Code, MadeinWeb), now in `src/assets/companies/` and served through the image pipeline at 36px, 1–3×.
- **A "{n} more experiences" link** follows the timeline, centred below it with no node (the line ends at the last company). It links to the Experiences page and shows only when more companies exist than Home shows; today that's "1 more experience" (pt: "Mais 1 experiência", es: "1 experiencia más"). Hover and focus give it the navigation links' intelligence-palette halo behind a solid chip. Both now read the stops from one token, `--intelligence-ring`.
- **Daccord Educação** (iOS Engineer, Aug 2013 – Mar 2014) was migrated as the fourth company, from the Hugo resume; §13.2 names it. The resume's entries after it (education, Naips, the PHP years, the internship) aren't migrated: some look unfinished (an example.com link) and need Antonio's check first.
- **The Experiences page uses the full timeline** (requested by Antonio): every company, newest open. A visually hidden "Timeline" h2 keeps the headings in order (h1 → h2 → company h3 → position h4).
  - The Resume PDF and LinkedIn buttons sit in the page header, under the lead and above the timeline (Antonio's request). `PageHeader` gained a slot for content after the lead.
  - The section after the timeline ("Before that"; was "Before Inter") keeps the software-since-2007 line, "Earlier web roles" and education. The Avenue Code, MadeinWeb and Daccord rows went, since the timeline has them. The page lead now reads "Newest first. Open an entry for its roles and the work."
  - **The `roles` collection and `RoleRow` were removed,** being unused. Their owed placeholders moved into Inter&Co's entry so they stay visible: the Executive Tech Manager start date, the CORE manager years and one public proof from the Investments years (§13.2).
- Lighthouse on Home: accessibility, best practices and SEO 100, performance 99; LCP 1.95s (the intro poster), CLS 0.

## Writing as cards (2026-10-04)

**Writing is a card grid like Projects (requested by Antonio):** one row of three on Home (the first three posts), and every post on the Blog page. The grid drops to two columns under a 52rem content column and one under 34rem. This replaces the post rows (`PostRow`, removed).

- **Each card:** a 16:10 cover, the source (Medium, Gist) as a small label, the title clamped to two lines, a summary clamped to two lines, up to three tags as chips, then a footer with the date (calendar icon) and "Read more →" when the post has a link.
- **Schema, per post:** `description` (optional), `tags` (three at most, enforced), and `cover` (optional image; the `pages` collection schema became `({ image }) => …` so the blog's posts can take one). `year` stays as the date text.
- **Placeholders:** all four posts are still placeholders (title, year, link). Each now also has a visible `[PLACEHOLDER: one-line summary of the post]`, and a missing cover shows `[PLACEHOLDER: cover image]`. A post without `href` gets no "Read more".
- Lighthouse on Home and Blog: accessibility, best practices and SEO 100, performance 99; CLS 0.

## AI usage from tokscale (2026-10-04)

**An AI usage section on Home (under GitHub Activity) and a full `/ai` page (requested by Antonio, modelled on a page he shared).** The data comes from tokscale, chosen after comparing it with Viberank, clawdboard, Token Tracker, a local-only script and Anthropic's usage API. Only tokscale publishes a per-user daily breakdown as public JSON. Anthropic's API sees only usage billed to a Console API account, and Antonio's Claude Code is a subscription.

**Data: a committed snapshot of the public profile.**

- `npx tokscale@latest submit`, run on Antonio's Mac, reads the local AI tool logs and uploads daily totals per tool and model to tokscale.ai/u/anettodev.
- `npm run ai:refresh` (`scripts/fetch-ai-usage.mjs`) reads `tokscale.ai/api/users/anettodev`, which is public and needs no token, and rewrites `src/data/ai-usage.json`. The build never calls tokscale.
- **Everything is summed from the daily records.** The API's `stats.activeDays` and `modelUsage` cover only its last-year chart window, while its token and cost totals cover the whole history. Mixing them gave 42 days and 6 models against 46 and 8, and model shares short of 100%.
- **Days without token counts are left out.** Cursor's history from Feb 22 to Jun 11, 2025 has 2,190 requests over 79 days but no tokens or cost, as Cursor's records from then carry none. Keeping them would start the range in February while tokens start on May 17, and count messages from days the other totals skip.
- `AI_USAGE_FILE=<graph.json> npm run ai:refresh` reads a local `tokscale graph --output` export instead, for an offline preview.
- **Privacy.** The script keeps only what the page shows. The profile also lists the machine's MCP server names, the user id and devices; none of that reaches the site. The upload itself does publish the MCP server names on tokscale (no opt-out); Antonio accepted that. The device is named "Mac" through `TOKSCALE_DEVICE_NAME`.
- **Keeping it current.** A launchd job on Antonio's Mac, `dev.anetto.tokscale-submit`, runs `tokscale@4.17.0 submit` daily at 22:00, or on wake if the Mac was asleep. It's pinned, so only the reviewed version runs unattended. It logs to `~/Library/Logs/tokscale-submit.log` and isn't part of the repo. Installed and test-run on 2026-10-04. Since Cursor is connected, each run also syncs Cursor's usage. The site still needs `ai:refresh` before each deploy, until the Phase 7 workflow runs it daily alongside `github:refresh`.
- tokscale's `usage` and `cursor login` commands read the Claude Code and Cursor logins and aren't used.

**What it shows.**

- **Card (Home and /ai):** the date range and last sync, three totals, the year calendar and a footer link to the profile.
  - The totals: API-equivalent cost with the average per active day, tokens with messages and active days, and the share of prompt tokens read from cache.
  - The calendar is `ActivityCalendar`, now shared with GitHub Activity: GitHub's calendar markup, palette sweep and tooltip moved there unchanged (measured the same to the pixel). Levels are quartiles of the active days in the window. The tooltip reads "4.8M tokens on Sep 30, 2026 · $2.71".
- **The card's chart switches between the heatmap and usage over time** (Antonio's request, modelled on tokscale's own chart). A "Heatmap | Over time" switch sits above the chart on Home and /ai. Heatmap is the default; the choice is remembered in local storage, and without JavaScript the switch hides and the heatmap shows.
  - **Over time** (`UsageTrend.astro`): stacked areas of tokens per model over the last 7, 15, 30, 60, 90, 180 or 360 days, picked with segmented buttons that replaced the chart's caption (Antonio's request). 7 is the default and the choice is remembered. The spans are `CHART_RANGES` in `lib/ai-usage.ts`.
    - Spans up to 90 days plot every day.
    - 180 and 360 plot a 7-day average per week, since daily spikes would bury the shape. They cover whole weeks, at least the days asked for: 26 and 52 weeks.
    - In each span the five models with the most tokens get bands in the intelligence palette, largest at the bottom, and the rest share "Other models". The leaders differ by span: the last 7 days are claude-opus-5-5, Sonnet 5.5 and Grok 4.7.
  - All seven charts are drawn at build time as SVG, with no chart library, and the buttons show one (`scripts/ai-chart.ts`). The hover tooltip (`scripts/usage-trend.ts`) gives the date, "Daily" or "7-day average", each band's value and the total. Each chart is one image to assistive tech, labelled with its span; the legend is text.
  - The snapshot keeps each day's tokens per model (`days[].models`) for it, about 35 KB read only at build time. The seven charts add about 5 KB of gzipped HTML to Home (now 30.4 KB) and /ai.
  - **Astro 7's compiler misreads `value! / divisor` in frontmatter**: the non-null `!` followed by `/` starts a phantom regex. `astro check` then reports nonsense errors in the component's `<style>`. Write `(value ?? 0) / divisor` instead.
- **The /ai page adds** the top six models by cost with bars (the rest in one "Other models" row), the token mix by type and a table of tools, then a note on cost.
- **The three totals carry the intelligence palette** (Antonio's request): each tile has the lane cards' look at tile size, a 4px gradient border over a blurred glow of the same gradient. They use the same `--gradient-pink/-cyan/-violet` tokens in the lanes' order: cost, tokens, cache. The tiles' grid is isolated, so the glows sit behind the tiles but above the card.
- **Costs are always "API-equivalent".** They're tokscale's estimates at public API prices, not what was paid. Every cost label says "API-equivalent", and the foot of the Models and Tools panels reads "Costs are tokscale's estimates at public API prices." (shortened and moved into both panels at Antonio's request). Showing them as spend would be a claim about Antonio that isn't true.
- With no data, Home leaves the section out and /ai shows `[PLACEHOLDER: AI usage appears here after the first tokscale sync]`.
- `/ai` is in the navigation island as "AI" (pt and es "IA"), between Projects and Blog (added at Antonio's request; it started outside the island). Home's "See the breakdown" links to it too. Its copy is UI text in the i18n files, since it describes the data rather than Antonio. The pt and es strings are drafts.
- On narrow panels a model's name takes its own line above its cost and share; the stat tiles stack.
- **Tools carry their maker's mark** (Antonio's request): Claude, Cursor, Google Gemini and Kimi from Simple Icons (CC0, simple-icons@16.34.0), added to `Icon.astro` beside the social marks. Each sits on a 28px chip in the text colour, so it follows the theme like the other marks; brand colours were skipped since Cursor's and Kimi's are black. A tool without a mark shows its initial. Marks with extra licence terms (GitHub Copilot's is MIT) aren't carried until a tool needs one.
- **Share leads the Tools table** (Antonio's request). It's larger and bolder, with its header in the text colour, while Cost and Tokens are muted. It stays at every width: below a 22rem panel, Cost and Tokens move under the tool's name ("$2,874.85 · 4.53B tokens") and the table keeps two columns, Tool and Share. That replaced an earlier narrow-screen list, which buried the share.
- **Models and Tools show a period, picked per panel** (Antonio's request). Each panel reads "Last [7] days", with 7, 15 or 30 days and 7 as the default.
  - The picker sets the whole panel: each row's cost, tokens and share are for those days.
  - Each share's ▲/▼ is the change in percentage points ("pp") against the previous period of the same length, e.g. the last 7 days against the 7 days before them.
  - Rows used in the previous period but not this one are listed at $0.00 / 0% with their fall, so the changes add up to zero and the shift shows. Over 30 days, Kimi CLI ▼ 14.2 is why Claude Code and Cursor both rose. In Models such rows usually fall into "Other models", whose change is the sum of its models'. A period with no usage shows "No AI usage in these days".
  - The pickers (`TrendWindow.astro`) are native `<select>`s inside one `<ai-trends>` (`scripts/ai-trends.ts`). Picking a period in either moves both and shows that period's rows, which carry `data-w`. The choice is remembered in local storage; without JavaScript the picker hides and the 7-day rows show.
  - The script computes `periods[N]` for N in `periodDays: [7, 15, 30]`: cost, tokens, and the models and tools with `shareDelta`, from the daily per-tool and per-model records. The all-time `models` and `clients` lists stay in the snapshot.
  - Moves under 0.05 points get no arrow. Up is green, down pink, in deeper shades in light mode for contrast. Hovering an arrow shows, and screen readers hear, "up 37.9 percentage points vs the previous 7 days".
  - Token mix still covers all time.
- **Tools carry their maker's mark** (Antonio's request): Claude, Cursor, Google Gemini and Kimi from Simple Icons (CC0, simple-icons@16.34.0), added to `Icon.astro` beside the social marks. Each sits on a 28px chip in the text colour, so it follows the theme like the other marks; brand colours were skipped since Cursor's and Kimi's are black. A tool without a mark shows its initial. Marks with extra licence terms (GitHub Copilot's is MIT) aren't carried until a tool needs one.
- **Share leads the Tools table** (Antonio's request). It's larger and bolder, with its header in the text colour, while Cost and Tokens are muted. It stays at every width: below a 22rem panel, Cost and Tokens move under the tool's name ("$2,874.85 · 4.53B tokens") and the table keeps two columns, Tool and Share. That replaced an earlier narrow-screen list, which buried the share.
- **Share arrows with a day picker** (Antonio's request), on both Tools and Models. Each share carries ▲/▼ and the percentage points ("pp") its share of all-time cost moved over the last 7, 15 or 30 days. That's its share now minus its share of the cost up to that many days ago.
  - Each panel reads "Last [7] days", with 7 as the default. The pickers (`TrendWindow.astro`) are native `<select>`s inside one `<ai-trends>` (`scripts/ai-trends.ts`). Picking a window in either moves both and shows the arrows for it.
  - "Other models" gets the sum of its models' changes, since shares add up.
  - The choice is remembered in the browser's local storage, a per-viewer convenience only. Without JavaScript the picker hides and "7" shows as text.
  - The script computes all three windows from the daily per-tool and per-model records: `clients[].shareDelta` and `models[].shareDelta` keyed by days, with `deltaWindows: [7, 15, 30]`.
  - Moves under 0.05 points get no arrow. Up is green, down pink, in deeper shades in light mode for contrast.
  - Hovering an arrow shows, and screen readers hear, "up 1.4 percentage points in the last 7 days".

## "Book a call" on the identity card (2026-10-04)

**A "Book a call" button closes the identity card, under the email (requested by Antonio).** It opens Calendly's scheduling popup for `calendly.com/anetto`, the calendar the Hugo site's `/contact` page offered through its Calendly shortcode. This adds to spec §16's "Contact is `mailto:`": the email stays, and Calendly is a second way in. There's still no `/contact/` page (§14 #4).

- **Calendly loads on the first click, not with the page** (`scripts/book-call.ts`). Its widget script and stylesheet come from `assets.calendly.com` only when someone asks to book. Visitors who never click never contact Calendly, and the page carries none of its weight; Home's JavaScript is unchanged. The button reads as busy while the script loads.
- **The button is a real link** to the Calendly page with `target="_blank"`. Without JavaScript, before the script runs, or if Calendly fails to load, it opens the page in a new tab. Modified clicks (new tab, new window) are left to the browser.
- **Look:** a pill with a calendar icon and a **constant** intelligence-ring halo (Antonio's request). At rest it turns slowly (8s a turn at 70% opacity); on hover and focus it's brighter and faster (4s, full). With reduced motion it stays still. Its glow sits in the isolated `.book` wrapper, so it shows behind the pill.
- **Accessible name:** "Book a call on Calendly", which includes the visible label. In pt it reads "Agendar uma conversa" and in es "Agendar una llamada" (drafts).
- **The popup's backdrop is darker and blurred** (`body > .calendly-overlay` in `global.css`). Calendly's stock 40% grey let the island and the theme toggle show through as if live, beside Calendly's close button.
- The popup itself is Calendly's white page, including its own cookie settings; colours that follow the site's theme need a paid Calendly plan. The card still fits short desktop viewports in its compact variant (measured at 1100×700).

## Home trimmed to lanes, GitHub and Last Experiences (2026-10-04)

**Home now runs: positioning, the three lanes, "Last Experiences", Tech Stack, then GitHub Activity last** (Antonio's request; Tech Stack was added and GitHub Activity moved to the end later the same day). This overrides spec §5.4's previews of Projects and Writing.

- **Removed from Home:** the Projects cards, the Writing cards and the AI usage section. Each stays complete on its own page (Projects, Blog, `/ai`), all reachable from the island. The lanes still link to Experiences and Projects.
- **"Experiences" became "Last Experiences"** (pt "Últimas experiências", es "Últimas experiencias", drafts). It's still the latest three companies, all collapsed, with the "{n} more" link and "All experiences".
- **Leftovers removed:**
  - the `previews.projects` and `previews.blog` copy and schema; the `pages` schema keeps only `previews.experiences`;
  - AI usage's Home variant (its heading row and "See the breakdown" link, and the `ai.detailsLink` string). `AiUsage` is now just the /ai page's body.
- Home's gzipped HTML went from 30.4 KB to 16.7 KB.

## Tech Stack section (2026-10-04)

**A Tech Stack section on Home, after Last Experiences, and on About, after the facts and before the personal line** (Antonio's request). The personal line stays last (§2).

- **Compact one-line pills** (`TechStack.astro`), modelled on two references Antonio shared and then made quieter at his request: wider is fine, taller isn't.
  - Each pill is 34px tall, as wide as its name, never wrapping inside (names keep their hyphens unbroken), and the pills flow across rows.
  - Each has a 26px logo tile with a Simple Icons mark from `Icon.astro`, or the name's initial.
  - Each page heads the section in its own style: Home's section heading with a hairline ("Tech Stack"), About's small label like the facts.
  - Drafts: pt "Stack de tecnologia", es "Stack tecnológico".
  - **A total sits after the title** (`CountBadge.astro`, formerly `TechCount`, Antonio's request; the Projects page's headings use it too): the number of technologies in a small pill-shaped circle, smaller on About's label. Screen readers hear "Tech Stack, 16 technologies" (pt "tecnologias", es "tecnologías"), not a bare number. It's hidden while the list is empty.
- **The list lives in `lib/tech-stack.ts`** (`TECH_STACK`: a name, an optional icon and an optional colour), in display order. Names are proper nouns and aren't translated.
- **Each pill can have its own colour** (`color: "#rrggbb"`, Antonio's request), kept discreet.
  - The logo tile takes the full colour, with its mark in near-black or white, whichever contrasts more (WCAG relative luminance, computed at build time).
  - The pill gets a 12% tint of the colour over the surface and a tinted border, so it still follows the theme.
  - Without a colour, a pill takes the theme's own colours.
  - The first full-colour backgrounds were too loud.
- **A sample list is in place for Antonio to try** (his request): the tools his resume names, with brand colours where the tool has one. It's his to edit or confirm before shipping. Logos for Swift, fastlane, Bitrise, ReactiveX (RxSwift), LottieFiles and Subversion were added to `Icon.astro`. CocoaPods (CC BY-NC) and Git (CC BY) carry attribution licences in Simple Icons, so those pills show an initial on their brand colour.
- **The list is Antonio's to supply.** The section shows `[PLACEHOLDER: the technologies to show]` until he does. The references showed a generic web stack, and the site makes no claims beyond the copy (spec rule), so nothing was filled in for him. Logos for his tools get added to `Icon.astro` from Simple Icons as the list arrives; Swift, Xcode, Fastlane, Bitrise, CocoaPods, ReactiveX, Lottie, Git and Subversion have one, while Objective-C, SwiftUI, TestFlight, Carthage, SPM and Tuist don't.

## Bookmarks page from Raindrop (2026-10-04)

**A `/bookmarks` page listing Antonio's public Raindrop.io bookmarks** (his request). It's in the island after Blog: About · Experiences · Projects · AI · Blog · Bookmarks (pt "Favoritos", es "Marcadores").

- **Data: a committed snapshot, `src/data/bookmarks.json`, written by `npm run bookmarks:refresh`** (`scripts/fetch-raindrop.mjs`). The build never calls Raindrop.
  - **No token.** The script reads what Raindrop already publishes. Antonio's public profile page (`anettodev.raindrop.page`) links each public collection as `/<slug>-<id>`.
  - Each collection's details and bookmarks come from the unauthenticated endpoints Raindrop's own public pages use (`api.raindrop.io/v1/collection/<id>` and `/v1/raindrops/<id>?nested=true`).
  - **Sub-collections count:** Antonio's public "Public" collection holds nothing itself; his bookmarks sit in its sub-collections (articles, github projects, tools, videos, websites). Without `nested=true` the page would show none. Each bookmark keeps the collection it sits in, so the chips name the sub-collections as Antonio wrote them in Raindrop. Items in a collection that isn't public are dropped.
  - These aren't in Raindrop's documented REST API, which needs a token. If they change, the script fails loudly and the committed snapshot stays as it was. The token route (`/rest/v1` with `RAINDROP_TOKEN`) is the fallback if that ever happens.
  - The profile page was unavailable until Antonio verified his Raindrop email.
- **Only collections marked Public in Raindrop exist on those pages**, so what the site shows is decided in Raindrop. Antonio shared the embed iframe Raindrop offers (`…/public-75789843/embed`); it isn't used, because it's a third-party page that can't follow the site's theme (spec §6.5's rule for iframes).
- **Kept per bookmark:** title, link, domain, a 180-character excerpt, tags, date and collection. Notes, highlights, covers and account details aren't kept.
- **A compact list** (Antonio's choice over cover cards), newest first. Each row has three lines, rearranged at Antonio's request:
  - a top line with the date pill and up to three hashtags on the left, and the site's icon and domain on the right (it wraps under them on narrow screens);
  - the title linking out;
  - a one-line excerpt.
  - The date shows the year only when it isn't the snapshot's.
  - **The date sits in a pill coloured by its day** (Antonio's request): same day, same colour. Each next day turns the hue by the golden angle (137.5°), so neighbouring days never look alike. It uses the same tint recipe as the timeline's skill tags, with a deeper stop in light mode; the text stays in the theme's colour for contrast.
  - **Site icons** (Antonio's request; they replaced letter tiles). The refresh script downloads each domain's icon once into `public/bookmarks/icons/`, from DuckDuckGo's icon service and then Google's.
  - The page serves those copies itself, so visitors never contact a third party. Icons for domains no longer listed are deleted on refresh, and a site with no icon gets a globe.
  - Each icon sits on a small white backing, so dark marks like GitHub's still show in dark mode. The first set is 9 icons, about 40 KB.
  - **Search, chips and pages** (Antonio's request), over the bookmarks already in the page. They're now the shared filtered-list pieces (see "All projects" below: `scripts/filter-list.ts` and the `List*` components):
    - **Search:** a field that matches titles and descriptions as you type, ignoring case and accents.
    - **Chips:** filter by collection, with counts, when there's more than one public collection.
    - **Pages of 10, 25 or 50**, picked in a "Show [10] per page" dropdown beside the status line (10 by default; the browser remembers the choice in local storage). Previous and next, up to seven page numbers, and "Showing 1–10 of 13" in a polite live region. The numbers are the first, the last and the current with its neighbours, with "…" for the rest: `1 2 3 4 … 12`, `1 … 6 7 8 … 12`, `1 … 9 10 11 12`. Up to seven pages, every number shows. A new page scrolls back to the top of the list.
    - **Sort toggle** (Antonio's request): a Date | Title switch beside the per-page picker. Date starts newest first, Title starts A–Z (case- and accent-insensitive, via `Intl.Collator`); pressing the active one again flips it (↓/↑, A–Z/Z–A). Ties fall back to newest first.
      - The rows are moved in the list, so reading order matches the screen. Each button's accessible name says what it does: "Sort by title, A to Z".
      - The browser remembers the choice in local storage.
    - Search, chips and sort combine, and any of them resets to page 1. With no match a message shows.
    - Without JavaScript the search, chips and pager hide, and every bookmark shows.
  - There are no third-party images: no favicons or covers are loaded from other hosts.
  - A footer gives the snapshot date and "View on Raindrop".
- **Until the first refresh** the page shows `[PLACEHOLDER: public Raindrop bookmarks appear here after the first refresh]`. After a refresh that finds no public bookmarks, it says "No public bookmarks yet." with a link to Raindrop. First real refresh: 13 bookmarks in 5 sub-collections.
- At cutover, the deploy workflow should run `bookmarks:refresh` alongside `github:refresh` and `ai:refresh`. It needs no secret.

## Projects page: Pinned carousel and paged grid (2026-10-04)

- **Order** (Antonio's request): header, GitHub Activity, then **Pinned**, then **All projects**.
- **Pinned** lists the projects whose frontmatter has `pinned: true` (a new `pinned` field in the projects schema, default `false`). Nutria is pinned. The section is left out when nothing is pinned. It's a horizontal carousel (`ProjectCarousel.astro`, ProjectCards' `carousel` layout), reworked to Antonio's spec:
  - **Layout:** two cards in view, or one and a bit on phones, snapping card by card.
  - **No scrollbar:** it's hidden while JavaScript runs.
  - **Arrows:** round glass arrows sit beside the row, left and right, 20px from it and centred on its height (Antonio's request, after a version that overlapped the card edges). Below a 40rem column they hide so the cards keep the width; swipe or the dots move it there.
  - **Dots:** one per stop the row can rest at, which isn't one per card when two are in view. The current stop's dot is a dash in the text colour, black or white with the theme (Antonio's request); the others mix it half into the page, enough for the 3:1 controls need (`aria-current` marks the current one). Each dot is labelled "Show <project>". The dots are rebuilt when the width changes the number of stops.
  - **Circular:** past the last stop wraps to the first, and back from the first goes to the last. Quick presses add up.
  - **Autoplay every 5 s**, wrapping, in `scripts/project-carousel.ts`:
    - **No pause button** (Antonio's call). One was added beside the dots and then removed at his request. WCAG 2.2.2 asks for a way to pause content that moves by itself for more than 5 s; hover, keyboard focus and reduced motion stop it here, but nothing stops it for good. Logged for the Phase 6 audit to weigh, like the intro's missing "Skip intro".
    - **Waits** while the pointer is over the carousel, while keyboard focus is inside, while it's less than half on screen and while the tab is hidden. Moving it by hand (arrow, dot, swipe, wheel) restarts the 5 s.
    - **Reduced motion:** for readers who prefer it, autoplay never runs and moves jump instead of gliding.
  - **Single project:** when every card fits, as now with one pinned project, no control shows and nothing moves.
  - **Without JavaScript** the row keeps its scrollbar and scrolls by hand, swipe or keyboard (it takes focus).
- **All projects:** every project, pinned ones included, in ProjectCards' new `grid-3` layout: three columns from 44rem, two from 30rem and one below, with a smaller title. The dev-only "next entry" placeholder stays after the cards.
  - **It works like Bookmarks** (Antonio's request):
    - a search over titles and descriptions (ignoring case and accents);
    - status chips with their dots and counts (only statuses in use);
    - a "Stack [All ▾]" picker listing every technology any project names;
    - a Title A–Z / Z–A sort;
    - "Showing 1–9 of 14";
    - "Show [9] per page" with 9, 18 or 36;
    - the same windowed pager.
  - **9 per page** (Antonio's choice), so a page fills three rows of three.
  - **Starts A–Z.** Only a title sort was asked for, so the projects' own `order` no longer applies here; the Pinned carousel still follows it.
  - The browser remembers the sort and page size per list (`anetto.projects-*`, like `anetto.bookmarks-*`).
- **One filtered-list engine for both pages:**
  - `scripts/filter-list.ts` (`<filter-list>`) replaced `bookmark-list.ts` and the short-lived `paged-list.ts`. It reads each `[data-item]`'s `data-title`, `data-date` and one `data-<filter>` per filter (several values joined by `|`), and searches the item's `[data-search]` parts.
  - Filters are any `[data-filter]`: a chip group or a `<select>`. Sorting moves the items in the page, keeping a trailing non-item (the dev card) last.
  - The toolbar markup and styles moved out of the Bookmarks page into `ListTools`, `ListChips` and `ListPick`.
  - **Two rows, not three** (Antonio's request, "we have space to fit better"):
    - Row 1 is the search, widening to fill, then the extra filters (Projects' Stack picker) and the sort toggle, all 40px tall.
    - Row 2 is the chips on the left and "Showing 1–9 of 14 · Show [9] per page" on the right.
    - Rows wrap on narrow screens. Where the chips fill row 2 (Bookmarks' five collections on desktop), the status and page size wrap under them, right-aligned.
  - The generic words (All, "Showing…", "Show … per page", the sort words) moved from `bookmarks` to a top-level `list` i18n group.
  - Bookmarks behaves as before (checked: chips, search, both sorts, page sizes, pages).
- **Shared pager:** the windowed page numbers (`1 … 6 7 8 … 12`) moved from the Bookmarks script into `lib/page-list.ts` (`pageList`, `fillPages`). The previous/next markup moved into `components/Pager.astro`, and its strings into a top-level `pager` group. Bookmarks and Projects both use them, through `<filter-list>`.
  - The pager hides when there's a single page, as now.
  - Without JavaScript every project shows.
- **Totals beside the headings** (Antonio's request): "Pinned" and "All projects" each show their project count in the same circle as Tech Stack. `TechCount` became `CountBadge`, which takes the number and its words (`projectsPage.count`, e.g. ", 1 project" for screen readers).
- **Hover halo on every project card** (Antonio's request), in both sections. It's the intelligence ring that turns behind "Book a call" and the timeline's "more" link (`--intelligence-ring`, `halo-turn`, 4 s). It also shows while keyboard focus is inside a card (`:has(:focus-visible)`), and with reduced motion it stays still.
  - It sits at z-index -1 in the cards' isolated container, behind every card's background, so it never tints a card.
  - The card lost its `overflow: hidden` (it would clip its own halo); the buttons' row rounds its own bottom corners instead.
  - A scroller clips what spills out of it, so the carousel row reaches 20px past the cards on every side (padding cancelled by a negative margin, plus matching `scroll-padding`). Cards still line up with the column edge at every stop; while the row moves, cards pass through that 20px margin.
- **The BS in Computer Science is the timeline's last entry** (Antonio's request, 2026-10-04).
  - It's a `companies` entry (`unicap.md`, order 5), so it renders like the jobs: logo, 2010-06 to 2015-06 with a "5 years" pill, the program link, a description quote and an "Activities and societies" list.
  - The copy comes from the Hugo resume (`git show main:content/resume.md`), an allowed source. The logo is the Hugo site's `catolicapernambuco_logo.jpeg`.
  - Fiscalize Aí's old domain is kept as plain text, not a link, since nothing confirms it's still the project's.
  - The degree title is translated in pt ("Bacharelado em Ciência da Computação", the official name) and es; job titles still stay in English.
  - The "Before that" list on Experiences had a "Computer Science, Universidade Católica de Pernambuco · 2015" row. It's gone, with its `before.education` schema field, so the degree shows once.
- **"Before that" on Experiences, filled in** (Antonio's request, 2026-10-04):
  - **Software since 2008, not 2007.** Antonio's correction; the earliest job is a 2008 internship. It overrides the spec's copy everywhere it appeared: the Home positioning line, About's description and body, and the Experiences lead, in all three languages.
  - **Three figures, now at the top of the page** (moved at Antonio's request: under the header, above the timeline; a top-level `figures` field of the page, no longer under `before`). Small tiles with a palette bar on top (pink, cyan, violet), spanning the column, each with small pills under its label (Antonio's wording, 2026-10-04):
    - "18+ years in Software Engineering", pills "web" and "<Apple mark> iOS";
    - "15+ years on <Apple mark> iOS", pills "since iOS 4.3" and "Obj-C → Swift";
    - "2+ years as SWE Manager", pill "Inter". It counts from May 2024, when Antonio became iOS manager of Inter's CORE Mobile team (his date). The same date fills Inter's "iOS Engineering Manager" position (`start: "2024-05"`, `current: true`, in his present tense).
    - The counts are whole years from each figure's `since` to the build date, so they move up with each deploy.
    - In a figure's `label` and `pills`, `{apple}` renders the Apple mark (Simple Icons 16.34.0, CC0, added to `Icon.astro`). Apple's trademark guidelines restrict use of its logo outside licensed uses; it's used here at Antonio's request, as a small inline mark beside "iOS".
  - **The lead is one sentence**, "Software since 2008, web first, then mobile." (Antonio's request). The iOS sentence was dropped because the iOS card above says it, and the lead doesn't leave a lone last word when it wraps (`text-wrap: pretty`).
  - **The earlier jobs replace "Earlier web roles"**: Naips Tecnologia (2012–2013), the PHP roles at Fishy, Cappen, Idealizza and Grupo Ser Educacional (2009–2012), and the Federal Police (SR/DPF/PE) internship (2008–2009).
    - The wording comes from the Hugo resume, and Antonio confirmed the entries.
    - Naips' resume link (`example.com/naips`) is not used; these rows have no links.
    - The rows use the timeline's date and node columns, so years and dots line up with the entries above. They're on a dashed rail with hollow dots, and nothing opens. On narrow columns the years move above, like the timeline.
- **Experiences header from Antonio's bio** (his request, 2026-10-04). It replaces "Inter, since October 2019." and "Newest first. Open an entry…".
  - **Headline, Antonio's words:** "From Web Developer to iOS Specialist." with "Currently I’m a Mobile engineering leader." under it, on its own smaller, muted line.
    - It's one `<h1>`, read as both sentences. A `\n` in a page title now does this in `PageHeader`.
    - Both sentences at full display size would have run four or five lines.
    - pt and es are drafts in sentence case.
  - **Lead, Antonio's words:** "B.Sc. in Computer Science and I’ve been working across banking and finance, e-commerce, automotive, logistics, communications, education and IT consulting, including companies listed on NASDAQ and B3 or in the Global Fortune 500." His bio says "several" of those companies, hence "including".
  - Two of the bio's facts were not used:
    - "started in 2007" conflicts with his 2008 correction;
    - "Software Specialist (Staff) in 2022" conflicts with the timeline's "iOS Dev Specialist II (Staff Engineer)" starting 2019-10. **Resolved (2026-10-05):** Antonio confirmed Staff Engineer from October 2019, so the bio's 2022 is wrong (see below).
    - Both are flagged to him.
- **Buttons get the intelligence halo on hover and keyboard focus** (his request; global `.button`, so About's buttons too). It's the "Book a call" ring at z-index -1 in `.button-row`, which is now isolated. The button turns solid `--surface` so the glow never sits behind its text. It's still with reduced motion. It replaces the old accent-border hover.
- **Page headers fill the column** (Antonio's request, all pages via `PageHeader`):
  - The headline and lead are 2px under their old sizes (`--text-h1` - 2px; 18px).
  - The lead's 38rem cap is gone.
  - The headline uses `text-wrap: pretty` instead of the site-wide `balance`, so lines run long ("From Web Developer to / iOS Specialist.") without leaving a lone last word.
  - On Experiences, LinkedIn now comes before the resume, with the LinkedIn mark before its label. The resume buttons (Experiences and About) read "Resume" with a stroke PDF icon (`UiIcon` "pdf": a folded page over "PDF"). Screen readers still hear "(PDF)" through visually hidden text. `.button.with-icon` spaces an icon from its label.
- **About headline, Antonio's words:** "I’m a technology executive manager who still practices the craft." It replaces "…technology executive at Inter who…". pt and es are drafts. The page's meta description still says "Technology executive at Inter…".
- **What Antonio owns now (his facts, rewritten at his request in a softer, professional tone, 2026-10-04).** He is Executive Tech Manager since October 2026 (`start: "2026-10"`, which replaces the start-date placeholder) and leads the Core Mobile Platform team, "a group of 18 people". He asked not to use his "reporting to me" wording or "just started".
  - **About:** "Today I’m Executive Tech Manager at [Inter](https://inter.co/), where I lead the Core Mobile Platform team, a group of 18 people. I guide our software engineering standards across features, the design system, architecture and performance."
  - **Timeline:** the position follows its siblings' format, a highlight quote ("Leading the Core Mobile Platform team, a group of 18 people, and guiding its software engineering standards.") then a "Focus Areas" list: Features, Design System, Architecture, Performance.- **About's text fills the column too** (Antonio's request): the prose (40rem cap) and the closing personal line (38rem cap) now span the full content column, like the page headers.
- **The CORE iOS team had eight engineers, and Antonio was its manager** (his correction). About now says "Before that I was the manager of the mobile CORE iOS team…, a team of eight iOS engineers", and Inter's "Leadership Role" list says "Led a team of 8 iOS engineers" (both were six).
- **"Outside work" on About** (Antonio's request; spec §2 has a single closing line). It replaces "Outside work, I’m the father of twins." It first sat last, then moved at Antonio's request to right under About's text, before the facts and Tech Stack.
  - **Content:** a label, his photo with the twins (the Hugo site's `theboys.jpeg`, now `src/assets/about/`, optimised by Astro to 200/400px, alt "Antonio with his twins"), and two lines condensed from his text:
    - "I’m a proud father of twins, a computer scientist and a software developer."
    - "I’m also an indie developer, building a few projects and apps of my own." Added at Antonio's request; "projects and apps" links to the locale's Projects page. The text supports `[label](href)` links.
    - "Originally from Recife, Pernambuco, I now live in Belo Horizonte, Minas Gerais, Brazil" plus the flag.
  - **The flag** is the site's SVG flag (`Flag`, `{br}` in the text), not the emoji he wrote (spec §9: flags are never emoji, which also don't render on Windows). There's one flag instead of two, since both cities are in Brazil.
  - **Layout:** the photo beside the text, or above it on narrow columns. `personal` in the about schema is now `{ title, text[], photo, alt }`.
- **About's text opens with Antonio's sentence** from his old About page, as its own first paragraph: "For over a decade, I have been committed to working in mobile app development, with a focus on the <Apple mark> iOS platform."
  - It was first put in the Experiences intro by mistake and moved here at his correction.
  - `{apple}` in About's Markdown renders the Apple mark: the page splits the rendered HTML on it.
  - The opening line and "Today I’m…" are in full colour; the history paragraphs after them are muted.
- **Nutria is no longer mentioned in About's text** (Antonio's request). The last paragraph ends at "…in Objective-C and then Swift." The Projects page still lists Nutria.
- **About has no buttons at the bottom** (Antonio's request). "Experiences →" and "Resume" are gone, along with the about schema's `experiencesLink` and `resumeLink`; the page ends with the Tech Stack. The resume stays on Experiences (beside LinkedIn).
- **Projects lead, Antonio's option C plus his additions:** "My indie side: apps and tools I build outside work, mostly for iOS, plus open-source contributions and hackathons." (The status sentence was dropped at his request.) The headline stays "I still ship." Open source and hackathons are mentioned in general terms only; no specific projects or events until he supplies them.
- **Projects: GitHub Activity sits 90px under the header** (it was 210px; Antonio's request). A `flush` prop drops the section's top margin there, so the gap is the header's own, as with the Experiences figures. Home keeps the normal section spacing.
- **AI page header, about Antonio's AI experience** (his request: "I have a good experience with many tools and providers").
  - **Headline:** "My real usage, in the open." (Antonio's pick; it replaced "AI is part of how I build.", which had this as its sub-line).
  - **Lead:** "I’ve worked with many AI tools and providers, and they’re now part of how I write software." then how the numbers are counted (tokscale, local session logs, synced daily). The list of tools and providers was dropped at his request; the panels below name them from the data.
- **AI page panels: Tools & Providers beside Agents** (Antonio's request). Under Models, the row is now "Tools & Providers" (the Tools table, renamed; pt "Ferramentas e provedores", es "Herramientas y proveedores") on the left and **Agents** on the right. Agents replaces the Token mix panel, which is gone along with its strings.
  - **Agents** are Claude Code's subagents (Workflow Subagent, Explore, Plan…), all time: name, with its tool under it; messages; tokens (the main column, most first). There's no cost column (Antonio's call). The numbers match tokscale's own Agents tab.
  - **Source:** the public tokscale profile has no agents. `ai:refresh` copies them from tokscale's local app cache on the Mac (`~/.config/tokscale/cache/tui-data-cache.json`, which `npx tokscale@latest` updates when opened). Only name, tool, tokens and messages are kept. Without the cache (CI), the snapshot keeps its last agents, and the panel footer gives their date.
  - **Privacy:** agent names are published as tokscale reports them. The built-in names are harmless, but a custom subagent's name (say, after an internal project) would show too; filter it in the script if that ever matters.
- **Bookmarks: source line on top, warmer lead** (Antonio's request). "Updated {date} · View on Raindrop →" moved from the list's footer to its first line, above the search. The lead now reads "A public shelf of the links I’ve saved: articles, videos, tools, websites and GitHub projects worth a second look." (pt/es drafts). The kinds of links named match today's Raindrop collections, so update the sentence if those change.
- **Medium stories on the Blog page** (Antonio's request).
  - **Source:** `npm run blog:refresh` (`scripts/fetch-medium.mjs`) reads Medium's public RSS feed for @anettodev, with no token, into the snapshot `src/data/medium.json`. The build never calls Medium.
  - **Kept per story:** title, link (tracking query removed), date, up to three tags, the first paragraph as an excerpt (≤200 characters), and the first image as cover. Medium's 1×1 stats pixel is skipped.
  - **Covers** are downloaded into `src/assets/medium/` and optimised by Astro, so visitors load nothing from Medium. Covers of stories no longer listed are pruned.
  - **The feed lists only the latest ten,** so each refresh merges into the snapshot by link: older stories stay once captured.
  - **On the page:** stories show newest first as post cards ("Medium", the date in the reader's language, "Read more"). Once there's at least one, they replace the frontmatter's Medium placeholders; the Gist placeholders stay. A story without an image gets a quiet cover with the Medium mark, not a `[PLACEHOLDER]`.
  - **Today the feed is empty** (no published stories on @anettodev), so the page still shows the placeholders.
  - **Tested** on another author's public feed: 10 stories, their covers, dates and tags all rendered. That sample was deleted afterwards.
  - At cutover, the Phase 7 workflow should run `blog:refresh` daily with the other refreshes; it needs no secret.
- **Evernote notes on the Blog page, refreshed through Claude Code** (Antonio's pick, "option 1", 2026-10-04).
  - **Why not a script on its own:** Evernote's classic API is deprecated and issues no keys (2026). Its MCP server (`https://mcp.evernote.com/mcp`, beta) speaks OAuth with dynamic client registration and refresh tokens, but its authorize step answers 400 ("Something went wrong") to every self-registered client, whatever the redirect URI (127.0.0.1, localhost, https), scope or `resource`. Known apps get in: the claude.ai connector worked.
  - `scripts/evernote-notes.mjs` and `npm run notes:login` (read-only OAuth via `@modelcontextprotocol/sdk`) stay in case Evernote opens access; today they stop at that 400.
  - **How notes are refreshed:**
    1. In a Claude Code session with the claude.ai Evernote connector, ask Claude to refresh the notes.
    2. Claude reads, read-only, the notes tagged **`anetto.dev`** (Antonio's tag) and saves them to an export file outside the repo.
    3. `npm run notes:write -- <export.json>` (`scripts/write-notes.mjs`) turns that into `src/data/evernote.json`.
    4. The build reads only the snapshot.
  - **Safety in the writer:**
    - Only notes carrying the tag are kept, whatever the export holds.
    - Content becomes HTML through an allowlist (`sanitize-html`): headings from `<h2>`, paragraphs, lists, links (`rel="noopener"`, http/https/mailto only), emphasis, code, quotes, tables.
    - Scripts, styles, iframes, forms and Evernote markup are dropped, and links whose address was removed become text. Images are kept only as described below.
    - Markdown goes through `marked` first. Tested on a hostile sample: nothing unsafe survived, and an untagged note was left out.
  - **On the site:** each note is a card on the Blog page (Antonio's choice), labelled "Evernote" and dated by its last update. Its cover is the note's first image, or the Evernote mark when it has none. Real posts (Medium and notes) come first, newest first; the placeholders follow. A card opens the note's own page, `/blog/<slug>/` (`pages/[...lang]/blog/[slug].astro`): "Note" label, title, "Updated {date}", tags, the cleaned text, and "← All writing".
  - **Images inside notes** (Antonio's request):
    - The export carries each attachment (`images: [{hash, data | file | url, alt}]`). An `<en-media>` or `<img>` in the note marks where it goes; an `https:` or `data:` image in the text works too.
    - The writer converts each image once to WebP (at most 1600px wide, quality 80, flattened onto white, rotated per EXIF) and stores it in `src/assets/notes/<slug>/`. Astro optimises it further, so visitors load nothing from Evernote.
    - The first image is the card's cover. Each image keeps the note's `alt` text (empty when the note gives none).
    - On the note's page an image is never stretched: it shows at its own width, up to the column's.
    - Images of notes no longer listed are pruned. A `javascript:` source, an empty file or one over 20 MB is dropped.
  - **A note's language** (Antonio's request):
    - Tag the note `lang-en`, `lang-pt` or `lang-es` in Evernote. Without that tag, the export's own `lang` is used, then English. `lang-*` tags aren't shown as tags.
    - The note's page marks its content with that language (`<main lang="pt-BR">`, for example) when it differs from the page's locale. The note itself isn't translated: it shows as written in every locale.
    - On the Blog page, a note in another language than the page's gets a small chip next to "Evernote" (PT, ES or EN, with the language's name for screen readers), and its title and summary carry the `lang` attribute.
  - **Tested** with sample notes (pt and es, an attachment, an external image, a hostile `javascript:` image and an untagged note); the sample was removed afterwards.
  - **Today:** no notes are tagged yet, so the snapshot is empty and the Blog page is unchanged.
- **Public GitHub gists on the Blog page** (Antonio's request).
  - **Source:** `npm run gists:refresh` (`scripts/fetch-gists.mjs`, also run by `npm run blog:refresh`) lists @anettodev's public gists through GitHub's REST API into the snapshot `src/data/gists.json`. No token is needed (60 requests an hour; one refresh makes one per 100 gists); `GITHUB_TOKEN` is sent when set (CI). The GitHub CLI's token is deliberately not used. The build never calls GitHub.
  - **Privacy:** only gists GitHub marks as public are kept, whatever the API returns. Kept per gist: link, description, file names, languages and dates. Nothing from the files' contents or the account.
  - **The snapshot is replaced on each refresh,** not merged: a gist deleted or made secret leaves the site with the next refresh.
  - **On the page:** each gist is a card labelled "Gist", with the GitHub mark as its quiet cover. The card shows:
    - **Title:** the gist's description, or its first file's name when it has none.
    - **Summary:** its other file names. GitHub's default names (`gistfile1.txt`) are left out.
    - **Tags:** its languages, up to three. GitHub's "Text" isn't a tag.
    - **Date:** when it was created.
  - Cards link to the gist on GitHub, mixed newest first with Medium stories and Evernote notes. Once there's at least one gist, the frontmatter's Gist placeholders go, like Medium's.
  - **Today:** 15 public gists (2016–2025), all shown. Nothing hides one yet; to keep one off the site, make it secret on GitHub, or ask for an exclude list.
  - At cutover, the Phase 7 workflow's daily `blog:refresh` covers gists too; it needs no secret.
- **Blog page: search, source chips, sort and pages, like Projects** (Antonio's request, once gists brought it to 17 cards).
  - The Blog page's cards (Medium, Evernote, Gist and the placeholders) run through the shared `<filter-list>`.
  - **Toolbar:** search over titles, summaries and tags (accents ignored), then a Date ↓ / Title A–Z sort. Below them, source chips with each platform's mark and count ("All 17 · Medium 2 · Gist 15"; only sources in use, hidden when there's just one). Then "Showing 1–6 of 17" and "Show 6/12/18 per page" (Antonio's choice over Projects' 9/18/36; two rows of three to start). The pager sits under the cards.
  - **It starts newest first, 6 per page.** Sort and page size are remembered per browser (`anetto.blog-*` in local storage). Without JavaScript the tools hide and every card shows.
  - **Placeholders stay last** whichever way the list sorts: the engine now keeps items without a sort value (no date or title) at the end in both directions. Bookmarks and Projects always have the value, so they're unaffected.
  - A source chip counts its placeholders too (Medium 2 today), since they're cards on the page.
  - Long file names used as gist titles now wrap mid-word instead of being cut off.
  - New strings: `blogPage` (search label and placeholder, no-match message, per-page name, chips' group name) in en/pt/es; the pt/es drafts await review.
- **Blog page: no "All writing on Medium / All gists" links** (Antonio's request). The links under the list are gone, along with the `more` field in the `blog` schema and its entries in the en/pt/es copy. The list now ends with its pager. Each Medium and Gist card still links to the post itself.
- **Blog page: Medium placeholders removed** (Antonio's request). The two "[PLACEHOLDER: Medium post title]" posts are gone from the en/pt/es copy. Medium stays wired up: once `blog:refresh` finds a story, it shows as a card; until then Medium has no cards. The two Gist placeholders stay in the copy, shown only if the gist snapshot is ever empty. With gists alone on the page today, the source chips hide (they need two sources) and return when a Medium story or Evernote note arrives.
- **Test samples on the Blog page (temporary; Antonio's request, to be removed).** Three Medium stories and three Evernote notes, all titled "Sample:", "Amostra:" or "Muestra:", on Swift Concurrency, Swift packages, Instruments, code review (pt), Swift Testing (en) and SwiftUI accessibility (es).
  - They were created locally, not in Antonio's accounts: the Evernote connector isn't available in this session, and publishing on Medium would notify his followers. They went through the real pipelines: a saved Medium RSS feed (`MEDIUM_FEED_FILE`) into `blog:refresh`'s script, and an Evernote export into `notes:write`. Covers and note images are generated art.
  - Their Medium links (`medium.com/@anettodev/sample-…`) don't exist; "Read more" on those cards leads to Medium's 404.
  - **Remove before cutover** (they were committed on the branch at Antonio's request; tracked in `PLAN.md`):
    1. Drop the posts whose link contains `/sample-` from `src/data/medium.json`, and delete `src/assets/medium/sample-*.png`. A Medium refresh merges, so it won't remove them.
    2. Run `npm run notes:write` with `{"notes":[]}`, which empties the notes snapshot and prunes `src/assets/notes/`.
- **Evernote lines become paragraphs** (found with the samples). Evernote writes each line as a `<div>` (a blank line is `<div><br></div>`), which the cleaner used to drop, so a real note's lines would have run together on its page, and its card summary ran into the first heading. Now a div holding text becomes a `<p>`, one wrapping other blocks is unwrapped, and empty ones go. Tested with lines, blank lines, nested divs, a list and a link.
- **Note images fill the text column** (found with the samples). The width came from the `sizes` hint (760px), so a 1400px image showed at 760px in the 900px column. Now CSS sets it: `min(100%, the image's own width)`. Large images fill the column, and a 24px icon stays 24px.
- **Post cards: source in a pill with its mark; Evernote's green cover** (Antonio's request).
  - The source line ("EVERNOTE", "MEDIUM", "GIST") is now a pill with the platform's mark (Evernote, Medium, GitHub) before the name, in the card label's type. The language chip (PT, ES) beside it is a matching pill.
  - A note without an image gets Evernote's brand green (`#00a82d`) as its cover, with the mark in white. Medium and Gist covers without an image keep the quiet grey; `SOURCE_TINT` in `PostCards.astro` takes a colour per source if those should follow.
- **One colour per source: Medium blue, Evernote green, Gist purple** (Antonio's request). `src/lib/sources.ts` holds each source's mark and colour; the chips and cards read it from there.
  - **Source chips:** a soft tint of the colour with a coloured border, then solid with white text when pressed. "All" keeps its neutral style.
  - **Covers without an image:** the source's colour behind its white mark. That's every gist today, a note without images, and any Medium story without one.
  - **The colours:** `#2563eb` (blue), `#15803d` (green) and `#8250df` (purple), each at least 4.5:1 with white text. Evernote's own brand green (`#00a82d`), used on its cover until now, gives only 3.2:1, so it gave way to the deeper green. Both themes checked.
  - **Card source pills** follow too (Antonio's request): the same tint and coloured border as an unpressed chip. The language pill beside it stays neutral.
- **Card language shows as a flag** (Antonio's request). A post in another language than the page's shows a flag on its own (no pill, Antonio's follow-up) next to its source pill, not the "PT"/"ES"/"EN" code: Brazil for pt-BR, the US for en, Spain for es. It's the same `Flag` the language switcher uses. The language's name, in the page's language, stays for screen readers and as the hover title (spec §9 asks for a flag beside the name; here the name is in the accessible text and tooltip).
- **Post cards: hover halo; cover and title link to the post** (Antonio's request).
  - **Halo:** hovering a card (or focusing a link in it) shows the turning intelligence halo, as on the project cards: the same `::before` ring at z-index -1 in the isolated grid. The card lost its `overflow: hidden` so nothing clips the ring. With reduced motion the halo shows but doesn't turn.
  - **Links:** a real post's cover and title now link to it, like "Read more". The title is the main link (underlined on hover). The cover link is a duplicate of it, so it's out of the tab order and hidden from screen readers: keyboard and screen-reader users meet the title and "Read more". Placeholders still have no links.
- **Blog headline and lead** (Antonio's request for a stronger headline and a short description). "Selected writing." became **"Notes from the craft."** (echoing About's "…who still practices the craft"), with the lead "Articles on Medium, notes from Evernote and code snippets on GitHub, all in one place." pt: "Notas do ofício." / es: "Notas del oficio." (drafts to review).
  - The `blog` schema now takes `lead`, as `projects` does.
  - The meta description names all three sources: "Articles, notes and code snippets by Antonio Netto, from Medium, Evernote and GitHub Gists."
  - The copy only describes what the page holds; it makes no claim about topics or frequency.
- **Home: Tech Stack links to About** (Antonio's request). The section head now ends with "More about me →" (pt "Mais sobre mim", es "Más sobre mí") on the right, like Last Experiences' "All experiences →". It goes to About, which also shows the list. The label lives in `home.md` as `previews.tech.linkLabel`; the heading stays the shared `tech.title`.
- **Home headline is a greeting** (Antonio's request: "a greeting… make it professional"). The three lines are now "Hello, I’m Antonio Netto." (full colour), "Executive Tech Manager at Inter." and "iOS specialist and indie developer."
  - pt: "Olá, sou Antonio Netto." / "Executive Tech Manager no Inter." / "Especialista iOS e desenvolvedor indie." es: "Hola, soy Antonio Netto." / "Executive Tech Manager en Inter." / "Especialista en iOS y desarrollador indie." (drafts to review).
  - This overrides spec §2's sentence. "Led the CORE mobile iOS team" left the headline; lane 02 ("CORE iOS") still says it. The meta description is unchanged.
  - The `<h1>` is still the only one on Home. Now that it says the name, it drops the visually hidden "Antonio Netto." prefix; copy without the name gets it back automatically.
- **Home headline: only the greeting, larger** (Antonio's follow-up). The two role lines are gone; the `<h1>` is just "Hello, I’m Antonio Netto." (pt "Olá, sou Antonio Netto.", es "Hola, soy Antonio Netto."). It's now set like the other pages' headlines (`--text-h1` − 2px, up to 78px) instead of the 34px lead size, and wraps in balanced lines on narrow screens. It fits on one line in the desktop column. The roles still show on the identity card and the three lanes below.
- **Home: "Hello, I’m Antonio 👋" and three new lanes** (Antonio's request).
  - **Greeting:** first name only, plus the waving hand (pt "Olá, sou Antonio 👋", es "Hola, soy Antonio 👋"). The `<h1>` keeps a visually hidden "Antonio Netto." first, so screen readers and search engines still get the full name. The emoji is the owner's choice; spec §9's no-emoji rule is about language flags.
  - **The lanes** replace Now / Depth / Craft, so the Inter `[PLACEHOLDER]` and the "six iOS engineers" line are gone from Home. All copy comes from the site's own text (About, the Inter entry, the Nutria project):
    1. **01 · Who: "About me"** (person icon) → About. "Over a decade in mobile app development, focused on iOS. A computer scientist, software developer and proud father of twins."
    2. **02 · Now: "Inter"** (briefcase) → Experiences. "Executive Tech Manager. I lead the Core Mobile Platform team, a group of 18 people, and guide its engineering standards."
    3. **03 · Latest: "Nutria"** (iPhone) → Projects. "My indie iOS app, in progress, built with Swift and SwiftUI." Nutria's own description is still a `[PLACEHOLDER]`, so this line only states its status and stack.
  - The icons follow the new subjects: `user` (new in `UiIcon`), `briefcase`, `smartphone`; `layers` is no longer used on Home. pt/es drafts to review.
  - Card 3 is written by hand: when a newer project ships, update it in `home.md`.
- **Home: the 👋 waves; lane titles line up** (Antonio's request).
  - **Wave:** the emoji in the greeting (wrapped in `.wave` wherever the copy has 👋) rocks once, 1.8 s, as the page appears. During the intro it waits, paused, and starts on the intro's reveal event (the one the lanes' entrance uses), not on page load under the intro card. It doesn't move with reduced motion. Measured: it started at the reveal, before the intro's cleanup.
  - **Lanes:** title and text now start right under the icon row, and the link keeps to the bottom. Every card's title sits at the same height whatever its text's length (they were bottom-aligned, so a shorter text pushed its title down).
- **Apple Music playlist under the identity card** (Antonio's request; option 1 of three, Apple's embed player).
  - **Where:** `MusicPlayer.astro`, inside the identity card's sticky aside, so it floats with the card in the left column on every page, and sits under the card on narrow screens. Desktop windows under 700px tall hide it, so the sticky column never runs off the screen.
  - **What:** Apple's embed (`embed.music.apple.com`, the compact 175px player), using Apple's own `allow`/`sandbox` attributes. Subscribers signed in to Apple Music hear full tracks; everyone else Apple's previews (90 s in a test).
  - **Loading** (`scripts/music-player.ts`): the frame gets its address only after the page has loaded and the browser is idle, and on Home only once the intro reveals the page, so Apple's player never delays the first paint. It then fades in.
  - **Theme:** the address carries `theme=dark|light` (Apple's option), swapped when the site's theme changes; that reloads the player, so a theme switch stops playback. Without JavaScript there's a "Listen on Apple Music" link.
  - **Trade-off, as with Raindrop:** this loads Apple's page and scripts (MusicKit, fonts) for every visitor once it starts, with its own look, which Antonio chose over a custom player (option 2, API + previews) for speed.
  - **The playlist:** `APPLE_MUSIC_PLAYLIST` in `src/lib/site.ts` is Antonio's public "BitsNBytes" (`music.apple.com/br/playlist/bitsnbytes/pl.u-e98lGaDHWJmxAd?l=en`), rewritten to the embed host. Empty would show `[PLACEHOLDER: Apple Music playlist link]`.
  - **No scrolling** (`scrolling="no"`): at 175px Apple's playlist view overflows and showed scrollbars plus a white strip. The player shows the playlist and its first track; play starts the playlist.
  - **Language:** Apple's player shows the storefront's language (Brazil: "Iniciar sessão") even with `l=en`. Don't change `l`: an unsupported value (`en-GB` tried) leaves the player on a grey, empty screen. That's also what Apple's "Today's Hits", used for a first test, showed.
  - **Tested** with BitsNBytes in both themes: it loads after the page and switches with the theme.
- **"My Playlist" title over the player** (Antonio's request): a small label (pt "Minha playlist", es "Mi playlist") above the Apple Music player, in the site's label style, also shown above the placeholder.
- **The player is Apple's full 450px size** (Antonio's pick of three fixes). Apple's embed opens its own overlays (the ••• menu, sign-in, the sheet after a preview ends), laid out for its standard playlist height. At the compact 175px with scrolling off they were cut off over a blurred player, and the page can't restyle inside the frame.
  - At 450px the overlays fit and about five tracks show, with Apple's play and "open in app" buttons.
  - **The left column (card + player, ~1,030px) is now taller than most windows.** A small script in `IdentityCard.astro` turns its sticky top negative when it doesn't fit: it scrolls with the page until its bottom is 24px above the window's, then stays put, so the player stays in view while reading. A column that fits keeps the usual top. The earlier "hide under 700px tall" rule is gone; short windows work the same way.
- **The playlist block waits for the intro** (Antonio's report: "My Playlist" showed during the intro). The whole block (title and player, or the placeholder) is now hidden until the player has its address, then fades in. On Home that's right after the intro reveals the page (measured: hidden until the reveal at 8.0 s, faded in by 8.6 s). Before, only the frame waited, so the title sat alone under the flying intro card.
- **Playback checked** (Antonio heard no sound). In the test browser, signed out of Apple Music, pressing "Reproduzir" played the first track's preview: the timer ran from 0:04 to 0:19 of 1:30. Pausing brought up Apple's sign-in/trial sheet ("Reproduza e baixe milhões de músicas"). The frame's `allow="autoplay *; encrypted-media *"` and Apple's sandbox list are in place. Silence with a running timer is on the listening side (tab or site muted, output device), not the embed.
- **Favicon and touch icons are the site's app-icon logo** (Antonio's request). They replace the old Hugo "ANETTO" circle. `npm run icons` (`scripts/make-icons.mjs`) makes them all from `src/assets/brand/logo-dark.png`; re-run it when that master changes.
  - **Favicons** (`favicon.ico` with 16/32/48, `favicon-16x16.png`, `favicon-32x32.png`): a tighter crop (9% off each side, corners re-rounded), because the full icon's mark blurs at tab size.
  - **`apple-touch-icon.png`** (180): the whole icon, square, with the corners filled in its background `#161e24` (iOS rounds it).
  - **Android 192/512:** the whole icon with its rounded corners. They're still unused: there's no web manifest.
  - The dark icon serves both themes: its own tile reads on light and dark browser chrome. `Base.astro` links the .ico (all three sizes) and both PNGs.
- **Inter position dates** (Antonio's dates). The four roles now each carry their length pill:
  - **iOS Dev Specialist II (Staff Engineer):** Oct 2019 – Apr 2021 ("1 year"; the timeline rounds down to whole years).
  - **iOS Dev Specialist Master (Senior Staff Engineer):** Apr 2021 – May 2024 ("3 years"); it ended when he became iOS Engineering Manager.
  - **iOS Engineering Manager:** from May 2024. **Executive Tech Manager:** from Oct 2026.
  - Set in en/pt/es. This settles the bio's "Staff in 2022": it was October 2019.
- **Length pills count months too** (Antonio's request). The timeline's pills (each company, each position, on Experiences and Home) read "1 year, 6 months" instead of rounding down to whole years. pt: "1 ano e 6 meses", es: "1 año y 6 meses".
  - `Intl.DurationFormat` (long style) in `ExperienceTimeline`'s `lengthOf`. Zero parts drop out: "7 years", "5 months".
  - Counted to the build date for current roles, as before.
- **TL;DR button on Experiences, after Resume** (Antonio's request, modelled on akitaonrails.com's).
  - **What it does:** opens an AI assistant in a new tab with a ready prompt (in the page's language): read the page's public address (`localizedUrl`, e.g. `https://anetto.dev/pt/experiences/`), summarize the career in five points plus a one-line conclusion, say what the summary leaves out, remind the visitor they can keep asking, and suggest a first follow-up question.
  - Nothing runs on the site, there's no API key or cost, and nothing is sent until the visitor clicks.
  - **Assistants:** the button opens Claude (`claude.ai/new?q=`). The arrow beside it opens a menu with Claude, ChatGPT (`chatgpt.com/?q=`) and Grok (`grok.com/?q=`). Akita's site hides that choice behind a right-click; here it's a visible split button, so touch screens get it too.
  - **Build:** `TldrButton.astro` + `scripts/tldr-menu.ts`. The menu is a native `<details>` (works without JS); the script adds Escape, outside clicks and closing after a choice. The isolated `.button-row` is lifted (`z-index`) while the menu is open, or the figures below would cover it. The sparkles icon is Lucide's. Each link says, for screen readers and as a tooltip, that it opens in a new tab.
  - **Until cutover the prompt's address doesn't exist yet:** `anetto.dev/experiences/` is a 404 on the live Hugo site (checked), so assistants can't read the page before the Astro site is deployed.
  - pt/es prompts are drafts to review.
- **TL;DR menu shows each assistant's mark** (Antonio's request): Claude, ChatGPT (OpenAI's mark) and Grok.
  - **OpenAI's mark** left Simple Icons after v13, so like LinkedIn its path is `simple-icons@13.21.0`'s (CC0; OpenAI's brand page is its listed guideline).
  - **Grok's mark** was never in Simple Icons. It comes from `@lobehub/icons-static-svg@1.95.1` (MIT) and needs the even-odd fill rule, which `Icon.astro` now applies per mark (`EVENODD`).
  - They're used only to name the assistant a link opens. Brand guidelines, OpenAI's especially, restrict use of their logos, so don't spread them elsewhere.
- **TL;DR menu: Cursor too** (Antonio's request). The menu now lists Claude, ChatGPT, Grok and Cursor. Cursor's documented web deeplink, `https://cursor.com/link/prompt?text=…` (the prompt goes in `text`, not `q`), opens a new chat in the Cursor app with the prompt filled in, so it needs Cursor installed. Its mark is the existing `cursor` icon.
- **TL;DR on About, AI and each note's page too** (Antonio's request). The button sits in each page's header (a `.button-row` in `PageHeader`'s slot), as on Experiences.
  - **The prompt is now a shared frame plus a per-page part** (i18n `tldr.prompt` + `tldr.pages`): what the page is ("Antonio Netto's About page", "…page about how he uses AI coding tools, with his real usage data", "a note by Antonio Netto, “{title}”") and what to summarize (who he is; tools, models, agents and usage; the note's 5 points and conclusion). Steps 2–4 (what you're missing, keep asking, a starter question) are shared.
  - `TldrButton` now takes `kind`, the page's absolute `url` and, for notes, `title`. A note's address is built from `Astro.site` + the blog path + its slug.
  - **Medium stories don't get one:** they open on medium.com, so the site has no page of its own for them. Only Evernote notes do (`/blog/<slug>/`).
  - As on Experiences, the addresses only exist once the Astro site is live at anetto.dev.
- **The playlist starts collapsed: a frosted-glass bar** (Antonio's request: "very discrete", tap to expand).
  - **Collapsed:** a 56px bar in the island's glass recipe (`--glass-bg`/`--glass-border`/`--glass-shadow`, `blur(18px) saturate(160%)`, solid under reduced transparency). It shows the playlist's cover, its title ("BitsNBytes") and a round down arrow. (A red Apple Music mark sat before the cover until Antonio had it removed; the " Music Playlist" label says where the music comes from.) The "My Playlist" label above it is gone; screen readers still hear "My Playlist: BitsNBytes, Apple Music".
  - **Tap or Enter** opens it (a native `<details>`): the panel slides down to Apple's 450px player where the browser can animate to an auto height (`interpolate-size`, `::details-content`), and the arrow turns up. Tapping again closes it. It always starts closed.
  - **Apple's player now loads only on the first open,** not after every page load. Visitors who never open it load nothing from Apple (no MusicKit, fonts or cover). The frame fades in once loaded, and still follows theme changes after that.
  - **Title and cover** come from a snapshot: `npm run music:refresh` (`scripts/fetch-playlist.mjs`) reads the playlist's public page. Its og:title gives the name; the cover is Apple's playlist artwork, from the og:image's address at 240×240. They're saved as `src/data/playlist.json` and `src/assets/music/playlist.jpg`, optimised by Astro. A snapshot of a different playlist than `APPLE_MUSIC_PLAYLIST` is ignored, and the bar falls back to "My Playlist" with no cover.
  - **Unchanged:** on Home it stays hidden until the intro reveals the page. The sticky column's fit script adapts as it opens and closes.
- **" Music Playlist" label on the playlist container** (Antonio's request). It sits at the top of the glass container, above the bar: the Apple mark plus "Music Playlist", 11px in the page's text colour, discreet. Screen readers hear "Apple Music Playlist". The Apple logo is used here at Antonio's request, as on Experiences. The `<details>` is now inside a `.music-glass` wrapper, so only the bar toggles the player.
- **Podcasts container under the playlist, Spotify, mock for now** (Antonio's request: same idea as the playlist, collapsed, below it; only one open at a time).
  - **Look:** `PodcastsPlayer.astro` is the playlist's twin: a frosted-glass container with a small "Spotify Podcasts" label (Spotify mark, simple-icons@16.34.0), then a bar with three overlapping show covers, "My Podcasts" with the show count, and the down arrow. pt "Meus podcasts", es "Mis podcasts".
  - **Behaviour:** open, it lists the shows (cover, name, publisher). Picking one swaps the list for Spotify's embed of that show (`open.spotify.com/embed/show/<id>`, 352px, `theme=0` in the dark theme), with "All podcasts" to go back. Focus moves to the back button, then back to the show.
  - **One open at a time:** both containers' `<details>` share `name="side-media"`, the browser's exclusive accordion. `scripts/side-media.ts` closes the other where the attribute isn't supported.
  - **Closing a container now stops its player** (the frame drops its page), for the playlist too. The page can't pause Apple's or Spotify's embeds, and switching containers would otherwise leave one playing out of sight. Reopening reloads it.
  - **Shared styles:** `styles/media-bar.css` (`media-` classes) now holds the glass, label, bar, arrow and pull-down for both containers.
  - **Data is mock:** five "Sample:" shows with generated covers, `"mock": true` in `src/data/podcasts.json`. The player is a `[PLACEHOLDER]`, and the container is left out of production builds while mock, so made-up shows can't go live. The steps to connect Spotify (Premium, a Development Mode app, a read-only sign-in, `podcasts:refresh`) are in `PLAN.md`.
- **Podcasts above the playlist** (Antonio's swap). Under the identity card the order is now: podcasts, then the Apple Music playlist. While the podcasts data is mock, production builds show only the playlist.
- **The podcasts come from Antonio's Spotify library** (Antonio's choice, 2026-10-05, over a hand-kept list of show links read from Spotify's public pages, which would have needed no app, Premium or secrets). `scripts/fetch-spotify-shows.mjs`: `npm run podcasts:login` once, then `npm run podcasts:refresh`.
  - **Read-only sign-in:** the Authorization Code flow with the client secret, scope `user-library-read` only, with `state` checked. A token granted any wider scope is refused. PKCE was rejected because its refresh tokens can rotate, which would break unattended daily runs.
  - **Secrets stay out of the repo and the screen:** `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET` come from the environment. The refresh token lives in `~/.config/anetto-dev/spotify.json` (0600), or `SPOTIFY_REFRESH_TOKEN` in CI. Nothing secret is printed. If Spotify rotates the token anyway, a local run saves the new one, and a CI run warns.
  - **The publisher comes from each show's public page.** Spotify's February 2026 Development Mode changes removed `publisher` from show objects, and the March 2026 reverts didn't restore it. The script takes the API's value when there is one, else the second part of the page's `og:description` ("Podcast · <publisher> · <description>"), the same public-page approach as `music:refresh`. A show without a publisher gets no line under its name.
  - **Kept per show:** `id`, `name`, `publisher`, `link`, and the smallest cover ≥ 160px, downloaded to `src/assets/podcasts/<id>.<ext>` on each run so changed artwork follows. If a download fails, the cover already on disk is kept. Every cover not in the snapshot is pruned, the mock `sample-*` ones included. IDs must be base62, since they name files and the embed address.
  - **`PODCASTS_SHOWN` decides which shows appear, and in what order** (Antonio's choice, 2026-10-06; it replaced a `PODCASTS_HIDDEN` list). Following a podcast on Spotify never puts it on the site by itself. Each entry in `src/lib/site.ts` is a show ID, a show link (`?si=` and all) or a `spotify:show:` URI. Anything else, or an ID Spotify doesn't know, stops the refresh with an error. A listed show comes from the library when followed, else from `GET /v1/shows/{id}`, so unfollowing a show doesn't remove it; deleting its line does. Each refresh prints the followed shows that aren't listed as ready-to-paste lines. An empty list shows no podcasts.
  - **Mock stays until the first real run:** the refresh writes the snapshot without `mock`, and that's what lets the container into production builds. Keep that guard.
- **"Podcasts List" and a scrolling list** (Antonio's request, 2026-10-06).
  - The bar title "My Podcasts" became "Podcasts List" (pt and es "Lista de podcasts", drafts). The small "Podcasts" label above it stays.
  - The open list no longer grows with every show. It shows four rows and half of a fifth (`max-height` from a `--pod-row` of 3.45rem, the 55px row at the default text size), then scrolls inside the container (`overscroll-behavior: contain`, thin scrollbar). The half row shows there's more where scrollbars stay hidden (macOS). Tabbing through the rows scrolls the focused one into view, and coming back from a player returns to its row.
- **"All episodes on Spotify" under a show's player** (Antonio's choice, 2026-10-06, over a list of recent episodes saved by `podcasts:refresh`).
  - **Why it's needed:** Spotify's show player shows only the newest episode, whatever its size. Tested at 300 × 352, 500 and 650, and at 450 and 700 wide: taller only adds blank space below.
  - **The link** (`.pod-more`, pt "Todos os episódios no Spotify", es "Todos los episodios en Spotify") sits centred under the player and opens the picked show's page on Spotify, in the same tab with the external-link arrow, like the site's other outbound links. Picking a show sets its `href` from the row's `data-link`.
  - Not shown while the data is mock.
- **A YouTube playlist container, listed like the podcasts** (Antonio's request and choice, 2026-10-06, over YouTube's own playlist player, which needed no key).
  - **Look:** `VideosPlayer.astro`, after the Apple Music container (the column now reads podcasts, playlist, videos). Its label is the YouTube mark plus "Videos" (pt and es "Vídeos"; screen readers hear "YouTube Videos"). The bar shows the playlist's own title and the video count. Rows have a 64×36 thumbnail, the title and the channel.
  - **Player:** picking a video loads `youtube-nocookie.com/embed/<id>?list=<playlist>&rel=0` (privacy-enhanced, 16:9, with `referrerpolicy="strict-origin-when-cross-origin"`, which YouTube needs to identify the embedding site). It has no theme parameter, so a theme change doesn't reload it, which would restart the video. "Playlist on YouTube" under it opens the playlist.
  - **Data:** `npm run youtube:refresh` (`scripts/fetch-youtube-playlist.mjs`) reads `YOUTUBE_PLAYLIST` (`src/lib/site.ts`; a link or ID; Public or Unlisted) through the YouTube Data API v3 with `YOUTUBE_API_KEY`. YouTube's tokenless playlist feeds answered 404 for every playlist and channel tested, so they're not an option. The key goes in the `X-goog-api-key` header, so it never sits in an address or a log. The script keeps up to 50 videos in playlist order, drops private and deleted ones, and downloads thumbnails to `src/assets/youtube/`. Before the first run, the snapshot is empty and the container is hidden.
  - **Some videos refuse to play on other sites** (seen with a label-owned music video, even on youtube.com/embed). YouTube's player then shows "This video is unavailable" with its own "Watch on YouTube" button.
  - **One list component:** `MediaList.astro` with `<media-list>` (`scripts/media-list.ts`) now runs both the podcasts and the videos; it replaced `podcasts-player.ts`. A wrapper passes the items, the player address (`{id}` replaced), an optional dark-theme parameter (`theme=0` for Spotify), and the link under the player (the picked item's, or a fixed one). Its classes start with `item-`, so they don't meet the island's global names. Player titles use `{name}` (formerly `{show}`).
- **Videos first under the identity card** (Antonio's order, 2026-10-06). The column now reads: YouTube videos, Spotify podcasts, Apple Music playlist.
- **The videos bar reads "anettodev playlist"** (Antonio's request, 2026-10-06). `YOUTUBE_PLAYLIST_TITLE` in `src/lib/site.ts` overrides the playlist's own title (still "anettodev" on YouTube and in the snapshot), in every language. Empty shows YouTube's title again.
- **The Investments proof placeholder is gone** (Antonio's request, 2026-10-06). The "one public proof from the Investments years" `[PLACEHOLDER]` under Inter's iOS Dev Specialist Master position was removed in all three languages instead of filled. Don't add it back.
- **Frutalia, pinned and first** (Antonio's request, 2026-10-06). New `projects` entry in all three languages (pt and es are drafts):
  - **Card:** status `done` (shown as "Shipped": it's live on the App Store), `pinned: true`, `order: 1` (Nutria moved to 2), so it leads the Pinned carousel. The description is Antonio's tagline. The stack is five pills: Swift, SwiftUI, Vision, RevenueCat, Cloudflare Workers. The buttons are App Store and website (frutalia.app). The cover is Antonio's festival artwork as `src/assets/projects/frutalia.webp` (1376×768; the 16:10 card trims a little from the sides, clear of the logo).
  - **Not on the site:** the Shipaton Showcase page has no button. The card's links are App Store, demo, source and website only. The longer story (inspiration, how it was built) isn't on the site; cards show only the tagline.
  - **Home's "03 · Latest" lane now shows Frutalia** ("My indie iOS app, live on the App Store: …"), following the rule to update it when a newer project ships.
- **Nutria is Nutrx** (Antonio's answer, 2026-10-06: Nutria was the working name). The `nutria.md` entries became `nutrx.md` in all three languages, so the project's placeholders are gone:
  - **Card:** title "Nutrx", status `done` ("Shipped"), still pinned, `order: 2` after Frutalia (the newer app). The description is from Antonio's launch text (AI nutrition diary, photo or description to calorie and macro estimates, no account, meals in iCloud). The stack is the four pieces he named: Swift, SwiftData, CloudKit, HealthKit. The buttons are App Store (`nutrx-intelligent-nutrition/id6742766749`, resolved from his LinkedIn short link) and nutrx.ai. The old azklepio.com/nutria link now redirects to a "Coming Soon" page and is dropped.
  - **Cover:** Antonio's 2:1 artwork ("cover - light", 1920×960). No 16:10 crop could keep both the headline on the left and the front phone, so it is padded to 1920×1200 instead (`src/assets/projects/nutrx.webp`). Each 120px band is the image's own edge row stretched and blurred sideways, so nothing is cropped and no seam shows. It replaced a first try built from the small 3:1 launch banner.
  - The Projects page's meta description now names Frutalia and Nutrx instead of "Nutria, in progress".
- **GitHub Planner, not pinned** (Antonio's request, 2026-10-06). New `projects` entry in all three languages (pt and es are drafts). It shows only in "All projects":
  - **Card:** status `done` (shipped: a public, installable MCS techpack, MIT), `pinned: false`, `order: 3`. The description is from the repository's own description and README. The stack is Claude Code, MCS, GitHub CLI, Python, Shell. There is one **Source** button to github.com/anettodev/github-planner; the project has no website of its own (mcs-cli.dev is MCS's).
  - **Cover:** Antonio's square logo centred on a 16:10 canvas in the logo's own near-black (`#16181b`, `src/assets/projects/github-planner.webp`, 1280×800), so its transparent rounded corners vanish.
- **Home's "N more experiences" counts the "Before that" rows too** (Antonio's request, 2026-10-06). The link under Home's three latest employers used to count only the rest of the timeline (2: Daccord and the BS). It now adds the Experiences page's "Before that" rows (3: Naips, the PHP roles, the Federal Police internship), so it reads "5 more experiences". It counts rows as listed, so the one row naming four PHP employers counts once. The count comes from the `experiences` page data in each language, so it follows edits there.
- **"On this page" on note pages** (Antonio's request, 2026-10-06, after akitaonrails.com's post pages). `pages/[...lang]/blog/[slug].astro` gives each note heading an id at build time; the HTML cleaner drops attributes, so the snapshot stays as it is. The id is the heading's text, accents dropped, with `-2`, `-3` for repeats; `main`, `top` and `note-toc` are reserved. The note's `<h2>`s and `<h3>`s (indented) make the summary, shown from two headings up.
  - **From an 860px content column** (a container query on `main`; at most 900px, so full width): a sticky column on the right, 13.5rem wide, open (an inline script opens the `<details>` before paint), with the note at about 630px beside it. It scrolls on its own when long, and never sideways (a subpixel overflow drew a scrollbar).
  - **Below that:** a closed box above the note that opens on tap.
  - **The section being read** is marked by `scripts/note-toc.ts` with `aria-current="location"`, never a `.current` class (the island's global `.current` would leak in). A section counts once its heading passes under the island; at the very bottom the last one counts. The entry gets the accent bar.
  - **"Back to top"** links to `#main`. Headings get `scroll-margin-top: var(--nav-clearance)`, so a jump lands just below the island. The labels (`post.toc`, `post.top`) are in the page's language and the entries in the note's.
- **Collapsing the side "On this page" gives its room to the note** (Antonio's request, 2026-10-06: "must be very animated").
  - **Collapsed:** the column shrinks from 13.5rem to a 40px round button (a new `toc` list icon in `UiIcon`), and the gap from 48px to 24px. The note widens into the space, from about 636px to 836px at full width.
  - **Expanded:** the button stretches back into an "On this page" pill with a chevron, and the list sits below it.
  - **Animation:** `grid-template-columns` and `column-gap` transition over 620ms on a slight spring (`cubic-bezier(0.34, 1.32, 0.5, 1)`, about 6px of overshoot). The label and chevron fade and slide, and where `::details-content` is supported the list fades and slides in from the right. The list keeps a 13.5rem width, so the narrowing column clips it instead of rewrapping it. On narrow screens the closed box slides open in height, like the media containers. With reduced motion nothing animates.
  - **No animation on load:** transitions only apply under `.is-ready`, which `scripts/note-toc.ts` adds two frames after the first paint (not at all while the tab is hidden, since hidden tabs pause animation frames).
  - **Remembered per browser:** the side column's open or collapsed state is stored in `localStorage` (`note-toc`), and the inline script reads it before paint, so a reader who collapsed it gets it collapsed on the next note. The narrow box always starts closed and isn't stored.
- **Share on note pages** (Antonio's request, 2026-10-06). `ShareButton.astro` sits after TL;DR in a note's `.button-row`; pt "Compartilhar", es "Compartir".
  - **What it does:** it opens the device's share sheet (Web Share API: iPhone, Android, macOS) with the note's title and public anetto.dev address, the same one TL;DR uses. Without that API (Firefox on desktop, for one), it copies the address. The icon then becomes a green check and the label "Link copied" for two seconds, also announced through a `role="status"` span. Cancelling the sheet is not an error.
  - **Hidden without JavaScript:** it stays `hidden` until `scripts/share-button.ts` runs, so it is never a dead button.
  - **Styling:** it is a real `<button>`, so it resets the browser's grey fill that the global `.button` (written for links) doesn't. It keeps the halo on hover. The icon is a new `share` mark in `UiIcon` (a box with an arrow, like iOS).
  - Only on note pages for now. Experiences, About and AI have TL;DR but no Share.
- **"Next note" in a note's foot** (Antonio's request, 2026-10-06). The foot is now a `<nav>` ("More notes"), with "All writing" on the left and the next note on the right: a small uppercase "Next note" over its title and an arrow. pt "Próxima nota", es "Siguiente nota".
  - **Order:** "next" follows the Blog's default order (newest update first), so reading on goes back in time. The oldest note shows no link.
  - **Language:** the link stays in the page's language. The title carries the next note's own `lang` when it differs.
  - On narrow screens the two links wrap, with the next note kept on the right.
- **Listen on note pages: the visitor's device reads the note** (Antonio's choice, 2026-10-06, to try first; a cloned voice is a to-do in `PLAN.md` §4). `ListenButton.astro` sits after Share. It uses the browser's speech synthesis (Web Speech API): free, no service, key or audio files, with the voice depending on the device.
  - **Player:** "Listen" (pt "Ouvir", es "Escuchar") plays. While reading, it says "Pause" / "Resume", and a stop button (■) and a speed button (1× → 1.25× → 1.5×) join it as one group. A thin accent line along the main button shows progress (decorative, `aria-hidden`).
  - **What's read:** the title, then each outermost heading, paragraph, list item and quote of `.note`, in order. Code blocks and images are skipped.
  - **Voice:** the note's language tag (e.g. `pt-BR`), preferring an "enhanced", "premium", "natural", "neural" or Google voice, then the default, then any voice in that language family.
  - **Reliability:** text goes out in sentence chunks of about 220 characters, because Chrome cuts long utterances off. Pause cancels and resume re-reads the current chunk, because `speechSynthesis.pause()` misbehaves on Android. A run counter ignores callbacks from cancelled utterances. A speed change restarts the current chunk. Leaving the page (`pagehide`) stops it.
  - **Highlight:** the passage being read gets `.is-reading` (an accent tint padded with a box-shadow, no layout shift). The page scrolls to it, centred, only when it's off screen, smoothly unless reduced motion is set.
  - **Hidden** where `speechSynthesis` is missing. The buttons reset the browser's grey fill, like Share, and have no `overflow` clip, which would cut their halo.
  - **Tested** with a silent stand-in for the speech engine: play, pause/resume, speed, stop, the end of the note and the off-screen scroll. Hearing the real voices needs a person at the device.
- **Notes in Antonio's cloned voice (ElevenLabs)** (Antonio's choice, 2026-10-06, after trying the device voice first). The device voice stays as the fallback.
  - **`npm run notes:audio`** (`scripts/notes-audio.mjs`) runs locally after `notes:write`. For each note it takes the same passages the player highlights (the title, then the outermost h2/h3/h4/p/li/blockquote, never code; a small walk over the cleaned HTML, matching `listen-button.ts`). It sends them in requests of up to 2,000 characters to `POST /v1/text-to-speech/{voice}/with-timestamps`: `eleven_multilingual_v2`, `mp3_44100_64`, the note's `language_code`, and up to 3 `previous_request_ids` from the `request-id` header, for continuity.
  - **Joining the parts:** the MP3 frames are joined, dropping ID3 tags and Xing/Info frames so the total duration reads right, checked against `ffprobe`. Each passage's start comes from the character timings.
  - **Output:** `public/audio/notes/<slug>.mp3` and `src/data/notes-audio.json` (`{ file, duration, chars, marks, hash }`). The hash covers the text, voice, model and language, so unchanged notes aren't sent again (`--force` overrides) and removed notes lose their audio. `--dry-run` prints the characters, which equal the credits.
  - **Secrets:** `ELEVENLABS_API_KEY` stays in the Keychain only, since notes are refreshed locally, and travels in the `xi-api-key` header. The key Antonio made is restricted (no `voices_read` / `user_read`), so the Voice ID came from him: `NOTES_VOICE_ID` in `src/lib/site.ts`, which isn't a secret.
  - **In the player:** when the note has a recording, `ListenButton` adds an `<audio preload="none">` with the marks. Play/pause, stop and speed (`playbackRate`) drive it, a time readout ("0:08 / 0:23") appears, and the highlight follows the marks. The tooltip says "in Antonio's voice, generated by AI" (pt "na voz do Antonio, gerada por IA"). If the file can't play, the device voice takes over from the start. There is no captions `<track>`: the recording reads the page's own text, which is its transcript (the lint rule is disabled there with that reason).
  - **Tested** against a mock that returns real MP3 speech (`say` + `lame`): joining, durations, stitching, skips, `--force` and pruning. Then for real on the three samples (1,028 credits; 24s, 19s, 28s). Playback in the page was checked with a stand-in for the media element, since the automated tab stayed hidden; Antonio hears the voice itself.
- **Listen comes first in a note's header** (Antonio's request, 2026-10-06): Listen, then TL;DR, then Share.
- **Recordings are opt-in, note by note** (Antonio's choice, 2026-10-06; it replaced a `no-audio` Evernote tag tried the same day). No note gets a recording by default. `npm run notes:audio -- --add <slug>,…` records a note, and from then on its entry in `src/data/notes-audio.json` keeps it recorded: a plain run re-records it when its text changes. `--remove <slug>` takes the recording away. Notes without one show "no recording (--add <slug> to make one)". The `/publish-notes` command asks Antonio about each new note before spending credits.
- **A note recorded in Antonio's voice gets a constant halo on Listen** (Antonio's request, 2026-10-06), so that version stands out. It's the "Book a call" treatment: `::before` at 0.7 opacity turning every 8s, full and every 4s on hover or focus, still with reduced motion. The player's buttons go solid (`--surface`), so the glow behind them never tints their text. It is set by `has-voice` on `<listen-button>` whenever the note has a recording.
- **`/publish-notes`** (`.claude/commands/publish-notes.md`; local, since `.claude/` is in Antonio's global gitignore) runs the whole notes pipeline in a Claude Code session:
  1. A preflight checks git status and that the claude.ai Evernote connector is available.
  2. It reads the `anetto.dev` notes, read-only, into an export in the scratchpad.
  3. It runs `notes:write` and lists the new, changed and removed notes.
  4. It does a `notes:audio --dry-run`, asks per new note whether to record it, and confirms the credits before spending. The key is read from the Keychain, never printed.
  5. It runs lint, the format check and the build.
  6. It commits only the notes files, and pushes after a confirmation. After Phase 7, a push to `main` deploys.
- **Coloured hashtags on note pages** (Antonio's request, 2026-10-06). Each tag under a note's header is a tinted pill with a coloured `#`, e.g. "#code review" and "#iOS".
  - **Hue:** one of six (pink 350, violet 300, blue 255, cyan 200, green 150, amber 60), from a hash of the tag's name, so a tag keeps its colour across notes. When two tags of one note land on the same hue, the later takes the next free one, so a note's tags always differ.
  - **Colour:** OKLCH at a per-theme lightness: `--tag-l` 0.8 on the dark default, 0.48 in light. The text stays `--fg`. The `#` measures 9.9:1 on dark and 6.3:1 on light, and the text about 16:1.
  - **Screen readers:** the `#` is `aria-hidden`, so they read just the tag.
  - **Blog cards use them too** (Antonio's request, the same day), for every source (notes, Medium, gists), a size down (0.8125rem). One shared piece serves both: `lib/tag-hues.ts` (`tagHues(tags)`, per list), `Hashtag.astro` (the `<li>`) and the global `styles/hashtags.css` (`.hashtag`, `.hashtag-hash`, `--tag-l` per theme on `:root`). A list styles them through `:global(.hashtag)`, since scoped rules don't reach another component's elements.
- **About is read in Antonio's voice, in the page's own language** (Antonio's request, 2026-10-06: "the audio must respect the localization"). Listen comes first in About's header, before TL;DR, with the constant halo. `/about` plays the English recording, `/pt/about` the Portuguese and `/es/about` the Spanish, each spoken with that language's code.
  - **What is read:** the title, then the passages of the areas marked `data-listen`: About's text and "Outside work". The facts list and the tech stack are reference material and aren't read.
  - **How it's made:** `npm run pages:audio` builds the site first and reads the built pages, so the recording says exactly what visitors see. The language comes from `<main lang>`, so a page falling back to English is recorded in English. A language is re-recorded only when its text changes (a hash). The pages are `VOICE_PAGES` in `src/lib/site.ts`.
  - **One player:** the player now reads the `data-listen` areas of any page (a note's `<article>` carries the marker too), and the highlight style lives with it. The device-voice tooltip says "this page".
  - **Spacing:** inline tags (links, emphasis, code) no longer add a space when the recorded text is extracted ("Inter</a>," reads "Inter,"), matching what the browser reads. Two sample notes whose text changed only by a space before a full stop kept their recordings: their stored hashes were updated instead of spending credits.
- **A "Recommendations" title over the containers under the identity card** (Antonio's request, 2026-10-06; pt "Recomendações", es "Recomendaciones"). It's a small uppercase muted label, the site's `.label` style (like About's "Outside work"), over Videos, Podcasts and Music Playlist. The three sit in a `<section>` named by that label, a `<p>`, not a heading, so the sidebar doesn't put an `<h2>` before the page's `<h1>`. On Home it stays hidden during the intro, like the containers. The gap between containers is now 12px for both pairs (it was 24px between Videos and Podcasts): the list component's `<script>` sits between the first two containers, so the spacing rule uses `.media ~ .media`.
- **Tech Stack grows from 16 to 32** (Antonio's picks, 2026-10-07). I gathered the terms Antonio's own material names (the resume and About on the Hugo site, the Experiences entries, the projects and the site's data), and Antonio chose: Swinject, Kingfisher and Charts (Inter), SwiftData, CloudKit and HealthKit (Nutrx), Cloudflare (Frutalia), Core Data (the old Nutria card), Python (the Hugo About), the patterns MVVM-C, MVVM, VIPER, MVC, DDD and ViewCode (Inter, Avenue Code, MadeinWeb), and Xcode (named nowhere; added on Antonio's word). RxSwift was already in. Python, Xcode and Cloudflare get their Simple Icons marks (16.34.0, CC0) and brand colours; the rest show an initial. The order runs languages, Apple frameworks, tools and libraries, build and CI, then the patterns. Left out unless Antonio asks: Buck, GitFlow, Push Notifications, App Store Connect, Vision, RevenueCat, C/C++, C#, Java, PHP, JS, MySQL, AI tools, GitHub Actions, Hugo, Go, Astro, Ruby. Not offered: "Laravel or CodeIgniter", whose Hugo resume entry (with an example.com link) reads as filler.
- **No initial in a Tech Stack pill without a logo** (Antonio's call, 2026-10-07). A pill shows its logo tile only when `Icon.astro` has the mark; otherwise just the name, with even padding (12px each side; 4px on the left beside a tile). CocoaPods and Git, which have a brand colour but no carried mark, keep their tinted pill without a tile.
- **Every Tech Stack pill has a colour** (Antonio's request, 2026-10-07). A pill with a brand colour keeps it. One without (almost none of these have an official one, and Simple Icons' "UIkit" is a web framework, not Apple's) is coloured by its `group` in `lib/tech-stack.ts`, in the hashtags' hues at OKLCH 0.7 lightness, 0.15 chroma: Apple frameworks blue (255), libraries violet (300), build and distribution tools cyan (200), architecture patterns amber (60), languages pink (350). It gets the same quiet tint as a brand-coloured pill (12% background, 40% border) and keeps the text colour, so the text's contrast doesn't change. The list is ordered by kind, so the colours fall into bands.
- **Git's logo from Devicon** (Antonio's request, 2026-10-07). Simple Icons carries Git's mark under CC BY, so it comes from Devicon 2.17.0 (MIT, © 2015 konpa; its "plain" version), drawn on Devicon's 128-unit grid through `VIEWBOX` in `Icon.astro`, in Git's brand colour. Devicon's Objective-C mark (a ring with "[OBJ-C]" lettering) was tried and removed at Antonio's request: the lettering was unreadable at 14px. Objective-C stays a text pill in its pink language colour. Nothing else has a usable logo: Apple's guidelines don't allow its framework icons (SwiftUI, CloudKit, HealthKit and so on), no free set includes them, and the libraries' own repo logos (Swinject, Kingfisher, Charts, Carthage, Tuist) have unclear licences. CocoaPods stays without its CC BY-NC mark.
- **Project card buttons show what they open** (Antonio's request, 2026-10-07). "App Store" starts with the Apple mark and "Website" (pt "Site") with the globe icon, before the label, and both keep the ↗ external arrow after it. "Source code" is unchanged: its GitHub mark after the label, with no arrow.
- **CI runs the project's own checks; super-linter is gone** (2026-10-07, ahead of the rest of Phase 7). On draft PR #1, super-linter v4 failed with its bundled configs rather than the project's. Its ESLint couldn't parse any TypeScript file (it looks for a tsconfig of its own, so all 41 TS "errors" were parsing errors). Its stylelint rejects modern CSS the site uses (view transitions, `::details-content`, `interpolate-size`) and the `-webkit-` prefixes Safari still needs, and its other linters apply generic rules. `.github/workflows/ci.yml` replaces it on pull requests into `main` and pushes to it: `npm ci`, `npm run lint`, `npm run format:check`, then `npm run build` (which runs `astro check` first). Read-only permissions, no deploy. It passed on a clean clone of the PR commit. `hugo.yml` stays until the deploy workflow replaces it.
- **A note page's URLs are its own** (fixed 2026-10-07, found in the cutover check). Note pages passed `route="blog"`, so their canonical, `og:url` and hreflang alternates pointed at the Blog index, and the language switcher sent readers there too. That broke the self-canonical rule and told search engines to drop the notes. Layouts and the switcher now take an optional `subpath` (the note's slug), and `localizedPath`/`localizedUrl` append it to the route. The route stays `blog`, so the island still marks Blog as current.
- **Test samples removed** (2026-10-07, before cutover). The three "Sample:" Medium stories and their covers are gone, and so are the three sample Evernote notes ("Sample:", "Amostra:", "Muestra:"; emptied with `notes:write` and an empty export, which pruned their images), with their recordings in Antonio's voice. The Blog lists the 15 public gists until real stories and notes arrive. The build is 22 pages.
- **Redirects from the Hugo URLs** (2026-10-07, Phase 7, approved by Antonio). The live Hugo sitemap lists `/`, `/about/` and seven more pages, which now forward from `redirects` in `astro.config.ts`: `/resume/` and `/timeline/` go to `/experiences/`, `/sideprojects/` to `/projects/`, `/gist/`, `/tags/` and `/categories/` to `/blog/` (the gists live there), and `/contact/` Home, where the identity card has the email and "Book a call". GitHub Pages can't send HTTP redirects, so Astro writes a page for each: meta refresh, canonical to the target, `noindex`, left out of the sitemap. The RSS feed at `/index.xml` is Antonio's to decide (a new feed, or let it lapse), like analytics. Antonio also decided to launch without a social preview image.
- **GoatCounter stays** (Antonio's call, 2026-10-07). The Astro site counts page views on the Hugo site's GoatCounter, `anettodev` (`GOATCOUNTER_CODE` in `lib/site.ts`), so the history carries on. `Base.astro` adds GoatCounter's `count.js` (from `gc.zgo.at`, async) in production builds only, so dev pages never count. GoatCounter sets no cookies, so there's no consent banner. It counts the canonical path, so each language's page counts separately. The forwarding pages from the Hugo URLs don't count.
- **Deploy workflow** (2026-10-07, Phase 7, approved by Antonio; takes effect when PR #1 is merged). `.github/workflows/deploy.yml` replaces `hugo.yml`. It builds with `npm run build` (type check included) and deploys `dist/` through the Pages artifact actions to the `github-pages` environment, which only accepts `main`. The custom domain stays in the Pages settings.
  - **A push to `main` deploys exactly what was merged**, with no refresh.
  - **The daily run** (06:23 UTC) and manual runs refresh GitHub activity, AI usage, bookmarks, Medium and gists, the Apple Music bar, Spotify podcasts (the three `SPOTIFY_*` secrets) and the YouTube playlist (`YOUTUBE_API_KEY`). Each refresh is `continue-on-error`, so an outage or a revoked token ships the last committed data instead of stopping the deploy. Changes under `src/data`, `src/assets` and `public/bookmarks` are committed to `main` as `chore(data): daily refresh`; pushes made with the Actions token don't start another run.
  - **AI agents stay as committed**: they come from the Mac's tokscale cache, which the runner doesn't have. Evernote notes and recordings in Antonio's voice stay manual (`/publish-notes`).
  - **Tested** on a clean clone with an empty home folder (no Mac-local caches or logins): the five refreshes that need no secret succeeded, touched only those paths, kept the AI agents and the gists, brought back no Medium samples, and the build passed.
- **An RSS feed of the notes, with a button to follow it** (Antonio's call, 2026-10-09).
  - **Why:** the live Hugo feed at `/index.xml` only listed six static pages and hadn't changed since August 2024. The notes are the site's own writing, and a feed is how readers follow a site without social media; it also lets automations pick up new notes. There's no way to count current subscribers: feed readers don't run GoatCounter, and Pages keeps no logs.
  - **The feed** (`lib/notes-feed.ts`, `@astrojs/rss`): every Evernote note, newest first by its first date. Each item has the title, the note's English-locale page (also its guid), the date, the summary and the tags as categories. The full text stays on the page, because note images only resolve when the pages are built. It's one feed in English with an `atom:link` to itself, and it's valid while empty. It's served at `/rss.xml` and at the Hugo feed's address, `/index.xml`, so anyone subscribed there gets the notes. Every page's head links it (`rel="alternate"`) for readers and browser extensions. Medium (which has its own feed) and gists aren't in it.
  - **The "RSS feed" button** (pt and es "Feed RSS", `FeedButton.astro`) sits in the Blog page's header. It's a real link to `/rss.xml`, but browsers show a feed's XML instead of subscribing, so with JavaScript a plain click copies the feed's address. The label turns into "Feed address copied" with a check for two seconds, also announced to screen readers. A click with a modifier key, or the middle button, still opens the feed. Its copy helper is shared with Share (`scripts/clipboard.ts`).
