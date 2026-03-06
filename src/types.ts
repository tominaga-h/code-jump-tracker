export interface HistoryEntry {
  filePath: string;
  fileName: string;
  line: number;
  column: number;
  symbolName: string;
  symbolKind?: number;
  isManual: boolean;
  timestamp: number;
}
