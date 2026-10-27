// Expo's default Metro config already handles pnpm monorepos (watchFolders + nodeModulesPaths).
const { getDefaultConfig } = require('expo/metro-config');

module.exports = getDefaultConfig(__dirname);
