import type { Framework } from '@/lib/api';

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  compliant: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  in_progress: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  started: { bg: 'bg-slate-50', text: 'text-slate-600', dot: 'bg-slate-400' },
};

export function FrameworkBadge({ framework }: { framework: Framework }) {
  const style = STATUS_STYLES[framework.status] || STATUS_STYLES.started;
  return (
    <div className={`inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-3 ${style.bg}`}>
      <span className={`h-2.5 w-2.5 rounded-full ${style.dot}`} />
      <span className={`text-sm font-semibold ${style.text}`}>{framework.name}</span>
      {framework.status === 'compliant' && (
        <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )}
    </div>
  );
}
