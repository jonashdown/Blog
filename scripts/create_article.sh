#!/bin/bash

set -e

if [ -z "$1" ]; then
  echo "Usage: $0 <article_title>"
  exit 1
fi

ARTICLE_TITLE="$1"

# Sanitize title for filename: lowercase, replace spaces with hyphens
FILENAME=$(echo "$ARTICLE_TITLE" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9\-]+/-/g' | sed 's/\-\-*/-/g' | sed 's/^-//' | sed 's/-$//')
FILE_PATH="articles/${FILENAME}.md"

# Check if file already exists
if [ -f "$FILE_PATH" ]; then
  echo "Error: File '${FILE_PATH}' already exists. Please choose a different title." >&2
  exit 1
fi

# Prompt for optional fields
read -p "Enter description (optional): " DESCRIPTION
read -p "Enter tags (comma-separated, optional): " TAGS
read -p "Enter cover image URL (optional): " COVER_IMAGE
read -p "Enter series (optional): " SERIES

# Construct front matter
FRONT_MATTER="---
title: ${ARTICLE_TITLE}
description: ${DESCRIPTION}
tags: '${TAGS}'
cover_image: '${COVER_IMAGE}'"

if [ -n "$SERIES" ]; then
  FRONT_MATTER="${FRONT_MATTER}
series: '${SERIES}'"
fi

FRONT_MATTER="${FRONT_MATTER}
canonical_url: null
published: true
---

# ${ARTICLE_TITLE}

<!-- Write your article content here -->"

# Create the file
echo -e "$FRONT_MATTER" > "$FILE_PATH"

echo -e "
[Buy me a coffee](https://buymeacoffee.com/jonashdown)" >> "$FILE_PATH"

echo "Article '${FILE_PATH}' created successfully."