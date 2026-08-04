'use client';

import { useState } from 'react';
import type { FAQ } from '@/lib/api';

function FAQItem({ faq }: { faq: FAQ }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-slate-200 last:border-0">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between py-5 text-left">
        <span className="pr-4 text-base font-medium text-slate-900">{faq.question}</span>
        <svg className={`h-5 w-5 shrink-0 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <div className="pb-5 pr-12 text-sm leading-relaxed text-slate-600">{faq.answer}</div>}
    </div>
  );
}

export function FAQSection({ faqs }: { faqs: FAQ[] }) {
  if (!faqs?.length) return null;
  const sorted = [...faqs].sort((a, b) => a.order - b.order);
  return (
    <section id="faq" className="py-16">
      <h2 className="mb-8 text-2xl font-bold text-slate-900">Frequently Asked Questions</h2>
      <div className="rounded-xl border border-slate-200 bg-white px-6">
        {sorted.map((faq) => <FAQItem key={faq.id} faq={faq} />)}
      </div>
    </section>
  );
}
