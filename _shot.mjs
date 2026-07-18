import { chromium } from 'playwright';

const DIR = process.argv[2] || '.';
const b = await chromium.launch();
const page = await b.newPage({ viewport: { width: 390, height: 844 } });
await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
await page.waitForTimeout(600);

// Fermer le bilan de départ s'il est ouvert
for (const rx of [/valider/i, /terminer/i, /fermer/i, /plus tard/i, /commencer/i, /c.est parti/i]) {
  const btn = page.getByRole('button', { name: rx });
  if (await btn.count()) { await btn.first().click().catch(()=>{}); break; }
}
await page.keyboard.press('Escape').catch(()=>{});
await page.waitForTimeout(400);

// Aller dans l'Arbre
await page.getByText('Arbre', { exact: true }).click();
await page.waitForTimeout(600);

async function shotCard(label, file) {
  const card = page.locator('.skill-card', { hasText: label }).first();
  if (!(await card.count())) { console.log('CARD NOT FOUND:', label); return; }
  await card.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await card.screenshot({ path: `${DIR}/${file}` });
  console.log('OK', file, '::', (await card.innerText()).replace(/\n+/g,' | ').slice(0,300));
}

await shotCard('Rappel', '02-rappel.png');
await shotCard('Décrocher', '03-decrocher.png');

await b.close();
