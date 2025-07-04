import feedparser
import requests
import json
import os
import re

DISCORD_WEBHOOK_URL = os.getenv('DISCORD_WEBHOOK_URL')
RSS_FEED_URL = os.getenv('RSS_FEED_URL')
LAST_CHECKED_FILE = 'last_checked_rss.json'

def load_last_checked():
    if os.path.exists(LAST_CHECKED_FILE):
        with open(LAST_CHECKED_FILE, 'r') as f:
            return json.load(f)
    return {}

def save_last_checked(data):
    with open(LAST_CHECKED_FILE, 'w') as f:
        json.dump(data, f)

def send_discord_message(webhook_url, title, link, description):
    data = {
        "embeds": [
            {
                "title": title,
                "url": link,
                "description": description,
                "color": 5814783 # A nice blue color
            }
        ]
    }
    response = requests.post(webhook_url, json=data)
    response.raise_for_status()
    print(f"Sent message for: {title}")

def main():
    if not DISCORD_WEBHOOK_URL or not RSS_FEED_URL:
        print("Error: DISCORD_WEBHOOK_URL or RSS_FEED_URL not set.")
        return

    feed = feedparser.parse(RSS_FEED_URL)
    last_checked = load_last_checked()
    feed_id = RSS_FEED_URL # Use URL as a unique ID for the feed

    new_entries = []
    for entry in feed.entries:
        entry_id = entry.link if hasattr(entry, 'link') else entry.id

        if feed_id not in last_checked or entry_id not in last_checked[feed_id]:
            new_entries.append(entry)

    # Process new entries in reverse order to send oldest first
    for entry in reversed(new_entries):
        title = entry.title
        link = entry.link
        description = entry.summary if hasattr(entry, 'summary') else "No description available."
        # Strip all HTML tags from description
        description = re.sub(r'<[^>]+>', '', description)

        try:
            send_discord_message(DISCORD_WEBHOOK_URL, title, link, description)
            if feed_id not in last_checked:
                last_checked[feed_id] = []
            last_checked[feed_id].append(entry_id)
        except requests.exceptions.RequestException as e:
            print(f"Failed to send Discord message for {title}: {e}")

    save_last_checked(last_checked)
    print(f"Processed {len(new_entries)} new entries.")

if __name__ == "__main__":
    main()