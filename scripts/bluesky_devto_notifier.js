// Bun has a native fetch API, no need for node-fetch
import { appendFile } from "node:fs/promises";

const DEVTO_API_URL = `https://dev.to/api/articles?per_page=1&username=${process.env.DEVTO_USER}`;
const LAST_ARTICLE_ID = process.env.LAST_ARTICLE_ID;

async function getLatestDevtoArticle() {
  try {
    const response = await fetch(DEVTO_API_URL);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const articles = await response.json();
    if (articles?.length > 0) {
      return articles[0];
    }
  } catch (error) {
    console.error(`Error fetching articles from Dev.to API: ${error}`);
    process.end(1);
  }
}

const constructMessage = ({ title, description, url }) =>
  `${title}

${description}

${url}`;

export async function main() {
  try {
    const latestArticle = await getLatestDevtoArticle();

    if (!latestArticle) {
      throw new Error("No latest article found from Dev.to API.");
    }

    const {
      id,
      title,
      url,
      description = "No description available.",
    } = latestArticle;

    if (id.toString() === LAST_ARTICLE_ID) {
      console.log("No new articles to post to Bluesky.");
      return;
    }

    // Construct the message for Bluesky
    const message = constructMessage({ title, description, url });
    console.log(`Bluesky Message: ${message}`);

    // The actual posting to Bluesky will be handled by the GitHub Action
    // This script just prepares the message
    if (process.env.GITHUB_OUTPUT) {
      await appendFile(
        process.env.GITHUB_OUTPUT,
        `bluesky_message=${message}
`,
      );
      await appendFile(
        process.env.GITHUB_OUTPUT,
        `new_article_id=${id}
`,
      );
    }
  } catch (error) {
    console.error("An error occurred:", error);
    process.exit(1);
  }
}
