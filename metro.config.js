const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require('nativewind/metro');
 
const config = getDefaultConfig(__dirname);

// Add 'wasm' to assetExts so Metro handles it correctly
config.resolver.assetExts.push('wasm');
 
module.exports = withNativeWind(config, { input: './global.css' });