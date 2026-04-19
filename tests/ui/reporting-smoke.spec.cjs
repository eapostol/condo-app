const { test, expect } = require('@playwright/test');

const API_URL = process.env.PLAYWRIGHT_API_URL || 'http://localhost:5001';
const SEEDED_MANAGER = {
  email: 'manager@example.com',
  password: 'Password123!',
};

function isCatalogResponse(response) {
  return response.url().includes('/api/reports/catalog') && response.status() === 200;
}

function isFiltersResponse(response) {
  return response.url().includes('/api/reports/filters') && response.status() === 200;
}

function isRunReportResponse(response) {
  const pathname = new URL(response.url()).pathname;
  return (
    pathname.startsWith('/api/reports/') &&
    !pathname.endsWith('/catalog') &&
    !pathname.endsWith('/filters') &&
    response.request().method() === 'GET' &&
    response.status() === 200
  );
}

test('manager reports page loads and runs a report', async ({ page, request, baseURL }) => {
  const health = await request.get(`${API_URL}/api/health`);
  expect(health.ok()).toBeTruthy();

  const loginResponse = await request.post(`${API_URL}/api/auth/login`, {
    data: SEEDED_MANAGER,
  });
  expect(loginResponse.ok()).toBeTruthy();

  const loginPayload = await loginResponse.json();

  await page.addInitScript(({ user, token }) => {
    localStorage.setItem('condo_user', JSON.stringify(user));
    localStorage.setItem('condo_token', token);
  }, loginPayload);

  const catalogPromise = page.waitForResponse(isCatalogResponse);
  const filtersPromise = page.waitForResponse(isFiltersResponse);
  const reportPromise = page.waitForResponse(isRunReportResponse);

  await page.goto(`${baseURL}/manager/reports`, { waitUntil: 'domcontentloaded' });

  const [catalogResponse, filtersResponse, reportResponse] = await Promise.all([
    catalogPromise,
    filtersPromise,
    reportPromise,
  ]);

  await expect(page.getByText('Manager monthly report')).toBeVisible();
  await expect(page.getByText('Reporting')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Run' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Save as PDF' })).toBeVisible();

  const catalogJson = await catalogResponse.json();
  const filtersJson = await filtersResponse.json();
  const reportJson = await reportResponse.json();

  expect(catalogJson.provider).toBeTruthy();
  expect(Array.isArray(catalogJson.catalog)).toBeTruthy();
  expect(Array.isArray(filtersJson.properties)).toBeTruthy();
  expect(reportJson.report).toBeTruthy();
  expect(typeof reportJson.count).toBe('number');
  expect(Array.isArray(reportJson.rows)).toBeTruthy();
});
