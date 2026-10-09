/** Copies text; the clipboard API needs a secure page, the fallback doesn't. */
export async function copy(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const field = document.createElement("textarea");
    field.value = text;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.opacity = "0";
    document.body.append(field);
    field.select();
    // Deprecated, but the only way left to copy without the clipboard API.
    const ok = document.execCommand("copy");
    field.remove();
    return ok;
  }
}
