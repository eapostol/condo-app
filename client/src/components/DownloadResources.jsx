import React from 'react';

const downloads = [
  {
    title: 'Word plan',
    description: 'Download the cloud implementation plan as a Word-compatible document.',
    href: '/downloads/condo-app-cloud-launcher-plan.doc',
    fileName: 'condo-app-cloud-launcher-plan.doc',
    badge: '.doc'
  },
  {
    title: 'Markdown plan',
    description: 'Download the same plan in Markdown for editing or checking into docs.',
    href: '/downloads/condo-app-cloud-launcher-plan.md',
    fileName: 'condo-app-cloud-launcher-plan.md',
    badge: '.md'
  },
  {
    title: 'PDF plan',
    description: 'Download a presentation-ready PDF copy for sharing with stakeholders.',
    href: '/downloads/condo-app-cloud-launcher-plan.pdf',
    fileName: 'condo-app-cloud-launcher-plan.pdf',
    badge: '.pdf'
  }
];

export default function DownloadResources() {
  return (
    <section className="bg-white rounded shadow p-4 space-y-3">
      <div>
        <h2 className="text-lg font-semibold text-slate-800">Planning downloads</h2>
        <p className="text-sm text-slate-600">
          Download the cloud launcher implementation plan in Word, Markdown, or PDF format.
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {downloads.map((item) => (
          <a
            key={item.href}
            href={item.href}
            download={item.fileName}
            className="block rounded border border-slate-200 p-4 hover:border-slate-400 hover:shadow-sm transition"
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-medium text-slate-800">{item.title}</h3>
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {item.badge}
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-600">{item.description}</p>
            <span className="mt-4 inline-flex text-sm font-medium text-blue-600">Download</span>
          </a>
        ))}
      </div>
    </section>
  );
}
