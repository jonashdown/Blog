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

test("main function should prepare bluesky message and write to GITHUB_OUTPUT", async () => {
  process.env.DEVTO_USER = "testuser";
  process.env.GITHUB_OUTPUT = "/tmp/github_output";

  // Dynamically import the module after setting environment variables
  const { main } = await import("./bluesky_devto_notifier.js");

  await main();

  expect(mockAppendFile).toHaveBeenCalledWith(
    "/tmp/github_output",
    "bluesky_message=Test Article\n\nA test description.\n\nhttp://example.com\n",
  );
  expect(mockAppendFile).toHaveBeenCalledWith(
    "/tmp/github_output",
    "new_article_id=123\n",
  );
});
