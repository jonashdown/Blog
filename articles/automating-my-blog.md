---
title:  Automating my Blog
description: The journey I went thorough to automate publishing my blog.
tags: 'Automating, github actions, mermaid.js, dev.to'
cover_image: ''
canonical_url: null
published: true
---

I use [Github](https://www.github.com) to store the code that I write, and [Github Actions](https://github.com/features/actions) to automate my workflows. My [blog](https://dev.to/jonashdown) is hosted on a number of platforms including [Dev.to](https://dev.to/jonashdown), which accepts markdown as an input format and has an [api](https://developers.forem.com/api).

If I could store my blog in Github, I could do the following
 - Write blog articles off line and use git to keep them upto date.
 - Push completed articles to Github.
 - Take advantage of Github Actions to:
   - Publish to various blogging platforms
   - Grammar and spell check
   - Generate and store diagrams 
   - Inform social media platforms of new/updated articles
   - Display latest articles on my Github profile.

## Publishing to Dev.to
A quick search of the [Github marketplace](https://github.com/marketplace?category=&type=actions&verification=&query=dev.to) found [Publish to dev.to](https://github.com/marketplace/actions/publish-to-dev-to) maintained and owned by [sinedied](https://dev.to/sinedied) which seems to fit my needs. 

After following the config steps for this action, I was able to see articles being published to my blog. The default config worked fine for the way I work, which is to always create a Pull Request before I merge to main.

## Generating Diagrams
[Mermaid.js](https://mermaid.js.org/) seemed like the obvious choice as it integrates with Markdown and Github, and importantly has a [commnand line interface](https://github.com/mermaid-js/mermaid-cli), which means it can be used in a workflow file.

Any generated images can use the github raw urls, so a bit of `sed` magic will convert the local urls that mermaid generates into a full url. N.b to take advantage of Github as a hosting service, the repo will have to be set as public otherwise, there will be a need to play with tokens and their expiry. I will write about how the repo is secured in another post.

I will also need ot consider how the generated images are added to the repo.

