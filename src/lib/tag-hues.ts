/*
 * Hashtag colours (requested by Antonio), for note pages and Blog cards
 * (Hashtag.astro, styles/hashtags.css). Each tag gets one of six hues from
 * its name (pink, violet, blue, cyan, green, amber), so a tag keeps its
 * colour everywhere. Within one list, a tag landing on a hue already taken
 * moves to the next free one, so a note's or card's tags always differ.
 */
export const TAG_HUES = [350, 300, 255, 200, 150, 60] as const;

function hashOf(tag: string): number {
  let hash = 0;
  for (const char of tag.toLowerCase()) {
    hash = (hash * 31 + (char.codePointAt(0) ?? 0)) >>> 0;
  }
  return hash;
}

/** Each tag of one list and its hue (an OKLCH hue angle). */
export function tagHues(tags: readonly string[]): Map<string, number> {
  const hues = new Map<string, number>();
  for (const tag of tags) {
    let index = hashOf(tag) % TAG_HUES.length;
    const taken = new Set(hues.values());
    while (taken.has(TAG_HUES[index] ?? 0) && taken.size < TAG_HUES.length) {
      index = (index + 1) % TAG_HUES.length;
    }
    hues.set(tag, TAG_HUES[index] ?? 0);
  }
  return hues;
}
