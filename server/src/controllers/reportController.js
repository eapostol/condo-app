import {
  getCatalogForRole,
  getReport,
  getFilterOptions
} from '../services/reportingService.js';

export async function getReportCatalog(req, res) {
  const userRole = req.user?.role;
  const catalog = getCatalogForRole(userRole);
  res.json({ provider: (process.env.REPORTING_PROVIDER || 'mysql'), catalog });
}

export async function getReportFilters(req, res) {
  const data = await getFilterOptions();
  res.json(data);
}

export async function runReport(req, res) {
  try {
    const userRole = req.user?.role;
    const reportId = req.params.reportId;

    const { report, provider, rows } = await getReport(reportId, userRole, req.query);

    res.json({
      report: { id: report.id, title: report.title },
      provider,
      count: rows.length,
      rows
    });
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ message: err.message || 'Failed to run report' });
  }
}
