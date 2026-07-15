'use client';

import { useState } from 'react';
import type { GrantData, Policy, ComplianceResource, TrustDocument } from '@/lib/api';
import {
  downloadAllPolicies,
  downloadAllPoliciesZip,
  downloadComplianceResource,
  downloadTrustDocument,
  downloadAllDocuments,
} from '@/lib/api';

type Tab = 'overview' | 'policies' | 'certificates' | 'documents';

export function AccessPortalClient({
  token,
  grant,
  policies,
  resources,
  documents,
}: {
  token: string;
  grant: GrantData;
  policies: Policy[];
  resources: ComplianceResource[];
  documents: TrustDocument[];
}) {
  const [tab, setTab] = useState<Tab>('overview');
  const [busy, setBusy] = useState<string | null>(null);

  async function dl(id: string, fn: () => Promise<{ url: string }>) {
    setBusy(id);
    try {
      const { url } = await fn();
      window.open(url, '_blank');
    } catch {
      alert('Download failed. Please try again.');
    } finally {
      setBusy(null);
    }
  }

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'policies', label: 'Policies', count: policies.length },
    { key: 'certificates', label: 'Certificates', count: resources.length },
    { key: 'documents', label: 'Documents', count: documents.length },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">{grant.organizationName} — Compliance Portal</h1>
            <p className="text-xs text-slate-500">
              Access for {grant.subjectEmail} &middot; Expires {new Date(grant.expiresAt).toLocaleDateString()}
            </p>
          </div>
          <a href="/" className="text-sm text-slate-600 hover:text-slate-900">&larr; Trust Center</a>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-8">
        <nav className="mb-8 flex gap-1 rounded-lg bg-slate-100 p-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${tab === t.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              {t.label}
              {t.count !== undefined && t.count > 0 && (
                <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs">{t.count}</span>
              )}
            </button>
          ))}
        </nav>

        {tab === 'overview' && (
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Your Access</h2>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div><dt className="text-slate-500">Organization</dt><dd className="font-medium text-slate-900">{grant.organizationName}</dd></div>
              <div><dt className="text-slate-500">Email</dt><dd className="font-medium text-slate-900">{grant.subjectEmail}</dd></div>
              <div><dt className="text-slate-500">Expires</dt><dd className="font-medium text-slate-900">{new Date(grant.expiresAt).toLocaleString()}</dd></div>
              {grant.ndaPdfUrl && (
                <div><dt className="text-slate-500">Signed NDA</dt><dd><a href={grant.ndaPdfUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 hover:underline">Download</a></dd></div>
              )}
            </dl>
            <p className="mt-6 text-sm text-slate-500">Use the tabs above to download policies, compliance certificates, and additional documents. All downloads are watermarked with your details.</p>
          </div>
        )}

        {tab === 'policies' && (
          <Section
            title="Policies"
            empty={policies.length === 0}
            actions={policies.length > 0 && (
              <div className="flex gap-2">
                <SmallBtn busy={busy === 'pol-pdf'} onClick={() => dl('pol-pdf', () => downloadAllPolicies(token))}>Download All (PDF)</SmallBtn>
                <SmallBtn busy={busy === 'pol-zip'} onClick={() => dl('pol-zip', () => downloadAllPoliciesZip(token))}>Download All (ZIP)</SmallBtn>
              </div>
            )}
          >
            {policies.map((p) => (
              <Row key={p.id} title={p.title || p.name || 'Policy'} subtitle={p.description || undefined} />
            ))}
          </Section>
        )}

        {tab === 'certificates' && (
          <Section title="Compliance Certificates" empty={resources.length === 0}>
            <div className="grid gap-4 sm:grid-cols-2">
              {resources.map((r) => (
                <button
                  key={r.framework}
                  onClick={() => dl(r.framework, () => downloadComplianceResource(token, r.framework))}
                  disabled={busy === r.framework}
                  className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 text-left transition-colors hover:border-blue-200 disabled:opacity-50"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                    <svg className="h-5 w-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                    </svg>
                  </div>
                  <div className="font-medium text-slate-900">{r.framework.replace(/_/g, ' ').toUpperCase()}</div>
                </button>
              ))}
            </div>
          </Section>
        )}

        {tab === 'documents' && (
          <Section
            title="Additional Documents"
            empty={documents.length === 0}
            actions={documents.length > 0 && (
              <SmallBtn busy={busy === 'doc-all'} onClick={() => dl('doc-all', () => downloadAllDocuments(token))}>Download All (ZIP)</SmallBtn>
            )}
          >
            {documents.map((d) => (
              <button
                key={d.id}
                onClick={() => dl(d.id, () => downloadTrustDocument(token, d.id))}
                disabled={busy === d.id}
                className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-5 py-4 text-left transition-colors hover:border-blue-200 disabled:opacity-50"
              >
                <div>
                  <div className="font-medium text-slate-900">{d.name}</div>
                  {d.category && <span className="mt-1 inline-block rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{d.category.replace(/_/g, ' ')}</span>}
                </div>
              </button>
            ))}
          </Section>
        )}
      </div>
    </div>
  );
}

function Section({ title, empty, actions, children }: { title: string; empty: boolean; actions?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">{title}</h2>
        {actions}
      </div>
      {empty ? <p className="text-sm text-slate-500">Nothing available yet.</p> : <div className="space-y-3">{children}</div>}
    </div>
  );
}

function Row({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-5 py-4">
      <div>
        <div className="font-medium text-slate-900">{title}</div>
        {subtitle && <div className="text-sm text-slate-500">{subtitle}</div>}
      </div>
    </div>
  );
}

function SmallBtn({ busy, onClick, children }: { busy: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} disabled={busy} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">
      {busy ? '...' : children}
    </button>
  );
}
