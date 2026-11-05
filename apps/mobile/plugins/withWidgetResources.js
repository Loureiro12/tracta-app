// Widgets run in their own iOS extension, which can't see what the app embeds. This adds to the
// extension made by expo-widgets the Archivo instances the widgets use and the translations of
// their names and descriptions in the widget gallery (written in English in the config).
// List it before expo-widgets: plugins listed earlier run later, once the widget target exists.
// CommonJS: the Expo config loader requires local plugins as plain JavaScript.
/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

const plist = require('@expo/plist').default;
const { withDangerousMod, withXcodeProject } = require('expo/config-plugins');
/* eslint-enable @typescript-eslint/no-require-imports */

const TARGET = 'ExpoWidgetsTarget';
/** Own folder: the app target already references files with these names. */
const FOLDER = 'WidgetFonts';

/** "key" = "value"; lines of a .strings file. */
const stringsFile = (strings) =>
  Object.entries(strings)
    .map(([key, value]) => `${JSON.stringify(key)} = ${JSON.stringify(value)};`)
    .join('\n') + '\n';

/**
 * @type {import('expo/config-plugins').ConfigPlugin<{
 *   fonts: string[];
 *   strings: Record<string, Record<string, string>>;
 * }>}
 */
const withWidgetResources = (config, { fonts, strings }) => {
  const languages = Object.keys(strings);
  config = withXcodeProject(config, (config) => {
    const project = config.modResults;
    const targetUuid = project.findTargetKey(TARGET);
    if (!targetUuid) return config;
    const objects = project.hash.project.objects;
    const groups = objects.PBXGroup;
    const groupKey = Object.keys(groups).find(
      (key) => groups[key]?.name === TARGET || groups[key]?.path === TARGET,
    );
    const phases = objects.PBXResourcesBuildPhase ?? {};
    const target = project.pbxNativeTargetSection()[targetUuid];
    let phaseKey = target.buildPhases.map((p) => p.value).find((key) => phases[key]);
    if (!phaseKey) {
      phaseKey = project.addBuildPhase([], 'PBXResourcesBuildPhase', 'Resources', targetUuid).uuid;
    }
    // By hand: the xcode library's helpers would also add them to the app target, which has them.
    for (const font of fonts) {
      const file = project.addFile(`${FOLDER}/${path.basename(font)}`, groupKey, {});
      if (!file) continue;
      file.uuid = project.generateUuid();
      file.target = targetUuid;
      project.addToPbxBuildFileSection(file);
      objects.PBXResourcesBuildPhase[phaseKey].files.push({
        value: file.uuid,
        comment: `${file.basename} in Resources`,
      });
    }
    // Folder references keep the .lproj folders whole in the bundle, where iOS looks them up.
    for (const language of languages) {
      const file = project.addFile(`${language}.lproj`, groupKey, {
        lastKnownFileType: 'folder',
      });
      if (!file) continue;
      file.uuid = project.generateUuid();
      file.target = targetUuid;
      project.addToPbxBuildFileSection(file);
      objects.PBXResourcesBuildPhase[phaseKey].files.push({
        value: file.uuid,
        comment: `${file.basename} in Resources`,
      });
    }
    return config;
  });

  // expo-widgets recreates the target folder, so the files go in once it exists.
  return withDangerousMod(config, [
    'ios',
    (config) => {
      const targetDir = path.join(config.modRequest.platformProjectRoot, TARGET);
      if (!fs.existsSync(targetDir)) return config;
      fs.mkdirSync(path.join(targetDir, FOLDER), { recursive: true });
      for (const font of fonts) {
        fs.copyFileSync(
          path.join(config.modRequest.projectRoot, font),
          path.join(targetDir, FOLDER, path.basename(font)),
        );
      }
      const infoPath = path.join(targetDir, 'Info.plist');
      const info = plist.parse(fs.readFileSync(infoPath, 'utf8'));
      // Xcode copies resources to the bundle root, without the folder.
      info.UIAppFonts = fonts.map((f) => path.basename(f));
      fs.writeFileSync(infoPath, plist.build(info));
      for (const language of languages) {
        const dir = path.join(targetDir, `${language}.lproj`);
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(path.join(dir, 'Localizable.strings'), stringsFile(strings[language]));
      }
      return config;
    },
  ]);
};

module.exports = withWidgetResources;
