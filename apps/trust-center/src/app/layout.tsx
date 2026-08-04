import type { Metadata } from 'next';
import './globals.css';

const ORG_NAME = process.env.NEXT_PUBLIC_ORG_NAME || 'Autochart.ai';

export const metadata: Metadata = {
  title: `${ORG_NAME} Trust Center`,
  description: `Security and compliance information for ${ORG_NAME}.`,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-white text-slate-900 antialiased">{children}</body>
    </html>
  );
}
