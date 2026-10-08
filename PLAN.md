# anetto.dev revamp: remaining plan

The Astro rebuild lives on the `revamp/astro` branch. `main` still holds and deploys the Hugo site. Phases 0–6 are done and logged in `DECISIONS.md`, which records why each choice was made. This file lists what is left, in order. Tick items off here as they land, and log each decision in `DECISIONS.md`.

Ground rules carried from the spec:

- Never invent claims about Antonio. Missing facts stay `[PLACEHOLDER: …]`.
- Do not deploy, change DNS or touch hosting without Antonio's explicit approval in chat.
- Commit only when asked.

## Where we stopped (2026-10-05)

Last work, all committed on `revamp/astro`:

- **Under the identity card, two collapsed frosted-glass containers, only one open at a time:**
  - **Spotify podcasts** (on top). Since then (committed 2026-10-05) they run on real data: `podcasts:login` and `podcasts:refresh` are wired to Antonio's Spotify library (5 followed shows), and the container now ships in production builds.
  - **The Apple Music playlist "BitsNBytes"** loads Apple's player only when opened and unloads it when closed.
- **Smaller additions:**
  - TL;DR buttons on Experiences, About, AI and note pages;
  - favicons from the app-icon logo;
  - Blog source colours, pills and flags;
  - a greeting headline on Home with three lanes;
  - years-and-months length pills on the timeline.

Next session, in order: remove the test samples, fill the placeholders, re-run QA, then Phase 7 once approved.

## 1. Before cutover

### Content

- [x] **Remove the test samples** (done 2026-10-07; the Blog now shows the 15 public gists only). Three Medium stories ("Sample: …") and three Evernote notes ("Sample:", "Amostra:", "Muestra:") were added to try the Blog page, and committed on the branch at Antonio's request.
  - Drop the posts whose link contains `/sample-` from `src/data/medium.json`, and delete `src/assets/medium/sample-*.png`. A Medium refresh merges into the snapshot, so it won't remove them.
  - Run `npm run notes:write` with an export of `{"notes":[]}`. That empties `src/data/evernote.json` and prunes `src/assets/notes/`.
- [x] **Fill the remaining placeholders.** Done on 2026-10-06. The Investments proof was removed at Antonio's request. Nutria turned out to be Nutrx, now shipped, with its cover, description and links. The Home lane "03 · Latest" shows Frutalia, the newest shipped project. Only the dev-only "next entry" card on Projects keeps a `[PLACEHOLDER]`, by design.
- [ ] **Tech Stack list** (`src/lib/tech-stack.ts`). It's a sample from the Hugo resume, kept until Antonio confirms or replaces it.
- [ ] **Review the pt-BR and es drafts.** Every content file marked with the "draft" YAML comment, the i18n strings, and the TL;DR prompts (`tldr.prompt`, `tldr.pages`). Remove each file's draft comment once it's approved.
- [ ] **Open questions for Antonio:**
  - Readwise on Bookmarks: Reader saves, highlights, or both? Which tag marks public items? Antonio sets `READWISE_TOKEN` himself.
  - Capitalisation of "Currently I’m a Mobile engineering leader." on Experiences.
- [ ] **Evernote notes:** tag real notes `anetto.dev` (plus `lang-pt` / `lang-es` for non-English ones). Then refresh in a Claude Code session with the claude.ai Evernote connector: read the notes read-only, save an export, run `npm run notes:write -- <export.json>`. See "Evernote notes" in `DECISIONS.md`.

### QA (re-run Phase 6, a lot changed since)

Checked on 2026-10-07 with the production build, for draft PR #1 (`revamp/astro` into `main`): lint, formatting, `astro check` and the build pass (31 pages). No internal link is broken, every hreflang alternate resolves, there are no `[PLACEHOLDER]`s, and Home ships about 8 KB of JS gzipped.

