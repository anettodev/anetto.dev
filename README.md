# anetto.dev

[![Hugo](https://img.shields.io/badge/hugo-0.147.0-blue.svg)](https://gohugo.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
![Build with Hugo](https://github.com/anettodev/anetto.dev/actions/workflows/hugo.yml/badge.svg)
![Linting](https://github.com/anettodev/anetto.dev/actions/workflows/super-linter.yml/badge.svg)

> A modern, responsive personal portfolio website.

**Live Demo:** [https://anetto.dev](https://anetto.dev)

![Screenshot](https://github.com/anettodev/anetto.dev/blob/main/Screenshot-anetto.dev.png)

## About

This repository contains the source code for my personal portfolio website. I'm Antonio Netto, an iOS Engineering Manager (but always a dev) with a passion for building elegant mobile experiences and leading high-performing engineering teams. 

This site serves as a central hub for my professional presence, showcasing my resume, side projects, and technical insights.

## Tech Stack

- **Static Site Generator:** [Hugo](https://gohugo.io) (v0.147.0 Extended)
- **Themes:**
  - [hugo-coder](https://github.com/luizdepra/hugo-coder) - Main theme
  - [hugo-shortcode-timeline](https://github.com/Wivik/hugo-shortcode-timeline) - Timeline functionality
  - [hugo-calendly-shortcode](https://github.com/jlrickert/hugo-calendly-shortcode) - Calendly integration
- **Deployment:** GitHub Pages via GitHub Actions
- **Analytics:** GoatCounter
- **Comments:** Utterances (GitHub-based)

## Features

- **Responsive Design** - Mobile-first approach with seamless experience across all devices
- **Dark Mode** - Automatic theme switching based on system preferences with manual toggle
- **Resume Timeline** - Interactive timeline showcasing professional experience
- **Projects Showcase** - Dedicated section for side projects and portfolio work
- **Blog Integration** - Technical writing and insights
- **Fast Performance** - Static site generation for optimal load times
- **SEO Optimized** - Proper meta tags and structured data
- **Automated Deployment** - CI/CD pipeline with GitHub Actions

## Quick Start

### Prerequisites

- [Hugo Extended](https://gohugo.io/installation/) v0.147.0 or higher
- Git

### Local Development

1. **Clone the repository with submodules:**
   ```bash
   git clone --recursive https://github.com/anettodev/anetto.dev.git
   cd anetto.dev
   ```

2. **If you already cloned without submodules, initialize them:**
   ```bash
   git submodule update --init --recursive
   ```

3. **Start the development server:**
   ```bash
   hugo server
   ```

4. **View the site:**
   Open your browser to `http://localhost:1313` (or the port shown in the terminal)

5. **Build for production:**
   ```bash
   hugo --minify
   ```

## Project Structure

```
anetto.dev/
├── .github/workflows/    # GitHub Actions CI/CD configuration
├── archetypes/          # Content templates
├── assets/              # SCSS and other assets
├── content/             # Markdown content files
│   ├── about.md
│   ├── contact.md
│   ├── resume.md
│   └── sideprojects.md
├── layouts/             # Custom layout overrides
│   ├── partials/
│   └── shortcodes/
├── static/              # Static files (images, etc.)
├── themes/              # Hugo themes (Git submodules)
├── hugo.toml           # Hugo configuration
└── README.md
```

## Deployment

The site is automatically deployed to GitHub Pages when changes are pushed to the `main` branch.

**Deployment Pipeline:**
1. Push to `main` triggers GitHub Actions workflow
2. Hugo builds the site with `--minify` flag
3. Generated files are deployed to GitHub Pages
4. Site is live at [https://anetto.dev](https://anetto.dev)

**Manual deployment** can be triggered via the GitHub Actions UI using workflow_dispatch.

## Development

### Working with Themes

Themes are managed as Git submodules. To update a theme:

```bash
# Update all themes
git submodule update --remote

# Update specific theme
git submodule update --remote themes/hugo-coder
```

### Theme Customization

Custom layouts and partials should be placed in the `layouts/` directory, which overrides the theme defaults without modifying the theme files directly.

### Content Management

- Add new pages in `content/` directory
- Use front matter for page metadata
- Markdown syntax for content formatting

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

- Website: [anetto.dev](https://anetto.dev)
- GitHub: [@anettodev](https://github.com/anettodev)

---

**Note:** This is a personal portfolio site. Feel free to use the code structure as inspiration for your own site, but please don't use my personal content or branding.
