const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch all files in the monorepo
config.watchFolders = [monorepoRoot];

// Tell Metro where to find packages
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// Enable symlink support for pnpm
config.resolver.unstable_enableSymlinks = true;

// Resolve from the project root first
config.resolver.disableHierarchicalLookup = false;

module.exports = withNativeWind(config, { input: './global.css' });
