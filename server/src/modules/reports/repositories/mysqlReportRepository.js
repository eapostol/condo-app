// @ts-check

import { mysqlPool } from '../../../config/mysql.js';

/** @typedef {import('../../../../../shared/contracts/reports.js').BoardMemberFilterOption} BoardMemberFilterOption */
/** @typedef {import('../../../../../shared/contracts/reports.js').PropertyFilterOption} PropertyFilterOption */
/** @typedef {import('../../../../../shared/contracts/reports.js').ReportQueryFilters} ReportQueryFilters */
/** @typedef {import('../../../../../shared/contracts/reports.js').ReportRow} ReportRow */

/**
 * Only allow queries against a pre-defined view name from the catalog.
 * viewName must be resolved from the catalog (do NOT pass user input here).
 *
 * @param {string} viewName
 * @param {ReportQueryFilters} [filters={}]
 * @returns {Promise<ReportRow[]>}
 */
export async function queryView(viewName, filters = {}) {
  const where = [];
  const params = [];

  // Whitelisted filters only; controller/service enforces which filters apply per report.
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null || value === '') continue;

    // Basic numeric normalization (ids)
    if (/_id$/.test(key)) {
      const n = Number(value);
      if (!Number.isFinite(n)) continue;
      where.push(`${key} = ?`);
      params.push(n);
    } else {
      // Fallback for string filters (rare in current catalog)
      where.push(`${key} = ?`);
      params.push(value);
    }
  }

  const sql = `SELECT * FROM ${viewName}` + (where.length ? ` WHERE ${where.join(' AND ')}` : '');
  const [rows] = await mysqlPool.execute(sql, params);
  return /** @type {ReportRow[]} */ (rows);
}

/** @returns {Promise<PropertyFilterOption[]>} */
export async function listProperties() {
  const [rows] = await mysqlPool.query('SELECT property_id, name AS property_name FROM property ORDER BY name');
  return /** @type {PropertyFilterOption[]} */ (rows);
}

/** @returns {Promise<BoardMemberFilterOption[]>} */
export async function listBoardMembers() {
  const [rows] = await mysqlPool.query(
    "SELECT user_id, full_name FROM user ORDER BY full_name"
  );
  return /** @type {BoardMemberFilterOption[]} */ (rows);
}
