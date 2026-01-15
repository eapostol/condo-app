import React from 'react';

export default function ReportTable({ rows }) {
  if (!rows || rows.length === 0) {
    return <div className="text-sm text-gray-600">No rows returned.</div>;
  }

  const columns = Object.keys(rows[0]);

  return (
    <div className="overflow-x-auto border rounded">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((col) => (
              <th key={col} className="text-left px-3 py-2 border-b">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx} className="border-b last:border-b-0">
              {columns.map((col) => (
                <td key={col} className="px-3 py-2 align-top">
                  {row?.[col] === null || row?.[col] === undefined ? '' : String(row[col])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
