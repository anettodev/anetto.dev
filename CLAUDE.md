# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a personal portfolio website (https://anetto.dev) built with Hugo static site generator and deployed to GitHub Pages. The site showcases professional experience, resume, projects, and blog content for Antonio Netto, an iOS Engineering Manager.

## Build & Development Commands

### Local Development
```bash
# Start local development server (Hugo automatically picks up an available port)
hugo server

# Start with drafts visible
hugo server -D

# Build site for production
hugo --minify
```

### Testing SCSS Changes
The site uses custom SCSS in `assets/scss/custom.scss`. Hugo automatically compiles SCSS on build or during server runtime. No separate build step needed.

### Deployment
Deployment is automated via GitHub Actions (`.github/workflows/hugo.yml`):
- Pushes to `main` branch trigger automatic deployment
- Hugo version in CI: 0.147.0 (extended)
- Manual deployment: Use workflow_dispatch in GitHub Actions UI

## Architecture & Key Patterns

### Hugo Theme Layering
The site uses **theme overrides** rather than modifying theme files directly:
- Base theme: `hugo-coder` (Git submodule at `themes/hugo-coder/`)
- Additional themes: `hugo-shortcode-timeline`, `hugo-calendly-shortcode`
- Override theme templates by placing files in `layouts/` with the same path structure
- Current overrides:
  - `layouts/partials/header.html` - Custom navigation with dark mode toggle on right
  - `layouts/_default/baseof.html` - Base template with custom structure

### SCSS Customization Pattern
Custom styles in `assets/scss/custom.scss` override theme defaults:
- **Glassmorphism effects** on navigation bar (`.header`, `.navbar`, `nav`)
- **Purple accent color** (`#a020f0`) used throughout for branding
- **Dark mode toggle positioning** using flexbox with `.nav-right` class
- **Responsive design** with mobile breakpoints at 768px and 700px

### Dark Mode Implementation
- Color scheme set to `"auto"` in `hugo.toml` (follows browser preference)
- Toggle button positioned on right side of navigation via flexbox
- Custom SCSS ensures proper alignment: `.colorscheme-toggle.nav-right`
- Production deployment includes both `coder-dark.css` and `coder-light.css`

### Content Structure
```
content/
├── about.md           # About page
├── contact.md         # Contact form/info
├── resume.md          # Professional timeline/resume
├── sideprojects.md    # Projects showcase
└── timeline.md        # Timeline shortcode usage
```

### Custom Shortcodes
Located in `layouts/shortcodes/`:
- `largefont.html` - Custom typography shortcode
- Additional shortcodes from timeline and calendly themes

## Important Configuration

### hugo.toml Key Settings
- `baseURL`: `https://anettodev.github.io/`
- `theme`: Multiple themes array `["hugo-coder", "hugo-shortcode-timeline", "hugo-calendly-shortcode"]`
- `customSCSS`: Points to `["scss/custom.scss"]`
- `colorScheme`: Set to `"auto"` for system preference detection
- Analytics: GoatCounter enabled (`code = "anettodev"`)
- Comments: Utterances integration configured

### Git Submodules
Themes are managed as Git submodules. When making changes:
```bash
# Update all submodules
git submodule update --init --recursive

# Update specific submodule
git submodule update --remote themes/hugo-coder
```

## Critical Fixes & Known Patterns

### CSS Generation Issue (Resolved)
The site previously had 404 errors for `coder-dark.css` and `coder-light.css` in production. This was resolved by:
1. Ensuring Hugo builds with `--minify` flag in GitHub Actions
2. Generating CSS files in `public/` directory during build
3. Committing all generated CSS to ensure they're deployed

### Dark Mode Toggle Positioning
The dark mode toggle must be positioned on the **right side** of the navigation. This is achieved through:
1. Adding `.nav-right` class to toggle button in `layouts/partials/header.html`
2. Using flexbox with `margin-left: auto` in `assets/scss/custom.scss`
3. Setting high `order: 999` to ensure it appears last in flex layout

### Theme Override Best Practice
**Never modify theme files directly** in `themes/hugo-coder/`. Instead:
1. Copy the file to `layouts/` maintaining the same path structure
2. Make modifications in the copied file
3. Hugo will automatically use the override instead of theme default

## Memory Bank Integration

This project uses a Cursor Memory Bank system located in `memory-bank/`:
- `projectbrief.md` - Project foundation and goals
- `productContext.md` - Why the project exists
- `activeContext.md` - Current work focus and recent changes
- `systemPatterns.md` - Architecture decisions
- `techContext.md` - Technologies and setup
- `progress.md` - Current status and known issues

When working on this project, reference memory bank files for context on recent changes and ongoing work patterns.
