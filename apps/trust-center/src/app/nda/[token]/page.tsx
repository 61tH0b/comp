import { getNdaDetails } from '@/lib/api';
import { NdaSigningForm } from './NdaSigningForm';

export const dynamic = 'force-dynamic';

export default async function NdaPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  let nda = null;
  let error: string | null = null;
  try {
    nda = await getNdaDetails(token);
  } catch (err) {
    error = err instanceof Error ? err.message : 'Unable to load NDA. The link may have expired.';
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-16">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-slate-900">Non-Disclosure Agreement</h1>
          {nda && (
            <p className="mt-2 text-sm text-slate-600">
              {nda.organizationName} requires you to sign an NDA before accessing compliance documentation.
            </p>
          )}
        </div>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
            <p className="text-sm text-red-700">{error}</p>
            <p className="mt-2 text-xs text-red-600">If your link expired, request a new one from the trust center.</p>
          </div>
        ) : nda ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="mb-6 space-y-3 text-sm">
              <Row label="Organization" value={nda.organizationName} />
              <Row label="Your Name" value={nda.requesterName} />
              <Row label="Your Email" value={nda.requesterEmail} />
              <Row label="Expires" value={new Date(nda.expiresAt).toLocaleDateString()} />
            </div>
            <div className="mb-6 rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs leading-relaxed text-slate-600">
              <p className="mb-2 font-semibold text-slate-700">NDA Summary:</p>
              <ul className="list-disc space-y-1 pl-4">
                <li>You acknowledge receiving access to confidential compliance documentation.</li>
                <li>You agree to maintain strict confidence and not disclose to third parties.</li>
                <li>Information is for evaluation purposes only.</li>
                <li>Term: 2 years from date of execution.</li>
              </ul>
            </div>
            <NdaSigningForm token={token} defaultName={nda.requesterName} defaultEmail={nda.requesterEmail} />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-500">{label}:</span>
      <span className="font-medium text-slate-900">{value}</span>
    </div>
  );
}
