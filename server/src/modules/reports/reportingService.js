// @ts-check

import { REPORT_CATALOG } from './reports.catalog.js';
import * as mysqlRepo from './repositories/mysqlReportRepository.js';
import * as mongoRepo from './repositories/mongoReportRepository.js';

/** @typedef {import('../../../../shared/contracts/reports.js').BoardMemberFilterOption} BoardMemberFilterOption */
/** @typedef {import('../../../../shared/contracts/reports.js').PropertyFilterOption} PropertyFilterOption */
/** @typedef {import('../../../../shared/contracts/reports.js').ReportCatalogItem} ReportCatalogItem */
/** @typedef {import('../../../../shared/contracts/reports.js').ReportFiltersResponse} ReportFiltersResponse */
/** @typedef {import('../../../../shared/contracts/reports.js').ReportProvider} ReportProvider */
/** @typedef {import('../../../../shared/contracts/reports.js').ReportQueryFilters} ReportQueryFilters */
/** @typedef {import('../../../../shared/contracts/reports.js').ReportRow} ReportRow */
/** @typedef {import('../../../../shared/contracts/auth.js').UserRole} UserRole */

/**
 * @typedef {object} ReportingRepository
 * @property {(viewName: string, filters?: ReportQueryFilters) => Promise<ReportRow[]>} queryView
 * @property {(() => Promise<PropertyFilterOption[]>) | undefined} [listProperties]
 * @property {(() => Promise<BoardMemberFilterOption[]>) | undefined} [listBoardMembers]
 */

/**
 * @typedef {object} ResolvedReportResult
 * @property {ReportCatalogItem} report
 * @property {ReportProvider | string} provider
 * @property {ReportRow[]} rows
 */

/** @type {ReportProvider | string} */
const provider = (process.env.REPORTING_PROVIDER || 'mysql').toLowerCase();

/** @returns {ReportingRepository} */
function getRepo() {
  if (provider === 'mongo' || provider === 'mongodb') {
    return /** @type {ReportingRepository} */ (/** @type {unknown} */ (mongoRepo));
  }
  return /** @type {ReportingRepository} */ (mysqlRepo); // default
}

/**
 * @param {UserRole | undefined} userRole
 * @returns {ReportCatalogItem[]}
 */
export function getCatalogForRole(userRole) {
  // Admin sees everything
  if (userRole === 'admin') return REPORT_CATALOG;
  if (!userRole) return [];
  return REPORT_CATALOG.filter((r) => r.roles.includes(userRole));
}

/**
 * @param {string} reportId
 * @param {UserRole | undefined} userRole
 * @param {ReportQueryFilters} [filters={}]
 * @returns {Promise<ResolvedReportResult>}
 */
export async function getReport(reportId, userRole, filters = {}) {
  const report = REPORT_CATALOG.find((r) => r.id === reportId);
  if (!report) {
    const err = /** @type {Error & { status?: number }} */ (new Error('Unknown report'));
    err.status = 404;
    throw err;
  }
  if (userRole !== 'admin' && (!userRole || !report.roles.includes(userRole))) {
    const err = /** @type {Error & { status?: number }} */ (new Error('Forbidden'));
    err.status = 403;
    throw err;
  }

  const repo = getRepo();
  const viewName = provider.startsWith('mongo') ? report.mongoView : report.mysqlView;

  if (!viewName) {
    const err = /** @type {Error & { status?: number }} */ (
      new Error(`Report not available for provider: ${provider}`)
    );
    err.status = 501;
    throw err;
  }

  // Only pass whitelisted filters for this report
  /** @type {ReportQueryFilters} */
  const safeFilters = {};
  for (const key of report.filters || []) {
    if (filters[key] !== undefined) safeFilters[key] = filters[key];
  }

  const rows = await repo.queryView(viewName, safeFilters);
  return { report, provider, rows };
}

/** @returns {Promise<ReportFiltersResponse>} */
export async function getFilterOptions() {
  const repo = getRepo();
  const [properties, boardMembers] = await Promise.all([
    repo.listProperties?.(),
    repo.listBoardMembers?.()
  ]);
  return { provider, properties: properties || [], boardMembers: boardMembers || [] };
}
