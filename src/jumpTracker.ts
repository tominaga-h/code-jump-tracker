import * as vscode from "vscode";
import * as path from "path";
import { HistoryEntry } from "./types";
import { HistoryManager } from "./historyManager";

const DEBOUNCE_MS = 300;
const LINE_JUMP_THRESHOLD = 10;

export class JumpTracker implements vscode.Disposable {
  private readonly disposables: vscode.Disposable[] = [];
  private debounceTimer: ReturnType<typeof setTimeout> | undefined;
  private lastFile: string | undefined;
  private lastLine: number | undefined;
  private isNavigating = false;

  constructor(private readonly historyManager: HistoryManager) {}

  activate(): void {
    this.disposables.push(
      vscode.window.onDidChangeActiveTextEditor((editor) => {
        if (!editor || this.isNavigating) {
          return;
        }
        this.handleMovement(editor);
      }),
      vscode.window.onDidChangeTextEditorSelection((e) => {
        if (
          this.isNavigating ||
          e.kind === vscode.TextEditorSelectionChangeKind.Keyboard
        ) {
          return;
        }
        this.handleMovement(e.textEditor);
      })
    );

    const editor = vscode.window.activeTextEditor;
    if (editor) {
      this.lastFile = editor.document.uri.fsPath;
      this.lastLine = editor.selection.active.line;
    }
  }

  setNavigating(value: boolean): void {
    this.isNavigating = value;
  }

  private isDiffEditor(): boolean {
    const activeTab = vscode.window.tabGroups.activeTabGroup.activeTab;
    return activeTab?.input instanceof vscode.TabInputTextDiff;
  }

  private handleMovement(editor: vscode.TextEditor): void {
    if (editor.document.uri.scheme !== "file") {
      return;
    }

    if (this.isDiffEditor()) {
      return;
    }

    const currentFile = editor.document.uri.fsPath;
    const currentLine = editor.selection.active.line;

    const isFileChange = this.lastFile !== undefined && this.lastFile !== currentFile;
    const isLargeJump =
      this.lastFile === currentFile &&
      this.lastLine !== undefined &&
      Math.abs(currentLine - this.lastLine) >= LINE_JUMP_THRESHOLD;

    if (!isFileChange && !isLargeJump) {
      this.lastFile = currentFile;
      this.lastLine = currentLine;
      return;
    }

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.recordJump(editor);
    }, DEBOUNCE_MS);
  }

  private async recordJump(editor: vscode.TextEditor): Promise<void> {
    const position = editor.selection.active;
    const symbolInfo = await this.getSymbolInfo(
      editor.document.uri,
      position
    );

    const entry: HistoryEntry = {
      filePath: editor.document.uri.fsPath,
      fileName: path.basename(editor.document.uri.fsPath),
      line: position.line,
      column: position.character,
      symbolName: symbolInfo?.name ?? "",
      symbolKind: symbolInfo?.kind,
      isManual: false,
      timestamp: Date.now(),
    };

    this.historyManager.push(entry);
    this.lastFile = entry.filePath;
    this.lastLine = entry.line;
  }

  private async getSymbolInfo(
    uri: vscode.Uri,
    position: vscode.Position
  ): Promise<{ name: string; kind: vscode.SymbolKind } | undefined> {
    try {
      const symbols = await vscode.commands.executeCommand<
        vscode.DocumentSymbol[]
      >("vscode.executeDocumentSymbolProvider", uri);
      if (!symbols) {
        return undefined;
      }
      return this.findContainingSymbol(symbols, position);
    } catch {
      return undefined;
    }
  }

  private findContainingSymbol(
    symbols: vscode.DocumentSymbol[],
    position: vscode.Position
  ): { name: string; kind: vscode.SymbolKind } | undefined {
    for (const symbol of symbols) {
      if (symbol.range.contains(position)) {
        const child = this.findContainingSymbol(symbol.children, position);
        return child ?? { name: symbol.name, kind: symbol.kind };
      }
    }
    return undefined;
  }

  dispose(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    for (const d of this.disposables) {
      d.dispose();
    }
  }
}
