---
layout: page
title: 'MPC IT Shark Tank - Cycle 1 Results'
teaser: 'The results of our first-ever MPC IT Shark Tank round are in, and a winner has been crowned!'
author: fran
categories: Team DevCulture
date: 2015-12-21 09:00:00
---

If you've been following our blog, you might remember that we launched [MPC IT Shark Tank](http://tech.popdata.org/mpc-it-shark-tank/) back in August.  Four months later, the results are in, and the experiment has been a big success!

The four teams we had this round were:

* Access Denied - One of our thorniest legacy tech challenges is a continued dependence on MS Access in one part of one of our data preparation workflow.  This project aimed to develop a web-based alternative which would allow us to deprecate Access.
* Team 537 - This team aimed to explore some data visualization of our data in blog format. Get it? 537... almost as cool as [538](http://fivethirtyeight.com/).  
* Team Moo - This team wanted to work on several enhancements to our Redmine work tracking tool.
* Unicorn Rainbows - This team set it sights squarely on one of our other toughest legacy tech challenges: a large codebase of VB macros embedded into Excel for use during our metadata development workflow.  This project would seek to find an alternate way to serve that function without a reliance on VB.

The teams met to work on their projects over the past few months and a couple of weeks ago the IT core gathered for the final presentations and crowning of a Shark Tank champion. For our first go at this, the results were spectacular!

First up went Team 537.  They demo'ed their finished blog post (appearing here soon!), which focused on visualizing changes over time of a very small geography, in this case Nicollet Island, which is in the Mississippi River in downtown Minneapolis. They chose this because it highlights the power of MPC data.  They used microdata from across multiple US censuses to track individual families and households on the island across several decades.  It was truly impressive and a great way to start the afternoon.

Team Unicorn Rainbows followed with a demonstration of a system using Python and Anaconda to bootstrap a researcher's desktop Excel instance to call Python-based functions instead of VB macros.  The team leveraged the Python XLWings library to implement functionality equivalent to what was being done in VB. Importantly, the team also developed a silent deploy and install method and fully integrated it into our current Excel environment to allow for incremental migration from VB to Python over time without any impact on the user.

Next, the Access Denied team presented their work, and showed off a clean web-based interface for checking out units of work, making changes locally, and syncing changes back to the central store. The system was built in Python and Django, and they're currently building off this successful start with another round of work in Shark Tank cycle 2.

Finally, Team Moo showed off a couple of key improvements to our Redmine system, including OAuth integration with our campus Google accounts for authentication and a suite of simplified email templates which do a much better job of highlighting the important changes occurring on a ticket.

After the presentations, we crowned the champion based on the highly scientific "cheering loudness" metric.  The voting instructions were simple: cheer loudly for the team which you feel has had the biggest impact on the MPC.  After one round, the vote was too close to call between Access Denied and Unicorn Rainbows.  After another close round of voting on the two finalists, team Unicorn Rainbows was crowned the inaugural MPC IT Shark Tank champions!  Congratualations to Jimm Domingo, Jesse Erdmann, Ben Klaas, Jayandra Pokharel and Ankit Soni for their important contribution to the MPC and the elimination of a technical pain point that had lingered for years.

I was overwhelmed with the quality of the work across the board and with the success of this first round.  Already, we've addressed what are arguably our two most challenging technical pain points, developed a powerful new way to think about and interact with our data, and made our daily work tracking tool more enjoyable to use.  Not bad for an experiment! MPC IT Shark Tank Cycle 2 has started (the teams have formed, but we'll keep you in suspense for a while longer) and the next round of results will be available in late March or early April. Hopefully this inspires some of you to implement a similar program in your own organizations.  If you have something like Shark Tank where you work, let us know in the comments.
