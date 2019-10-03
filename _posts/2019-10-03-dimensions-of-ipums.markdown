---
author: gfellis
title: 'Dimensions of IPUMS'
teaser: ''
categories: Data Visualization
tags: IPUMS
---


In a perfect world the U.S. Census would have asked every  possible question of every person since the first census and the questions would always have the same range of responses. In that world  everyone would have happily responded to the lengthy questioning and census-takers would all behave exactly the same, making no mistakes, and have perfect  penmanship and consistent spelling.

In our universe, however, we must build the IPUMS websites with the census and survey data we actually have. You can request a customized IPUMS data extract from our site by requesting the datasets (Census year, survey year) and variables (questions) you need. In that perfect world, you'd simply select from a list of datasets and another list of variables. Finding what you wanted would be as simple as scrolling or searching. In the real world, not all questions were asked in every year. 

Taking the naive approach to navigating the  variable availibility to get data would amount to picking and choosing what you wanted, downloading the result, and often ending up with a data extract full of missing data.  Instead of torturing our users like that we provide an "availibility grid" when users select data. The grid shows the intersection of chosen variables with chosen datasets  so the users know ahead of time if  their desired question was asked in a particular year. The horizontal axis represents census years, the vertical is variables. You scan  a column to know what variables exist in a given year, and a row to see what years a variable exists in.


[ screen-shot of a few samples and variables with the grid ]

So far, so good. But what if you need to look at a large set of years and variables simultaneously? The grid approach, in a literal sense, does not scale:

[screen shot of full grid ]


IPUMS has the additional difficulty that some data products contain lots more questions than the U.S. Census, and sometimes many more datasets as well. So the dimensions of this grid can get out of hand very easily and a one size-fits-all solution may be hard to find. It's an interesting user interface design challenge. We try to encourage users to select a small set of datasets ("samples") up-front to limit the width of the x-axis.

The rise of mobile computing with much smaller screen sizes makes the problem more acute. The <a href="usa.abacus.ipums.org">IPUMS Abacus</a> mobile realtime tabulation app had to dispense with a grid altogether and rely on an interactive data selection approach: You choose a year and immediately all varitopics and variables narrow down to what's available for that year. If you choose a topic and variable first, your choices of years narrows accordingly as well.   It's an elegant solution especially when few variables and years are involved, but the trial-and-error nature of the process could become cumbersome if a user could select dozens of variables and years. Fortunately for Abacus, tabulation naturally limits itself to a few variables at a time.


The  data availibility grid is foundational to the whole IPUMS concept: Integrating data across time and countries is an imperfect business. We make available data as comparable as possible but we can't conjure answers  out of thin air. (* But we do impute some variables when we have enough other information to allow it. See <a href="https://usa.ipums.org/usa-action/variables/IMPREL#description_section"> IMPREL</a>.) 

The availibility grid manifests itself at several layers of the IPUMS software, starting at the data integration / conversion layer, through the modeling of the metadata driving the website and ending in the UI for selecting data.


Let's take a bird's-eye view of variable availibility across all years for all variables in IPUMS-USA which has U.S. Census data:

[ USA image ]



You will see many gaps, with availibility increasing over time as automation of the Census took hold and more questions could be asked or inferred every year. The right-hand side has more coverage because we include the ACS (American Community Survey,) which contains many more questions than the Census. The thin dark vertical line  near the right-hand side represents the 2010 deceneal Census which had only a handful of questions, and no long form. 

The grid has too many points to actually label them; you'd need a software "microscope" to navigate this grid directly, zooming in on topics of interest, plucking records from the   pile near your area of interest.

 You could imagine a third dimension representing available cases or total categories, perhaps even fuzzy matches to search criteria. Visualizing data like this is the closest thing I can think of to William Gibson's description of wandering through a giant corporate database in Cyberspace:
 
 > Cyberspace. A consensual hallucination experienced daily by billions of legitimate operators, in every nation, by children being taught mathematical concepts... A graphic representation of data abstracted from banks of every computer in the human system. Unthinkable complexity. Lines of light ranged in the nonspace of the mind, clusters and constellations of data. Like city lights, receding...
 
 <cite> William Gibson</cite>


Let's look at some other data products:

[ IPUMSI grid ]

Here we see a fairly well populated bottom half of the grid with the top-half being quite sparse. Why? It's because the top half represents "source variables" which mirror the original census questions in each country for each year, and each of these questions is represented as a unique variable in our metadata model. This is so that users of international data can retrieve the original census questions if they want, in addition to the IPUMS hahrmonized  versions of the questions.

Now look at this survey data:

[ Highered ]

Here we have a much smaller number of datasetrs and variables.

On the other hand:

[ NHIS ]

The NHIS health survey has many many questions asked every year since 1963. As you can see though, some years had supplimental questionaires which cause the number of variables to ballon for some years.


