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
- Island tile, 144px: AV1 WebM 18–22 KB, H.264 MP4 27–34 KB, JPEG poster 3 KB, per theme.
- Intro card, 640px: AV1 WebM 146–171 KB, H.264 MP4 227–244 KB, JPEG poster 27–33 KB, per theme.
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

## Island links hover with the halo (2026-10-03)

**Hovering a link in the pill shows the brand halo (requested by Antonio; replaces the plain grey hover chip).**

- The link becomes a solid `--surface` chip with the identity card's halo (copper, pearl, blue conic gradient, blurred) glowing behind it, turning once every 4s. It's a small version of the identity card.
- Keyboard focus (`:focus-visible`) shows the same, next to the focus ring.
- The text stays `--fg` on the solid chip, so the halo's colours never affect its contrast (about 15:1 dark, 18:1 light).
- The current page keeps its grey chip until hovered. With reduced motion the halo doesn't turn.

## Company link on the identity card (2026-10-03)

**"Inter" on the identity card links to https://inter.co/ (requested by Antonio).** That is the `companyURL` the Hugo site used.

- It's in the accent, semibold, with a soft underline that turns solid on hover. The underline keeps it recognisable as a link without relying on colour (WCAG 1.4.1). The accent is 8.4:1 on the dark card and 6.5:1 on the light one.
- `COMPANY` and `PERSON.city` live in `src/lib/site.ts`. Only the preposition is translated (`card.at`: at / no / en), and the intro's info face uses the same word.
- The link's text is set with `set:text`, because Prettier's Astro plugin reflows inline content onto separate lines. That put spaces inside the link and stretched its underline past the name.
