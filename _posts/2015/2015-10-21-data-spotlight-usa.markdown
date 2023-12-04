---
layout: page
title: 'Data Product Spotlight:  IPUMS USA'
teaser: 'This edition of the Data Product Spotlight goes wayyy back to the very beginnings of the MPC and takes a look at our first and still most widely known data product, IPUMS USA.'
author: ccd
categories: Data
---


## MPC Data Product: IPUMS USA (__Integrated Public Use Microdata Series__ for the U.S.A.)

Find it at <a href="http://usa.ipums.org">http://usa.ipums.org/</a>.

###  **What is IPUMS USA**

The Integrated Public Use Microdata Series (IPUMS - pronounced "ipp umms", not "eye pums") is the most well known Minnesota Population Center data product, and comprises the microdata (data about individual persons) projects at the Center. Although today it encompasses almost a dozen separate projects, it all got started with a single project, IPUMS USA.  As a result, if someone refers to just "the IPUMS", they often mean IPUMS USA, as opposed to, say, IPUMS International.

IPUMS USA contains U.S. census microdata from 1850 to the present. IPUMS USA began in 1990 with the first data release of fifty thousand sampled people from the 1880 U.S. census. Over the ensuing twenty five years IPUMS USA datasets have been integrated and released to cover census decades up to 2010. Since 2001 the U.S. Census Bureau has run an annual survey called the American Community Survey, and we have also included the ACS data in the IPUMS product, making it comparable with the census data.  Recently, new samples have been added to increase the sampling density. Full count datasets (which include every record from the original census) have been released for 1880 and recently 1940. Eventually we plan to release full count census data for 1850 to 1940, and 1950 when the data is made public in 2022.

### **Description of IPUMS Data**

IPUMS data is not a collection of statistics but rather individual records which IPUMS users can use to create their own statistics. Users can select particular questions of interest and select census years they want to study, then request an extract to be downloaded for local analysis. For simple analyses we also provide an online tabulator, which avoids the extract step.

IPUMS USA microdata covers the U.S. census decades from 1850 to 2010 and the annual American Community Survey from 2001 to the present. In the past the US census included a large number of questions which was asked of a subset of the population, known as the "Long Form", while the rest of the population was asked a simpler "Short Form". IPUMS USA includes both types of data. More recently, the annual ACS survey mentioned above has become something of a replacement for the long form questionaires -- the census no longer includes a long form.

