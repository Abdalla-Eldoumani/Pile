import nextPlugin from "@next/eslint-plugin-next";
import tseslint from "typescript-eslint";

// Next 16 removed `next lint` and ESLint 9 uses flat config. Loading
// eslint-config-next through FlatCompat hits a circular-structure bug, so build
// the flat config directly: typescript-eslint's recommended rules plus the Next
// plugin's core-web-vitals rules.
const config = [
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "convex/_generated/**",
      "public/**",
    ],
  },
  ...tseslint.configs.recommended,
  {
    plugins: { "@next/next": nextPlugin },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
    },
  },
];

export default config;
