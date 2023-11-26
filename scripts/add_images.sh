#! /bin/bash
set -e

#setup a url to load images from
RAW_URL='https://raw.githubusercontent.com/jonashdown/Blog/main/_svg/'

#decide if we have genarated images
GENERATED_IMAGES=false

#loop over the articles folder and generate images
for f in $(git diff --name-only HEAD HEAD~1 -- articles)
do
  #generate images using mermaid
  npx mmdc -i $f -o posts/$(basename $f)

  #replace relative image urls with absolute
  sed -i 's@./@${RAW_URL}@g' posts/$(basename $f)

  #move images to the _svg folder
  mv posts/$(basename -s .md $f)*.svg _svgs

  #add generated artifacts to git staging
  git add posts/$(basename $f)
  git add _svgs/$(basename -s .md $f)*.svg
  GENERATED_IMAGES=true
done

#add generated images and posts to the last commit
if [ $GENERATED_IMAGES ]
then
  git commit --amend --no-edit
fi
