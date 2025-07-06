#!/bin/bash
set -e
mkdir -p _svgs

#setup a url to load images from
RAW_URL='https://raw.githubusercontent.com/jonashdown/Blog/main/_svgs/'

#loop over the articles folder and generate images
for f in $(git diff --name-only HEAD HEAD~1 -- articles)
do
  if [ -f "$f" ]; then
    FILENAME=$(basename "$f")
    BASENAME_NO_EXT=$(basename "$f" .md)

    #generate images using mermaid
    bunx mmdc -i "$f" -o "posts/$FILENAME" --puppeteerConfigFile "./scripts/puppeteer-config.json"

    #replace relative image urls with absolute
    sed -i "s@\./@${RAW_URL}@g" "posts/$FILENAME"

    #move images to the _svgs folder
    for s in $(ls posts/${BASENAME_NO_EXT}*.svg)
    do
      mv $s _svgs/
    done
  fi
done
