import type { Vendor } from '@/lib/api';

export function VendorList({ vendors }: { vendors: Vendor[] }) {
  if (!vendors?.length) return null;
  return (
    <section id="subprocessors" className="py-16">
      <h2 className="mb-2 text-2xl font-bold text-slate-900">Subprocessors</h2>
      <p className="mb-8 text-sm text-slate-500">Third-party services that process data on our behalf.</p>
      <div className="overflow-hidden rounded-xl border border-slate-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-6 py-3 font-medium">Service</th>
              <th className="px-6 py-3 font-medium">Purpose</th>
              <th className="px-6 py-3 font-medium">Compliance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {vendors.map((v) => {
              const link = v.trustPortalUrl || v.website;
              return (
                <tr key={v.id} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {v.logoUrl && <img src={v.logoUrl} alt="" className="h-8 w-8 rounded object-contain" />}
                      <span className="font-medium text-slate-900">
                        {link ? (
                          <a href={link} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600">{v.name}</a>
                        ) : v.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{v.description || '—'}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {v.complianceBadges?.map((b) => (
                        <span key={b.type} className="inline-block rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                          {b.label}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
