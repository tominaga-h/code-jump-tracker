import * as vscode from "vscode";
import * as path from "path";
import { HistoryEntry } from "./types";
import { HistoryManager } from "./historyManager";
import { JumpTracker } from "./jumpTracker";
import { GutterManager } from "./gutterManager";
import {
  HistoryTreeDataProvider,
  HistoryTreeItem,
} from "./historyTreeProvider";

export function activate(context: vscode.ExtensionContext): void {
  const historyManager = new HistoryManager(context.workspaceState);
  historyManager.restore();

  const jumpTracker = new JumpTracker(historyManager);
  jumpTracker.activate();

  const gutterManager = new GutterManager(historyManager, context.extensionUri);

  const historyLogProvider = new HistoryTreeDataProvider(historyManager);

  context.subscriptions.push(
    vscode.window.registerTreeDataProvider(
      "codeJumpTracker.historyLog",
      historyLogProvider
    ),

    vscode.commands.registerCommand(
      "codeJumpTracker.navigateToEntry",
      async (entry: HistoryEntry) => {
        await openEntry(entry);
      }
    ),

    vscode.commands.registerCommand(
      "codeJumpTracker.deleteItem",
      (item: HistoryTreeItem) => {
        historyManager.remove(item.entryIndex);
      }
    ),

    vscode.commands.registerCommand(
      "codeJumpTracker.pushManual",
      async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document.uri.scheme !== "file") {
          return;
        }

        const position = editor.selection.active;
        const symbolInfo = await getSymbolInfo(
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
          isManual: true,
          timestamp: Date.now(),
        };

        historyManager.push(entry);
        gutterManager.updateDecorations();
      }
    ),

    vscode.commands.registerCommand("codeJumpTracker.goBack", async () => {
      jumpTracker.setNavigating(true);
      try {
        const entry = historyManager.goBack();
        if (entry) {
          await openEntry(entry);
        }
      } finally {
        setTimeout(() => jumpTracker.setNavigating(false), 100);
      }
    }),

    vscode.commands.registerCommand("codeJumpTracker.goForward", async () => {
      jumpTracker.setNavigating(true);
      try {
        const entry = historyManager.goForward();
        if (entry) {
          await openEntry(entry);
        }
      } finally {
        setTimeout(() => jumpTracker.setNavigating(false), 100);
      }
    }),

    vscode.commands.registerCommand("codeJumpTracker.sortOrderDesc", () => {
      historyLogProvider.toggleSortOrder();
    }),

    vscode.commands.registerCommand("codeJumpTracker.sortOrderAsc", () => {
      historyLogProvider.toggleSortOrder();
    }),

    vscode.commands.registerCommand("codeJumpTracker.clearAll", () => {
      historyManager.clearAll();
    }),

    jumpTracker,
    gutterManager,
    historyManager,
    historyLogProvider
  );
}

async function openEntry(entry: HistoryEntry): Promise<void> {
  const uri = vscode.Uri.file(entry.filePath);
  const doc = await vscode.workspace.openTextDocument(uri);
  const editor = await vscode.window.showTextDocument(doc, {
    preserveFocus: false,
  });
  const pos = new vscode.Position(entry.line, entry.column);
  editor.selection = new vscode.Selection(pos, pos);
  editor.revealRange(
    new vscode.Range(pos, pos),
    vscode.TextEditorRevealType.InCenter
  );
}

async function getSymbolInfo(
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
    return findContainingSymbol(symbols, position);
  } catch {
    return undefined;
  }
}

function findContainingSymbol(
  symbols: vscode.DocumentSymbol[],
  position: vscode.Position
): { name: string; kind: vscode.SymbolKind } | undefined {
  for (const symbol of symbols) {
    if (symbol.range.contains(position)) {
      const child = findContainingSymbol(symbol.children, position);
      return child ?? { name: symbol.name, kind: symbol.kind };
    }
  }
  return undefined;
}

export function deactivate(): void {
  // Cleanup handled by disposables
}
