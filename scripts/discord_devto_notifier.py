import requests
import json
import os

DISCORD_WEBHOOK_URL = os.getenv('DISCORD_WEBHOOK_URL')
DEVTO_API_URL = "https://dev.to/api/articles?per_page=1&username=jonashdown"
LAST_CHECKED_FILE = 'last_checked_devto.json'

def load_last_checked():
    if os.path.exists(LAST_CHECKED_FILE):
        with open(LAST_CHECKED_FILE, 'r') as f:
            return json.load(f)
    return {'last_article_id': None}

def save_last_checked(data):
    with open(LAST_CHECKED_FILE, 'w') as f:
        json.dump(data, f)

def send_discord_message(webhook_url, title, url, description, cover_image=None):
    embed = {
        "title": title,
        "url": url,
        "description": description,
        "color": 5814783 # A nice blue color
    }
    if cover_image:
        embed["image"] = {"url": cover_image}

    data = {
        "embeds": [
            embed
        ]
    }
    response = requests.post(webhook_url, json=data)
    response.raise_for_status()
    print(f"Sent message for: {title}")

def main():
    if not DISCORD_WEBHOOK_URL:
        print("Error: DISCORD_WEBHOOK_URL not set.")
        return

    try:
        response = requests.get(DEVTO_API_URL)
        response.raise_for_status() # Raise an exception for HTTP errors
        articles = response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error fetching articles from Dev.to API: {e}")
        return

    if not articles:
        print("No articles found from Dev.to API.")
        return

    latest_article = articles[0]
    article_id = latest_article.get('id')
    article_title = latest_article.get('title', 'Untitled Article')
    article_url = latest_article.get('url')
    article_description = latest_article.get('description', 'No description available.')
    article_cover_image = latest_article.get('cover_image')

    last_checked = load_last_checked()

    if article_id and article_id != last_checked.get('last_article_id'):
        print(f"New article found: {article_title}")
        try:
            send_discord_message(
                DISCORD_WEBHOOK_URL,
                article_title,
                article_url,
                article_description,
                article_cover_image
            )
            last_checked['last_article_id'] = article_id
            save_last_checked(last_checked)
        except requests.exceptions.RequestException as e:
            print(f"Failed to send Discord message for {article_title}: {e}")
    else:
        print("No new articles to notify about.")

if __name__ == "__main__":
    main()
