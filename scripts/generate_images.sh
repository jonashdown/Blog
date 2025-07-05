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
    npx mmdc -i "$f" -o "posts/$FILENAME"

    #replace relative image urls with absolute
    sed -i "s@\./@${RAW_URL}@g" "posts/$FILENAME"

    #move images to the _svgs folder
    mv posts/${BASENAME_NO_EXT}*.svg _svgs/
  fi
done
