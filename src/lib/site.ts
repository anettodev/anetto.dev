export const PERSON = {
  name: "Antonio Netto",
  email: "hello@anetto.dev",
  city: "Belo Horizonte",
} as const;

/** Current employer, linked from the identity card (the Hugo site's companyURL). */
export const COMPANY = { name: "Inter", href: "https://inter.co/" } as const;

export type SocialId = "linkedin" | "github" | "x" | "medium";

/** Profiles shown as icon buttons on the identity card (spec §5.2). Mastodon pending §14 #3. */
export const SOCIAL: readonly { id: SocialId; label: string; href: string }[] =
  [
    {
      id: "linkedin",
      label: "LinkedIn",
      href: "https://www.linkedin.com/in/anettodev/",
    },
    { id: "github", label: "GitHub", href: "https://github.com/anettodev/" },
    { id: "x", label: "X", href: "https://twitter.com/anettodev/" },
    { id: "medium", label: "Medium", href: "https://medium.com/@anettodev" },
  ];

/** Scheduling page for the identity card's "Book a call" (the Hugo site's /contact used it). */
export const CALENDLY_URL = "https://calendly.com/anetto";

/**
 * The Apple Music playlist under the identity card (requested by Antonio):
 * its music.apple.com link (Share → Copy Link; the playlist must be public).
 * Empty shows a [PLACEHOLDER] there instead.
 */
export const APPLE_MUSIC_PLAYLIST =
  "https://music.apple.com/br/playlist/bitsnbytes/pl.u-e98lGaDHWJmxAd?l=en";

export const LINKS = {
  /** Interim: the resume the Hugo site links today, until a current PDF is supplied (§13.1). */
  resume: "https://drive.proton.me/urls/ERWQ9A0XPR#U0bUIrcLBRHR",
  linkedin: "https://www.linkedin.com/in/anettodev/",
} as const;
