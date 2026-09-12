import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    ".run-check/**",
    ".run-*/**",
    "public/engine/**",
    "stockfish*.js",
  ]),
  {
    files: ["components/ui/**/*.{ts,tsx}", "hooks/use-mobile.ts"],
    rules: {
      // These files are vendored verbatim from shadcn@4.17.0. Keep the
      // registry source intact while applying the stricter rules to Site code.
      "@typescript-eslint/no-unused-vars": "off",
      "react-hooks/purity": "off",
      "react-hooks/set-state-in-effect": "off",
    },
  },
  {
    files: ["app/page.tsx"],
    rules: {
      // The workspace intentionally resets transient analysis state whenever the
      // selected ply changes. This will disappear when page state moves to the
      // planned StudyWorkspace reducer.
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/exhaustive-deps": "off",
      // Chess pieces are local SVG sprites with fixed CSS sizing; Next image
      // optimization provides no benefit for these 12 tiny static assets.
      "@next/next/no-img-element": "off",
    },
  },
]);

export default eslintConfig;
