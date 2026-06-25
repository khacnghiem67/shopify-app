/** @type {import('@types/eslint').Linter.BaseConfig} */
module.exports = {
  root: true,
  extends: [
    "@remix-run/eslint-config",
    "@remix-run/eslint-config/node",
    "@remix-run/eslint-config/jest-testing-library",
    "prettier",
  ],
  globals: {
    shopify: "readonly"
  },
  settings: {
    // We use Vitest (jest-compatible API), not Jest, so eslint-plugin-jest
    // (pulled in by @remix-run/eslint-config/jest-testing-library) cannot
    // auto-detect a Jest version and crashes on *.test.ts files. Pin it.
    jest: { version: 28 },
  },
};
