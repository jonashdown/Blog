import { expect, mock, test } from "bun:test";

globalThis.fetch = mock(() =>
  Promise.resolve({
    ok: true,
    json: () =>
      Promise.resolve([
        {
          id: 123,
          title: "Test Article",
          url: "http://example.com",
          description: "A test description.",
        },
      ]),
  }),
);

const mockAppendFile = mock(() => Promise.resolve());

mock.module("node:fs/promises", () => ({
  appendFile: mockAppendFile,
}));

test("main function should send discord message for new article", async () => {
  process.env.DISCORD_WEBHOOK_URL = "http://test.webhook.com";
  process.env.DEVTO_USER = "testuser";
  process.env.GITHUB_OUTPUT = "/tmp/github_output";

  const { main } = await import("./discord_devto_notifier.js");

  await main();

  expect(mockAppendFile).toHaveBeenCalledWith(
    "/tmp/github_output",
    "new_article_id=123\n",
  );
});
