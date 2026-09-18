// Metro config for the MicroHealth mobile app.
//
// The design system lives at the repository root (`src/tokens`, `src/icons`,
// `src/rn`) and is consumed from here rather than copied, so web and native can
// never drift apart. Two settings make that safe:
//
//   watchFolders      — lets Metro see the shared folder outside this project.
//   nodeModulesPaths  — pins bare-import resolution to *this* app's
//                       node_modules. Without it Metro walks up from the
//                       shared folder into the root project, which carries its
//                       own React 18 and would give the app two copies.
//
// The shared modules are deliberately dependency-free (or depend only on
// react-native) so there is nothing else for Metro to resolve on their behalf.

const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const sharedRoot = path.resolve(projectRoot, "..", "src");

const config = getDefaultConfig(projectRoot);

config.watchFolders = [sharedRoot];

config.resolver.nodeModulesPaths = [path.resolve(projectRoot, "node_modules")];

/* The shared modules, reachable by name. Keep these in step with the `paths`
   entries in tsconfig.json — TypeScript and Metro resolve separately.

   Metro's own `resolver.alias` map only rewrites an *exact* module name, so
   `@rn/theme` would sail past an `"@rn"` entry and fail to resolve. Handling
   the rewrite in `resolveRequest` lets each alias cover its subpaths too. */
const aliases = {
  "@tokens": path.resolve(sharedRoot, "tokens"),
  "@rn": path.resolve(sharedRoot, "rn"),
  "@glyphs": path.resolve(sharedRoot, "icons", "geometry"),
  /* The metric registry and its read-time resolution. Framework-free, so the
     two platforms cannot disagree about what a reading means. */
  "@metrics": path.resolve(sharedRoot, "metrics"),
  "@app": path.resolve(sharedRoot, "app"),
  /* Bundled images live with the shared assets so both platforms use one file. */
  "@assets": path.resolve(sharedRoot, "assets"),
  "@": path.resolve(projectRoot, "src"),
};

config.resolver.resolveRequest = (context, moduleName, platform) => {
  for (const [prefix, target] of Object.entries(aliases)) {
    if (moduleName === prefix || moduleName.startsWith(`${prefix}/`)) {
      const rewritten = target + moduleName.slice(prefix.length);
      return context.resolveRequest(context, rewritten, platform);
    }
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
