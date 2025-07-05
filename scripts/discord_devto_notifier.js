const fetch = require('node-fetch');
const fs = require('fs');

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
const DEVTO_USER = process.env.DEVTO_USER;
const DEVTO_API_URL = `https://dev.to/api/articles?per_page=1&username=${DEVTO_USER}`;
const LAST_CHECKED_FILE = 'last_checked_devto.json';

function loadLastChecked() {
    if (fs.existsSync(LAST_CHECKED_FILE)) {
        const data = fs.readFileSync(LAST_CHECKED_FILE, 'utf8');
        return JSON.parse(data);
    }
    return { last_article_id: null };
}

function saveLastChecked(data) {
    fs.writeFileSync(LAST_CHECKED_FILE, JSON.stringify(data));
}

async function sendDiscordMessage(webhookUrl, title, url, description, coverImage) {
    const embed = {
        title,
        url,
        description,
        color: 5814783, // A nice blue color
    };
    if (coverImage) {
        embed.image = { url: coverImage };
    }

    const data = {
        embeds: [embed],
    };

    const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    console.log(`Sent message for: ${title}`);
}

async function main() {
    if (!DISCORD_WEBHOOK_URL) {
        console.error("Error: DISCORD_WEBHOOK_URL not set.");
        return;
    }

    let articles;
    try {
        const response = await fetch(DEVTO_API_URL);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        articles = await response.json();
    } catch (error) {
        console.error(`Error fetching articles from Dev.to API: ${error}`);
        return;
    }

    if (!articles || articles.length === 0) {
        console.log("No articles found from Dev.to API.");
        return;
    }

    const latestArticle = articles[0];
    const {
        id: articleId,
        title: articleTitle = 'Untitled Article',
        url: articleUrl,
        description: articleDescription = 'No description available.',
        cover_image: articleCoverImage,
    } = latestArticle;

    const lastChecked = loadLastChecked();

    if (articleId && articleId !== lastChecked.last_article_id) {
        console.log(`New article found: ${articleTitle}`);
        try {
            await sendDiscordMessage(
                DISCORD_WEBHOOK_URL,
                articleTitle,
                articleUrl,
                articleDescription,
                articleCoverImage
            );
            lastChecked.last_article_id = articleId;
            saveLastChecked(lastChecked);
        } catch (error) {
            console.error(`Failed to send Discord message for ${articleTitle}: ${error}`);
        }
    } else {
        console.log("No new articles to notify about.");
    }
}

if (require.main === module) {
    main();
}
