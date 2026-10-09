import type { BrandId } from "../components/Icon.astro";

/*
 * Where the Blog page's posts come from: each source's mark and colour
 * (Antonio's picks: Medium blue, Evernote green, Gist purple). The source
 * chips and the source pills use them, and so does a post's cover when it
 * has no image. Each colour keeps white text at 4.5:1 or more.
 */
export interface Source {
  name: string;
  icon: BrandId;
  color: string;
}

export const SOURCES: readonly Source[] = [
  { name: "Medium", icon: "medium", color: "#2563eb" },
  { name: "Evernote", icon: "evernote", color: "#15803d" },
  { name: "Gist", icon: "github", color: "#8250df" },
];

export const sourceOf = (name: string) =>
  SOURCES.find((source) => source.name === name);
