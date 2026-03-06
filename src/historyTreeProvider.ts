import * as vscode from "vscode";
import { HistoryEntry } from "./types";
import { HistoryManager } from "./historyManager";

export class HistoryTreeItem extends vscode.TreeItem {
  constructor(
    public readonly entry: HistoryEntry,
    public readonly entryIndex: number
  ) {
    super(entry.fileName, vscode.TreeItemCollapsibleState.None);

    const lineDisplay = `L${entry.line + 1}`;
    this.description = entry.symbolName
      ? `${lineDisplay} ${entry.symbolName}`
      : lineDisplay;

    this.iconPath = entry.isManual
      ? new vscode.ThemeIcon("pinned")
      : new vscode.ThemeIcon("go-to-file");

    this.tooltip = `${entry.filePath}:${entry.line + 1}`;

    this.command = {
      command: "codeJumpTracker.navigateToEntry",
      title: "Navigate",
      arguments: [entry],
    };

    this.contextValue = "historyItem";
  }
}

export class HistoryTreeDataProvider
  implements vscode.TreeDataProvider<HistoryTreeItem>
{
  private readonly onDidChangeTreeDataEmitter =
    new vscode.EventEmitter<void>();
  readonly onDidChangeTreeData = this.onDidChangeTreeDataEmitter.event;

  private readonly disposable: vscode.Disposable;

  constructor(
    private readonly historyManager: HistoryManager,
    private readonly mode: "history" | "unique"
  ) {
    this.disposable = this.historyManager.onDidChange(() => {
      this.onDidChangeTreeDataEmitter.fire();
    });
  }

  getTreeItem(element: HistoryTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(): HistoryTreeItem[] {
    const history = this.historyManager.getHistory();

    if (this.mode === "unique") {
      const unique = this.historyManager.getUniqueLocations();
      return unique.map((entry) => {
        const originalIndex = history.indexOf(entry);
        return new HistoryTreeItem(entry, originalIndex);
      });
    }

    return [...history].map(
      (entry, index) => new HistoryTreeItem(entry, index)
    );
  }

  dispose(): void {
    this.disposable.dispose();
    this.onDidChangeTreeDataEmitter.dispose();
  }
}
