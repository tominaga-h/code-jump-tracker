export interface HistoryEntry {
  filePath: string;
  fileName: string;
  line: number;
  column: number;
  symbolName: string;
  isManual: boolean;
  timestamp: number;
}
