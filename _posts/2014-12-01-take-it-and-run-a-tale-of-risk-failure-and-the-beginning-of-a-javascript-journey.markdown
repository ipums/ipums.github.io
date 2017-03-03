---
layout: page
status: publish
published: true
title: 'Take It and Run: A Tale of Risk, Failure, and the Beginning of a Javascript
  Journey'
author: jakew
wordpress_id: 325
wordpress_url: http://tech.popdata.org/?p=325
date: '2014-12-01 12:53:15 -0600'
date_gmt: '2014-12-01 18:53:15 -0600'
categories: DevCulture
tags: []
---

Ever since I joined the MPC as the primary web developer for NHGIS (<a href="http://nhgis.org/">http://nhgis.org/</a>) a few months ago, the shadow of an enormous problem has loomed over my head. NHGIS is a project that has evolved over the course of more than a decade, and for all of the technical boons, debts, and peculiarities that I inherited, there is one which stands out as the most challenging. It's not the incredibly complex queries in need of optimization, though they're certainly in there. It's not the dark corners of Rails 2 style code in need of a refresh, though there's no shortage of that either. No, it's the javascript. Ugh.

Our happy friendly neighborhood JQuery has slowly but surely taken root in almost all aspects of the application, and it's, well... a mess. It has grown up organically over the years, with no overall plan or architecture. The usage patterns are inconsistent throughout the app, and it's difficult to figure out how to add new features. It feels like it's about four years overdue for a massive overhaul. If you're working on a large, mature project right now, this probably sounds familiar. I bet you have some similar technical debt skeletons in your code closet right now.

These kinds of problems can feel too big to tackle. It's tempting to try to just do incremental fixes over long periods of time to keep the disruption to a minimum. It's easy to make excuses like "new features can't get written if I am paying off technical debt." So we file it away for another day, that mythical day when we'll have more time and less pressure to build new stuff. That kind of thinking is human nature, but it ignores the cost of continuing under the weight of the crufty, inferior solution currently in place. It's inefficient and more error-prone to build the app under the current system. Each new feature implemented before the Javascript is refactored only serves to make that can you're kicking down the road a little bit bigger. And that mythical day when it's convenient to do a big refactor never materializes, so you just find yourself asking the same questions a few months or years down the road.

I can pretend that I simply don't have the time to do that kind of forklift refactor right now, but if I am being honest, that's not true. At the MPC our customers understand that a certain amount of time needs to go towards cleaning house. They understand that fixing this problem now means that all new feature development is going to be better for it later. They're more than willing to make time for technical debt work alongside feature development. So, it's not the lack of time. What is it then?

It's simply fear. Fear of failure. The fear of making the wrong move at the wrong time. After all, some developer chose to do it the way it was done in the first place, and there were probably good reasons for that, at least at the time. What if I were to redo it all, and then two years down the line it was just as bad? Or even worse, I redo it and break the whole application in the process (we have a thorough test suite, but not for the javascript :( ). What if I choose a way of doing it that the team abhors, and now I have to rewrite it again in a new framework/methodology! It sounds a lot easier to just wait for the right direction to become apparent.

I've been chatting about this topic with the team lately, and these conversations have inspired me to move beyond this fear of failure. I've come to realize that the right direction will not simply become apparent, that "becoming apparent" actually means "iteratively trying to do something about the problem until you find the right solution". I've come to realize that I just have to take it and run. Make a bad decision and fail. Heck, make five or ten bad decisions and fail five or ten times. But eventually I will get somewhere, and nine times out of ten that somewhere is a much better place than where I started. Even if I fail miserably and come out without a working product, I will have learned more than if I built two or three solutions that worked right off the bat. On top of that, the next product I build which does work will be just that much better crafted.

Going through this process, I've gained a better understanding of how the concepts of risk and failure relate to my job. I've become more comfortable with the idea that failure is normal and healthy and expected. There's no shortage of cliche quotes about how failure is a good thing, but it's much more concrete for me now that I can see the cost of risk avoidance and fear of failure in my project. It's through taking risks that we uncover opportunities to improve both the code and the coder. In the absence of risk taking, we incur all sorts of costs - the cost of continuing to develop an inefficient codebase, the cost of not learning new coding skills, the cost of leaving this mess for the next developer to inherit. It certainly seems like making decisions based on fear of failure and risk avoidance end up being riskier in the end!

So, I've decided I'm going to refactor this Javascript wholesale and clean out this skeleton once and for all. I'm going to take a run at Ember.js to see if it would work for us. I'll reimplement a core piece of the NHGIS app's workflow with Ember as a proof of concept. I might fail. Heck, I'll probably fail, at least at first. I'm sure I'll make a lot of missteps along the way and throw away a lot of code while I'm at it. But I'm excited about it. The team's excited about it. And I know that no matter what happens, I'll learn a lot and the project will be better off.

Stay tuned - I plan to share some more technical bits along the way. In the meantime, if you're reading this and thinking about similar challenges in your own projects, I hope I've inspired you to go and find the time, space and courage to fail a little bit more. Thanks for reading!

<em>Update:  Part 2 of this series - <a href="http://tech.popdata.org/ember-for-rails-devs-understanding-how-ember-thinks/" title="Ember for Rails Devs: Understanding How Ember Thinks">Ember for Rails Devs: Understanding How Ember Thinks</a> - is now posted!</em>
