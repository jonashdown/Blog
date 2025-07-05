#!/bin/bash
set -e

# Add generated artifacts to git staging
for f in $(git diff --name-only HEAD HEAD~1 -- articles)
do
  if [ -f "$f" ]; then
    BASENAME_NO_EXT=$(basename "$f" .md)

    git add "_svgs/${BASENAME_NO_EXT}"*.svg
  fi
done

# Check if there are any staged changes
if git diff --staged --quiet; then
  echo "No changes to commit"
else
  # Amend the last commit
  git commit --amend --no-edit
fi