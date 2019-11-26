---
author: ccd
title: 'Dimensions of IPUMS'
teaser: ''
categories: "Data Visualization"
tags:
- IPUMS
- UX
---

The IPUMS   data products aim to make comparison  of Census and survey data across time and nations as easy as possible. The first step in effectively using IPUMS is to discover and request data that's available for the time and place you're interested in studying. The IPUMS data extraction websites give users an efficient method for finding  and requesting data from IPUMS. 

"Efficiently requesting data"  presents some interesting user interface  challenges. In the rest of this article we'll  l take a visual, high-level view of the IPUMS metadata that drives the data extract system  and underpins   our data integration process.

To start with, we'll  focus on the U.S. Census (IPUMS-USA) since most of us have some familiarity with a national Census. Most of the discussion also applies to other IPUMS data drawn from health and employment surveys.

###  Why Data Discovery is Not Dead Simple

In a perfect world the U.S. Census would have asked every  possible question of every person since the first census and the questions would always have had the same range of responses. 

In that world  everyone would have happily responded to the lengthy questioning and census-takers would all have behaved exactly the same, making no mistakes, and would have displayed perfect  penmanship and consistent spelling. 

In our world, however, we must build the IPUMS websites with the census and survey data we actually have. You can request a customized IPUMS data extract from our site by requesting the datasets (Census year, survey year) and variables (questions) you need. In a perfect world, you'd simply select from a list of datasets and another list of variables. Finding what you wanted would be as simple as scrolling or searching. In the real world, not all questions were asked in every year. 

The U.S. Census changed throughout the history of the nation. Some questions got dropped, while others were added.  Enumerators had messy handwriting and poor inconsistent spelling. The Census had a long form and a short form for many decades, then in 2001 introduced the American Community Survey and as an annual survey and dropped the long-form Census in 2010. 

Taking the naive approach to requesting data from IPUMS would amount to picking and choosing what you wanted from static lists of datasets and questions, then downloading the result. Applied to IPUMS data,  this would often result in a data extract full of missing data. You might resort to reading documentation on each census question you want before requesting it,  to learn if it was asked in every year you want in your analysis. That could take a lot of time.

### Requesting Only Data That Exists

Instead of tormenting our users like that, we provide an "availability grid" when users select data. The grid shows the cross-product of choosable variables from within a selected topic group, by chosen datasets  (or all datasets if none have yet been chosen.) We mark every cell in the grid -- every variable-dataset combination -- as available or not available. 

This way,  the users know ahead of time if  their desired question was asked in a particular year. The horizontal axis represents census years, the vertical is variables. You scan  a column to know what variables exist in a given year, and a row to see what years a variable exists in.

__Screenshot of an availability grid with a few samples and variables__

![Selecting From a few Variables Among a few Years](/images/dimensions-of-ipums-few-samples.png)

The  data availability grid is foundational to the whole IPUMS concept: Integrating data across time and countries is an imperfect business. We make available data as comparable as possible but we can't conjure answers  out of thin air. (* But we do impute some variables when we have enough other information to allow it. See <a href="https://usa.ipums.org/usa-action/variables/IMPREL#description_section" target="_blank"> IMPREL</a>.) 

The availability grid manifests itself at several layers of the IPUMS software, starting at the data integration / conversion layer, through the modeling of the metadata driving the website and ending in the UI for selecting data.


### Navigating Available Data

So far, so good. But what if you need to look at a large set of years and variables simultaneously? The grid approach, in a literal sense, does not scale:

__Screenshot of a full availability grid__

![Every Year With Many Variables in a Grid](/images/dimensions-of-ipums-full-samples.png)

The x-axis extends far to the right of  even the largest screen and you can scroll down for page after page to see all variables.

Other IPUMS data products have the additional difficulty that some data products contain many more questions than the U.S. Census, and sometimes many more datasets as well. So the dimensions of this style of grid can get out of hand very easily and a one size-fits-all solution may be hard to find. It's an interesting user interface design challenge.  

We encourage users to select a small set of datasets ("samples") up-front to limit the width of the x-axis. To limit the size of the y-axis we guide the user to view subsets of variables grouped by topics or alphabetically. For products with many more variables than USA we make more variable topic groups and make dataset selection easier. For instance CPS, with nearly six hundred datasets, has <a href="https://cps.ipums.org/rotation_pattern_explorer#/">  Rotation Pattern Explorer.</a>

