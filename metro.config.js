// https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// When building for GitHub Pages (served at /CANTOKIDS/), set publicPath
// so all asset URLs are prefixed correctly.
// Set EXPO_PUBLIC_BASE_PATH env var during build to enable this.
if (process.env.EXPO_PUBLIC_BASE_PATH) {
  config.transformer = config.transformer || {};
  config.serializer = config.serializer || {};
  config.serializer.publicPath = process.env.EXPO_PUBLIC_BASE_PATH;
}

module.exports = config;
