/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  rootDir: ".",
  roots: ["<rootDir>/src", "<rootDir>/tests"],
  testMatch: ["**/*.test.ts"],
  moduleFileExtensions: ["ts", "tsx", "js", "json"],
  setupFiles: ["<rootDir>/tests/setup-env.ts"],
  testTimeout: 15000,
  // We rely on the in-memory store path (DATABASE_URL unset) so tests
  // never reach Postgres in CI.
  clearMocks: true,
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/index.ts",
    "!src/db/**"
  ]
};
