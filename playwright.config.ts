import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end tests run against the production build.
 * `PW_CHANNEL=msedge` uses the Edge already on the machine instead of a downloaded browser.
 */
const channel = process.env.PW_CHANNEL;

export default defineConfig({
  testDir: 'e2e',
  reporter: 'list',
  use: { baseURL: 'http://localhost:4174/', serviceWorkers: 'allow' },
  webServer: {
    command: 'npm run build && npx vite preview --port 4174 --strictPort',
    url: 'http://localhost:4174/',
    reuseExistingServer: true,
    timeout: 120_000,
  },
  projects: [
    {
      name: 'phone',
      use: { ...devices['Pixel 7'], ...(channel ? { channel } : {}) },
    },
  ],
});
