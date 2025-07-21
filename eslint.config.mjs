import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals"),
  {
    ignores: [
      ".next/**/*",
      "node_modules/**/*",
      "dist/**/*",
      "build/**/*",
      "*.d.ts",
      "**/*.d.ts",
      ".git/**/*",
      "coverage/**/*",
      "public/**/*",
      "*.config.js",
      "*.config.mjs",
      "*.config.ts",
      "jest.config.js",
      "next.config.ts",
      "postcss.config.mjs",
      "tailwind.config.ts",
      "tailwind.config.js",
    ],
  },
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    rules: {
      "no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "react/no-unescaped-entities": "warn",
      "react-hooks/exhaustive-deps": "warn",
      "react-hooks/rules-of-hooks": "error",
      "@next/next/no-img-element": "warn",
    },
  },
  {
    files: ["**/*.test.{js,jsx,ts,tsx}", "tests/**/*", "**/__tests__/**/*"],
    rules: {
      "no-unused-vars": "off",
    },
  },
];

export default eslintConfig;
