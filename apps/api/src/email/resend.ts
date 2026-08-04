import { Resend } from 'resend';
import * as React from 'react';

export const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
}

export const sendEmail = async ({
  to,
  subject,
  react,
  marketing,
  system,
  test,
  cc,
  scheduledAt,
  attachments,
}: {
  to: string;
  subject: string;
  react: React.ReactNode;
  marketing?: boolean;
  system?: boolean;
  test?: boolean;
  cc?: string | string[];
  scheduledAt?: string;
  attachments?: EmailAttachment[];
}) => {
  if (!resend) {
    throw new Error('Resend not initialized - missing API key');
  }

  // 1) Pull each env var into its own constant
  const fromMarketing = process.env.RESEND_FROM_MARKETING;
  const fromSystem = process.env.RESEND_FROM_SYSTEM;
  const fromDefault = process.env.RESEND_FROM_DEFAULT;
  const toTest = process.env.RESEND_TO_TEST;
  const replyMarketing = process.env.RESEND_REPLY_TO_MARKETING;

  // 2) Decide which one you need for this email
  const fromAddress = marketing
    ? fromMarketing
    : system
      ? fromSystem
      : fromDefault;

  const toAddress = test ? toTest : to;

  const replyTo = marketing ? replyMarketing : undefined;

  // Local dev: capture emails to a file instead of sending via Resend.
  if (process.env.MOCK_EMAIL === 'true') {
    try {
      const { render } = await import('@react-email/render');
      const html = await render(react as React.ReactElement);
      const links = Array.from(html.matchAll(/href="([^"]+)"/g))
        .map((m) => m[1])
        .filter((u) => u && !u.startsWith('mailto:'));
      const { appendFileSync, mkdirSync } = await import('fs');
      const dir = process.env.MOCK_EMAIL_DIR || '/root/local-stack-data';
      mkdirSync(dir, { recursive: true });
      const id = `mock_${Date.now()}`;
      appendFileSync(
        `${dir}/emails.jsonl`,
        JSON.stringify({ id, at: new Date().toISOString(), to: toAddress ?? to, subject, links }) + '\n',
      );
      // eslint-disable-next-line no-console
      console.log(`[MOCK_EMAIL] to=${toAddress ?? to} subject="${subject}" links=${JSON.stringify(links)}`);
      return { id };
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('[MOCK_EMAIL] capture failed:', e);
      return { id: `mock_error_${Date.now()}` };
    }
  }

  // 3) Guard against undefined
  if (!fromAddress) {
    throw new Error('Missing FROM address in environment variables');
  }
  if (!toAddress) {
    throw new Error('Missing TO address in environment variables');
  }

  try {
    const { data, error } = await resend.emails.send({
      from: fromAddress, // now always a string
      to: toAddress, // now always a string
      cc,
      replyTo,
      subject,
      // @ts-ignore – React node allowed by the SDK
      react,
      scheduledAt,
      attachments: attachments?.map((att) => ({
        filename: att.filename,
        content: att.content,
        contentType: att.contentType,
      })),
    });

    if (error) {
      console.error('Resend API error:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }

    return {
      message: 'Email sent successfully',
      id: data?.id,
    };
  } catch (error) {
    console.error('Email sending error:', error);
    throw error instanceof Error ? error : new Error('Failed to send email');
  }
};
