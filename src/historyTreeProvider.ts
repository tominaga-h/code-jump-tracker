import * as vscode from "vscode";
import { HistoryEntry } from "./types";
import { HistoryManager } from "./historyManager";

const symbolKindIconMap: Record<number, string> = {
  [vscode.SymbolKind.File]: "symbol-file",
  [vscode.SymbolKind.Module]: "symbol-module",
  [vscode.SymbolKind.Namespace]: "symbol-namespace",
  [vscode.SymbolKind.Package]: "symbol-package",
  [vscode.SymbolKind.Class]: "symbol-class",
  [vscode.SymbolKind.Method]: "symbol-method",
  [vscode.SymbolKind.Property]: "symbol-property",
  [vscode.SymbolKind.Field]: "symbol-field",
  [vscode.SymbolKind.Constructor]: "symbol-constructor",
  [vscode.SymbolKind.Enum]: "symbol-enum",
  [vscode.SymbolKind.Interface]: "symbol-interface",
  [vscode.SymbolKind.Function]: "symbol-function",
  [vscode.SymbolKind.Variable]: "symbol-variable",
  [vscode.SymbolKind.Constant]: "symbol-constant",
  [vscode.SymbolKind.String]: "symbol-string",
  [vscode.SymbolKind.Number]: "symbol-numeric",
  [vscode.SymbolKind.Boolean]: "symbol-boolean",
  [vscode.SymbolKind.Array]: "symbol-array",
  [vscode.SymbolKind.Object]: "symbol-object",
  [vscode.SymbolKind.Key]: "symbol-key",
  [vscode.SymbolKind.Null]: "symbol-null",
  [vscode.SymbolKind.EnumMember]: "symbol-enum-member",
  [vscode.SymbolKind.Struct]: "symbol-struct",
  [vscode.SymbolKind.Event]: "symbol-event",
  [vscode.SymbolKind.Operator]: "symbol-operator",
  [vscode.SymbolKind.TypeParameter]: "symbol-type-parameter",
};

export class HistoryTreeItem extends vscode.TreeItem {
  constructor(
    public readonly entry: HistoryEntry,
    public readonly entryIndex: number
  ) {
    const label = entry.symbolName || entry.fileName;
    super(label, vscode.TreeItemCollapsibleState.None);

    this.description = entry.fileName;

    if (entry.isManual) {
      this.iconPath = new vscode.ThemeIcon("pinned");
    } else {
      const iconId =
        entry.symbolKind != null
          ? symbolKindIconMap[entry.symbolKind] ?? "symbol-misc"
          : "symbol-file";
      this.iconPath = new vscode.ThemeIcon(iconId);
    }

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
  private sortOrder: "asc" | "desc" = "desc";

  constructor(private readonly historyManager: HistoryManager) {
    this.disposable = this.historyManager.onDidChange(() => {
      this.onDidChangeTreeDataEmitter.fire();
    });
    vscode.commands.executeCommand(
      "setContext",
      "codeJumpTracker.sortOrder",
      this.sortOrder
    );
  }

  toggleSortOrder(): void {
    this.sortOrder = this.sortOrder === "desc" ? "asc" : "desc";
    vscode.commands.executeCommand(
      "setContext",
      "codeJumpTracker.sortOrder",
      this.sortOrder
    );
    this.onDidChangeTreeDataEmitter.fire();
  }

  getTreeItem(element: HistoryTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(): HistoryTreeItem[] {
    const history = this.historyManager.getHistory();
    const unique = this.historyManager.getUniqueLocations();
    const items = unique.map((entry) => {
      const originalIndex = history.indexOf(entry);
      return new HistoryTreeItem(entry, originalIndex);
    });
    if (this.sortOrder === "desc") {
      items.reverse();
    }
    return items;
  }

  dispose(): void {
    this.disposable.dispose();
    this.onDidChangeTreeDataEmitter.dispose();
  }
}
