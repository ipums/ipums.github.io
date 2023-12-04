---
layout: page
status: publish
published: true
title: Data Duplication Detection
author: jerdmann
wordpress_id: 163
wordpress_url: http://tech.popdata.org/?p=163
date: '2014-10-07 20:16:44 -0500'
date_gmt: '2014-10-07 20:16:44 -0500'
categories: Code
tags:
- duplication
- 1880 Census
- 1940 Census
---

Dealing with historical census data is dealing with dirty data.  Prior to the 1960 census, the primary way of collecting census data was through enumeration-by-foot. People were hired as enumerators to walk through districts and interview residents as they filled out a hand-written <a title="Census Forms" href="http://www.ancestry.com/download/forms" target="_blank">enumeration form</a>.  The end of the census was just the beginning of the long life of these forms.   These forms were collected by the Census Bureau and stored for decades.  In some cases sheets were lost.  For an extreme example, <a title="Fate of the 1890 Census" href="http://www.archives.gov/publications/prologue/1996/spring/1890-census-1.html" target="_blank">the entire 1890 census was lost to a fire</a>, but other censuses would lose a sheet here and there, or maybe an entire town.

Eventually these sheets were transferred to microfiche, and more recently scanned to digital images.  The manual process of imaging or digitizing resulted in some sheets being shuffled out of order or scanned twice.  In other cases, duplicate partial sheets (enumerators would sometimes start a sheet but then start over on a new sheet) were included.  Some sheets couldn't be processed automatically - these images were then had entered, character by character, from copies of the aged physical sheets that suffer from many legibility issues.  By the time the now-digitized census arrives at the MPC, it's full of errors.  In this post, we'll introduce how we detect one type of error, the duplicate.

How does one go about identifying duplicate sheets where the duplicates are almost certainly not identical duplicates?  As an example with a smaller dataset, the 1800 census is a 202 MB file with 542,000 households (censuses only included households, not individual people, until 1850).  Each household record has 51 variables.  One thing we have going for us is that the data includes an identifier for the sheet each line came from and the line number on the sheet, thus reducing our problem space to comparing the 17,105 sheets in the census.

A brute force approach might be to compare all 17,105 sheets to every other sheet in the dataset, but that's rather compute intensive.  Rather than comparing each sheet to all the other sheets, first we try to reduce the problem size.  For 1800 this may simply be a convenience, but this is truly necessary to handle larger cases like the 1940 census, with 123,000,000 people.

So, we have developed a few tricks to wrestle this problem down to manageable size.  The first step is to reduce each column on each sheet from the source data values down to a simple "change / no change" pattern.  If the value in the current row matches the value in the previous row, we add a 0 to the pattern.  If the value changes we add a 1.  If the column being analyzed is a column of last names, the following two examples would both produce the same pattern:

|Roberts|Smith|1|
|Roberts|Smith|0|
|Townsend|Smithe|1|
|Chavez|Smith|1|
|Chavez|Smith|0|

Note that the third row of the second column, "Smithe", is likely a typo, but at this early stage we're only looking to reduce the number of full sheet comparisons we have to make.

Once the patterns are generated, we select a representative group of columns that are most likely to reduce potential matches. We're looking for columns where the values will tend to change a few times within a single sheet.  Columns where most of the sheet maps to a single value (e.g. city or state) are not useful for our purposes.  Likewise, columns where there is so much change that only one or two sheets in the entire dataset will share that pattern (e.g. occupation) will do little other than add execution time.  Our algorithm makes an attempt to select the columns that are in between these two extremes.  Columns containing first and last names as well as gender are usually among the top scored columns - they have just the right amount of change within the column to be useful for detecting duplicate sheets.

Once we select our columns, we set about comparing the patterns extracted from the dataset.  Pairs of sheets with the same pattern are enumerated and any sheets with patterns that have a 95% match are also enumerated.  We get another savings here due to the variance in sheets sizes. There's no reason to compare a pattern for sheets with 200 rows to a pattern for a sheet with 5 rows because they cannot have a 95% match.

After all the potential matches from our selected columns are enumerated, we identify pairs of sheets that have a 95% or higher pattern match across 75% or more of our selected columns move on to the final phase. In 1800, this leads to 71 possible sets of duplicate sheets, which are subjected to a cell-by-cell comparison.  Seven sheets ultimately prove to be easily identifiable duplicates while the rest are eliminated for reasons, such as a majority of the sheet being empty cells.

This is just one of the many quality checks we apply to historical datasets.  For instance, we still have to go back and deal with that typo up above.  But that's for a later phase in the process - and a later blog post.
