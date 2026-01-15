import { REPORT_CATALOG } from '../reports.catalog.js';
import * as mysqlRepo from '../repositories/reporting/mysqlReportRepository.js';
import * as mongoRepo from '../repositories/reporting/mongoReportRepository.js';

const provider = (process.env.REPORTING_PROVIDER || 'mysql').toLowerCase();

function getRepo() {
  if (provider === 'mongo' || provider === 'mongodb') return mongoRepo;
  return mysqlRepo; // default
}

export function getCatalogForRole(userRole) {
  // Admin sees everything
  if (userRole === 'admin') return REPORT_CATALOG;
  return REPORT_CATALOG.filter((r) => r.roles.includes(userRole));
}

export async function getReport(reportId, userRole, filters = {}) {
  const report = REPORT_CATALOG.find((r) => r.id === reportId);
  if (!report) {
    const err = new Error('Unknown report');
    err.status = 404;
    throw err;
  }
  if (userRole !== 'admin' && !report.roles.includes(userRole)) {
    const err = new Error('Forbidden');
    err.status = 403;
    throw err;
  }

  const repo = getRepo();
  const viewName = provider.startsWith('mongo') ? report.mongoView : report.mysqlView;

  if (!viewName) {
    const err = new Error(`Report not available for provider: ${provider}`);
    err.status = 501;
    throw err;
  }

  // Only pass whitelisted filters for this report
  const safeFilters = {};
  for (const key of report.filters || []) {
    if (filters[key] !== undefined) safeFilters[key] = filters[key];
  }

  const rows = await repo.queryView(viewName, safeFilters);
  return { report, provider, rows };
}

export async function getFilterOptions() {
  const repo = getRepo();
  const [properties, boardMembers] = await Promise.all([
    repo.listProperties?.(),
    repo.listBoardMembers?.()
  ]);
  return { provider, properties: properties || [], boardMembers: boardMembers || [] };
}
