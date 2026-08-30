const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Add 'wasm' and 'tflite' to assetExts so Metro handles them correctly
config.resolver.assetExts.push("wasm");
config.resolver.assetExts.push("tflite");

module.exports = withNativeWind(config, { input: "./global.css" });
