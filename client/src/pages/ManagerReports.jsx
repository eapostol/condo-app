import React, { useEffect, useState } from 'react';
import { useApi } from '../components/apiClient.jsx';
import ReportRunner from '../components/ReportRunner.jsx';

export default function ManagerReports() {
  const api = useApi();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/condo/manager/reports/monthly')
      .then((res) => setData(res.data))
      .catch((err) => {
        setError(err.response?.data?.message || 'Failed to load report');
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
    return <div className="text-sm text-slate-600">Loading report...</div>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-slate-800">Manager monthly report</h1>
      <section className="bg-white rounded shadow p-4">
        <h2 className="font-semibold text-sm mb-2">Open work orders</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead>
              <tr className="border-b bg-slate-50">
                <th className="text-left px-2 py-1">Title</th>
                <th className="text-left px-2 py-1">Unit</th>
                <th className="text-left px-2 py-1">Status</th>
                <th className="text-left px-2 py-1">Priority</th>
              </tr>
            </thead>
            <tbody>
              {data.openWorkOrders.map((wo) => (
                <tr key={wo._id} className="border-b">
                  <td className="px-2 py-1">{wo.title}</td>
                  <td className="px-2 py-1">{wo.unit?.unitNumber}</td>
                  <td className="px-2 py-1">{wo.status}</td>
                  <td className="px-2 py-1">{wo.priority}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
      <ReportRunner role="manager" />
      </div>
  );
}
