// ESLint flat config (`next lint` was removed in Next 16 — lint runs via the
// eslint CLI, see the `lint` script). Next's rules + TS rules; generated code
// and the src/ staging area are never linted.
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "convex/_generated/**",
      "src/**",
      "next-env.d.ts",
    ],
  },
  ...nextCoreWebVitals,
  ...nextTypescript,
];

export default eslintConfig;
