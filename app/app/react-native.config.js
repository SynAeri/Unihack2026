// react-native.config.js
// Used by the React Native CLI for linking static assets.
// This is required for native builds that need to bundle custom ML model files.

module.exports = {
  assets: [
    "./assets/model/",
  ],
};
