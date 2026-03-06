import * as vscode from "vscode";
import * as path from "path";
import { HistoryManager } from "./historyManager";

export class GutterManager implements vscode.Disposable {
  private readonly decorationType: vscode.TextEditorDecorationType;
  private readonly disposables: vscode.Disposable[] = [];

  constructor(
    private readonly historyManager: HistoryManager,
    extensionUri: vscode.Uri
  ) {
    this.decorationType = vscode.window.createTextEditorDecorationType({
      gutterIconPath: vscode.Uri.joinPath(extensionUri, "resources", "icon_pin.svg"),
      gutterIconSize: "contain",
    });

    this.disposables.push(
      vscode.window.onDidChangeActiveTextEditor(() => {
        this.updateDecorations();
      }),
      this.historyManager.onDidChange(() => {
        this.updateDecorations();
      })
    );

    this.updateDecorations();
  }

  updateDecorations(): void {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }

    const currentPath = editor.document.uri.fsPath;
    const manualEntries = this.historyManager.getManualEntries();
    const ranges: vscode.Range[] = [];

    for (const entry of manualEntries) {
      if (path.normalize(entry.filePath) === path.normalize(currentPath)) {
        const line = entry.line;
        ranges.push(new vscode.Range(line, 0, line, 0));
      }
    }

    editor.setDecorations(this.decorationType, ranges);
  }

  dispose(): void {
    this.decorationType.dispose();
    for (const d of this.disposables) {
      d.dispose();
    }
  }
}
