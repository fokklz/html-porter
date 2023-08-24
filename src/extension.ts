// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { addTemplate } from "./commands/add-template";
import { useTemplate } from "./commands/use-template";
import { updateTemplates } from "./commands/update-templates";

import fileWatcher from "./classes/file-watcher";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated

  let addTemplateCommand = vscode.commands.registerCommand(
    "html-porter.add-template",
    addTemplate
  );
  context.subscriptions.push(addTemplateCommand);

  let useTemplateCommand = vscode.commands.registerCommand(
    "html-porter.use-template",
    useTemplate
  );
  context.subscriptions.push(useTemplateCommand);

  let updateTemplatesCommand = vscode.commands.registerCommand(
    "html-porter.update-templates",
    updateTemplates
  );
  context.subscriptions.push(updateTemplatesCommand);
}

// This method is called when your extension is deactivated
export function deactivate() {
  fileWatcher.dispose();
}
