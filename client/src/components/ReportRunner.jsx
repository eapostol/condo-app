// @ts-check

import React, { useEffect, useMemo, useState } from 'react';
import { useApi } from './apiClient.jsx';
import ReportTable from './ReportTable.jsx';

/** @typedef {import('../../../shared/contracts/reports.js').BoardMemberFilterOption} BoardMemberFilterOption */
/** @typedef {import('../../../shared/contracts/reports.js').PropertyFilterOption} PropertyFilterOption */
/** @typedef {import('../../../shared/contracts/reports.js').ReportCatalogItem} ReportCatalogItem */
/** @typedef {import('../../../shared/contracts/reports.js').ReportCatalogResponse} ReportCatalogResponse */
/** @typedef {import('../../../shared/contracts/reports.js').ReportFiltersResponse} ReportFiltersResponse */
/** @typedef {import('../../../shared/contracts/reports.js').ReportProvider} ReportProvider */
/** @typedef {import('../../../shared/contracts/reports.js').ReportQueryFilters} ReportQueryFilters */
/** @typedef {import('../../../shared/contracts/reports.js').ReportRow} ReportRow */
/** @typedef {import('../../../shared/contracts/reports.js').RunReportResponse<ReportRow>} RunReportResponse */
/**
 * @typedef {object} ReportPdfOptions
 * @property {string} title
 * @property {ReportRow[]} rows
 * @property {ReportProvider | string} provider
 * @property {string[]} filtersSummary
 */

/** @param {{ role: import('../../../shared/contracts/auth.js').UserRole }} props */
export default function ReportRunner({ role }) {
  const api = useApi();

  const [provider, setProvider] = useState(/** @type {ReportProvider | string} */ (''));
  const [catalog, setCatalog] = useState(/** @type {ReportCatalogItem[]} */ ([]));
  const [filters, setFilters] = useState(
    /** @type {ReportFiltersResponse} */ ({ provider: '', properties: [], boardMembers: [] })
  );

  const [reportId, setReportId] = useState('');
  const [propertyId, setPropertyId] = useState('');
  const [boardMemberId, setBoardMemberId] = useState('');

  const [rows, setRows] = useState(/** @type {ReportRow[]} */ ([]));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/reports/catalog')
      .then((res) => {
        /** @type {ReportCatalogResponse} */
        const data = res.data;
        setProvider(data.provider);
        const roleCatalog = (data.catalog || []).filter((r) =>
          role === 'admin' ? true : (r.roles || []).includes(role)
        );
        setCatalog(roleCatalog);
        if (roleCatalog.length) setReportId(roleCatalog[0].id);
      })
      .catch(() => setError('Failed to load report catalog'));
  }, [role]);

  useEffect(() => {
    api
      .get('/reports/filters')
      .then((res) => {
        /** @type {ReportFiltersResponse} */
        const data = res.data;
        setFilters(data);
      })
      .catch(() => {});
  }, []);

  const selected = useMemo(
    () => catalog.find((r) => r.id === reportId),
    [catalog, reportId]
  );

  async function run() {
    setError('');
    setLoading(true);
    try {
      /** @type {ReportQueryFilters} */
      const params = {};
      if (selected?.filters?.includes('property_id') && propertyId) params.property_id = propertyId;
      if (selected?.filters?.includes('board_member_id') && boardMemberId) params.board_member_id = boardMemberId;
      const res = await api.get(`/reports/${reportId}`, { params });
      /** @type {RunReportResponse} */
      const data = res.data;
      setRows(data.rows || []);
    } catch (e) {
      const err = /** @type {any} */ (e);
      setError(err.response?.data?.message || 'Failed to run report');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (reportId) run();
  }, [reportId]);

  function buildFiltersSummary() {
    /** @type {string[]} */
    const summary = [];
    if (selected?.filters?.includes('property_id')) {
      const name =
        (filters.properties || []).find((p) => String(p.property_id) === String(propertyId))
          ?.property_name || (propertyId ? propertyId : 'All');
      summary.push(`Property: ${name}`);
    }
    if (selected?.filters?.includes('board_member_id')) {
      const name =
        (filters.boardMembers || []).find((u) => String(u.user_id) === String(boardMemberId))
          ?.full_name || (boardMemberId ? boardMemberId : 'All');
      summary.push(`Board member: ${name}`);
    }
    return summary;
  }

  async function onSavePdf() {
    const { downloadReportPdf } = await import('../utils/reportPdf.js');
    /** @type {ReportPdfOptions} */
    const pdfOptions = {
      title: selected?.title || 'Report',
      rows,
      provider,
      filtersSummary: buildFiltersSummary()
    };
    downloadReportPdf(pdfOptions);
  }

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold">Reporting</h2>
          <div className="text-xs text-gray-600">Source: {provider || 'unknown'}</div>
        </div>

        <div className="flex gap-2 flex-wrap items-end">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Report</label>
            <select
              className="border rounded px-2 py-1 text-sm"
              value={reportId}
              onChange={(e) => setReportId(e.target.value)}
            >
              {catalog.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title}
                </option>
              ))}
            </select>
          </div>

          {selected?.filters?.includes('property_id') && (
            <div>
              <label className="block text-xs text-gray-600 mb-1">Property</label>
              <select
                className="border rounded px-2 py-1 text-sm"
                value={propertyId}
                onChange={(e) => setPropertyId(e.target.value)}
              >
                <option value="">All</option>
                {(filters.properties || []).map((p) => (
                  <option key={p.property_id} value={p.property_id}>
                    {p.property_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {selected?.filters?.includes('board_member_id') && (
            <div>
              <label className="block text-xs text-gray-600 mb-1">Board member</label>
              <select
                className="border rounded px-2 py-1 text-sm"
                value={boardMemberId}
                onChange={(e) => setBoardMemberId(e.target.value)}
              >
                <option value="">All</option>
                {(filters.boardMembers || []).map((u) => (
                  <option key={u.user_id} value={u.user_id}>
                    {u.full_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            className="bg-black text-white rounded px-3 py-1 text-sm"
            onClick={run}
            disabled={loading}
          >
            {loading ? 'Running…' : 'Run'}
          </button>

          <button
            className="border border-black text-black rounded px-3 py-1 text-sm"
            onClick={onSavePdf}
            disabled={loading || !selected}
            title={!selected ? 'Select a report first' : 'Save a PDF copy of this report'}
          >
            Save as PDF
          </button>
        </div>
      </div>

      {error && <div className="mt-3 text-sm text-red-600">{error}</div>}

      <div className="mt-4">
        <ReportTable rows={rows} />
      </div>
    </div>
  );
}
