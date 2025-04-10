import eslint from "@eslint/js";
import nextPlugin from "@next/eslint-plugin-next";

export default [
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    extends: [
      "eslint:recommended",
      "plugin:@typescript-eslint/recommended",
      "next/core-web-vitals",
    ],
    plugins: ["@typescript-eslint"],
    parser: "@typescript-eslint/parser",
    rules: {
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
];
