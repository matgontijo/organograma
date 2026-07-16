import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  // App is client-rendered (ssr:false) — wait for the diagram + nodes to mount.
  await expect(page.getByTestId('diagram')).toBeVisible();
  await expect
    .poll(async () => page.locator('.react-flow__node').count())
    .toBeGreaterThan(10);
});

test('renders the swimlane bands', async ({ page }) => {
  for (const band of ['PESSOAS', 'EMPRESAS', 'IMÓVEIS', 'CARROS', 'SEGUROS']) {
    await expect(
      page.getByRole('button', { name: new RegExp(`faixa ${band}`, 'i') }),
    ).toBeVisible();
  }
});

test('adds a link to a card and opens it in a new tab', async ({ page, context }) => {
  // Select the (unique) Jeep Wrangler card.
  await page.getByText('Jeep Wrangler', { exact: true }).click();
  await expect(page.getByTestId('inspector-title')).toHaveValue('Jeep Wrangler');

  // Add a link via the inspector and give it a real URL + label.
  await page.getByTestId('inspector-add-link').click();
  await page.getByPlaceholder('Rótulo').last().fill('Documento');
  await page.getByPlaceholder('https://...').last().fill('https://example.com/jeep');

  // The card footer now shows a clickable link that opens in a new tab.
  const cardLink = page.getByRole('link', { name: 'Documento' });
  await expect(cardLink).toHaveAttribute('target', '_blank');

  const [popup] = await Promise.all([context.waitForEvent('page'), cardLink.click()]);
  expect(popup.url()).toContain('example.com/jeep');
});

test('search for "Gibraltar" highlights the chain and centralizes', async ({
  page,
}) => {
  const input = page.getByLabel('Buscar por nome, sócio, placa ou matrícula');
  await input.fill('Gibraltar');
  await input.press('Enter');

  await expect(page.getByTestId('hit-count')).toBeVisible();
  // At least one node highlighted and at least one dimmed (chain isolation).
  await expect
    .poll(async () => page.locator('.react-flow__node.node-hit').count())
    .toBeGreaterThan(0);
  await expect
    .poll(async () => page.locator('.react-flow__node.node-dim').count())
    .toBeGreaterThan(0);
});

test('exports a PNG file', async ({ page }) => {
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'PNG', exact: true }).click(),
  ]);
  expect(download.suggestedFilename()).toBe('mapa-trk.png');
});

test('collapses and expands a lane', async ({ page }) => {
  await expect(page.getByText('Jeep Wrangler', { exact: true })).toBeVisible();

  // Collapse CARROS.
  await page.getByRole('button', { name: /Recolher faixa CARROS/i }).click();
  await expect(page.getByText('Jeep Wrangler', { exact: true })).toHaveCount(0);

  // Expand again.
  await page.getByRole('button', { name: /Expandir faixa CARROS/i }).click();
  await expect(page.getByText('Jeep Wrangler', { exact: true })).toBeVisible();
});
