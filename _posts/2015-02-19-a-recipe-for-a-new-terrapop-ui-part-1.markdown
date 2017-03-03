---
layout: page
status: publish
published: true
title: 'A Recipe for a New TerraPop UI: Part 1'
author: ftrabucc
teaser: A look at our newest project, Terra Populus, and the collaborative
  process we're utilizing to design develop the new TerraPop UI.
wordpress_id: 517
wordpress_url: http://tech.popdata.org/?p=517
date: '2015-02-19 16:27:21 -0600'
date_gmt: '2015-02-19 22:27:21 -0600'
categories: DevCulture
tags:
- UI
- user testing
comments:
- id: 124
  author: Pete Clark
  author_email: pclark@umn.edu
  author_url: ''
  date: '2015-02-21 22:53:53 -0600'
  date_gmt: '2015-02-22 04:53:53 -0600'
  content: Congrats, and good luck! Collaboration is indeed the most important thing
    - good tech doesn't matter if you're not solving the right problem.
---
<strong>TerraPop needs a new UI.</strong>

To be more accurate, TerraPop needs a new way for users to formulate requests for data, and it needs to be <em>better</em> than the current one. Not that the current one is not good or is not working properly, but our usability testing with a variety of TerraPop users is hinting to us that there could be a better way.

What does <em>better</em> means in this context? It means that TerraPop has to be more intuitive, more informative, lighter weight, and why not, even better looking... in other words, its User eXperience needs to be improved. It's not an easy task, as the process of specifying a TerraPop data extract is inherently a complex one. The problem we're trying to solve with this project - combining heterogeneous data from multiple domains in dramatically different formats and allowing it to be transformed to new formats, post-processed, and delivered to the user - does not lend itself to simple, elegant web workflows.

### Finding a Medium to Explore New Options

Nevertheless, the team is committed to iterating over this interface until we've made it as simple and elegant as the problem allows. So we dove in, but before opening an editor and starting to code or do any implementation of any sort, we needed to step back and understand the requirements and the feedback. These inputs came from non-developers, and most of the time they tend to be somewhat less than precisely specified. Of course, as any developer knows, the devil lies in the details. So, we first needed to find a <em>medium</em> where both developers and non-developers could have a common understanding, a way to discuss all major functionality, hidden gotchas, interaction between moving parts, and think about them in layers of different granularity, from major actions to minute details. Until these concepts were settled and agreed upon, it would be unproductive to start coding. A common understanding helped the team to avoid major adjustments, sometimes called <em>scope creep</em>, in the middle of an implementation of a major change, most of the time caused by innocuous misunderstandings.

Did we find this <em>medium</em>? I would say yes. Is it perfect? I'm not sure, maybe not, certainly there have been a few imperfections along the way, but so far it's working pretty well. What is it then? It's not a magic paper or a futuristic device, it's simply a combination of different but very important things:

Whiteboards, Wireframes/Mockups, and some speedy Prototyping.

It looks like an obvious list of ingredients for a good meal, but you'll need the right recipe.

Everything starts and ends with meetings, lots of them. They are the glue that keeps everything together, where ideas, concepts, and feedbacks are presented, discussed, refined, and approved.

We started to break the new UI's workflow into layers of different granularity, big concepts at the beginning, details at the end, then whiteboard sketch sessions over and over and over again. This is fun! Never underestimate the power of a whiteboard and in-person collaboration.  The excitement in discovering a new idea that none of us had singularly but rather emerged from the union of thoughts on a whiteboard is thrilling and healthy. But we wondered how to preserve and present these whiteboard iterations to other people that are not in the room? We wanted to make sure the momentum and energy that comes forth in these moments is carried forward to the rest of the team.

### User Testing and Iterating with Wireframes

It's not easy to carry around piles of whiteboards, so we started to create wireframes using <a href="https://balsamiq.com/" target="_blank">Balsamiq</a>. In this way we were able to make our mockups clickable, with colors and other visual aids, and convey key interactions between moving parts. At some point we wondered if we had gotten carried away using this nice tool, focusing too much on pixel-perfect details, or mocking up too many interactions.  But even that provided worthwhile once we got the chance to use Balsamic printouts as a printed paper representation of the website.  We did this as part of a UI/UX test session conducted at our university by Prof. Joseph Konstan and his students during their User Interface Design class.  If you can picture students looking at paper printouts of each view of the website, "clicking" on items with their fingers, and then us rearranging the papers to reflect the updated state - well, you've got the right idea.  Not high tech in the least, but surprisingly effective.

It wasn't easy to create or run this exercise, but it was a great experience for us. We learned a lot, much more than we expected. And luckily we got the chance to correct our path before spending time in implementation.

We collected all the positive and negative feedback and analyzed them. A new series of meetings and whiteboard sessions gave us new ideas and concepts to present, but instead of using wireframe mockups, this time we did a prototype, not of the whole UI, but of a key component that was most criticized during the UI/UX test. We made a real web page with the elements that we thought best represented all the functionality we had to revisit.

It turned out that having a real interactive UI, even if limited and out of context from the bigger picture, is a better way to show and test its functionalities than a wireframe mockup when looking at a truly critical piece of the system. People can fully interact with it, play with it, and provide better feedback.

The trick is knowing which technique to deploy at which time.  Whiteboards for initial brainstorming or to capture that "bolt of lightning" inspiration. Balsamiq to preserve those ideas for future discussions and iterations.  And prototypes when it's truly critical to having something close to the real thing for people to study.

I think we are on the good track now. So far everyone involved - those non-developers included - seem to be happy about the process and its results. Now for the easy part - we just have to implement everything!

### Conclusions

What's the take on all of this? Here's a list:

1. Never underestimate the power of the whiteboard.
1. Wireframes (in Balsamiq) are great for "big picture" mockups, but not sufficient to describe big processes with lots of interactions.
1. Prototype key components of a new UI and let people use them, play with them.
1. Though they are important, the tools you are using to convey your concepts or ideas are not the only thing that matters. What matters most is <strong>collaboration</strong>.

As for that last item - you can be the best chef and have the perfect list of ingredients and the best recipe to make a great product, but left alone you're not going to achieve much improvement. Instead, if you have the opportunity to work with others and have an exchange of ideas and feedbacks, you can create new recipes and improve your own as well.

Bonus point: during the buildout of the prototype I described in this article, I developed a nice little jQuery plugin for zebra-striped tables. I'm going to use it a lot, but it needs feedback. <a href="https://github.com/bafio/zebra-stripe" target="_blank">Check it out</a>!
