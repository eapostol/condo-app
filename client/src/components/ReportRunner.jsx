import React, { useEffect, useMemo, useState } from 'react';
import { useApi } from './apiClient.jsx';
import ReportTable from './ReportTable.jsx';

export default function ReportRunner({ role }) {
  const api = useApi();

  const [provider, setProvider] = useState('');
  const [catalog, setCatalog] = useState([]);
  const [filters, setFilters] = useState({ properties: [], boardMembers: [] });

  const [reportId, setReportId] = useState('');
  const [propertyId, setPropertyId] = useState('');
  const [boardMemberId, setBoardMemberId] = useState('');

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/reports/catalog')
      .then((res) => {
        setProvider(res.data.provider);
        const roleCatalog = (res.data.catalog || []).filter((r) =>
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
      .then((res) => setFilters(res.data))
      .catch(() => {});
  }, []);

  const selected = useMemo(() => catalog.find((r) => r.id === reportId), [catalog, reportId]);

  async function run() {
    setError('');
    setLoading(true);
    try {
      const params = {};
      if (selected?.filters?.includes('property_id') && propertyId) params.property_id = propertyId;
      if (selected?.filters?.includes('board_member_id') && boardMemberId) params.board_member_id = boardMemberId;
      const res = await api.get(`/reports/${reportId}`, { params });
      setRows(res.data.rows || []);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to run report');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (reportId) run();
  }, [reportId]);

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
        </div>
      </div>

      {error && <div className="mt-3 text-sm text-red-600">{error}</div>}

      <div className="mt-4">
        <ReportTable rows={rows} />
      </div>
    </div>
  );
}
