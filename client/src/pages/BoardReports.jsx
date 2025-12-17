import React, { useEffect, useState } from 'react';
import { useApi } from '../components/apiClient.jsx';

export default function BoardReports() {
  const api = useApi();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/condo/board/reports/monthly')
      .then((res) => setData(res.data))
      .catch((err) => {
        setError(err.response?.data?.message || 'Failed to load snapshot');
      });
  }, []);

  if (error) {
    return (
      <div className="text-red-600 text-sm bg-red-50 border border-red-100 rounded px-3 py-2">
        {error}
      </div>
    );
  }

  if (!data) {
    return <div className="text-sm text-slate-600">Loading snapshot...</div>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-slate-800">Board monthly snapshot</h1>
      <section className="bg-white rounded shadow p-4 flex gap-6 text-sm">
        <div>
          <p className="text-slate-500 text-xs uppercase">Open work orders</p>
          <p className="text-2xl font-semibold">{data.totals.openWorkOrders}</p>
        </div>
        <div>
          <p className="text-slate-500 text-xs uppercase">Total units</p>
          <p className="text-2xl font-semibold">{data.totals.totalUnits}</p>
        </div>
      </section>
      <section className="bg-white rounded shadow p-4">
        <h2 className="font-semibold text-sm mb-2">Payments summary</h2>
        <ul className="text-xs text-slate-700">
          {data.paymentsSummary.map((p) => (
            <li key={p._id}>
              {p._id}: ${p.total.toFixed(2)}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
