import { expect, test } from '@playwright/test';

test('home page renders template content', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle('Lambda Site Template');
    await expect(page.getByRole('heading', { name: 'Main explainer title' })).toBeVisible();
    await expect(page.locator('main.home-wrapper')).toBeVisible();
    await expect(page.locator('.home-steps__item')).toHaveCount(3);
});

test('api/test responds from browser context', async ({ request }) => {
    const response = await request.get('/api/test');

    await expect(response).toBeOK();
    await expect(response.text()).resolves.toBe('Successful request to the backend API');
});
