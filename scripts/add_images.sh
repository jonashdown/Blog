#! /bin/bash
set -ex

for f in $(git --name-only HEAD HEAD~1 -- articles)
do
  npx mmdc -i $f -o posts/$(basename $f)
  sed -i s@./@https://raw.githubusercontent.com/jonashdown/Blog/main/_svg/@ posts/$(basename $f)
  git add posts/$(basename $f)
done

mv posts/*.svg _svgs
git add _svgs/*
git commit --ammend --no-edit