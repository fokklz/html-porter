import * as vscode from "vscode";
import { getSettings, saveSetting } from "../settings";
import { TemplateData } from "../types";
import { toRelativePath } from "../utils";
import fileWatcher from "../classes/file-watcher"; // Adjust the import path based on your directory structure

export function addTemplate() {
  const editor = vscode.window.activeTextEditor;
  if (editor && editor.document.languageId === "html") {
    const absoluteHtmlFilePath = editor.document.uri.fsPath;

    const workspaceFolder = vscode.workspace.workspaceFolders
      ? vscode.workspace.workspaceFolders[0].uri.fsPath
      : undefined;

    if (workspaceFolder) {
      const settings = getSettings(workspaceFolder);
      if (!settings.templates) {
        settings.templates = [];
      }

      const relativeHtmlFilePath = toRelativePath(
        absoluteHtmlFilePath,
        workspaceFolder
      );

      // Check if template already exists
      const existingTemplate = settings.templates.find(
        (t: TemplateData) => t.path === relativeHtmlFilePath
      );
      if (!existingTemplate) {
        settings.templates.push({
          path: relativeHtmlFilePath,
          targets: [],
        });

        saveSetting(workspaceFolder, "templates", settings.templates);

        // Inform the FileWatcher to start watching this new template
        fileWatcher.addTemplate(relativeHtmlFilePath);

        vscode.window.showInformationMessage("Template added successfully.");
      } else {
        vscode.window.showWarningMessage(
          "This file is already marked as a template."
        );
      }
    }
  } else {
    vscode.window.showErrorMessage(
      "Please open an HTML file to add it as a template."
    );
  }
}
