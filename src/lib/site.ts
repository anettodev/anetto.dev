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

/**
 * The Spotify podcasts on the site, in this order (requested by Antonio:
 * only the shows listed here appear, so following a new one on Spotify
 * doesn't add it). Each entry is a show's link (Share → Copy link to show)
 * or its ID, the part after open.spotify.com/show/. `npm run
 * podcasts:refresh` reads them, and prints followed shows not listed here.
 */
export const PODCASTS_SHOWN: readonly string[] = [
  "0MX9PyeCzDhdlyRv6slwIX", // The Peterman Pod
  "2p0Vx75OmfsXktyLBuLuSf", // Hipsters Ponto Tech
  "2jz0gSreoUqQVxLKNprjZ9", // escovando bits
  "64tJx8PtMF1cQT9UUflGgZ", // Palestras Filosóficas Nova Acrópole
  "2MAi0BvDc6GTFvKFPXnkCL", // Lex Fridman Podcast
  "1oMIHOXsrLFENAeM743g93", // Data Hackers
];

/**
 * The YouTube playlist under the identity card, the first container there
 * (requested by Antonio): its link (youtube.com/playlist?list=…) or ID. It
 * must be Public or Unlisted. `npm run youtube:refresh` reads it; until
 * then, or while this is empty, the container stays hidden.
 */
export const YOUTUBE_PLAYLIST =
  "https://www.youtube.com/playlist?list=PLVcHTu88gH6E";

/**
 * The name the videos bar shows (requested by Antonio), in every language.
 * Empty shows the playlist's own title on YouTube.
 */
export const YOUTUBE_PLAYLIST_TITLE = "anettodev playlist";

/**
 * The ElevenLabs voice that reads Antonio's notes (his Instant Voice Clone):
 * its Voice ID, which isn't a secret. `npm run notes:audio` uses it; empty
 * leaves every note to the visitor's device voice.
 */
export const NOTES_VOICE_ID = "AloJubJl8XlsJISJOwQW";

/**
 * Site pages recorded in that voice, in every language (requested by
 * Antonio): `npm run pages:audio` reads their built `data-listen` text.
 */
export const VOICE_PAGES: readonly string[] = ["about"];

export const LINKS = {
  /** Interim: the resume the Hugo site links today, until a current PDF is supplied (§13.1). */
  resume: "https://drive.proton.me/urls/ERWQ9A0XPR#U0bUIrcLBRHR",
  linkedin: "https://www.linkedin.com/in/anettodev/",
} as const;
