import * as vscode from "vscode";
import * as fs from "fs";
import { getSettings, saveSetting } from "../settings";
import { prefixContent, toAbsolutePath, toRelativePath } from "../utils"; // Assuming you have this utility function as discussed before
import { TemplateData } from "../types";

export function useTemplate() {
  const editor = vscode.window.activeTextEditor;
  if (editor && editor.document.languageId === "html") {
    const currentPosition = editor.selection.active;
    const currentLine = editor.document.lineAt(currentPosition).text.trim();

    if (currentLine === "") {
      const workspaceFolder = vscode.workspace.workspaceFolders
        ? vscode.workspace.workspaceFolders[0].uri.fsPath
        : undefined;

      if (workspaceFolder) {
        const settings = getSettings(workspaceFolder);
        const currentFileRelativePath = toRelativePath(
          editor.document.uri.fsPath,
          workspaceFolder
        );

        // Ask user to select a template
        const templatePaths = settings.templates.map(
          (t: TemplateData) => t.path
        );
        vscode.window
          .showQuickPick(templatePaths, { placeHolder: "Select a template" })
          .then((selectedTemplatePath) => {
            if (selectedTemplatePath) {
              const template = settings.templates.find(
                (t: TemplateData) => t.path === selectedTemplatePath
              );
              if (template) {
                // Update targets of the selected template
                if (!template.targets.includes(currentFileRelativePath)) {
                  template.targets.push(currentFileRelativePath);
                  saveSetting(workspaceFolder, "templates", settings.templates);
                }

                // Insert template content at the current position
                const absoluteTemplatePath = toAbsolutePath(
                  selectedTemplatePath,
                  workspaceFolder
                );
                const templateContent = fs.readFileSync(
                  absoluteTemplatePath,
                  "utf-8"
                );
                editor
                  .edit((editBuilder) => {
                    editBuilder.insert(
                      currentPosition,
                      prefixContent(templateContent, template.path)
                    );
                  })
                  .then((success) => {
                    if (success) {
                      // Set cursor's position to the second line (just after the start comment)
                      const foldingStartPosition = currentPosition.translate(
                        1,
                        0
                      ); // Move to the next line
                      editor.selection = new vscode.Selection(
                        foldingStartPosition,
                        foldingStartPosition
                      );
                      editor.revealRange(
                        new vscode.Range(
                          foldingStartPosition,
                          foldingStartPosition
                        ),
                        vscode.TextEditorRevealType.InCenterIfOutsideViewport
                      );

                      // Enforce folding
                      vscode.commands.executeCommand("editor.fold");
                      editor.document.save();
                    }
                  });
              }
            }
          });
      }
    } else {
      vscode.window.showErrorMessage(
        "Please select an empty line to insert the template."
      );
    }
  } else {
    vscode.window.showErrorMessage(
      "Please open an HTML file to insert a template."
    );
  }
}
