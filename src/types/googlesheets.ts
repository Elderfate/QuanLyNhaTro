// Google Sheets types - compatible with google-spreadsheet library
export interface GoogleSheetsRow {
  get(key: string): string | number | boolean | null;
  set(key: string, value: string | number | boolean | null): void;
  save(): Promise<void>;
  delete(): Promise<void>;
  toObject(): Record<string, string | number | boolean | null>;
  _sheet?: {
    headerValues: string[];
  };
}

// Actual Google Spreadsheet Row type (from library)
export interface GoogleSpreadsheetRowData {
  [key: string]: string | number | boolean | null;
}

export interface DatabaseDocument {
  _id?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface QueryFilter {
  [key: string]: string | number | boolean | QueryOperators | null;
}

export interface QueryOperators {
  $eq?: unknown;
  $ne?: unknown;
  $in?: unknown[];
  $nin?: unknown[];
  $regex?: string;
  $options?: string;
}

export interface AggregationPipeline {
  $match?: QueryFilter;
  $sort?: { [key: string]: 1 | -1 };
  $limit?: number;
}

export interface UpdateDocument {
  [key: string]: unknown;
}

export interface FindOptions {
  limit?: number;
  skip?: number;
  sort?: { [key: string]: 1 | -1 };
}