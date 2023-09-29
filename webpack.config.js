const path = require("path");
const DeclarationBundlerPlugin = require("typescript-declaration-webpack-plugin");

module.exports = {
  entry: "./src/index.ts",
  output: {
    filename: "main.js",
    path: path.resolve(__dirname, "dist"),
    libraryTarget: "umd",
    globalObject: "this",
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: [/(node_modules)/],
        use: [
          {
            loader: "ts-loader",
          },
        ],
      },
      {
        test: /\.d\.ts$/,
        use: "ignore-loader",
      },
      {
        test: /\.map$/,
        use: "ignore-loader",
      },
    ],
  },
  resolve: {
    modules: ["node_modules"],
    extensions: [".tsx", ".ts", ".js"],
    fallback: {
      stream: require.resolve("stream-browserify"),
      path: require.resolve("path-browserify"),
      tty: require.resolve("tty-browserify"),
      http: require.resolve("stream-http"),
      crypto: require.resolve("crypto-browserify"),
      https: require.resolve("https-browserify"),
      zlib: require.resolve("browserify-zlib"),
      child_process: false,
      fs: false,
      os: require.resolve("os-browserify/browser"),
      pnpapi: false,
      worker_threads: false,
    },
  },
  plugins: [
    new DeclarationBundlerPlugin({
      moduleName: "lit-listener-sdk",
      out: "./index.d.ts",
    }),
  ],
  mode: "production",
};
