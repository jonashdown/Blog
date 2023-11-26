#! /bin/bash
set -ex
RAW_URL='https://raw.githubusercontent.com/jonashdown/Blog/main/_svg/'

for f in $(git diff --name-only HEAD HEAD~1 -- articles)
do
  npx mmdc -i $f -o posts/$(basename $f)
  sed -i 's@./@${RAW_URL}@g' posts/$(basename $f)
  mv posts/$(basename -s .md $f)*.svg _svgs
  git add posts/$(basename $f)
  git add _svgs/$(basename -s .md $f)*.svg
done

git commit --amend --no-edit
