import * as fs from "fs";
import * as path from "path";

/**
 * Returns the path to the settings file.
 * @param workspaceRoot - The root path of the workspace.
 */
function getSettingsFilePath(workspaceRoot: string): string {
  return path.join(workspaceRoot, ".vscode", "htmlTemplates.json");
}

/**
 * Fetches the current settings.
 * @param workspaceRoot - The root path of the workspace.
 */
export function getSettings(workspaceRoot: string) {
  const settingsPath = getSettingsFilePath(workspaceRoot);
  if (fs.existsSync(settingsPath)) {
    return JSON.parse(fs.readFileSync(settingsPath, "utf-8"));
  }
  return { templates: [] };
}

/**
 * Saves a specific setting.
 * @param workspaceRoot - The root path of the workspace.
 * @param key - The setting key.
 * @param value - The setting value.
 */
export function saveSetting(workspaceRoot: string, key: string, value: any) {
  const settings = getSettings(workspaceRoot);
  settings[key] = value;
  const settingsPath = getSettingsFilePath(workspaceRoot);

  const dir = path.dirname(settingsPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 4));
}
