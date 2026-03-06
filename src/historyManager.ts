import * as vscode from "vscode";
import { HistoryEntry } from "./types";

const STATE_KEY = "codeJumpTracker.history";
const CURSOR_KEY = "codeJumpTracker.cursor";

export class HistoryManager {
  private history: HistoryEntry[] = [];
  private cursor = -1;
  private readonly onDidChangeEmitter = new vscode.EventEmitter<void>();
  readonly onDidChange = this.onDidChangeEmitter.event;

  constructor(private readonly state: vscode.Memento) {}

  private get maxSize(): number {
    return vscode.workspace
      .getConfiguration("codeJumpTracker")
      .get<number>("maxHistorySize", 50);
  }

  push(entry: HistoryEntry): void {
    if (this.cursor < this.history.length - 1) {
      this.history = this.history.slice(0, this.cursor + 1);
    }

    this.history.push(entry);

    while (this.history.length > this.maxSize) {
      this.history.shift();
    }

    this.cursor = this.history.length - 1;
    this.save();
    this.onDidChangeEmitter.fire();
  }

  remove(index: number): void {
    if (index < 0 || index >= this.history.length) {
      return;
    }
    this.history.splice(index, 1);

    if (this.cursor >= this.history.length) {
      this.cursor = this.history.length - 1;
    } else if (index <= this.cursor) {
      this.cursor = Math.max(-1, this.cursor - 1);
    }

    this.save();
    this.onDidChangeEmitter.fire();
  }

  clearAll(): void {
    this.history = [];
    this.cursor = -1;
    this.save();
    this.onDidChangeEmitter.fire();
  }

  goBack(): HistoryEntry | undefined {
    if (this.cursor <= 0) {
      return undefined;
    }
    this.cursor--;
    this.save();
    this.onDidChangeEmitter.fire();
    return this.history[this.cursor];
  }

  goForward(): HistoryEntry | undefined {
    if (this.cursor >= this.history.length - 1) {
      return undefined;
    }
    this.cursor++;
    this.save();
    this.onDidChangeEmitter.fire();
    return this.history[this.cursor];
  }

  getHistory(): readonly HistoryEntry[] {
    return this.history;
  }

  getCursor(): number {
    return this.cursor;
  }

  getUniqueLocations(): HistoryEntry[] {
    const seen = new Set<string>();
    const unique: HistoryEntry[] = [];
    for (const entry of this.history) {
      const key = `${entry.filePath}:${entry.line}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(entry);
      }
    }
    return unique;
  }

  getManualEntries(): HistoryEntry[] {
    return this.history.filter((e) => e.isManual);
  }

  save(): void {
    this.state.update(STATE_KEY, this.history);
    this.state.update(CURSOR_KEY, this.cursor);
  }

  restore(): void {
    this.history = this.state.get<HistoryEntry[]>(STATE_KEY, []);
    this.cursor = this.state.get<number>(CURSOR_KEY, -1);
    if (this.cursor >= this.history.length) {
      this.cursor = this.history.length - 1;
    }
    this.onDidChangeEmitter.fire();
  }

  dispose(): void {
    this.onDidChangeEmitter.dispose();
  }
}
