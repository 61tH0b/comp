'use client';

import { useState } from 'react';
import { signNda, previewNda } from '@/lib/api';

export function NdaSigningForm({
  token,
  defaultName,
  defaultEmail,
}: {
  token: string;
  defaultName: string;
  defaultEmail: string;
}) {
  const [name, setName] = useState(defaultName);
  const [email, setEmail] = useState(defaultEmail);
  const [loading, setLoading] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [signed, setSigned] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePreview() {
    setPreviewing(true);
    setError(null);
    try {
      const { url } = await previewNda(token);
      window.open(url, '_blank');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate preview');
    } finally {
      setPreviewing(false);
    }
  }

  async function handleSign(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await signNda(token, name, email);
      setSigned(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign NDA');
    } finally {
      setLoading(false);
    }
  }

  if (signed) {
    return (
      <div className="py-4 text-center">
        <svg className="mx-auto h-12 w-12 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="mt-3 text-lg font-semibold text-slate-900">NDA Signed</h3>
        <p className="mt-2 text-sm text-slate-600">
          You&apos;ll receive an email shortly with a link to access the compliance documentation.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSign} className="space-y-4">
      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Full Name</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
      </div>
      <div className="flex items-center gap-3 pt-4">
        <button type="submit" disabled={loading} className="flex-1 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-50">
          {loading ? 'Signing...' : 'I Accept — Sign NDA'}
        </button>
        <button type="button" onClick={handlePreview} disabled={previewing} className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">
          {previewing ? '...' : 'Preview PDF'}
        </button>
      </div>
    </form>
  );
}
