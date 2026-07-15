import { getOverview, getFrameworks, getFaqs, getVendors, getCustomLinks } from '@/lib/api';
import { FrameworkBadge } from '@/components/FrameworkBadge';
import { FAQSection } from '@/components/FAQSection';
import { VendorList } from '@/components/VendorList';
import { CustomLinks } from '@/components/CustomLinks';
import { AccessRequestForm, ReclaimAccessForm } from '@/components/AccessRequestForm';

const ORG_NAME = process.env.NEXT_PUBLIC_ORG_NAME || 'Autochart.ai';

export const dynamic = 'force-dynamic';

export default async function TrustCenterPage() {
  const [overview, frameworksData, faqsData, vendors, customLinks] = await Promise.all([
    getOverview().catch(() => null),
    getFrameworks().catch(() => ({ frameworks: [] })),
    getFaqs().catch(() => ({ faqs: null })),
    getVendors().catch(() => []),
    getCustomLinks().catch(() => []),
  ]);

  const frameworks = (frameworksData?.frameworks || []).filter((f) => f.enabled);
  const faqs = faqsData?.faqs || [];

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900">
              <span className="text-sm font-bold text-white">A</span>
            </div>
            <div>
              <h1 className="text-base font-semibold text-slate-900">{ORG_NAME}</h1>
              <p className="text-xs text-slate-500">Trust Center</p>
            </div>
          </div>
          <nav className="hidden items-center gap-6 text-sm sm:flex">
            <a href="#compliance" className="text-slate-600 hover:text-slate-900">Compliance</a>
            <a href="#subprocessors" className="text-slate-600 hover:text-slate-900">Subprocessors</a>
            <a href="#faq" className="text-slate-600 hover:text-slate-900">FAQ</a>
            <a href="#resources" className="text-slate-600 hover:text-slate-900">Resources</a>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6">
        <section className="py-16">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            {overview?.title || 'Security & Compliance'}
          </h2>
          <div className="mt-6 max-w-3xl whitespace-pre-line text-base leading-relaxed text-slate-600">
            {overview?.content ||
              `${ORG_NAME} is committed to maintaining the highest standards of data security and privacy compliance.`}
          </div>
        </section>

        {frameworks.length > 0 && (
          <section id="compliance" className="pb-16">
            <h2 className="mb-6 text-2xl font-bold text-slate-900">Compliance Certifications</h2>
            <div className="flex flex-wrap gap-3">
              {frameworks.map((fw) => <FrameworkBadge key={fw.slug} framework={fw} />)}
            </div>
          </section>
        )}

        <section className="pb-16">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-8">
            <h2 className="mb-2 text-xl font-bold text-slate-900">Access Compliance Documentation</h2>
            <p className="mb-6 text-sm text-slate-600">
              Our SOC 2 report, policies, penetration test summaries, and other documentation are available under NDA.
            </p>
            <AccessRequestForm />
            <div className="mt-6 border-t border-slate-200 pt-6">
              <ReclaimAccessForm />
            </div>
          </div>
        </section>

        <VendorList vendors={vendors} />
        <FAQSection faqs={faqs} />
        <CustomLinks links={customLinks} />
      </main>

      <footer className="mt-16 border-t border-slate-200 bg-slate-50">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
          <p className="text-sm text-slate-500">&copy; {new Date().getFullYear()} Aya Health Technologies Inc.</p>
          <p className="text-sm text-slate-500">
            Powered by <a href="https://trycomp.ai" className="font-medium text-slate-700 hover:text-slate-900">Comp AI</a>
          </p>
        </div>
      </footer>
    </div>
  );
}
