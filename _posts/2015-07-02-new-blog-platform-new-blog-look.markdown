---
layout: page
title: New Blog Platform, New Blog Look
author: fran
teaser: We've updated the blog platform from WordPress to Jekyll (GitHub Pages)!  We also took the opportunity to refresh the blog's look.  Read more about the motivations for the switch.
category: News
---

**MPC IT Blog - Now with more simple!**

Last fall, we took the path of least resistance for getting a blog up quickly: we put up a site with a canned template on a WordPress host.  We wanted to get a blog up with a minimum of fuss and effort.  It certainly worked, as two of us were able to get that blog online with sporadic effort over the course of a couple of weeks.  

We always knew it would be a temporary solution, since there were several pain points we knew we'd have to address eventually.  Some of the pain points were:

* The WP templates were too rigid, layout tweaking was such a pain.
* No one enjoyed hacking on PHP to make changes.
* Each post required a banner image, from which a thumbnail would be automatically generated, usually in some sub-optimal way (e.g. cutting off words)
* The home page feature slider was a pain to keep fresh.  We kept having to photoshop up new banner images.
* PHP.
* All this emphasis on imagery was annoying, since 95% of our posts didn't suggest an obvious image to use.
* Every time we logged into the admin console, there were a handful of updates that needed to be applied to the WP code or themes.
* Markdown support was shaky at best.  Authors hated the editing process.  Code syntax highlighting was too fragile.
* PHP.
* We had to maintain a third-party host (because it's less work than running our own WP server).  Dreamhost did a fine job, but it was yet another service to learn how to support (and selfishly, it was also generating annoying paperwork for me in the form of the monthly expense report!)
* Also, PHP.

Things came to a head when my blog maintenance partner left the MPC and I was left as the only maintainer and editor.  I wanted something simpler, and I wanted it fast.

Goals for the new platform:

* Reduce barriers for authors to create new content
* Reduce barriers for me to edit and get a new post online
* Host it with minimal sysadmin and administrative load
* Flexible theming that gets out of my way rather than in it
* De-emphasize images
* !PHP

I quickly settled on a Jekyll -> GitHub Pages strategy.  This was a win-win-win-win-win-win with respect to the six goals I outlined above.  

If you're not familiar with [Jekyll](http://jekyllrb.com/), it's a tool which describes itself as a "simple, blog-aware static site generator" (which happens to be Ruby-based, though this turns out to be mostly irrelevant).  It works like this: you pipe in your input in whatever format you want (e.g. markdown), Jekyll cranks it through converters (e.g. Markdown -> HTML) and its template engine (Liquid), and out comes a static site.  By providing metadata along with your content (e.g. which layout to use, who is the author, and so on), you get a beautifully rendered site out on the other end that _doesn't require any backing database or dynamic web framework_.  Brilliant #1!

Even better, the most common way to manage a Jekyll site is as a git repository.  This is great since we're a git-based dev shop and we're using git all day long anyhow.  Developing a new post is simply a fork-write-pull request cycle. Brilliant #2!

Now, where to host it? GitHub Pages, Github's solution for hosting web sites for its projects, is running Jekyll under the hood, so it's super simple to publish a Jekyll site as a GitHub Pages site.  This is important for us, because we are an enterprise Github customer, and have a campus instance of Github that can serve as our site host.  (Of course, we could have used github.com for this if this weren't the case.) No more third-party hosting.  Brilliant #3!

There are lots of other great benefits, too.  We adopted a minimalist, flexible, responsive theme ([Feeling Responsive](https://phlow.github.io/feeling-responsive/)) so there's not a lot to worry about other than the content itself.  We get great code syntax highlighting through Jekyll's support of [Pygments](http://pygments.org/).  And as a static site, I don't have to worry about sysadmin headaches like database connections or PHP/WP security patches.  Brilliant #4,5,6!

Porting content was a bit of a chore, but our site wasn't all that big so some search-and-replace fu got our content most of the way to a state of clean markdown syntax.  I've been pleasantly surprised at how easy it has been for me to make layout tweaks, since I am not a front end developer and CSS is not my usual cup of tea.  The template engine syntax is clean, so it's easy to pull in data like author information from the YAML config files.  All in all, I've rebuilt the entire site on Jekyll in about a week - way easier than even WordPress.  And for our needs, which are in a word "simple", it's a perfect match.  Hopefully this means more great content for the blog in the coming months!
