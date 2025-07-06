import { appendFile } from "node:fs/promises";

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
const DEVTO_USER = process.env.DEVTO_USER;
const DEVTO_API_URL = `https://dev.to/api/articles?per_page=1&username=${DEVTO_USER}`;
const LAST_ARTICLE_ID = process.env.LAST_ARTICLE_ID;

async function sendDiscordMessage({ title, url, description, coverImage }) {
  const embed = {
    title,
    url,
    description,
    color: 5814783, // A nice blue color
    image: coverImage ? { url: coverImage } : undefined,
  };

  const data = {
    embeds: [embed],
  };

  const response = await fetch(DISCORD_WEBHOOK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  console.log(`Sent message for: ${title}`);
}

export async function main() {
  if (!DISCORD_WEBHOOK_URL) {
    console.error("Error: DISCORD_WEBHOOK_URL not set.");
    return;
  }

  try {
    const response = await fetch(DEVTO_API_URL);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const articles = await response.json();
    if (!articles?.length) {
      throw new Error("No articles found from Dev.to API.");
    }

    const {
      id,
      title,
      url,
      cover_image,
      description = "No description available.",
    } = articles[0];

    if (id.toString() === LAST_ARTICLE_ID) {
      console.log("no articles to publish");
      return;
    }

    console.log(`New article found: ${title}`);
    await sendDiscordMessage({
      title,
      url,
      cover_image,
      description,
    });

    if (process.env.GITHUB_OUTPUT) {
      await appendFile(
        process.env.GITHUB_OUTPUT,
        `new_article_id=${id}
`,
      );
    }
  } catch (error) {
    console.error(`Error fetching articles from Dev.to API: ${error}`);
    process.exit(1);
  }
}
