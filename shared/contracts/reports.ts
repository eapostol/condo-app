import type { UserRole } from './auth.js';

export type ReportProvider = 'mysql' | 'mongo' | 'mongodb';

export type ReportFilterKey = 'property_id' | 'board_member_id' | 'project_id';

export type ReportRow = Record<string, unknown>;

export interface ReportCatalogItem {
  id: string;
  roles: UserRole[];
  title: string;
  mysqlView?: string;
  mongoView?: string;
  filters?: ReportFilterKey[];
}

export interface ReportCatalogResponse {
  provider: ReportProvider | string;
  catalog: ReportCatalogItem[];
}

export interface PropertyFilterOption {
  property_id: number;
  property_name: string;
}

export interface BoardMemberFilterOption {
  user_id: number;
  full_name: string;
}

export interface ReportFiltersResponse {
  provider: ReportProvider | string;
  properties: PropertyFilterOption[];
  boardMembers: BoardMemberFilterOption[];
}

export interface ReportQueryFilters {
  property_id?: string | number;
  board_member_id?: string | number;
  project_id?: string | number;
}

export interface ReportSummary {
  id: string;
  title: string;
}

export interface RunReportResponse<Row extends ReportRow = ReportRow> {
  report: ReportSummary;
  provider: ReportProvider | string;
  count: number;
  rows: Row[];
}

export interface ReportPeriod {
  month: number;
  year: number;
}

export interface PaymentSummaryRow {
  _id: string;
  total: number;
}

export interface OpenWorkOrderUnitSummary {
  unitNumber?: string;
}

export interface OpenWorkOrderSummaryRow {
  _id: string;
  title: string;
  status?: string;
  priority?: string;
  unit?: OpenWorkOrderUnitSummary | null;
}

export interface ManagerMonthlyReportResponse {
  period: ReportPeriod;
  openWorkOrders: OpenWorkOrderSummaryRow[];
  paymentsSummary: PaymentSummaryRow[];
}

export interface BoardMonthlySnapshotResponse {
  period: ReportPeriod;
  totals: {
    openWorkOrders: number;
    totalUnits: number;
  };
  paymentsSummary: PaymentSummaryRow[];
}
