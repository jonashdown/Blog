import { test, expect, mock } from "bun:test";
import { promises as fs } from 'fs';

globalThis.fetch = mock(() => Promise.resolve({
  ok: true,
  json: () => Promise.resolve([{ id: 123, title: "Test Article", url: "http://example.com", description: "A test description." }]),
}));

const mockAccess = mock(() => Promise.reject({ code: 'ENOENT' }));
const mockReadFile = mock(() => Promise.resolve(JSON.stringify({ id: 122 })));
const mockWriteFile = mock(() => Promise.resolve());

mock.module('fs', () => ({
  promises: {
    access: mockAccess,
    readFile: mockReadFile,
    writeFile: mockWriteFile,
  },
}));

test('main function should send discord message for new article', async () => {
  process.env.DISCORD_WEBHOOK_URL = 'http://test.webhook.com';
  process.env.DEVTO_USER = 'testuser';

  const { main } = await import('./discord_devto_notifier.js');

  await main();

  expect(mockWriteFile).toHaveBeenCalledWith(
    'last_checked_devto.json',
    JSON.stringify({ id: 123 })
  );
});