import { promises as fs } from 'fs';

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
const DEVTO_USER = process.env.DEVTO_USER;
const DEVTO_API_URL = `https://dev.to/api/articles?per_page=1&username=${DEVTO_USER}`;
const LAST_CHECKED_FILE = 'last_checked_devto.json';

async function loadLastChecked() {
    try {
        await fs.access(LAST_CHECKED_FILE);
        const data = await fs.readFile(LAST_CHECKED_FILE, 'utf8');
        const { id } = JSON.parse(data);
        return id;
    } catch (error) {
        if (error.code === 'ENOENT') {
            return null;
        }
        throw error;
    }
}

async function saveLastChecked(id) {
    return await fs.writeFile(LAST_CHECKED_FILE, JSON.stringify({ id }));
}

async function sendDiscordMessage( {title, url, description, coverImage} ) {
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

    const response = await fetch(DISCORD_WEBHOOK_URL, {
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

        const { id, title, url, cover_image, description = 'No description available.' } = articles[0];
        const lastChecked = await loadLastChecked();

        if( id === lastChecked ) {
            console.log("no articles to publish");
            return;
        }

        console.log(`New article found: ${title}`);
        await sendDiscordMessage( {
            title, url, cover_image, description
        });
        saveLastChecked(id);

    } catch (error) {
        console.error(`Error fetching articles from Dev.to API: ${error}`);
        process.exit(1);
    }
}

