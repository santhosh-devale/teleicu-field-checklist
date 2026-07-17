export type ItemStatus = 'working' | 'not_working' | null;

export interface ChecklistItem {
  id: string;
  no: number;
  label: string;
  /** Marks systems whose failure alone should force a "Critical" overall status */
  critical?: boolean;
}

export interface ChecklistSection {
  id: string;
  code: string; // e.g. "A", "B", "H"
  title: string;
  table: 1 | 2; // which of the two source tables this section belongs to
  items: ChecklistItem[];
}

export interface ItemResponse {
  status: ItemStatus;
  remarks: string;
}

export type ResponsesMap = Record<string, ItemResponse>;

export interface VisitMeta {
  hospital: string;
  location: string;
  visitDate: string;
  visitedBy: string;
}

export type OverallStatus = 'OK' | 'Issues Found' | 'Critical';

export interface SignatureBlock {
  name: string;
  designation: string;
  date: string;
  signatureDataUrl: string | null;
}

export interface SignaturesState {
  fieldEngineer: SignatureBlock;
  inCharge: SignatureBlock;
}
