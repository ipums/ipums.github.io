---
layout: page
title: 'Data Product Spotlight: Series Intro and the American Time Use Survey'
teaser: 'Colin Davis launches a new series which will provide quick summaries of our microdata products from a developer perspective.  In this first post, he introduces the concept then takes a look at the American Time-Use Survey.'
author: ccd
categories: Data
---

In this series I'll briefly introduce a number of MPC data products and highlight points of interest for software developers. As a developer, you don't necessarily need a deep understanding of a dataset to put it to some interesting uses, but you do need to know what is in the data and what kinds of questions you can answer with it.

For every product I'll tell you:

1. What is this thing in the first place?
2. Specifics on the scope of the data and important details
3. What (possibly non-obvious) interesting topics can I study / extract / visualize from the data?
4. What has been unique and interesting about developing the software to produce and distribute this particular product?

All the MPC data products that offer microdata (data about individual people) provide a data extraction system in which you specify from which datasets you want data and which variables / questions from the census or survey you want to study.  You can ask the system to produce a fixed-width ASCII file of your data of interest, or alternately produce a CSV or a binary version of the data for stats analysis programs such as SAS, Stata or SPSS.

The files will contain one record per observation. Usually (but not always) these records represent people in the survey or census. In the cases of census data, records are only sampled from the census and anonymized; you cannot locate particular people in the census data.

For each of the products I'll give its address, and you can find instructions online on how to use the extract system.

#### Why Use MPC Data Products?

Even if you're not a social science researcher, using the MPC data products gives you some powerful advantages:

1. All data within a data product (e.g. U.S. Census data, or the American Time-Use Survey) has been made (by MPC) as comparable across the years as possible. Typically, surveys and censuses are not designed with an eye towards year-over-year comparability, so we've done that work for you. This would be quite expensive to do on your own.
2. With an extract of microdata you can produce new, never-before-created tables, and you can experiment with data to make tables that best suit your needs.
3. We provide systematic, consistent documentation of the data.

While you can browse the products and see what data is available anonymously, you need to register to actually download data from our products, but registration is free.  We ask people to register so that we can understand how the community is utilizing our data for research.  This helps us continue to get grant funding to support the products and keep the data free for all to use.

And now, on to our first data product spotlight!

### __ATUS__, the __American Time Use Survey__

Find it at <a href="www.atusdata.org">http://www.atusdata.org/</a>.

  **What is ATUS?**

The American Time-Use Survey is a survey which tries to capture how Americans spend their time and with whom they spend it. ATUS has run annually since 2003. (Some older U.S. time use data also exists, and some other countries do time use surveys as well. We're working on making that data available too!) The Bureau of Labor Statistics is responsible for the ATUS.

The MPC's ATUS-X project created a system to integrate the ATUS surveys across time and allow users to build custom data extracts from those datasets.

**Description of the Survey**

The American Time-Use Survey started in 2003 and has run every year since then. Participants in the survey are drawn from the Current Population Survey, a larger survey. Thirteen to twenty thousand households are included in the time-use survey and one individual from the household responds to a phone survey where they describe in great detail what they did with their time over a twenty-four hour period. The survey is spread throughout the year and on different days of the week.

Participants provide starting and stopping times for all activities. The activities get categorized into some six hundred possible activities. Secondary activities get recorded as well, with special modules for eating and drinking and well-being. Special attention is also paid to child care activities that might occur alongside other activities, as well as care for elders. Participants are asked who else was present during activities, so the survey data also captures who participated in activities with the respondent.

  **Software Development Highlights**

To make good use of the time use data one needs to calculate the time spent doing activities, usually on a per-person basis, qualified by different things like time of day, where the activities were done, type of activity and so forth. The activity data is attached to each person in the form of activity records, and attached to each of these activity records are records concerning who was with the person.  The data, in other words, is rather complex and interrelated. It can't easily be flattened out, or rather, that flat data would be pretty hard to work with.

We offer a way for users to create their own time use variables, eliminating most of the hard part of preparing the data for analysis. These time use variables get built at the time of a data extract and the values put onto each person record.  The data that's delivered to a user is a set of person records with all the user created time use variables attached. These sorts of queries cannot be (quite) expressed in SQL except for the simpler, less interesting ones.

Designing the web user interface to formulate the time use variable request and keeping the UI concise but not confusing or misleading was an interesting challenge. The back-end process for creating these variables on the fly was also something not done in other products and is an interesting difference from other microdata products at the MPC. It makes the data extract system more of a data creation system and adds tremendous value to the time use data.

 **What can I do With ATUS Data?**

 Here's a sampling of some of the interesting things one could do with ATUS data.

* Since ATUS participants come from the CPS (Current Population Survey) you might link the CPS people with ATUS people to get richer data on people doing various activities of interest.
* You might do a limited time series analysis since 2003 to observe, just for example, changes in computer use and television viewing.
* ATUS could provide useful data about sleep, which is hard to find.
* You could look at time use differences between days of the week to assist with planning events or business hours.
* You could visualize various activities with time of day, day of the week or time of year as one of the axes and total time spent as the other.
* You could visualize a particular activity, such as time spent taking care of pets, as a line or bar plot with total minutes spent (bucketed into say 30 groups) on one axis and the number of people spending that amount of time on the other axis.
* Since activities are listed in order for each person in the survey, you could add information on each activity record about the previous and subsequent activity. You could then answer questions like "What do people do after school?" or "How much time is spent driving before and after a restaurant meal?"

For more ideas, see our <a href="http://bibliography.ipums.org"> bibliography</a> for specific publications that used the ATUS data from MPC. If you've used ATUS data, share your story in the comments.

Stay tuned for more installments of the Data Product Spotlight!
