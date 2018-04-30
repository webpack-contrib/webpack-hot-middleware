module.exports = {
  testEnvironment: "node",
  testMatch: ["<rootDir>/test/*-test.js"],
  globals: {
    document: undefined,
    window: undefined,
    __resourceQuery: ''
  }
};
