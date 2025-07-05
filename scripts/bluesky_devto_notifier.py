import requests
import json
import os

DEVTO_API_URL = "https://dev.to/api/articles?per_page=1&username=" + os.getenv('DEVTO_USER')

def get_latest_devto_article():
    try:
        response = requests.get(DEVTO_API_URL)
        response.raise_for_status()
        articles = response.json()
        if articles:
            return articles[0]
    except requests.exceptions.RequestException as e:
        print(f"Error fetching articles from Dev.to API: {e}")
    return None

def main():
    latest_article = get_latest_devto_article()

    if latest_article:
        title = latest_article.get('title', 'Untitled Article')
        url = latest_article.get('url')
        description = latest_article.get('description', 'No description available.')

        # Construct the message for Bluesky
        # Bluesky posts are typically short, so combine title, description, and URL
        message = f"{title}\n\n{description}\n\n{url}"
        # Replace newlines with spaces for GITHUB_OUTPUT compatibility
        single_line_message = message.replace('\n', ' ').replace('\r', ' ')
        print(f"Bluesky Message: {message}")
        # The actual posting to Bluesky will be handled by the GitHub Action
        # This script just prepares the message
        with open(os.environ['GITHUB_OUTPUT'], 'a') as fh:
            print(f"bluesky_message={message}", file=fh)
    else:
        print("No latest article found from Dev.to API.")
        with open(os.environ['GITHUB_OUTPUT'], 'a') as fh:
            print("bluesky_message=", file=fh)

if __name__ == "__main__":
    main()