The rise of mobile computing with much smaller screen sizes makes the limitations of the grid approach more acute. The <a href="usa.abacus.ipums.org" target="_blank">IPUMS Abacus</a> mobile realtime tabulation app had to dispense with a grid altogether and rely on an dynamic, interactive data selection approach: You choose a year and immediately all topics and variables narrow down to what's available for that year. If you choose a topic and variable first, your choices of years narrows accordingly as well.   The dynamic feedback loop actually makes exploring what's possible to tabulate more efficient than the grid approach.  It's an elegant solution especially when few variables and years are involved. 


__Screenshot of IPUMS Abacus showing variables available for the 1940 Census sample__

![Screenshot of IPUMS Abacus showing variables available for the 1940 Census sample](/images/dimensions-of-ipums-abacus-availability.png)

The __Abacus__ approach could become cumbersome if a user could select dozens of variables and years at once, potentially missing exactly which year or variable choice it was that may have dramatically reduced their choices in the other dimension. Fortunately for Abacus, tabulation naturally limits itself to a few variables at a time, so the effect of each choice on the other dimension is evident.


### Visualizing IPUMS Data  Availability

Let's take a bird's-eye view of variable availability across all years for all variables in IPUMS-USA (U.S. Census data):

__IPUMS-USA Data availability Grid__

![USA image ](/images/dimensions-of-ipums-usa-availability.png)


The dark spots show where data is available. You see many gaps, with availability increasing over time as automation of the Census took hold and more questions could be asked or inferred every year. 

The right-hand side has more coverage because we include the annual (since 2001) ACS (American Community Survey,) which contains many more questions than the Census. 

The thin light vertical line  near the right-hand side represents the 2010 decenneal Census which had only a handful of questions, and no long form.  It takes up two vertical spaces because the Puerto Rico and U.S. states Censuses are separate datasets.

The grid has too many points to actually label them; you'd need a software "microscope" to navigate this grid directly, zooming in on topics of interest, plucking records from the   pile near your area of interest.

 You could imagine a third dimension representing available cases or total categories, perhaps even coloring regions to indicate fuzzy matches to search criteria. The horizontal  axis is sorted by time; you could imagine turning the graph ninety degrees on its back so that the most recent data lives on the "surface" of the graph and you'd "dive" down into the past. 
 
 Visualizing data like this is the closest thing I can think of to William Gibson's description of wandering through a giant corporate database in Cyberspace:
 
 > Cyberspace. A consensual hallucination experienced daily by billions of legitimate operators, in every nation, by children being taught mathematical concepts... A graphic representation of data abstracted from banks of every computer in the human system. Unthinkable complexity. Lines of light ranged in the nonspace of the mind, clusters and constellations of data. Like city lights, receding...
 
 <cite> William Gibson</cite>

Okay, don't get too excited. In our visualizations the "variable" dimension representing census questions has a fairly arbitrary sort order; your particular position in the graph doesn't mean a lot. The "variables" Y-axis is sorted by general topic, so there's some meaning there but not a lot.  

Let's look at some other data products:

__The IPUMS-International availability Grid__

![ IPUMSI grid ](/images/dimensions-of-ipums-international-availability.png)

Here we see a fairly well populated bottom half of the grid with the top-half being quite sparse. Why? It's because the top half represents country specific questions which mirror the original census questions from each country, sometimes uniquely  from each year, and each of these questions is represented as a unique variable in our metadata model. While these country specific variables aren't very "integrated"they are quite useful, so we compromise  on the amount of integration required to be in the IPUMSI data, keeping a core of comparable variables while making country-specific data easily available.


Now look at this survey data:

__The Higher-Ed Survey Data availability Grid__

![ Highered ](/images/dimensions-of-ipums-highered-availability.png)

Here we have a much smaller number of datasets and variables, and the survey appears to be quite consistent across time, which makes sense since it was designed to measure the same things each time the survey was taken, and there aren't many years in which the survey might have changed.

On the other hand:

__NHIS Health Interview Data availability Grid__

![ NHIS  Grid](/images/dimensions-of-ipums-nhis-availability.png)

The NHIS health survey has had a vast number of questions asked every year since 1963. Some of these years had supplemental questionnaires, which consequently causes that years variable count to balloon. 


