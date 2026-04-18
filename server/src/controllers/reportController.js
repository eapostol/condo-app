// @ts-check

import {
  getCatalogForRole,
  getReport,
  getFilterOptions
} from '../services/reportingService.js';

/** @typedef {import('../../../shared/contracts/reports.js').ReportCatalogResponse} ReportCatalogResponse */
/** @typedef {import('../../../shared/contracts/reports.js').ReportFiltersResponse} ReportFiltersResponse */
/** @typedef {import('../../../shared/contracts/reports.js').RunReportResponse} RunReportResponse */

/** @param {any} req @param {any} res */
export async function getReportCatalog(req, res) {
  const userRole = req.user?.role;
  const catalog = getCatalogForRole(userRole);
  /** @type {ReportCatalogResponse} */
  const response = { provider: (process.env.REPORTING_PROVIDER || 'mysql'), catalog };
  res.json(response);
}

/** @param {any} req @param {any} res */
export async function getReportFilters(req, res) {
  /** @type {ReportFiltersResponse} */
  const data = await getFilterOptions();
  res.json(data);
}

/** @param {any} req @param {any} res */
export async function runReport(req, res) {
  try {
    const userRole = req.user?.role;
    const reportId = req.params.reportId;

    const { report, provider, rows } = await getReport(reportId, userRole, req.query);

    /** @type {RunReportResponse} */
    const response = {
      report: { id: report.id, title: report.title },
      provider,
      count: rows.length,
      rows
    };

    res.json(response);
  } catch (err) {
    const error = /** @type {any} */ (err);
    const status = error.status || 500;
    res.status(status).json({ message: error.message || 'Failed to run report' });
  }
}