Why do we start at 1850? Prior to 1850 the census didn't record individual people but rather summarized each enumerated household. This makes the pre-1850 censuses far less useful for analysis.  However, in the future we plan to offer the household microdata from 1790 to 1840.  We should also note that we don't offer the 1890 census data either, since the original forms burned in a warehouse fire long before they could be digitally preserved. (You can still find tabulations published from the original 1890 data, however, and we've done some research on re-creating a synthetic version of the 1890 census by extrapolating from the existing 1880 and 1900 data.)

Through a lot of effort, the MPC created these census samples from the original enumeration forms for the historical census data, by making them machine readable. But this digitization was only the first step. We also do a lot of work towards data quality, detecting errors in digitization and also filling in missing data. However, the most important step remained.  To allow easy comparison of the United States population across time, the MPC also created an standardized form of each sample, which recodes each census year's individual questions and answers into a universal, standardized set of questions and answers which are consistent across time. This is necessary because the US Censuses do not try to maintain consistency through time; the questions and answers change with every census (e.g. the number of possible answers for the Race question has expanded dramatically from 1850 to present).  This standardization process is what puts the "Integrated" in Integrated Public Use Microdata Series.  A lot of the value of IPUMS USA is in this "integration" across census years, because it's makes studying change over time much easier for researchers.

Integrating data consists of:

1. **Harmonizing responses to census questions** Similar or identical questions in different decades get the same numeric values for the same responses. Harmonizing also involves organizing the coding structure so that years where detailed questions were asked can be correctly compared with years where only general versions of those questions were asked, such as the Race question mentioned above.
2. **Creating consistent variables across decades** For instance, occupation questions had different sets of valid responses in every decade, but it's possible to create a new occupation variable in the data which codes occupations the same for comparison purposes. This takes careful research to determine which occupations are actually comparable and the comparibility is not perfect, of course.
3. **Creating computed data that's comparable across time** For instance MPC produces "pointer" variables which add variables to each person's record indicating who in the household is the subject's mother, father and spouse, if those people are present. The pointers allow for attaching characteristics of relatives to other people and is a very useful addition to the data. Using the IPUMS you know the same method was used on all decades -- as much as possible -- to make the attached characteristics comparable.
4. **Imputing missing cases in the data** Since the census forms were filled out by hand a certain number were illegible and could not be entered. We use methods similar to the U.S. Census to impute values based on data from the rest of the population. If done carefully, missing data imputation improves the data quality. All imputed cases get flagged as such in the data so that users can know if they are working with original or synthetic data in any given record.

### **IPUMS USA Software Challenges and Highlights**

In this section we'll look at some of the unique aspects of IPUMS USA from a software development perspective.

As the first MPC data, IPUMS USA had the oldest code base. Originally the data integration software was written in Fortran. The first version of the data extraction system ran as a Perl CGI site with a Fortran program to produce data extracts in the background. So, modernizing the architecture was the first challenge. Since then we've re-written the integration application in C++, used Ruby for the website, and turned to Java for the back-end data extraction jobs. For large scale tabulation and some large data processing and extraction work we're now beginning to use Apache Spark on many MPC products.

IPUMS-USA solves some additional unique problems through software not found in other MPC data, such as imputing small percentages of missing cases, and imputing -- essentially data mining -- values on all people in certain years.  

Here's one example: the 1850, 1860 and 1870 censuses didn't ask people their relationship to the household head or their marital status. These turn out to be very powerful pieces of information, which, if known, allow for computing the "pointer" variables mentioned earlier and better imputation of missing data, as well as comparison to later decades. To rectify this shortcoming, we take a set of donor people from the U.S. 1880 census (when these questions WERE asked) and use that info to develop a model to predict their relationship and marital status values, then apply that model to the earlier decades. The technique resembles a classifier but with a lot of tuning applied to get the best results.  Other data-mining techniques came close but couldn't quite match the accuracy of our method.

Imputing missing cases on many different variables is a simple problem in essence, but applying the solution across large datasets correctly and efficiently is not so simple. In the days of the Fortran integration application RAM was at a premium and yet donor values had to reside in RAM if the program was to finish within a reasonable time (days rather than weeks), so special techniques had to be used to select the best donors only. It worked well, but the result is a stateful process which cannot run in parallel. As we have increased the size of our data releases we needed to parallelize our integration process, necessitating the development of a stateless missing data server, which we have recently completed.

We also have some unique project requirements to consider.  For example, the USA integration software needs to be able to execute in a non-networked environment for use in secure research data centers on data that's not yet in the public domain.  In these environments, external dependancies need to be minimized, so we consider that when building our tools.

Finally, the IPUMS USA data spans a large time period. More effort is needed to integrate the data across time than with any other data product. Additionally the expectations for data quality are very high for the USA data. This requires research and special knowledge of U.S. historical  demography and the Census. Applying this knowledge results in the most complex domain-specific code of any of the MPC products.

### **What can I Study With IPUMS?**

##### __Family Structure and Individuals in the Context of their Families__

 The Census microdata allows one to examine family structure comparatively across time. This is a well studied topic, but still an area of interesting and active research.  The data reveals some facts that might be counter-intuitive to some. For example, you would find the age of marriage at its lowest point around 1950, not in the 19th century.  (See <a href="http://www.hist.umn.edu/~ruggles/Articles/Ruggles_Marriage_2014.pdf"> Marriage, Family Systems, and Economic Opportunity in the United States Since 1850. </a>)

##### __Immigration and Language__

The Census has questions about citizenship, birthplace, migration between states, race and language. You can study different regions to see how migration of different groups ebbed and flowed over the years.

##### __Income, Housing and Mortgages__

Using ACS data in particular, you could study the rise and fall of home prices over the course of the housing boom and bust, just to measure it or to look for significant corelations.  

As homeowners lost their homes to foreclosure they moved into rental situations, reducing supply of rental housing and increasing rents. But the picture is rather nuanced. You could look not just at changes in numbers of houses / households rented vs. owned, but by using the microdata you could calculate total numbers of people living in rented housing vs. owned (by the household head) housing.   I might suggest that the demand for rental housing will stay higher for longer than might be expected, because even as people leave larger rented households, they will continue to rent on their own due to loss of net worth and credit worthiness since 2008.

There's also data on second mortgages, house values, monthly rent and mortgage payments, HOA fees and utility costs in the ACS data. Linking that data with other demographic and housing data could yield interesting results.  

The ACS has enough records so that you can study different regions of the U.S. and individual cities like Phoenix or Minneapolis.

Here's an interesting article that uses ACS and census data on housing costs and maps it: <a href="http://www.huduser.gov/portal/periodicals/cityscpe/vol15num3/Cityscape_Nov2013.pdf#page=257"> Exploring Housing Cost Data with Conditioned Choropleth Maps.” Cityscape: A Journal of Policy Development and Research 15: 251-256</a>.

##### __Historical and Current Economic Inequality__

 The U.S. Census has asked questions about income, occupation and education over many decades. Rather than tracking economic progress in absolute terms you could compare one group of people to another by computing difference in incomes and types of occupations as a ratio. Specifically you could take any two groups - teachers vs. farmers, white vs. black, urban vs. rural - and see if the ratio of economic difference varies over time or place with differences in government policy. These topics naturally are well studied, but developing a framework for doing this kind of analysis on a variety of groups over time would be new and it would require IPUMS data.

##### New Data on Race and Same-Sex Partnership

In 2000 and 2010 the Census has allowed more than one response to the question of race and same-sex partnerships (marriage was not an option but an "unmarried partner" response was collected.) Using the microdata you can study households with much more nuance regarding race and same-sex partner relationships and families.

I hope you enjoyed this introduction to IPUMS USA, the MPC's oldest data product.  For more research ideas, be sure to check our <a href="bibliography.ipums.org"> bibliography</a> to discover the many papers, books and articles using the IPUMS USA data.
