import { Injectable } from '@nestjs/common';

import type {
  ReportCatalogItem,
  ReportFiltersResponse,
  ReportProvider,
  ReportQueryFilters,
  ReportRow,
} from '../../../../../shared/contracts/reports.js';
import type { UserRole } from '../../../../../shared/contracts/auth.js';

import {
  getCatalogForRole,
  getFilterOptions,
  getReport,
} from '../reportingService.js';

export interface ResolvedReportResult {
  report: ReportCatalogItem;
  provider: ReportProvider | string;
  rows: ReportRow[];
}

@Injectable()
export class ReportsNestService {
  getCatalogForRole(userRole: UserRole | undefined): ReportCatalogItem[] {
    return getCatalogForRole(userRole);
  }

  getFilterOptions(): Promise<ReportFiltersResponse> {
    return getFilterOptions();
  }

  getReport(
    reportId: string,
    userRole: UserRole | undefined,
    filters: ReportQueryFilters = {},
  ): Promise<ResolvedReportResult> {
    return getReport(reportId, userRole, filters);
  }
}
