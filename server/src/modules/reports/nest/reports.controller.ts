import {
  Controller,
  Get,
  HttpException,
  Inject,
  Param,
  Query,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';

import type {
  ReportCatalogResponse,
  ReportFiltersResponse,
  ReportQueryFilters,
  RunReportResponse,
} from '../../../../../shared/contracts/reports.js';
import type { UserRole } from '../../../../../shared/contracts/auth.js';

import { ReportsNestService } from './reports.service.js';

type ReportRequest = Request & {
  user?: {
    role?: UserRole;
  };
};

@Controller()
export class ReportsNestController {
  constructor(
    @Inject(ReportsNestService)
    private readonly reportsService: ReportsNestService,
  ) {}

  @Get('catalog')
  getReportCatalog(@Req() req: ReportRequest): ReportCatalogResponse {
    const userRole = req.user?.role;
    const catalog = this.reportsService.getCatalogForRole(userRole);

    return {
      provider: process.env.REPORTING_PROVIDER || 'mysql',
      catalog,
    };
  }

  @Get('filters')
  async getReportFilters(): Promise<ReportFiltersResponse> {
    return this.reportsService.getFilterOptions();
  }

  @Get(':reportId')
  async runReport(
    @Param('reportId') reportId: string,
    @Req() req: ReportRequest,
    @Query() query: ReportQueryFilters,
  ): Promise<RunReportResponse> {
    try {
      const { report, provider, rows } = await this.reportsService.getReport(
        reportId,
        req.user?.role,
        query,
      );

      return {
        report: { id: report.id, title: report.title },
        provider,
        count: rows.length,
        rows,
      };
    } catch (err) {
      const error = err as Error & { status?: number };

      throw new HttpException(
        { message: error.message || 'Failed to run report' },
        error.status || 500,
      );
    }
  }
}
