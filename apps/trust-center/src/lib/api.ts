const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3333/v1';
const ORG_SLUG = process.env.NEXT_PUBLIC_ORG_SLUG || 'autochart';

export interface Framework {
  name: string;
  slug: string;
  status: 'started' | 'in_progress' | 'compliant';
  enabled: boolean;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  order: number;
}

export interface ComplianceBadge {
  type: string;
  label: string;
}

export interface Vendor {
  id: string;
  name: string;
  description: string | null;
  website: string | null;
  logoUrl: string | null;
  complianceBadges: ComplianceBadge[];
  trustPortalUrl?: string | null;
}

export interface CustomLink {
  id: string;
  title: string;
  description: string | null;
  url: string;
}

export interface Overview {
  title: string | null;
  content: string | null;
}

export interface AccessRequestPayload {
  name: string;
  email: string;
  company: string;
  jobTitle: string;
  purpose: string;
}

export interface NdaDetails {
  id: string;
  organizationName: string;
  requesterName: string;
  requesterEmail: string;
  status: string;
  expiresAt: string;
}

export interface GrantData {
  organizationName: string;
  expiresAt: string;
  subjectEmail: string;
  ndaPdfUrl: string | null;
}

export interface Policy {
  id: string;
  title?: string;
  name?: string;
  description?: string | null;
}

export interface ComplianceResource {
  framework: string;
  fileName?: string;
}

export interface TrustDocument {
  id: string;
  name: string;
  category?: string | null;
  description?: string | null;
}

async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}/trust-access/${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    cache: 'no-store',
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res.json();
}

// --- Public content (shapes verified against the Comp AI trust-access API) ---
export const getOverview = () => api<Overview | null>(`${ORG_SLUG}/overview`);
export const getFrameworks = () =>
  api<{ frameworks: Framework[] }>(`${ORG_SLUG}/frameworks`);
export const getFaqs = () => api<{ faqs: FAQ[] | null }>(`${ORG_SLUG}/faqs`);
export const getVendors = () => api<Vendor[]>(`${ORG_SLUG}/vendors`);
export const getCustomLinks = () => api<CustomLink[]>(`${ORG_SLUG}/custom-links`);
export const getFavicon = () =>
  api<{ faviconUrl: string | null }>(`${ORG_SLUG}/favicon`);

export const submitAccessRequest = (payload: AccessRequestPayload) =>
  api<{ id: string; status: string; message: string }>(`${ORG_SLUG}/requests`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const reclaimAccess = (email: string, query?: string) =>
  api<{ message: string }>(
    `${ORG_SLUG}/reclaim${query ? `?query=${encodeURIComponent(query)}` : ''}`,
    { method: 'POST', body: JSON.stringify({ email }) },
  );

// --- NDA flow ---
export const getNdaDetails = (token: string) => api<NdaDetails>(`nda/${token}`);
export const previewNda = (token: string) =>
  api<{ url: string }>(`nda/${token}/preview-nda`, { method: 'POST' });
export const signNda = (token: string, name: string, email: string) =>
  api<{ message: string }>(`nda/${token}/sign`, {
    method: 'POST',
    body: JSON.stringify({ name, email, accept: true }),
  });

// --- Gated content ---
export const getGrantData = (token: string) => api<GrantData>(`access/${token}`);
export const getPolicies = (token: string) =>
  api<{ policies: Policy[] }>(`access/${token}/policies`);
export const downloadAllPolicies = (token: string) =>
  api<{ url: string }>(`access/${token}/policies/download-all`);
export const downloadAllPoliciesZip = (token: string) =>
  api<{ url: string }>(`access/${token}/policies/download-all-zip`);
export const getComplianceResources = (token: string) =>
  api<{ resources: ComplianceResource[] }>(`access/${token}/compliance-resources`);
export const downloadComplianceResource = (token: string, framework: string) =>
  api<{ url: string }>(`access/${token}/compliance-resources/${framework}`);
export const getTrustDocuments = (token: string) =>
  api<{ documents: TrustDocument[] }>(`access/${token}/documents`);
export const downloadTrustDocument = (token: string, documentId: string) =>
  api<{ url: string }>(`access/${token}/documents/${documentId}`);
export const downloadAllDocuments = (token: string) =>
  api<{ url: string }>(`access/${token}/documents/download-all`);
