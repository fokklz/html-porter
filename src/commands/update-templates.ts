import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { getSettings } from "../settings"; // Assuming you have this function
import {
  prefixContent,
  generateTemplateRegex,
  replaceTemplateContent,
  toAbsolutePath,
} from "../utils"; // Utility functions

export async function updateTemplates() {
  const workspaceFolder = vscode.workspace.workspaceFolders
    ? vscode.workspace.workspaceFolders[0].uri.fsPath
    : undefined;
  if (!workspaceFolder) {
    vscode.window.showErrorMessage("No workspace folder found.");
    return;
  }

  const settings = getSettings(workspaceFolder);
  for (const template of settings.templates) {
    const absoluteTemplatePath = toAbsolutePath(template.path, workspaceFolder);
    if (fs.existsSync(absoluteTemplatePath)) {
      const content = fs.readFileSync(absoluteTemplatePath, "utf-8");
      const prefixedContent = prefixContent(content, template.path);

      for (const targetRelativePath of template.targets) {
        const targetAbsolutePath = path.resolve(
          workspaceFolder,
          targetRelativePath
        );
        const regex = generateTemplateRegex(template.path);

        await replaceTemplateContent(
          targetAbsolutePath,
          regex,
          prefixedContent
        );
      }
    } else {
      vscode.window.showWarningMessage(
        `Template not found at path: ${absoluteTemplatePath}`
      );
    }
  }
  vscode.window.showInformationMessage(
    "Templates updated successfully in all targets."
  );
}
