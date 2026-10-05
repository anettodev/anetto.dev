# anetto.dev revamp: remaining plan

The Astro rebuild lives on the `revamp/astro` branch. `main` still holds and deploys the Hugo site. Phases 0–6 are done and logged in `DECISIONS.md`, which records why each choice was made. This file lists what is left, in order. Tick items off here as they land, and log each decision in `DECISIONS.md`.

Ground rules carried from the spec:

- Never invent claims about Antonio. Missing facts stay `[PLACEHOLDER: …]`.
- Do not deploy, change DNS or touch hosting without Antonio's explicit approval in chat.
- Commit only when asked.

## Where we stopped (2026-10-05)

Last work, all committed on `revamp/astro`:

- **Under the identity card, two collapsed frosted-glass containers, only one open at a time:**
  - **Spotify podcasts** (on top) run on mock data. They show in dev only, and wiring them up is below.
  - **The Apple Music playlist "BitsNBytes"** loads Apple's player only when opened and unloads it when closed.
- **Smaller additions:**
  - TL;DR buttons on Experiences, About, AI and note pages;
  - favicons from the app-icon logo;
  - Blog source colours, pills and flags;
  - a greeting headline on Home with three lanes;
  - years-and-months length pills on the timeline.

Next session, in order: remove the test samples, fill the placeholders, wire up Spotify (needs Antonio's Premium and app), re-run QA, then Phase 7 once approved.

## 1. Before cutover

### Content

- [ ] **Remove the test samples.** Three Medium stories ("Sample: …") and three Evernote notes ("Sample:", "Amostra:", "Muestra:") were added to try the Blog page, and committed on the branch at Antonio's request.
  - Drop the posts whose link contains `/sample-` from `src/data/medium.json`, and delete `src/assets/medium/sample-*.png`. A Medium refresh merges into the snapshot, so it won't remove them.
  - Run `npm run notes:write` with an export of `{"notes":[]}`. That empties `src/data/evernote.json` and prunes `src/assets/notes/`.
- [ ] **Fill the remaining placeholders**, only with Antonio's facts:
  - "one public proof from the Investments years" (Home lanes / Experiences timeline);
  - Nutria's cover image and its one-line description (`src/content/projects/*/nutria.md`). The Home lane "03 · Latest" is hand-written and should be updated to match.
- [ ] **Tech Stack list** (`src/lib/tech-stack.ts`). It's a sample from the Hugo resume, kept until Antonio confirms or replaces it.
- [ ] **Review the pt-BR and es drafts.** Every content file marked with the "draft" YAML comment, the i18n strings, and the TL;DR prompts (`tldr.prompt`, `tldr.pages`). Remove each file's draft comment once it's approved.
- [ ] **Open questions for Antonio:**
  - Readwise on Bookmarks: Reader saves, highlights, or both? Which tag marks public items? Antonio sets `READWISE_TOKEN` himself.
  - Capitalisation of "Currently I’m a Mobile engineering leader." on Experiences.
- [ ] **Evernote notes:** tag real notes `anetto.dev` (plus `lang-pt` / `lang-es` for non-English ones). Then refresh in a Claude Code session with the claude.ai Evernote connector: read the notes read-only, save an export, run `npm run notes:write -- <export.json>`. See "Evernote notes" in `DECISIONS.md`.

### QA (re-run Phase 6, a lot changed since)

- [ ] Budgets on the production build (§12): Home JS ≤ 30 KB gzip, LCP < 2.5 s, CLS < 0.1. The new pieces to check are the Apple Music embed (deferred, but it pulls MusicKit), the TL;DR menus, the Blog list tools and the new icons.
- [ ] Lighthouse (debug only) and the keyboard / reduced-motion / contrast passes on Home, About, Experiences, Projects, AI, Blog, Bookmarks and a note page, in both themes.
- [ ] Internal links and the i18n check (hreflang, canonicals, switcher links) across all built pages.
- [ ] **Antonio, on real devices:** VoiceOver on macOS and iOS Safari; a mid-range Android phone (glass and mesh cost); Apple Music playback while signed in.
- [ ] **Decision #9:** three.js on Projects, yes or no.

### Wire up the Spotify podcasts (the container is built, with mock data)

The "Spotify Podcasts" container above the playlist (podcasts first since Antonio swapped them) (`PodcastsPlayer.astro`, `scripts/podcasts-player.ts`) runs on **mock data**: five "Sample:" shows in `src/data/podcasts.json` (`"mock": true`) and generated covers `src/assets/podcasts/sample-*.png`. While `mock` is true, it shows only in `npm run dev`; production builds leave it out, and its player is a `[PLACEHOLDER]`.

Antonio's part (never paste keys or tokens in chat):

- [ ] Have **Spotify Premium**. Since Feb 2026 it's required to own a Development Mode app, which is limited to one client ID and 5 users.
- [ ] Follow the podcasts to show in Spotify (Your Library → Podcasts).
- [ ] Create an app at <https://developer.spotify.com/dashboard>:
  - name it e.g. "anetto.dev podcasts" and choose **Web API**;
  - add the redirect URI **`http://127.0.0.1:8791/callback`** (Spotify takes loopback IPs, not `localhost`);
  - keep its **Client ID** and **Client secret** for the env vars below.
- [ ] Set them yourself in your shell (and later as GitHub Actions secrets): `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`.

The build side (a future session):

- [ ] **Test one call first.** Since the 2026 changes, Development Mode apps have reported 403s even with Premium.
- [ ] **`npm run podcasts:login`** (new `scripts/fetch-spotify-shows.mjs login`): a one-time browser sign-in, Authorization Code flow with the client secret, scope `user-library-read` only (read-only). It saves the refresh token to `~/.config/anetto-dev/spotify.json` (0600) and prints nothing secret.
  - The client-secret flow is chosen over PKCE because PKCE refresh tokens can rotate, which would break unattended daily runs.
  - For CI, Antonio copies the token into the `SPOTIFY_REFRESH_TOKEN` secret himself.
- [ ] **`npm run podcasts:refresh`:**
  - get an access token from the refresh token, then page through `GET https://api.spotify.com/v1/me/shows?limit=50`;
  - keep only `id`, `name`, `publisher`, `external_urls.spotify` (as `link`) and the smallest image ≥ 160px;
  - download the covers to `src/assets/podcasts/<id>.jpg` and prune unlisted ones, including the `sample-*` covers;
  - write `src/data/podcasts.json` **without** `mock`;
  - skip any show in a new `PODCASTS_HIDDEN` list (show IDs) in `src/lib/site.ts`, for shows to keep off the site.
  - The component already reads exactly this shape: `{ fetchedAt, source, shows: [{ id, name, publisher, link, cover }] }`.
- [ ] Check About in dev: the real shows, Spotify's embed per show (`open.spotify.com/embed/show/<id>`, `theme=0` in dark). Then check a production build, where the container now appears.
- [ ] Add `podcasts:refresh` to the Phase 7 daily refresh, with the three `SPOTIFY_*` secrets.

## 2. Phase 7: deploy and cutover (needs Antonio's explicit approval)

- [ ] **Deploy workflow:** GitHub Actions builds Astro and deploys to GitHub Pages, replacing `hugo.yml` and `super-linter.yml`.
- [ ] **Daily refresh in that workflow** (none needs a secret beyond the Actions token):
  - `github:refresh`
  - `ai:refresh`, which keeps the agents already in the snapshot because tokscale's cache only exists on Antonio's Mac
  - `bookmarks:refresh`
  - `blog:refresh` (Medium + gists)
  - `music:refresh` (the playlist bar's title and cover)
  - `podcasts:refresh`, once wired (needs the `SPOTIFY_*` secrets)
  - Commit the snapshots, then build.
- [ ] **Redirects from Hugo URLs** (§4): `/resume/`, `/timeline/`, `/gist/`, `/tags/`, `/categories/`, `/sideprojects/`, `/contact/` and the RSS feed at `/index.xml`.
- [ ] **Custom domain:** confirm how GitHub Pages gets `anetto.dev` (a `CNAME` file in `public/` or the Pages setting). No DNS change without approval.
- [ ] **Merge** `revamp/astro` into `main`. Then replace the Hugo-era docs (`README.md`, `CLAUDE.md`, `memory-bank/`, `.cursor/`) with current ones, and drop the formatter exclusions for them. Dependabot starts once its config is on `main`.
- [ ] **After launch, check:**
  - the TL;DR buttons, whose prompts point assistants at the live pages (`anetto.dev/experiences/` etc. are 404s on the Hugo site until then);
  - the favicon;
  - the Apple Music embed on the real domain.

## 3. After launch

- [ ] Field data (CrUX / Search Console) for INP and real LCP.
- [ ] Watch the daily refresh runs.
- [ ] AI agents and Evernote notes stay manual: run `ai:refresh` on the Mac, and refresh notes in a Claude Code session.

## Manual commands, for reference

| Command                                | What it refreshes                                              |
| -------------------------------------- | -------------------------------------------------------------- |
| `npm run github:refresh`               | GitHub contribution calendar                                   |
| `npm run ai:refresh`                   | tokscale AI usage (+ agents from the Mac's cache)              |
| `npm run bookmarks:refresh`            | public Raindrop bookmarks                                      |
| `npm run blog:refresh`                 | Medium stories + public gists (`gists:refresh` alone)          |
| `npm run notes:write -- <export.json>` | Evernote notes snapshot from an export                         |
| `npm run music:refresh`                | Apple Music playlist title + cover for the collapsed bar       |
| `npm run icons`                        | favicons and touch icons from `src/assets/brand/logo-dark.png` |
