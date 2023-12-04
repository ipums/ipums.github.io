---
layout: page
title: 'Data Product Spotlight:  IHIS'
teaser: 'In this edition of the data product spotlight, Colin introduces us to IHIS, our health survey data product.'
author: ccd
categories: Data
---

Find it at <a href="http://ihis.us/">ihis.us</a>.

### **What is IHIS?**

The IHIS (Integrated Health Interview Series) integrates the annual NHIS (National Health Interview Survey) and makes the data available in one comprehensive data extract system. It contains annual health data from 1963 to the present. The survey asks many questions and those questions have varied greatly over time. The NHIS public use files provide the source of the IHIS data. The NHIS covers health status, acute and chronic illness, disability, access and utilization of health care services, health insurance coverage and health related behaviors.

IHIS integrates data across time to enable researchers to do time series analysis. As with other MPC data, the integration applied to the data distinguishes the MPC's IHIS product from the NHIS data. Integration in IHIS must provide some common variables out of very different data across time. For instance,

	"...A second feature of integration in IHIS is combining, into a single
	variable, material covering comparable substantive ground but appearing
	in different types of files in the original NHIS public use data. For
	example, IHIS combines information on whether an individual had a usual
	place for medical care into a single variable (USUALPL).

	This information appeared for many years under different variable names
	and in several different types of files (including the Health Promotion
	and Disease Prevention, Cancer Control, Child Health, and Access to
	Care supplements and the core Sample Adult and Sample Child files) in
	the original NHIS public use files." [from the IHIS documentation]

As with all MPC data products the consistent browsable and searchable documentation adds a lot to the usefulness of the data.

Read the introduction to <a href="https://www.ihis.us/ihis/resources/AHC_2011_poster.pdf">this IHIS overview poster</a> for a more detailed explaination of IHIS and the value it provides to health research.

### **Description of IHIS Data**

The data has supplementry information in some years on children and adults (via different questions). At intervals the survey asks extra questions on other topics, as well. In 2002, 2007 and 2012 the NHIS included the Complimentary and Alternative Medicine questions, asking about use of "alternative medicine" and the conditions people used alternative medicine to treat.

The data follows the structure of other MPC microdata by grouping people into households, allowing researchers to study people in the context of their households and families. In addition to people and households, the IHIS data has many records attached to people, most of which MPC hasn't yet released publically (but we will.)  Every person was asked about every health condition they have, or (in other years) every injury they suffered. In the future we plan to include these additional types of information for people:

* X-rays
* Hospitalizations
* Prescription medications
* Non-prescription medications
* Doctor visits
* Motor vehicle accidents
* Device implant (joints)
* Device implant (fixation)
* Device implant (heart_valve)
* Device implant (lens)
* Device_implant (pacemaker)
* Device implant (other)

Not all years of the survey contain all the listed records under the person records by any means. Motor vehicle accidents only appeared as distinct record types in two survey years, for instance.

In addition to offering data attached to individual people directly we aggregate some of this information from injury and condition records to attach as additional variables to each person record, making the data easier to use for some purposes.

Each annual dataset contains approximately fifty-thousand households with all their people, for a total of around 100k to 130k people.

### **IHIS Software Challenges and Highlights**

The NHIS survey has many questions. For some questions if you answer "yes" to an initial question, you will get a follow-up set of questions on a particular topic relevant to you. Combining all possible sets of questions into a set of questions that can represent any person in the survey yields a very large (multi-thousand) set of variables on each person record.

In addition, NHIS has some of these detailed questions stored in the form of sub-records to the person record. For example a person may have many conditions -- a varying number -- or medications, and so on. Some of the most useful information from these sub-records gets summarized onto the person record, resulting in even more person variables.

Therefore, one unusual characteristic of the IHIS data is the very wide person record, making storage in most relational databases problematic. Certainly we could find work-arounds, but these complicate the back-end for no gain -- we're not interested in retrieving just a handful of individual records or updating a few records at a time.  

The other interesting quality of the data (mentioned already) is that there are many record types associated with the person records. You might think of these relationships like "people have many doctor visits, people have many medications" and so forth -- a very standard one to many scheme. What makes this problematic is the need to consume and produce entire datasets at once and compute lots of new values on every record in the process. The most efficient representation is more along the lines of a hierarchical document model, where all records have been joined but no data is repeated. Apart from the redundancy of field names in the data, JSON is a good representation. The following figure shows a slice of the data. Keep in mind there's no set number of "child" records that must follow their "parent" types.

	household: [ ....data values ]
		person: [ ...values ....]
			injury: [... data ... ]
			injury: [ ... data ... ]
			medication: [ ... data ...]
			hospitalization: [ ,... data ...]
		person: [ ... data ...]
			injury: [ ...data...]
	household: [ data ...]

and so forth for every single household surveyed. This is the most efficient format for reasoning over the data at the micro level but it doesn't lend itself to efficient tabulation, search, or filtering.

We first produce the integrated data using the hierarchical format (we do this for all microdata.) For later analysis and extraction we transform the data into the most effective formats for those tasks. To be clear, if you request data from IHIS you will get, by default, a flat file either as CSV or fixed-width, optionally in native stats application (Stata, SAS, SPSS) format. You can request data in hierarchical form and in that case you get the format described above.

The sheer number of variables in the integrated IHIS poses a challenge in navigating the data extraction system and locating the questions users want to study. Conceptually it's easy enough to imagine a checklist of variables where users check those they're interested in retrieving, but given the number of variables the user interface design to turn this idea into a working interface is not trivial.

### **What Can I Study With IHIS?**

IHIS contains a vast number of health-related topics. The survey has changed a lot over time, so many detailed topics won't have coverage all the way back to 1963.

You can find very simple types of information such as height, weight, age, general health status in addition to basic demographic and economic information.  The IHIS also has basic geography information: region and metro area. Keep in mind that with under 150,000 people in the survey you cannot use IHIS data to study small regions well.

For children you can find very detailed information about school and services at school. For adults there is detailed information about jobs and health insurance. To effectively use the detailed information applying to only part of the survey you need to understand "flag" variables and weight variables.  See the online documentation for more on these topics.

Here are a few examples of what can be done with the data. Read over these data briefs to get an appreciation for what you can do with IHIS and what it takes to effectively use the data.

*  <a href="https://www.ihis.us/ihis/resources/IHIS_Data_Brief_No_2.pdf"> IHIS Data Brief: Did the Affordable Care Act affect insurance coverage for young adults? </a>.
*  <a href="https://www.ihis.us/ihis/resources/IHIS_Data_Brief_No_1.pdf"> IHIS Data Brief: Food Insecurity in the United States 1998-2003 </a>.
*   <a href="https://www.ihis.us/ihis/resources/Lee_APHA_Presentation.pdf">  Presentation on studying complementary and alternative medicine use with the IHIS.</a> _Note that this presentation only includes data for 2002 and 2007 biut there's a supplement for 2012 available now as well._

Due to the complex record structure and sheer number of variables, IHIS is one of the more interesting and challenging microdata projects from an IT perspective. We hope this introduction has piqued your curiosity to explore this important resource of health data!
