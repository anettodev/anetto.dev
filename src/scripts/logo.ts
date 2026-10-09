import { currentTheme } from "./theme";

/** The current theme's logo clip inside `root` (styles/logo.css shows only that one). */
export function themedLogo(root: ParentNode): HTMLVideoElement | null {
  const theme = currentTheme() === "light" ? "logo-light" : "logo-dark";
  return root.querySelector<HTMLVideoElement>(`video.${theme}`);
}
