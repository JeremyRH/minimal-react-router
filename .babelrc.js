module.exports = ({ env }) => {
  const isTest = env("test");
  return {
    plugins: [
      ["@babel/plugin-transform-typescript", { isTSX: true }],
      isTest ? "@babel/plugin-transform-react-jsx" : "@babel/plugin-syntax-jsx",
      isTest
        ? "babel-plugin-dynamic-import-node"
        : "@babel/plugin-syntax-dynamic-import",
      "@babel/plugin-transform-modules-commonjs"
    ],
    ignore: isTest
      ? undefined
      : ["**/*.test.ts", "**/*.test.tsx", "**/*.test.js"]
  };
};
