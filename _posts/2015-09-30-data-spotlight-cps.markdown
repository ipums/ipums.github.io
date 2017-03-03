---
layout: page
title: 'Data Product Spotlight:  Current Population Survey'
teaser: 'Our newest data product spotlight shines on CPS, the federal government monthly survey on employment in America, among other topics.'
author: ccd
categories: Data
---

## MPC Data Product Spotlight: CPS (__Current Population Survey__ )

Find it at <a href="www.cps.ipums.org"> www.cps.ipums.org</a>

### What is CPS

The U.S. Bureau of Labor Statistics (BLS) conducts the Current Population Survey. The CPS is the "Monthly Household Survey" you may have heard about in news reports on unemployment.  The CPS survey was initiated after the Great Depression to get better statistics on unemployment.  Over the years they've added additional topics to the survey, so that now the CPS also includes data on topics such as fertility and tobacco use, although it is still largely focused on employment and the economy.

CPS has twelve monthly surveys. Different months survey basic employment topics and also focus on different supplemental topics such as health and food security.  

### Survey Description  

MPC has CPS data going back to 1962. We produce new harmonized versions of the data as the BLS releases it.  There are surveys released for every month. The March survey contains data on between thirty and one hundred thousand households and all their individuals -- it has grown over time as the population has grown. The other months contain around fifteen thousand households per month. People participate in more than one survey in a year; there are files of linking keys available from MPC if you want to link people across surveys.

The data isn't a set of compiled statistics but rather the microdata from which those stats get produced, as with other MPC microdata products. People are grouped together into their family and households so you can study them in the context of other family and household members, something you could not do with compiled statistics.

### CPS Software Development Highlights

Harmonizing the data -- making all the data as comparable as possible --  poses a challenge in CPS as there are more than five hundred datasets from the last fifty-three years. The amount of time and attention available from a developer or subject matter specialist on any one dataset therefore is limited; we needed to create automated QA and easy-to-apply methods for massaging the data into a useful form, and techniques to leverage expert knowledge.

Not only does CPS contain many datasets but it has thousands of survey questions. We provide a web application to select and extract small subsets of this data to assist in studying a particular topic, as with all microdata products, but designing an effective user interface to select from the large number of datasets, survey topics and questions poses unique challenges.

### What Can I do With CPS?

You can produce time series on some topics that extend back as far as you're interested.  Questions have been added over the years, so only a core subset of topics extend back to 1962. That said, you can look at many subjects over the course of many months and years, through recessions and booms, in a way not possible with census data.

You can study some regional differences, but keep in mind the small number of households in the survey limits the precision for small geographic areas. Still, there's enough data to look at many individual states. The records include weight variables to allow you to calculate how many people from the entire U.S. population a given person represents. Weights in CPS are more complex than for U.S. Census and International Census MPC data products, but there is good documentation on how to properly use the data.

You could use the CPS data to fill in demographic data between census decades prior to the introduction of the American Community Survey (ACS) in 2001. [Ed. note: the ACS data is available as part of the IPUMS-USA data at <a href="http://usa.ipums.org"> usa.ipums.org </a>.]

You may also choose to use the online tabulation system with CPS data. It doesn't offer the flexibility of the microdata extract system, but is an easy place to start exploring the data. Find it at <a href="https://cps.ipums.org/cps/sda.shtml"> sda.cps.ipums.org</a>.

The CPS focuses on employment, so naturally you can use the data to look at unemployment, wages and other labor topics. There are many supplements to the CPS focusing on nuanced work, income and health related topics. Some supplements were done for many years, others just a few times.

CPS covers the following topics:

* __Food Security__
*  __Voter | Civic Engagement__
* __Education | Internet and Computer Use__
* __Volunteer__
* __Veterans__
* __Tobacco Use__
* __Fertility__
* __Public Arts__
* __Displaced Worker__
* __Under-banked__
* __Disability__
* __Child Support__
* __Immigration__
* __Unemployment Insurance__
* __Contingent Work__
* __Work Schedules__
* __Race and Ethnicity__
* __Lead Paint__
* __Health and Pension__
* __Employee Benefit__
* __Dual Job__
* __Job Training__

To learn more and start using CPS data, see <a href="https://cps.ipums.org/cps-action/faq">The IPUMS-CPS FAQ page.</a>

To learn about published research, books and articles using the CPS see our bibliography <a href="https://bibliography.ipums.org"> bibliography.ipums.org</a> and select CPS as the project.
