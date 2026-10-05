# anetto.dev revamp: remaining plan

The Astro rebuild lives on the `revamp/astro` branch. `main` still holds and deploys the Hugo site. Phases 0–6 are done and logged in `DECISIONS.md`, which records why each choice was made. This file lists what is left, in order. Tick items off here as they land, and log each decision in `DECISIONS.md`.

Ground rules carried from the spec:

- Never invent claims about Antonio. Missing facts stay `[PLACEHOLDER: …]`.
- Do not deploy, change DNS or touch hosting without Antonio's explicit approval in chat.
- Commit only when asked.

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

## 2. Phase 7: deploy and cutover (needs Antonio's explicit approval)

- [ ] **Deploy workflow:** GitHub Actions builds Astro and deploys to GitHub Pages, replacing `hugo.yml` and `super-linter.yml`.
- [ ] **Daily refresh in that workflow** (none needs a secret beyond the Actions token):
  - `github:refresh`
  - `ai:refresh`, which keeps the agents already in the snapshot because tokscale's cache only exists on Antonio's Mac
  - `bookmarks:refresh`
  - `blog:refresh` (Medium + gists)
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
| `npm run icons`                        | favicons and touch icons from `src/assets/brand/logo-dark.png` |
