/** Shared types for the Maintenance & Quality Agent. */
export type Severity = 'error' | 'warning' | 'info';

export interface Issue {
  /** Stable rule identifier, e.g. "percent-sum". */
  rule: string;
  severity: Severity;
  message: string;
  nodeId?: string;
  nodeLabel?: string;
}

export interface QAReport {
  issues: Issue[];
  counts: { error: number; warning: number; info: number };
  nodeCount: number;
  edgeCount: number;
  hasErrors: boolean;
  generatedAt: number;
}

export const PERCENT_TOLERANCE = 0.1;
