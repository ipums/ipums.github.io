---
layout: page
status: publish
published: true
title: Chestnuts Roasting on 1000 CPUs
author: jerdmann
wordpress_id: 368
wordpress_url: http://tech.popdata.org/?p=368
date: '2014-12-23 14:44:05 -0600'
date_gmt: '2014-12-23 20:44:05 -0600'
categories: Infrastructure
tags: []
---
Tis the holiday season and in Minnesota that means two things:

1. It is a good time to reflect on the year.
1. It is cold outside.

One of the many things to love about the MPC is that we have lots of data.  Literally a good chunk of the people that have ever lived are somewhere in our data.  I haven't done the calculations to figure out exactly what the percentage is, however, if I WERE to want to do that calculation, we also have the hardware available to do so.

As a member of the <a href="http://www.research.umn.edu/">Office of Research</a> at the <a href="http://umn.edu">University of Minnesota</a> we get access to use the machines at the <a href="http://msi.umn.edu">Minnesota Supercomputing Institute</a> (MSI).  When we find ourselves working on a problem that brings our poor laptop, or indeed our small Torque cluster, to its knees we can move that data over to MSI and bend a few thousand cores and terabytes of RAM at the problem.  Have a use for some GPUs, sure, why not?

In some situations a particular package you need might not be available and requires a privileged account to install, or at least to easily install it and all of its dependencies.  Alas, MSI hasn't given us root on their very expensive machines supporting the entirety of the research community here at Minnesota.  Luckily, we also have access to <a href="http://aws.amazon.com/">Amazon Web Services</a> (AWS) for just these situations!  Any R&D work can be tested out there before working with MSI or other partners to deploy the necessary tools in an appropriate environment.

None of this really addresses point number two, however.  It still remains cold outside.  Neither MSI nor AWS will let us into their data centers unsupervised with a bag of chestnuts ready for the roasting.  While MPC does supply us with a generally cozy working environment, sometimes you might want a quick blast of heat to shake off that chill.  Hmm... maybe I really do want to run that calculation on my laptop...