- [x] **Fix the note pages' URLs** (fixed 2026-10-07). Note pages pass `route="blog"`, so their canonical, `og:url` and hreflang alternates point at the Blog index instead of the note, and the language switcher sends readers there too. Give them their slug as a sub-path of the route.
- [x] **Analytics:** GoatCounter kept (Antonio's call, 2026-10-07), same `anettodev` site as Hugo's.
- [x] **Social preview image:** launching without one (Antonio's call, 2026-10-07).

- [ ] Budgets on the production build (§12): Home JS ≤ 30 KB gzip, LCP < 2.5 s, CLS < 0.1. The new pieces to check are the Apple Music embed (deferred, but it pulls MusicKit), the TL;DR menus, the Blog list tools and the new icons.
- [ ] Lighthouse (debug only) and the keyboard / reduced-motion / contrast passes on Home, About, Experiences, Projects, AI, Blog, Bookmarks and a note page, in both themes.
- [ ] Internal links and the i18n check (hreflang, canonicals, switcher links) across all built pages.
- [ ] **Antonio, on real devices:** VoiceOver on macOS and iOS Safari; a mid-range Android phone (glass and mesh cost); Apple Music playback while signed in.
- [ ] **Decision #9:** three.js on Projects, yes or no.

### Wire up the Spotify podcasts (done and committed 2026-10-05)

The "Spotify Podcasts" container above the playlist (`PodcastsPlayer.astro`, `scripts/podcasts-player.ts`) ran on **mock data** (five "Sample:" shows, `"mock": true`, dev only) until the first real `npm run podcasts:refresh` on 2026-10-05, which replaced it with Antonio's 5 followed shows. A snapshot with `"mock": true` still keeps the container out of production builds.

Antonio's part (never paste keys or tokens in chat):

- [x] Have **Spotify Premium**. Since Feb 2026 it's required to own a Development Mode app (up to 25 apps per developer since July 2026, 5 users each).
- [x] Follow the podcasts to show in Spotify (Your Library → Podcasts). Following isn't enough to appear: only the shows in `PODCASTS_SHOWN` (`src/lib/site.ts`) reach the site, in its order (Antonio's choice, 2026-10-06).
- [x] Create an app at <https://developer.spotify.com/dashboard>:
  - name it e.g. "anetto.dev podcasts" and choose **Web API**;
  - add the redirect URI **`http://127.0.0.1:8791/callback`** (Spotify takes loopback IPs, not `localhost`);
  - keep its **Client ID** and **Client secret** for the env vars below.
- [x] Store `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET` outside the repo (done: in the Mac's Keychain, loaded into the shell on demand). They become GitHub Actions secrets in Phase 7.
- [x] Run **`npm run podcasts:login`** on the Mac and approve read-only access in the browser. It ends with one test call (`/me/shows?limit=1`), the check for the 403s Development Mode apps have reported even with Premium (it passed: 5 shows). If the browser shows "redirect_uri: Not matching configuration" right after adding the URI, save the app's settings and retry a few minutes later; that's what fixed it on 2026-10-05. On a 403, add your Spotify account under the app's **User Management** and sign in again.

The build side:

- [x] **`npm run podcasts:login`** (`scripts/fetch-spotify-shows.mjs login`): a one-time browser sign-in, Authorization Code flow with the client secret, scope `user-library-read` only (a wider grant is refused), `state` checked. It saves the refresh token to `~/.config/anetto-dev/spotify.json` (0600) and prints nothing secret.
  - The client-secret flow is chosen over PKCE because PKCE refresh tokens can rotate, which would break unattended daily runs.
- [x] **`npm run podcasts:refresh`:**
  - gets an access token from the refresh token (`SPOTIFY_REFRESH_TOKEN` in CI, else the file), then pages through `GET /v1/me/shows?limit=50`;
  - keeps `id`, `name`, `publisher`, `link` and the smallest image ≥ 160px, downloaded to `src/assets/podcasts/<id>.<ext>`;
  - prunes every other cover, the `sample-*` ones included;
  - keeps only the shows in `PODCASTS_SHOWN`, in its order: each entry is a show ID or link. A listed show Antonio doesn't follow is fetched by ID (`GET /v1/shows/{id}`), and followed shows that aren't listed are printed as lines ready to paste into the list;
  - writes `src/data/podcasts.json` **without** `mock`, in the shape the component reads: `{ fetchedAt, source, shows: [{ id, name, publisher, link, cover }] }`.
  - **The publisher comes from each show's public page** (`og:description`, "Podcast · <publisher> · …"), because Development Mode responses lost `publisher` in Feb 2026 and it hasn't been restored. A show without one gets no publisher line.
  - Tested end to end against a mocked API: paging, a 429, a list mixing a link, a URI, an ID and a duplicate, an unfollowed show, a bad entry, an empty list, a show without an image, a real public page and cover, the CI token path, a wider scope, a 403. Then run against the real API on 2026-10-05.
- [x] **First real run:** `npm run podcasts:refresh` wrote 5 shows, each with a publisher and cover, and removed the sample covers. Checked in a production build (`astro preview`, dark theme): the container is on all 31 pages beside the playlist; opening a show loads `open.spotify.com/embed/show/<id>?theme=0`; going back or closing unloads the player and returns focus to the show.
- [x] **Committed** the scripts, the snapshot, the covers (the `sample-*` ones deleted) and the container changes.
- [x] **GitHub Actions secrets set** (2026-10-06) on `anettodev/anetto.dev`: `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REFRESH_TOKEN`, copied from the Keychain and the sign-in file without reaching the screen. The Keychain stays the source of truth: after resetting the client secret, or after a new `podcasts:login`, update the matching secret too.
- [ ] **Phase 7:** add `podcasts:refresh` to the daily refresh (below).

### YouTube playlist (done and committed 2026-10-06)

A third container under the identity card, now the first of the three (`VideosPlayer.astro`, Antonio's order: videos, podcasts, playlist), lists the videos of one YouTube playlist like the podcasts list. It shows `YOUTUBE_PLAYLIST_TITLE` on the bar ("anettodev playlist"; empty shows the playlist's own title), a 64×36 thumbnail per video and four and a half rows before scrolling. Picking a video plays it in YouTube's privacy-enhanced player (`youtube-nocookie.com`, 16:9) within the playlist, and "Playlist on YouTube" opens it there. The first `youtube:refresh` (2026-10-06) read Antonio's public playlist "anettodev" (5 videos), so the container now ships in production builds. An empty snapshot keeps it hidden.

Antonio's part (never paste keys in chat):

- [x] Create a Google Cloud project at <https://console.cloud.google.com/>, then enable **YouTube Data API v3** in **APIs & Services → Library**.
- [x] Create an **API key** in **APIs & Services → Credentials**, and restrict it to YouTube Data API v3. Leave its **application restriction at None**: a website restriction makes Google refuse the script's calls ("Requests from referer <empty> are blocked").
- [x] Store it in the Keychain: `read -rs TOK && security add-generic-password -U -s shell-env -a YOUTUBE_API_KEY -w "$TOK" && unset TOK`. Then add `YOUTUBE_API_KEY` to `load_shell_secrets` in `~/.zsh.keychain.zsh`.
- [x] Choose the playlist; it must be **Public or Unlisted**. Put its link in `YOUTUBE_PLAYLIST` (`src/lib/site.ts`).

The build side:

- [x] **`npm run youtube:refresh`** (`scripts/fetch-youtube-playlist.mjs`):
  - reads the playlist and up to 50 of its videos (YouTube Data API v3, about 1 quota unit per 50 videos of the free 10,000 a day), with the key sent in the `X-goog-api-key` header, never in an address;
  - leaves out private and deleted videos;
  - downloads each 320×180 thumbnail to `src/assets/youtube/`, pruning the rest;
  - writes `src/data/youtube.json`.
  - YouTube's tokenless playlist feeds (`/feeds/videos.xml`) answer 404 since 2026, hence the key.
  - Tested against a mocked API: a link with `&si=`, paging, private and deleted videos, a missing key, an empty setting, an unknown playlist, an exhausted quota. Then run against the real API on 2026-10-06.
- [x] **One list component** (`MediaList.astro`, `scripts/media-list.ts`) now runs both the podcasts and the videos. Podcasts behaved as before in the browser.
- [x] **First real run:** 5 videos and thumbnails. All five play in the embedded player (checked side by side in the browser), and the production build ships the container on all 31 pages.
- [x] **Committed** the YouTube container, the shared list and the snapshot.
- [ ] **Phase 7:** add `youtube:refresh` to the daily refresh with a `YOUTUBE_API_KEY` secret: `printf %s "$(security find-generic-password -w -s shell-env -a YOUTUBE_API_KEY)" | gh secret set YOUTUBE_API_KEY`.

## 2. Phase 7: deploy and cutover (needs Antonio's explicit approval)

- [x] **CI on pull requests** (2026-10-07): `.github/workflows/ci.yml` runs the project's own checks (`npm ci`, lint, `format:check`, then `build`, which type-checks first) on pull requests into `main` and on pushes to it, and never deploys. It replaced `super-linter.yml`, which failed PR #1 on its bundled configs.
- [x] **Deploy workflow** (written 2026-10-07; runs once merged): `.github/workflows/deploy.yml` builds Astro and deploys to GitHub Pages, replacing `hugo.yml`. A push to `main` deploys what was merged; the daily run (06:23 UTC) and manual runs refresh the snapshots first.
- [x] **Daily refresh in that workflow** (each refresh may fail without blocking the deploy; dry-run on a clean clone with an empty home passed) (none needs a secret beyond the Actions token):
  - `github:refresh`
  - `ai:refresh`, which keeps the agents already in the snapshot because tokscale's cache only exists on Antonio's Mac
  - `bookmarks:refresh`
  - `blog:refresh` (Medium + gists)
  - `music:refresh` (the playlist bar's title and cover)
  - `podcasts:refresh` with the three `SPOTIFY_*` secrets (already set). Let it fail without blocking the deploy, so the site keeps the last committed shows (e.g. if the refresh token is revoked or Premium lapses).
  - `youtube:refresh` with the `YOUTUBE_API_KEY` secret, also without blocking the deploy.
  - Commit the snapshots, then build.
- [x] **Redirects from Hugo URLs** (§4; done 2026-10-07 in `astro.config.ts`, the RSS feed left to Antonio): `/resume/`, `/timeline/`, `/gist/`, `/tags/`, `/categories/`, `/sideprojects/` and `/contact/`, which with `/` and `/about/` are every page in the live sitemap. Pages can't redirect the RSS feed at `/index.xml`, so either publish a feed there or let it lapse (Antonio's call).
- [x] **Custom domain** (checked 2026-10-07): Pages already builds from a workflow and has `anetto.dev` in its settings, with HTTPS enforced. The Astro deploy needs no `CNAME` file and no DNS change.
- [ ] **Merge** `revamp/astro` into `main`. Then replace the Hugo-era docs (`README.md`, `CLAUDE.md`, `memory-bank/`, `.cursor/`) with current ones, and drop the formatter exclusions for them. Dependabot starts once its config is on `main`.
- [ ] **After launch, check:**
  - the TL;DR buttons, whose prompts point assistants at the live pages (`anetto.dev/experiences/` etc. are 404s on the Hugo site until then);
  - the favicon;
  - the Apple Music embed on the real domain.

## 3. After launch

- [ ] Field data (CrUX / Search Console) for INP and real LCP.
- [ ] Watch the daily refresh runs.
- [ ] AI agents and Evernote notes stay manual: run `ai:refresh` on the Mac, and refresh notes in a Claude Code session.

## 4. Notes read in Antonio's own voice (ElevenLabs, wired up 2026-10-06)

Notes have a free **Listen** button today (2026-10-06): the visitor's device reads them with the browser's speech synthesis, so the voice differs per device. The next step is a natural voice, ideally Antonio's own, generated once per note and language when notes are written, then played by the same player.

- [x] **Chose ElevenLabs** (Instant Voice Cloning on the Starter plan). The alternatives below stay for reference:
- [ ] **Compare cloned-voice text-to-speech** (optional, later) on one real note in Portuguese, English and Spanish, judging quality, Portuguese accent, price and terms:
  - **ElevenLabs:** Instant Voice Cloning (a minute or so of audio) or Professional Voice Cloning (more audio, closer match). About $0.04–0.08 per 1K characters (about a minute of speech) in September 2026.
  - **Cartesia:** fast voice cloning, usually cheaper.
  - **Local open-source** (F5-TTS, XTTS-v2): free on the Mac, more variable quality, especially in Portuguese.
  - Not these: OpenAI **Whisper** is speech-to-text (the opposite direction); OpenAI's text-to-speech (`gpt-4o-mini-tts`, about $0.015 per audio minute) has no voice cloning; **Suno** makes music, not narration.
- [x] **Record a clean sample** of Antonio's voice (quiet room, a few minutes of natural reading) for the chosen provider. Check its terms on voice ownership and on deleting the clone.
- [x] **`npm run notes:audio`** (`scripts/notes-audio.mjs`, after `notes:write`; Prettier formats its snapshot) generates one MP3 per note (`public/audio/notes/<slug>.mp3`, 64 kbps) with the passage timings, skipping unchanged notes (a hash) and pruning removed ones. `--dry-run` shows the characters (credits) first. Voice: `NOTES_VOICE_ID` in `src/lib/site.ts`. Key: `ELEVENLABS_API_KEY`, in the Keychain only (limited to text-to-speech). The three samples were generated on 2026-10-06 (1,028 credits).
- [x] **The Listen player plays it:** the same buttons, a time readout, and the highlight following the timings. The tooltip says the voice is AI-generated. It falls back to the device voice when there is no recording or it fails.
- [ ] **Listen to the samples and judge the clone** (Antonio). If it's off, re-record the sample or try Professional Voice Cloning, then `npm run notes:audio -- --force`.
- [ ] **Seeking** in the recording (click or drag the progress line, arrow keys): not built yet.
- [x] **Opt-in per note** (`notes:audio -- --add <slug>`, `--remove <slug>`): no recording by default.
- [x] **Constant halo** on Listen for notes recorded in Antonio's voice.
- [x] **About is read in Antonio's voice, in each language** (2026-10-06): Listen comes first in its header, and each locale plays its own recording (`/about` English, `/pt/about` Portuguese, `/es/about` Spanish). `npm run pages:audio` (`scripts/pages-audio.mjs`) builds the site, reads each built page's title and `data-listen` text (About's text and "Outside work"; not the facts or the tech stack), and records what changed into `public/audio/pages/<page>-<locale>.mp3` and `src/data/pages-audio.json`. The pages are `VOICE_PAGES` in `src/lib/site.ts`. The first recording cost 2,857 credits (about 1 minute per language).
- [ ] **When an About text changes, run `npm run pages:audio`** (with the key from the Keychain), or that language keeps the old recording. Each re-recorded language costs about 950 credits. The Portuguese and Spanish texts are still drafts, so settle them first.
- [x] **`/publish-notes`** Claude Code command (local, in `.claude/commands/`): refresh the notes from Evernote, ask which new notes to record, check the site, then commit and push after confirmations.
- [ ] **After removing the samples and writing real notes,** run `/publish-notes` (recordings cost about 1,000 credits per minute of speech).

## Manual commands, for reference

| Command                                | What it refreshes                                              |
| -------------------------------------- | -------------------------------------------------------------- |
| `npm run github:refresh`               | GitHub contribution calendar                                   |
| `npm run ai:refresh`                   | tokscale AI usage (+ agents from the Mac's cache)              |
| `npm run bookmarks:refresh`            | public Raindrop bookmarks                                      |
| `npm run blog:refresh`                 | Medium stories + public gists (`gists:refresh` alone)          |
| `npm run notes:write -- <export.json>` | Evernote notes snapshot from an export                         |
| `npm run music:refresh`                | Apple Music playlist title + cover for the collapsed bar       |
| `npm run podcasts:login`               | one-time read-only Spotify sign-in (+ one test call)           |
| `npm run podcasts:refresh`             | followed Spotify shows + covers for the podcasts container     |
| `npm run youtube:refresh`              | YouTube playlist videos + thumbnails for the videos container  |
| `npm run notes:audio`                  | recordings of opted-in notes in Antonio's voice (credits)      |
| `npm run pages:audio`                  | About's recordings in each language, after a build (credits)   |
| `npm run icons`                        | favicons and touch icons from `src/assets/brand/logo-dark.png` |
