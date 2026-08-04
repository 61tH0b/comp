import type { CustomLink } from '@/lib/api';

export function CustomLinks({ links }: { links: CustomLink[] }) {
  if (!links?.length) return null;
  return (
    <section id="resources" className="py-16">
      <h2 className="mb-8 text-2xl font-bold text-slate-900">Resources</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {links.map((link) => (
          <a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-start gap-3 rounded-xl border border-slate-200 p-5 transition-all hover:border-blue-200 hover:bg-blue-50/50"
          >
            <svg className="mt-0.5 h-5 w-5 shrink-0 text-slate-400 group-hover:text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
            <div>
              <div className="font-medium text-slate-900 group-hover:text-blue-700">{link.title}</div>
              {link.description && <div className="mt-1 text-sm text-slate-500">{link.description}</div>}
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
