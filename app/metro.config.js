// Shim: uniwind expects metro/private/DeltaBundler/Graph, removed in Metro 0.83
const Module = require("module");
const path = require("path");
const _resolve = Module._resolveFilename;
Module._resolveFilename = function (request, parent, ...args) {
  if (request === "metro/private/DeltaBundler/Graph") {
    return path.join(
      __dirname,
      "node_modules/metro-config/node_modules/metro/src/DeltaBundler/Graph.js"
    );
  }
  return _resolve.call(this, request, parent, ...args);
};

const { getDefaultConfig } = require("expo/metro-config");
const { withUniwindConfig } = require("uniwind/metro");
const { wrapWithReanimatedMetroConfig } = require("react-native-reanimated/metro-config");

const config = getDefaultConfig(__dirname);
config.resolver.assetExts.push("fbx", "glb", "gltf", "obj", "mtl");

module.exports = withUniwindConfig(
  wrapWithReanimatedMetroConfig(config),
  {
    cssEntryFile: "./global.css",
  }
);
