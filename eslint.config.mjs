import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/** React Compiler lint rules are accurate but very slow on large codebases. */
const reactCompilerRulesOff = Object.fromEntries(
  [
    "config",
    "error-boundaries",
    "gating",
    "globals",
    "immutability",
    "incompatible-library",
    "preserve-manual-memoization",
    "purity",
    "refs",
    "set-state-in-effect",
    "set-state-in-render",
    "static-components",
    "unsupported-syntax",
    "use-memo",
  ].map((rule) => [`react-hooks/${rule}`, "off"]),
);

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    settings: {
      "import/resolver": {
        typescript: { alwaysTryTypes: false },
      },
    },
    rules: reactCompilerRulesOff,
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "node_modules/**",
    "public/**",
    "supabase/**",
  ]),
]);

export default eslintConfig;
