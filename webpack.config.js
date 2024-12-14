const path = require("path");

module.exports = {
  mode: "development", // Change to "development" for debugging with source maps

  // Define multiple entry points for scripts
  entry: {
    background: "./src/background.ts", // Background script
    content: "./src/content/index.ts", // Content script
    popup: "./src/popup/popup.ts", // Popup script
  },

  // Output configuration for bundled files
  output: {
    filename: "[name].js", // Output filenames: background.js, content.js, popup.js
    path: path.resolve(__dirname, "dist"), // Output directory
    clean: true, // Clean output folder before each build
  },

  // Resolve extensions so imports don't need full file names
  resolve: {
    extensions: [".ts", ".js", ".json"],
  },

  // Loaders for processing different file types
  module: {
    rules: [
      {
        test: /\.ts$/, // Match all .ts files
        use: "ts-loader", // Compile TypeScript files
        exclude: /node_modules/,
      },
      {
        test: /\.css$/, // Match all .css files
        use: ["style-loader", "css-loader"], // Inject and bundle CSS
      },
      {
        test: /\.html$/, // Match all .html files
        use: "html-loader", // Bundle HTML files
      },
    ],
  },

  // Generate source maps for debugging (optional)
  devtool: "source-map",

  // Optimization to split shared dependencies into separate chunks (optional)
  optimization: {
    splitChunks: {
      chunks: "all", // Split common dependencies
    },
  },
};
