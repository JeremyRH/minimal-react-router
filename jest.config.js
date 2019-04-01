module.exports = {
  rootDir: "./",
  roots: ["<rootDir>/src"],
  transform: {
    "\\.(ts|tsx|js)$": "babel-jest"
  },
  setupFiles: ["<rootDir>/jest.setup.js"],
  testMatch: ["<rootDir>/src/**/*.test.{ts,tsx,js}"],
  testEnvironment: "jsdom",
  testURL: "http://localhost",
  collectCoverageFrom: ["<rootDir>/src/**/*.{ts,tsx,js}"],
  coverageDirectory: "test_coverage"
};
