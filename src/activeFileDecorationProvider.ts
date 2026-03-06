import * as vscode from "vscode";
import * as path from "path";

export const TREE_URI_SCHEME = "codeJumpTracker";

export class ActiveFileDecorationProvider
  implements vscode.FileDecorationProvider
{
  private readonly onDidChangeEmitter = new vscode.EventEmitter<
    vscode.Uri | vscode.Uri[] | undefined
  >();
  readonly onDidChangeFileDecorations = this.onDidChangeEmitter.event;

  private activeFilePath: string | undefined;

  setActiveFile(filePath: string | undefined): void {
    this.activeFilePath = filePath ? path.normalize(filePath) : undefined;
    this.onDidChangeEmitter.fire(undefined);
  }

  provideFileDecoration(
    uri: vscode.Uri
  ): vscode.FileDecoration | undefined {
    if (uri.scheme !== TREE_URI_SCHEME || !this.activeFilePath) {
      return undefined;
    }
    if (path.normalize(uri.path) !== this.activeFilePath) {
      return undefined;
    }
    return new vscode.FileDecoration(
      undefined,
      undefined,
      new vscode.ThemeColor("list.highlightForeground")
    );
  }

  dispose(): void {
    this.onDidChangeEmitter.dispose();
  }
}
