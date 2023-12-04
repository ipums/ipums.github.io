---
layout: page
title: MPC IT Shark Tank - Cycles 4 & 5 Results!
teaser: "We closed out 2016 with two more rounds of Shark Tank! Read on for details."
author: fran
categories: Team DevCulture 
date: 2017-01-03 09:00:00
tags: []
---

_Editor's Note: This is the fifth post in our Shark Tank series. If you are just joining us, you can catch up by reading the [intro][], [first cycle][] results, [second cycle][] results, or [third cycle][] results. This write-up actually covers the fourth and fifth cycles._

[intro]: {{site.url}}/mpc-it-shark-tank/
[first cycle]: {{site.url}}/Shark-Tank-Cycle-1-Results/
[second cycle]: {{site.url}}/Shark-Tank-Cycle-2-Results/
[third cycle]: {{site.url}}/Shark-Tank-Cycle-3-Results/

In this update we'll cover results from two Shark Tank cycles, the 4th and 5th cycles. Both cycles featured only one presenting group. The lack of competition should not be interpreted as a lack of quality - in fact, these are two of the strongest projects to come out of the Shark Tank. Maybe the other projects were simply too scared to compete against such juggernauts!

# The Fourth Cycle

In September we presented the results from the fourth cycle of MPC IT Shark Tank. This cycle featured a presentation from:

* **IPUMS Mobile** - The team's goal was to create a mobile-friendly application for accessing IPUMS USA metadata and servicing simple questions that can be answered using variable code frequencies (e.g. "How many married people in 1910?") They presented in two prior cycles but again made significant progress, so they presented a third (and final - read on!) time.

The progress of the IPUMS Mobile team was impressive.  Since their last presentation, they had made significant improvements to the UI and had added some simple bar chart visualizations of the frequencies.   

The most exciting news is that in the time since Cycle 4 concluded, IPUMS Mobile has graduated to a full-fledged MPC project! Out from the incubator that is MPC Shark Tank, it is now moving forward as a component of the main IPUMS microdata codebase. It follows Cluster ALL The Things (which created our Mesos cluster environment, won Shark Tank Cycle 2 and was the first graduate of the Shark Tank program) as our second graduate.

# The Fifth Cycle

In December we wrapped up the fifth Cycle of MPC IT Shark Tank. This cycle featured a presentation from:

* **Cluster Job Runner (CJR)** - This team's goal was to create a [Mesos framework](http://mesos.apache.org/documentation/latest/app-framework-development-guide/) for running our DCP and similar jobs. Previously, we were using the built-in `mesos-execute` command for running our jobs, but this was very limited in how we could leverage Mesos functionality. A Mesos framework is an application which receives cluster job requests and brokers and manages them on a Mesos cluster using the Mesos APIs. We wanted a framework that would allow us to have more control and visibility for our cluster jobs than `mesos-execute` could offer.

The CJR has allowed the team to manage DCP runs on the cluster as a single, holistic job rather than dozens or hundreds of distinct `mesos-execute` tasks. This gives us much better monitoring of the overall job progress, and even the ability to adjust resource demands on the fly. These features are important to us as we continue to invest in cluster technologies to speed up our data processing.

The CJR team (consisting of Colin Davis, Brian Gottreu, Lap Huynh, Jon Renner, and June Taylor) certainly earned their Shark Tank Cycle 5 victory with their effort! This project is a great example of how we can use Shark Tank efforts to fill in some critical gaps that weren't anticipated as part of a grant deliverable (how our work typically gets funded) yet are crucial to our overall success. Cluster Job Runner has greatly improved our cluster management ability and is now in production at the MPC. As such, it has become __the third graduate (!)__ of the Shark Tank program to enter ongoing production support at the MPC.

# Conclusion

Five cycles in, we're now starting to see a consistent stream of projects graduating from the Shark Tank incubator and entering production service at the MPC, filling in critical gaps in our infrastructure. This is exactly what we had hoped to achieve when we established the Shark Tank program, so these results are encouraging! The sixth cycle is now underway and once again there are some exciting new projects being born. I look forward to telling you about them in the next update!
