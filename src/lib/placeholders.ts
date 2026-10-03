/**
 * Copy that Antonio still has to supply is written as `[PLACEHOLDER: …]` in
 * content files (spec §0.2). These helpers render it as a visible <mark>.
 */
const PLACEHOLDER = /\[PLACEHOLDER:[^\]]*\]/g;

const ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (char) => ESCAPES[char] ?? char);
}

/** Wraps placeholders in already-rendered HTML (Markdown bodies). */
export function markPlaceholders(html: string): string {
  return html.replace(
    PLACEHOLDER,
    (match) => `<mark class="placeholder">${match}</mark>`,
  );
}

/** Escapes a plain string (frontmatter) and wraps its placeholders. */
export function textWithPlaceholders(text: string): string {
  return markPlaceholders(escapeHtml(text));
}
