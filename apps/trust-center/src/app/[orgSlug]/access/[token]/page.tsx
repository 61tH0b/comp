import { AccessPortal } from '@/components/AccessPortal';

export const dynamic = 'force-dynamic';

export default async function OrgAccessPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <AccessPortal token={token} />;
}
