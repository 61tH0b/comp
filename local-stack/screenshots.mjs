// Capture screenshots of the running trust center across the full NDA flow.
// Usage: node local-stack/screenshots.mjs <ndaToken>
import { chromium } from 'playwright';
import { readFileSync, mkdirSync } from 'fs';

const NDA_TOKEN = process.argv[2];
const BASE = 'http://127.0.0.1:3003';
const EMAILS = '/root/local-stack-data/emails.jsonl';
const OUT = '/root/local-stack-data/shots';
mkdirSync(OUT, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function latestAccessLink() {
  const lines = readFileSync(EMAILS, 'utf8').trim().split('\n').map((l) => JSON.parse(l));
  for (let i = lines.length - 1; i >= 0; i--) {
    if (/Access Granted/i.test(lines[i].subject)) {
      const link = (lines[i].links || []).find((u) => /\/access\//.test(u) || /token=/.test(u));
      if (link) return link.replace(/&amp;/g, '&');
    }
  }
  return null;
}

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });

// 1. Homepage
await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
await sleep(500);
await page.screenshot({ path: `${OUT}/01-homepage.png`, fullPage: true });
console.log('shot: 01-homepage');

// 2. Access request form (open state)
const reqBtn = page.getByRole('button', { name: /Request Access to Documentation/i });
if (await reqBtn.count()) {
  await reqBtn.first().click();
  await sleep(400);
  await page.screenshot({ path: `${OUT}/02-access-request-form.png`, fullPage: true });
  console.log('shot: 02-access-request-form');
}

// 3. NDA signing page
await page.goto(`${BASE}/nda/${NDA_TOKEN}`, { waitUntil: 'networkidle' });
await sleep(600);
await page.screenshot({ path: `${OUT}/03-nda-signing.png`, fullPage: true });
console.log('shot: 03-nda-signing');

// 4. Sign the NDA (drives the real POST /nda/:token/sign)
const signBtn = page.getByRole('button', { name: /I Accept/i });
await signBtn.first().click();
await page.getByText(/NDA Signed/i).waitFor({ timeout: 15000 });
await sleep(400);
await page.screenshot({ path: `${OUT}/04-nda-signed.png`, fullPage: true });
console.log('shot: 04-nda-signed');

// 5. Gated access portal (link came via the captured "Access Granted" email)
await sleep(800);
const accessLink = latestAccessLink();
if (accessLink) {
  const url = accessLink.startsWith('http') ? accessLink : `${BASE}${accessLink}`;
  await page.goto(url, { waitUntil: 'networkidle' });
  await sleep(700);
  await page.screenshot({ path: `${OUT}/05-access-portal.png`, fullPage: true });
  console.log('shot: 05-access-portal ->', url);

  // certificates tab
  const certTab = page.getByRole('button', { name: /Certificates/i });
  if (await certTab.count()) {
    await certTab.first().click();
    await sleep(400);
    await page.screenshot({ path: `${OUT}/06-access-certificates.png`, fullPage: true });
    console.log('shot: 06-access-certificates');
  }
} else {
  console.log('No access link captured yet');
}

await browser.close();
console.log('DONE');
