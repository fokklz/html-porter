import * as path from "path";
import * as vscode from "vscode";

export function prefixContent(content: string, file: string): string {
  const startComment = `<!-- TEMPLATE_START: ${file} -->\n`;
  const endComment = `\n<!-- TEMPLATE_END: ${file} -->`;
  return startComment + content + endComment;
}

export function generateTemplateRegex(filePath: string): RegExp {
  // Escape special characters in the file path for regex
  const escapedPath = filePath.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
  return new RegExp(
    `\\<\\!\\-\\-[\\s]{1}TEMPLATE_START\\:[\\s]{1}${escapedPath}[\\s]{1}\\-\\-\\>[\\s\\S]*?\\<\\!\\-\\-[\\s]{1}TEMPLATE_END\\:[\\s]{1}${escapedPath}[\\s]{1}\\-\\-\\>`,
    "g"
  );
}

export async function replaceTemplateContent(
  filePath: string,
  regex: RegExp,
  newContent: string
) {
  // Read the current content of the file
  const fileUri = vscode.Uri.file(filePath);
  const fileData = await vscode.workspace.fs.readFile(fileUri);
  const fileContent = fileData.toString();

  // Replace the content if the regex matches
  if (regex.test(fileContent)) {
    const replacedContent = fileContent.replace(regex, newContent);

    // Write the updated content back to the file
    const newFileData = Buffer.from(replacedContent);
    await vscode.workspace.fs.writeFile(fileUri, newFileData);
  }
}
export function toRelativePath(
  absolutePath: string,
  workspaceFolder: string
): string {
  return path.relative(workspaceFolder, absolutePath);
}

export function toAbsolutePath(
  relativePath: string,
  workspaceFolder: string
): string {
  return path.resolve(workspaceFolder, relativePath);
}
