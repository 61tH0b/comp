'use client';

import { useState } from 'react';
import { submitAccessRequest, reclaimAccess } from '@/lib/api';

export function AccessRequestForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const data = new FormData(e.currentTarget);
    try {
      await submitAccessRequest({
        name: data.get('name') as string,
        email: data.get('email') as string,
        company: data.get('company') as string,
        jobTitle: data.get('jobTitle') as string,
        purpose: data.get('purpose') as string,
      });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6">
        <h3 className="font-semibold text-emerald-900">Request Submitted</h3>
        <p className="mt-1 text-sm text-emerald-700">
          Your access request has been received. You&apos;ll receive an email with next steps once it&apos;s reviewed.
        </p>
      </div>
    );
  }

  if (!isOpen) {
    return (
      <button onClick={() => setIsOpen(true)} className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-slate-800">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
        </svg>
        Request Access to Documentation
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">Request Access to Compliance Documentation</h3>
        <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
      </div>
      <p className="mb-6 text-sm text-slate-600">
        Access to compliance certificates, policies, and detailed security documentation requires signing a non-disclosure agreement.
      </p>
      {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field name="name" label="Full Name" />
          <Field name="email" label="Work Email" type="email" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field name="company" label="Company" />
          <Field name="jobTitle" label="Job Title" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Purpose of Request *</label>
          <textarea name="purpose" required rows={3} placeholder="e.g., Vendor due diligence, security assessment, audit review..." className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
        </div>
        <div className="flex items-center gap-3 pt-2">
          <button type="submit" disabled={loading} className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-50">
            {loading ? 'Submitting...' : 'Submit Request'}
          </button>
          <button type="button" onClick={() => setIsOpen(false)} className="rounded-lg px-5 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900">Cancel</button>
        </div>
      </form>
    </div>
  );
}

function Field({ name, label, type = 'text' }: { name: string; label: string; type?: string }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label} *</label>
      <input type={type} name={name} required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
    </div>
  );
}

export function ReclaimAccessForm() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await reclaimAccess(email);
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reclaim access');
    } finally {
      setLoading(false);
    }
  }

  if (submitted) return <p className="text-sm text-emerald-700">If an active grant exists for that email, a new access link has been sent.</p>;

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-3">
      <div className="flex-1">
        <label className="mb-1 block text-xs font-medium text-slate-600">Already have access? Enter your email for a new link.</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
      </div>
      <button type="submit" disabled={loading} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">
        {loading ? '...' : 'Reclaim'}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </form>
  );
}
