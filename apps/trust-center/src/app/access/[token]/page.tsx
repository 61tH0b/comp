import { getGrantData, getPolicies, getComplianceResources, getTrustDocuments } from '@/lib/api';
import { AccessPortalClient } from './AccessPortalClient';

export const dynamic = 'force-dynamic';

export default async function AccessPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  try {
    const [grant, policies, resources, documents] = await Promise.all([
      getGrantData(token),
      getPolicies(token).catch(() => ({ policies: [] })),
      getComplianceResources(token).catch(() => ({ resources: [] })),
      getTrustDocuments(token).catch(() => ({ documents: [] })),
    ]);

    return (
      <AccessPortalClient
        token={token}
        grant={grant}
        policies={policies?.policies || []}
        resources={resources?.resources || []}
        documents={documents?.documents || []}
      />
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Your access link has expired or is invalid.';
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-xl border border-red-200 bg-red-50 p-8 text-center">
          <h2 className="text-lg font-semibold text-red-900">Access Unavailable</h2>
          <p className="mt-2 text-sm text-red-700">{message}</p>
          <a href="/" className="mt-4 inline-block text-sm font-medium text-red-700 underline hover:text-red-900">Return to Trust Center</a>
        </div>
      </div>
    );
  }
}
