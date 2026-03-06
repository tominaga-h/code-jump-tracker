import * as vscode from "vscode";
import * as path from "path";
import { HistoryEntry } from "./types";
import { HistoryManager } from "./historyManager";
import { TREE_URI_SCHEME } from "./activeFileDecorationProvider";

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

type FileGroupTreeNode = FileGroupItem | FileEntryItem;

export class FileGroupItem extends vscode.TreeItem {
  constructor(
    public readonly filePath: string,
    public readonly entryCount: number
  ) {
    const fileName = path.basename(filePath);
    super(fileName, vscode.TreeItemCollapsibleState.Collapsed);

    this.description = `(${entryCount})`;
    this.iconPath = new vscode.ThemeIcon("symbol-file");
    this.tooltip = filePath;
    this.contextValue = "fileGroupItem";
  }
}

export class FileEntryItem extends vscode.TreeItem {
  constructor(
    public readonly entry: HistoryEntry,
    public readonly entryIndex: number
  ) {
    const label = entry.symbolName || `L${entry.line + 1}`;
    super(label, vscode.TreeItemCollapsibleState.None);

    this.description = `L${entry.line + 1}`;

    if (entry.isManual) {
      this.iconPath = new vscode.ThemeIcon("pinned");
    } else {
      const iconId =
        entry.symbolKind != null
          ? symbolKindIconMap[entry.symbolKind] ?? "symbol-misc"
          : "symbol-file";
      this.iconPath = new vscode.ThemeIcon(iconId);
    }

    this.resourceUri = vscode.Uri.from({
      scheme: TREE_URI_SCHEME,
      path: entry.filePath,
      query: `index=${entryIndex}`,
    });

    this.tooltip = `${entry.filePath}:${entry.line + 1}`;

    this.command = {
      command: "codeJumpTracker.navigateToEntry",
      title: "Navigate",
      arguments: [entry],
    };

    this.contextValue = "historyItem";
  }
}

export class FileGroupTreeProvider
  implements vscode.TreeDataProvider<FileGroupTreeNode>
{
  private readonly onDidChangeTreeDataEmitter =
    new vscode.EventEmitter<void>();
  readonly onDidChangeTreeData = this.onDidChangeTreeDataEmitter.event;

  private readonly disposable: vscode.Disposable;

  constructor(private readonly historyManager: HistoryManager) {
    this.disposable = this.historyManager.onDidChange(() => {
      this.onDidChangeTreeDataEmitter.fire();
    });
  }

  getTreeItem(element: FileGroupTreeNode): vscode.TreeItem {
    return element;
  }

  getParent(element: FileGroupTreeNode): FileGroupItem | undefined {
    if (element instanceof FileEntryItem) {
      const groups = this.buildGroups();
      const group = groups.get(element.entry.filePath);
      if (group) {
        return new FileGroupItem(element.entry.filePath, group.length);
      }
    }
    return undefined;
  }

  getChildren(element?: FileGroupTreeNode): FileGroupTreeNode[] {
    if (!element) {
      return this.getRootItems();
    }
    if (element instanceof FileGroupItem) {
      return this.getFileEntries(element.filePath);
    }
    return [];
  }

  private buildGroups(): Map<string, { entry: HistoryEntry; index: number }[]> {
    const history = this.historyManager.getHistory();
    const seen = new Set<string>();
    const groups = new Map<
      string,
      { entry: HistoryEntry; index: number }[]
    >();
    history.forEach((entry, index) => {
      const dedupeKey = `${entry.filePath}:${entry.line}`;
      if (seen.has(dedupeKey)) {
        return;
      }
      seen.add(dedupeKey);
      const key = entry.filePath;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push({ entry, index });
    });
    return groups;
  }

  private getRootItems(): FileGroupItem[] {
    const groups = this.buildGroups();
    const items: FileGroupItem[] = [];
    for (const [filePath, entries] of groups) {
      items.push(new FileGroupItem(filePath, entries.length));
    }
    items.sort((a, b) => {
      const nameA = path.basename(a.filePath).toLowerCase();
      const nameB = path.basename(b.filePath).toLowerCase();
      return nameA.localeCompare(nameB);
    });
    return items;
  }

  private getFileEntries(filePath: string): FileEntryItem[] {
    const groups = this.buildGroups();
    const entries = groups.get(filePath) ?? [];
    const sorted = [...entries].sort((a, b) => a.entry.line - b.entry.line);
    return sorted.map((e) => new FileEntryItem(e.entry, e.index));
  }

  dispose(): void {
    this.disposable.dispose();
    this.onDidChangeTreeDataEmitter.dispose();
  }
}
