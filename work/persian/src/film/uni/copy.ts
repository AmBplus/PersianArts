// Copy map loader. CONFIDENTIALITY: the exact Persian strings are NOT in this (tracked) file.
// They live in the gitignored media/briefs-local/university-admissions/copy-map.json and are
// imported at bundle time. Tracked code references COPY tokens only (e.g. COPY.B2a).
// Tokens follow work/persian/prompt-design-brief.md section 1 (six proof clusters).
import raw from "../../../../../media/briefs-local/university-admissions/copy-map.json";

export type CopyToken =
  | "Q"
  | "B2a" | "B2b"
  | "B3a" | "B3b" | "B3c"
  | "B4a" | "B4b" | "B4c"
  | "B5a" | "B5b" | "B5c"
  | "B6a" | "B6b" | "B6c"
  | "B7a" | "B7b"
  | "B8";

export const COPY = raw as Readonly<Record<CopyToken, string>>;
