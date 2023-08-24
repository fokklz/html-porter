import * as vscode from "vscode";
import * as fs from "fs";
import { getSettings, saveSetting } from "../settings";
import {
  generateTemplateRegex,
  prefixContent,
  replaceTemplateContent,
} from "../utils";
import { toAbsolutePath, toRelativePath } from "../utils";
import { TemplateData } from "../types";

class FileWatcher {
  private watchers: { [key: string]: vscode.FileSystemWatcher } = {};

  constructor() {
    this.initializeWatchers();
  }

  private resolveWorkspaceFolder() {
    return vscode.workspace.workspaceFolders
      ? vscode.workspace.workspaceFolders[0].uri.fsPath
      : undefined;
  }

  public dispose() {
    for (const targetRelativePath in Object.keys(this.watchers)) {
      const watcher = this.watchers[targetRelativePath];
      if (watcher) {
        watcher.dispose();
        delete this.watchers[targetRelativePath];
      }
    }
  }

  private initializeWatchers() {
    const workspaceFolder = this.resolveWorkspaceFolder();
    if (workspaceFolder) {
      const settings = getSettings(workspaceFolder);
      for (const template of settings.templates) {
        this.createWatcher(template.path);
      }
    }
  }

  private createWatcher(templateRelativePath: string) {
    const workspaceFolder = this.resolveWorkspaceFolder();
    if (workspaceFolder) {
      const templateAbsolutePath = toAbsolutePath(
        templateRelativePath,
        workspaceFolder
      );

      if (!fs.existsSync(templateAbsolutePath)) {
        const settings = getSettings(workspaceFolder);
        const templateIndex = settings.templates.findIndex(
          (t: TemplateData) => t.path === templateRelativePath
        );

        if (templateIndex > -1) {
          const template = settings.templates[templateIndex];
          for (const targetRelativePath of template.targets) {
            const targetAbsolutePath = toAbsolutePath(
              targetRelativePath,
              workspaceFolder
            );
            if (fs.existsSync(targetAbsolutePath)) {
              const regex = generateTemplateRegex(template.path);
              replaceTemplateContent(targetAbsolutePath, regex, "");
            }
          }

          settings.templates.splice(templateIndex, 1);
          saveSetting(workspaceFolder, "templates", settings.templates);
        }
      }

      const watcher = vscode.workspace.createFileSystemWatcher(
        templateAbsolutePath,
        true,
        false,
        false
      );

      watcher.onDidChange(async (uri) => {
        await this.handleFileChange(uri);
      });
      watcher.onDidDelete(async (uri) => {
        await this.handleFileDelete(uri);
      });

      this.watchers[templateRelativePath] = watcher;
    }
  }

  private async handleFileDelete(uri: vscode.Uri) {
    const workspaceFolder = this.resolveWorkspaceFolder();
    if (workspaceFolder) {
      const settings = getSettings(workspaceFolder);
      const deletedTemplateRelativePath = toRelativePath(
        uri.fsPath,
        workspaceFolder
      );
      const templateIndex = settings.templates.findIndex(
        (t: TemplateData) => t.path === deletedTemplateRelativePath
      );

      if (templateIndex > -1) {
        const template = settings.templates[templateIndex];
        for (const targetRelativePath of template.targets) {
          const targetAbsolutePath = toAbsolutePath(
            targetRelativePath,
            workspaceFolder
          );
          if (fs.existsSync(targetAbsolutePath)) {
            const regex = generateTemplateRegex(template.path);
            await replaceTemplateContent(targetAbsolutePath, regex, "");
          }
        }

        settings.templates.splice(templateIndex, 1);
        saveSetting(workspaceFolder, "templates", settings.templates);
      }

      const watcher = this.watchers[deletedTemplateRelativePath];
      if (watcher) {
        watcher.dispose();
        delete this.watchers[deletedTemplateRelativePath];
      }
    }
  }

  private async handleFileChange(uri: vscode.Uri) {
    const workspaceFolder = this.resolveWorkspaceFolder();
    if (workspaceFolder) {
      const settings = getSettings(workspaceFolder);
      const changedTemplateRelativePath = toRelativePath(
        uri.fsPath,
        workspaceFolder
      );
      const template = settings.templates.find(
        (t: TemplateData) => t.path === changedTemplateRelativePath
      );

      if (template) {
        const templateContent = fs.readFileSync(uri.fsPath, "utf-8");
        const newContent = prefixContent(
          templateContent,
          changedTemplateRelativePath
        );

        for (const targetRelativePath of template.targets) {
          const targetAbsolutePath = toAbsolutePath(
            targetRelativePath,
            workspaceFolder
          );

          if (fs.existsSync(targetAbsolutePath)) {
            const regex = generateTemplateRegex(template.path);

            await replaceTemplateContent(targetAbsolutePath, regex, newContent);
          } else {
            const index = template.targets.indexOf(targetRelativePath);
            if (index > -1) {
              template.targets.splice(index, 1);
            }
            saveSetting(workspaceFolder, "templates", settings.templates);
          }
        }
      }
    }
  }

  public addTemplate(relativeTemplatePath: string) {
    this.createWatcher(relativeTemplatePath);
  }
}

const fileWatcher = new FileWatcher();
export default fileWatcher;
