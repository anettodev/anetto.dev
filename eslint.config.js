import js from "@eslint/js";
import astro from "eslint-plugin-astro";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig([
  globalIgnores(["dist/", ".astro/", "node_modules/", "themes/"]),
  js.configs.recommended,
  tseslint.configs.recommended,
  astro.configs["flat/recommended"],
  astro.configs["flat/jsx-a11y-recommended"],
  {
    languageOptions: {
      globals: { ...globals.browser },
    },
  },
]);
