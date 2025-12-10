const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  resolver: {
    blockList: [
      // Block temporary native build files from being watched
      new RegExp(
        `${path.resolve(__dirname, 'android/app/.cxx').replace(/[/\\\\]/g, '[/\\\\]')}.*`,
      ),
    ],
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);

