import { getGrantData, getPolicies, getComplianceResources, getTrustDocuments } from '@/lib/api';
import { AccessPortalClient } from '@/components/AccessPortalClient';

// Shared server component for the gated access portal. Rendered by both
// /access/[token] (dedicated-domain root) and /[orgSlug]/access/[token]
// (the slug-prefixed link format the Comp AI backend emails).
export async function AccessPortal({ token }: { token: string }) {
  try {
    const [grant, policies, resources, documents] = await Promise.all([
      getGrantData(token),
      getPolicies(token).catch(() => []),
      getComplianceResources(token).catch(() => []),
      getTrustDocuments(token).catch(() => []),
    ]);
    return (
      <AccessPortalClient
        token={token}
        grant={grant}
        policies={policies}
        resources={resources}
        documents={documents}
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
