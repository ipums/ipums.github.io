---
author: kevin
author: fran
author: ccd
title: Ingesting the 2020 U.S. Census with DuckDB
teaser: DuckDB made it possible for us to reshape the U.S. Census with pure SQL and a sprinkling of classic UNIX utilities.
categories: Code
tags:
- DuckDB
- NHGIS
- Parquet
- SQL
---

## Introduction

Our [IPUMS NHGIS data collection](https://nhgis.ipums.org) aims to make public U.S. Census Bureau (USCB) data releases easier to use. The USCB publishes statistics from every decennial census and the annual American Community Survey (ACS). NHGIS makes this information easier to navigate: users can request data on specific topics, from specific times and places. The stats are available for different geographic levels: states, counties, tracts and even city blocks (as well as many more). When you hear about census stats for your state or county or city, it's probably available from NHGIS. In addition to making the information easier to find, NHGIS makes the data comparable across many decades so that you can more easily look at change over time.

Behind the scenes, the IPUMS team has to get the original form of the data from the public USCB publication and transform it along with the metadata also provided by USCB (labels of locations, names of tables and so forth.) The metadata helps us match up topics and labels to prior censuses. We download and reshape the data to match all of our existing data. We refer to this process of consuming the USCB's metadata and data and transforming it into the NHGIS schema as "ingesting". The ingest process is partly automated but always involves some amount of manual adjustment to data and metadata to account for changes in the latest census or survey. 

There are a few steps, all of which may be performed mostly automatically or mostly manually if necessary:

1. Download from USCB
2. Prepare the NHGIS metadata description of the NHGIS version of the census
3. Transform census data into our format suitable for driving our NHGIS data extract system
1. Evaluate and validate, going back to steps 2 and 3 when necessary until reaching a good quality release
2. Publish to the NHGIS data dissemination system

 Most of this article is concerned with step 3, the data transformation. The 2020 census release from USCB threw us some curveballs, forcing us to improvise in order to get the data out the door in a reasonable timeframe. One of the things that really helped us achieve this is DuckDB, which allowed us to do our 2020 ingest in a completely different way from the 2010 ingest. Let's take a closer look.
 
## The Problem
 
Upon the recent 2020 full U.S. Census release last June, we discovered the public data didn't at all match our expected format. We expected something like the format used for the annual ACS, for which we are very prepared with a lot of automation. Instead, the 2020 census, formally known as the 2020 Demographic Household Census (DHC), was mostly still in the legacy format USCB used in 2010. To quickly incorporate it into our NHGIS system we would have to improvise.

The last time we did a full census ingest for 2010, it took considerable time. Much of the effort went to the time needed for our research experts to iteratively evaluate the data and the metadata needed to describe the data in our extract system. Some of this effort is irreducible: the hard work is in finding the unique quirks and mistakes in the USCB published data and metadata and addressing them with artisinal code or hand-crafted data and metadata changes. Next, we look at the differences since the last census. New geographic locations appear, new questions get asked, new cross-tabulations published. All that new stuff has to get identified and incorporated into our NHGIS extract system and documentation.

The overall process took several weeks. However, in addition to the required research time, the data transformation work was also slow. Many days were spent reading and reshaping the data. If that aspect could be improved we'd be able to focus more on the parts that are necessarily not automatable.

In recent years, we had modernized our ingest software to support new ACS formats, an investment that quickly paid off since we ingest new ACS releases every year. However, since censuses only come around once a decade and the 2020 census was still using a legacy 2010 format, extending our new ingest software to support the 2020 census would be a big effort that would only be used once, since we fully expect the 2030 census to use a different format. Building highly-engineered reusable software for this use case seemed a poor use of our resources. After all, the goal is to get the 2020 census into NHGIS, not write software that would get retired immediately. 

We needed a different approach.

## A Closer Look at the 2020 DHC NHGIS Data

First, let's dive deeper into the data we get from USCB for the 2020 DHC census.

### Census Tables

USCB organizes the census into a set of tables. Let's look at an simple table: `HOUSING UNITS` (what USCB refers to as table `H1` in the 2020 DHC). This table has only one variable:
* Total 

which contains the number of housing units in this geographic area. Table exist at multiple levels of geography, so there will be an `H1` table for the entire state of Alaska, for each county in Alaska, for each county subdivision in Alaska, and so on. 

Let's look at a slightly more complicated table: `URBAN AND RURAL` (housing units), table `H2`. This table has four variables:
* Total
* Urban
* Rural
* Not defined for this file

which has the same number of housing units as would be found in table `H1` but `H2` breaks them down into their urban/rural characteristic.

There are around 250 tables containing nearly 10,000 variables in the 2020 DHC census data.

### Segmenting

USCB distributed the data as one `.zip` file per state, and one for the whole nation. D.C. and Puerto Rico are included as "states," so there were fifty-three files in total.

When you unzip one of these files you find that each state has been divided into a set of 44 "segment" files which are pipe-delimited text containing the data itself (e.g. `ak000012020.dhc.gz` below), plus a geographic header file (e.g. `akgeo2020.dhc.gz` below). We end up gzipping these files to save significant space.

Here's a sample of what the input data is structured as:
```text
.
├── ak2020.dhc
│   ├── ak000012020.dhc.gz
│   ├── ak000022020.dhc.gz
..... snip ........
│   ├── ak000442020.dhc.gz
│   └── akgeo2020.dhc.gz
├── al2020.dhc
│   ├── al000012020.dhc.gz
│   ├── al000022020.dhc.gz
.... snip ....
│   ├── al000442020.dhc.gz
│   └── algeo2020.dhc.gz
├── ar2020.dhc
│   ├── ar000012020.dhc.gz
│   ├── ar000022020.dhc.gz
│   ├── ar000032020.dhc.gz
... and so on for all the states
```
Every state has the same number of segments. Each segment comprises many published census tables from USCB. USCB provides mappings so that users can figure out which segment(s) hold their tables of interest.

The file name `ak000012020.dhc.gz` can be broken down as follows: `ak` for Alaska, `00001` for segment #1, `2020` for the 2020 census, `dhc` is for Demographic and Housing Characteristics (there are various data products for the 2020 census, DHC is only one of them), and `.gz` because we converted it to a gzip file for space savings. (In the remainder of this post assume we've unzipped it to do the work).

Each row in a segment file represents a specific geographic unit within that state, so while all of Alaska's segment files will have the same number of rows, Alabama's segment files will have a different number of rows than Alaska's segment files, because Alabama has a different number of counties, county subdivisions, and so on than Alaska. 

This is what a row in the `ak000012020.dhc.gz` segment file looks like:
```
DHCST|AK|000|01|0000001|326200|326200|195718|130482|0|326200|269148|57052|269148|112016|59992|97140|182067|83335|42134|56598|8061|2290|589|5182|33029|8486|10489|14054|12248|5107|1952|5189|2810|547|94|2169|5776|2164|889|2723|25157|10087|3845|11225|13959|5187|1653|7119|178056|81766|41764|54526|7745|2207|569|4969|32268|8224|10395|13649|12077|5035|1936|5106|2751|533|84|2134|1736|770|363|603|20556|8294|3228|9034|4011|1569|370|2072|316|83|20|213|761|262|94|405|171|72|16|83|59|14|10|35|4040|1394|526|2120|4601|1793|617|2191|57052|10070|1244|3152|1183|29722|336|11345|269148|182067|8061|33029|12248|2810|5776|25157|269148|255189|178056|7745|32268|12077|2751|1736|20556|13959|4011|316|761|171|59|4040|4601|703100|269148|73681|88573|40371|33204|17103|8869|7347|269148|172008|125469|2879|18975|7059|641|3053|13932|97140|56598|5182|14054|5189|2169|2723|11225|269148|172008|165168|6840|97140|90021|7119|269148|172008|38409|61202|26633|23076|11663|5970|5055|97140|35272|27371|13738|10128|5440|2899|2292|182067|125469|29330|48723|18861|16076|7247|3140|2092|56598|22564|17107|7365|5316|2463|1130|653|8061|2879|699|885|484|365|229|110|107|5182|1949|1318|746|534|322|172|141|33029|18975|3938|4671|2929|2564|1844|1485|1544|14054|4496|3250|2124|1688|1134|730|632
```

The first column describes the data product: `DHCST` for DHC at the state level. The next 4 columns describe the geographic unit this row refers to, and the remaining columns are the table data.

### Geographic Header Files and Summary Levels

As I just mentioned, columns 2-5 contain geographic unit data. Starting in column 2, we have `AK` for Alaska, the `000` and `01` are related to something called Characteristic Iteration and is beyond scope here, and the `0000001` is a Logical Record Number which allows us to link to the geography header file to get more information about this geographic unit. 

Alaska has 43,234 distinct geographic units in the 2020 DHC census, which means there are 43,234 rows in each of Alaska's segment files and 43,234 geographic variants of many of the 2020 DHC data tables for Alaska (not all data tables are available at all geography levels). The geographic header file for Alaska therefore has 43,234 rows to decribe all of these places. Other states have more or fewer geographic units, but all told there are more than 11 million geographic units in the 2020 DHC census. 

Each of those more than 11 million geographic units maps to a particular geography level, or what USCB calls a "Summary Level". Common summary levels include state, county, county subdivision, place, census tract, block group and block, but there are also others such as school and legislative districts, plus separate hierarchies for American Indian, Alaska Native and Native Hawaiian Areas. This concept becomes important later in our process.

Getting back to the specific example row above, linking into Alaska's geography header file using the Logical Record Number, we can determine that `0000001` means "the state of Alaska". Here is the relevant row:

```
DHCST|AK|040|00|00|000|00|0000001|0400000US02|02|4|9|02|01785533|||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||1478941109938|245380162784|Alaska|Alaska|A||733391|326200|+63.3473560|-152.8397334|00||
```

The `040` in column 3 is the summary level code for "state". You can see there are quite a few columns, and many of them are blank in this case. Let's look at a more interesting example, `0000036`, which represents the municipality of Anchorage:

```
DHCST|AK|050|00|00|000|00|0000036|0500000US02020|02020|4|9|02|01785533|020|H6|01416061|||||||||||||||||||||||||||||||||11260|1|999|99999||||||||||||||||||||||||||||||||4420591349|621302197|Anchorage|Anchorage Municipality|C||291247|118640|+61.1742503|-149.2843294|12||
```

States can have different classification systems for their places, but you can see here from the `050` in column 3 that USCB considers this the equivalent of a county, since that's the summary level code representing the `State-County` hierarchy. As the geographic units get smaller in size, the records contain more of this "nesting" information. Here's an example of the lowest geographic unit, a census block:

```
DHCST|AK|100|00|00|000|00|0018802|1000000US021220013001063|021220013001063|4|9|02|01785533|122|H1|01419972|68610|Z5|01939944|99999|99|99999999||||99999|99|99999999|99999|99|99999999|001300|1|1063|9999|9|99999|99|99999999|999|99999|99|99999999|999999|9|14410|E7|02419341|99999|9|999|99999|99999|9|999|99999|9|9|99999|9|R|00|||||00P|||||032|||||32-847|A|99664|99999|99999|00390|00200|105812|0|1063|Block 1063|S||0|0|+60.0818687|-149.3458873|BK||99999
```

Most fields contain data in this case. So as you can see, there is quite a bit of contextual geographic data available, especially as you get into the smaller geographies. This type of information is incredibly useful for users of this census data. Rather than repeating this information on each row within each of the 44 segment files, USCB pulled that information out into its own file and put the Logical Record Number linking keys in the data itself to save space. We will need to re-join this data back to the table data within NHGIS so we can provide this useful contextual geographic data to users in their data extracts.

### Table Data

The actual table data starts at column 5. Using table-to-segment mapping information from USCB, we know that table `H1` is the first table in segment 1. We saw above that table `H1` only has one variable, for the total number of housing units. So that `326200` in the fifth column is telling us there are 326,200 housing units in the state of Alaska. The next four columns are for table `H2`. We see the same `326200` total of housing units, with `195718` of them being urban, `130482` rural, and `0` unspecified (which checks out since 195,718 + 130,482 = 326,200). The rest of the colums in segment 1 represent tables `H3` through `H12C`.

If you are wondering why USCB does this segmenting business, it's to keep each data file under 255 columns to make it easier to use these files in spreadsheet software. A rough calculation of 10,000 variables divided by 255 columns would require at least 40 segments. We end up with 44 because USCB doesn't want to split tables across two different segments so they can't be perfectly efficient with using all 255 columns per segment.

## From USCB Segments to NHGIS Datasets

NHGIS groups the 250 tables in the 2020 DHC census into NHGIS "datasets". Remember how I said above that not all tables are available at all geographies? One of the main reasons NHGIS groups tables into separate datasets is to group data together which is available for all of the same geographic summary levels. NHGIS creates three distinct datasets for the 2020 DHC. At NHGIS we also don't have the same 255 column restriction that USCB has, so we can also get rid of segments at this point. 

While learning about the 2010 DHC workflow which handled a "similar to but not exactly the same as" 2020 data format, it seemed to me that the underlying transformations on the data tables looked like pretty straightforward operations. Our past system in 2010 employed a series of scripts to transform the data as text files, but what they were doing was pretty much translatable to relational database terms.

The general overview of our ingest process is as follows:
1. Merge segments together (i.e. a "horizontal" merge) based on which NHGIS dataset their tables will be in. Luckily segments don't split across datasets -- all of the tables in each segment belong to one and only one NHGIS dataset, which makes the transformation from segments to datasets a bit easier. 
2. Merge states together (i.e. a "vertical" merge). Note that steps 1 and 2 can happen in either order - this is important in a moment.
3. Join the geography information from the geog header files for each state onto the rows of data.
4. Enhance the records with NHGIS-specific value adds. Much of this involves bringing in enhanced geographic information.
5. Do QA checks and look for errors in USCB data or metadata.
6. Transform data into a format which is compatible with and performant for the NHGIS data extract system

### Could a Database Help?

All of these steps could benefit from being done within a database engine, but particularly steps 3-6, which are the most compute intensive, whereas the file munging in steps 1 and 2 is already quite efficient with UNIX command line tools like `cat` and `paste`. In theory, these activities map directly in relational database terms to `select` with `union` (steps 1 and 2), `join` (step 3), `update` (step 4), `select` (step 5) and `select` and `join` (step 6). Could we really boil things down to a series of SQL statements? That would be so nice. Representing the data reshaping tasks as SQL would bring the ingest process much closer to a self-documenting procedure for the future when we've all forgotten what the heck was going on ten years ago or when it turns out we need to totally reprocess the 2010 and 2020 censuses for some reason I'm sure will make sense in the year 2029. 

The decennial census data presents challenges the annual ACS does not: the decennial census contains finer-grained geography levels like "block group" and "block", meaning we have some records for every block in the census, of which there are about 11 million across the country. That may not sound especially large, except that these tables can have thousands of columns and we need to do some checking on them all -- or did in the past anyhow.

In 2010, the obstacles to executing some of the queries would have been twofold: the simple version of the schema would have required many thousands of columns, not something databases available to us in 2010 could support, and more raw memory than was available to us in 2010. Well, now we have servers with 256GB and even one TB of RAM, as well as dozens of cores! And solid-state storage. And very fast ethernet between servers. It's so much better than things were ten years ago, so maybe a database-based approach is now feasible?

Another reason we hadn't used a database tool earlier was that our work style requires that we do a lot of import-transform-export workflows and having a single database server as a bottleneck slows this down and prevents parallel workflows. We may want many versions of the same set of data at once for concurrent processing. These are things expensive commercial products can accommodate, but we use open source tools (partly out of principle and partly out of budgetary constraints). So while the query execution is something we could have really benefitted from in the past, the client-server database model wasn't a great fit. Perhaps the situation has improved a decade later?

### Choosing a Database Tool

If we use a database tool there would be essentially two broad phases: cleaning + loading, then transforming + enhancing. With luck the export is a straightforward afterthought. We set out to identify an open-source database tool that might be able to accommodate this workflow. We looked at a number of options, but long story short, we chose DuckDB.

Looking at DuckDB's <a href="http://duckdb.org"> home page</a>:

>	When to use DuckDB 
>	• Processing and storing tabular datasets, e.g., 
>     from CSV or Parquet files
>	• Interactive data analysis, e.g., join & aggregate
>     multiple large tables
>	• Concurrent large changes, to multiple large tables, 
>     e.g., appending rows, adding/removing/updating columns
>	• Large result set transfer to client

In addition, DuckDB is a stand-alone tool and doesn't concern itself with running a server. 

Seems like a perfect match. 

## How DuckDB Supported our Workflow

Now for how we actually used DuckDB. We should also note that we used DuckDB 0.7.1 for most of our work; 0.9.2 is available now and you should probably use that.

### Loading the Data

I mentioned above that steps 1 and 2 were already quite efficient using UNIX command line utilities. Let's say that we determine segments 1-27 are all destined for NHGIS dataset A. An alternative cheap, low-memory way to join the data before loading into the database would be to use `paste` like so:

```
$ paste ak000012020.dhc ak000022020.dhc .. ak000272020.dhc -d '|' > ak_dataset_a.dhc
```

to join all of a state's segments together, and then:

```
$ cat ak_dataset_a.dhc al_dataset_a.dhc .. wy_dataset_a.dhc > us_dataset_a.dhc
```
to combine all of the states into one data file for the NHGIS dataset A.

Then the loading process would simply be one database "create table from csv file" operation per dataset, no join needed. We considered doing this, but the database would need a robust CSV reader to support the large number of columns which might differ from the number of columns allowed in a internally created table. This turned out to be an issue on the version of DuckDB we used, so instead we loaded segments into temporary tables and joined in the DB. 

So, instead, to initially load the DHC data into a database we first:
* Make files to serve as the headers for the pipe-delimited segment files provided by USCB (e.g. `S44_heading.dhc.gz`, created using metadata from USCB)
* Concatenate all the state files for each segment into consolidated files, one per segment: We simply use `cat` for this like we showed above, but create one file per segment so they are not too wide (looks like we do have something akin to a 255 column limit after all, at lesat until we get into the database!)
* Ensure the input files use the correct character encoding (in our case they had to get encoded from Windows 1252 to UTF-8 to work with the rest of our workflow.)
* In DuckDB, load those segment files in with "read_csv_auto()" -- there are similar functions in other database systems.

The concatenation was like this (yes, you can `cat` together `gzip`'ed files!):

```shell
cat S44_heading.dhc.gz \
/tmp/2020dhc_data/segmented_states/tx2020.dhc/tx000442020.dhc.gz \
/tmp/2020dhc_data/segmented_states/nc2020.dhc/nc000442020.dhc.gz \
/tmp/2020dhc_data/segmented_states/co2020.dhc/co000442020.dhc.gz \
/tmp/2020dhc_data/segmented_states/nv2020.dhc/nv000442020.dhc.gz \
... 
> /tmp/2020dhc_data/segmented_states/segment_S44.dhc.gz	
```
for every state, on every segment file up to segment 44. We end up with one file per segment.

And here is a sample of the loading script:
```shell
ccd@build:/tmp/2020dhc_data/work$ head 02_load_into_duckdb.sh                                                                                                                                                      
duckdb-71 new_cleaned_tmp.nhgis.data.db -s "PRAGMA memory_limit='100GB';create table geo as select * from read_csv_auto('geou.psv', header=true, sep='|', sample_size=-1,all_varchar=1);alter table geo alter LOGRECNO type integer"                                                                                                                                                                                                  
duckdb-71 new_cleaned_tmp.nhgis.data.db -s "PRAGMA memory_limit='100GB';create table S01 as select * from read_csv_auto('segment_S01.dhc.gz', header=true, sep='|')"                                               
duckdb-71 new_cleaned_tmp.nhgis.data.db -s "PRAGMA memory_limit='100GB';create table S02 as select * from read_csv_auto('segment_S02.dhc.gz', header=true, sep='|')"                                               
duckdb-71 new_cleaned_tmp.nhgis.data.db -s "PRAGMA memory_limit='100GB';create table S03 as select * from read_csv_auto('segment_S03.dhc.gz', header=true, sep='|')"                                               
duckdb-71 new_cleaned_tmp.nhgis.data.db -s "PRAGMA memory_limit='100GB';create table S04 as select * from read_csv_auto('segment_S04.dhc.gz', header=true, sep='|')"                                               
duckdb-71 new_cleaned_tmp.nhgis.data.db -s "PRAGMA memory_limit='100GB';create table S05 as select * from read_csv_auto('segment_S05.dhc.gz', header=true, sep='|')"                                               
duckdb-71 new_cleaned_tmp.nhgis.data.db -s "PRAGMA memory_limit='100GB';create table S06 as select * from read_csv_auto('segment_S06.dhc.gz', header=true, sep='|')"                                               
duckdb-71 new_cleaned_tmp.nhgis.data.db -s "PRAGMA memory_limit='100GB';create table S07 as select * from read_csv_auto('segment_S07.dhc.gz', header=true, sep='|')"                                               
duckdb-71 new_cleaned_tmp.nhgis.data.db -s "PRAGMA memory_limit='100GB';create table S08 as select * from read_csv_auto('segment_S08.dhc.gz', header=true, sep='|')"                                               
duckdb-71 new_cleaned_tmp.nhgis.data.db -s "PRAGMA memory_limit='100GB';create table S09 as select * from read_csv_auto('segment_S09.dhc.gz', header=true, sep='|')"                                               
ccd@build:/tmp/2020dhc_data/work$  

```

Now we have an initial database and are ready to join the temporary segment tables. All segment files will be in the same order as long as the concatenation process reads the state directories in the same order for each segment. We now have a database consisting of tables matching the concatenated segment files so that there are tables like "S01", "S02" ... "S44".

### Transforming the Data

This part is all pure SQL. However, we can invoke DuckDB as a command line tool against the working database file (much like Sqlite), so we can still accomplish many tasks with a generated shell script that includes the query we want to execute. We used a mix of shell scripts calling the DuckDB CLI tool and the Python library for DuckDB.

Here is each transformation step with sample SQL.

* Join segment tables into dataset tables. As we mentioned above, NHGIS groups DHC data tables into three datasets. Our segment files happen to all be in the same order so that the join is simple. All segment tables in the same dataset have the exact same number of rows because we grouped segments based on the geography levels contained in the tables within. There are about 11 million geographic units and therefore rows in dataset "A", 2.5 million in dataset "B" and 38 thousand in dataset "C". The join runs fairly fast considering there are 3500 and 5700 columns in A and B respectively. The memory footprint is pretty large, however. 

The joins were done like this (here `STUSAB` is the USCB code for the state):
```shell
duckdb-71 new_cleaned_tmp.nhgis.data.db -s  "
create index S16_idx on S16(S16STUSAB,S16LOGRECNO);
create index S17_idx on S17(S17STUSAB,S17LOGRECNO);
drop table if exists tmp_dataset_cph_2020_DHCc;
PRAGMA force_index_join;
create table tmp_dataset_cph_2020_DHCc as select * from S16 left join S17 on S16.S16STUSAB = S17.S17STUSAB and S16.S16LOGRECNO = S17.S17LOGRECNO;
"
```
This is for "Dataset C" only, the smallest one, which is comprised of only two segments. You see that we use the Logical Record Number to join across the two segments, to ensure that the joining rows represent the same geographic place. It's technically a left join but segments 16 and 17 should contain the same number of rows since they have tables at all of the same geographic summary levels.

* Next we join the `geo` table, which is populated by the geographic header files, to each of the dataset tables; this can be an inner join using the state code (STUSAB) and Logical Record Number (LOGRECNO) as the key on both sides -- the temp dataset tables will have columns like s01_STUSAB, s01_LOGRECNO and so on, indicating their origin on different segments. The values all match. These joins take some time and is one place where a row-oriented DBMS may have performed better.
  
```sql
create table dataset_2020_DHCc as 
 select * from geo 
  inner join tmp_dataset_2020_DHCc on 
    geo.STUSAB = tmp_dataset_2020_DHCc.S16STUSAB and 
    geo.LOGRECNO = tmp_dataset_2020_DHCc.S16LOGRECNO
```
We have now created the final dataset tables, but they still need some `update`s.

* Drop redundant columns such as the segment variants of LOGRECNO and STUSAB; drop the temporary dataset tables and segment tables

For example:
```sql
delete from dataset_2020_DHCa 
  where STUSAB = 'US' 
    and SUMLEV in ('040', '050', '060', '070', '155', '160', '170', '172', '230', '500', '610', '620');
```
This is slightly slower than it would be on a row-store DB.

* We also do little bits of housekeeping, like adding a `US` convenience column
```sql
duckdb-71 new_cleaned_tmp.nhgis.data.db -s "--
-- Add the US convenience column to datasets.;
alter table dataset_2020_DHCa  add column  US varchar; update dataset_2020_DHCa set US=1 where SUMLEV=10; alter table dataset_2020_DHCb add column US varchar; update dataset_2020_DHCb set US=1 where SUMLEV=10;alter table dataset_2020_DHCc add column US varchar; update dataset_2020_DHCc set US=1 where SUMLEV=10"
```
This is very fast because of DuckDB's column store.

* Next we can add and compute the GISJOIN columns to each dataset. GISJOIN is a concatenated geographic identifier we construct for internal NHGIS usage. The algorithm for generating a GISJOIN varies depending on the summary level. This is a rather complex update but with DuckDB it runs quite fast. So if we find we made a mistake it's cheap to redo.

```sql
-- Create and update all GISJOIN rows for each dataset;
alter table cph_2020_DHCa add column GISJOIN varchar;
;
UPDATE cph_2020_DHCa SET GISJOIN = CONCAT('G', RIGHT(CONCAT('00000', US), 1)) WHERE SUMLEV = '010';
;
UPDATE cph_2020_DHCa SET GISJOIN = CONCAT('G', RIGHT(CONCAT('00000', REGION), 1)) WHERE SUMLEV = '020';
;
UPDATE cph_2020_DHCa SET GISJOIN = CONCAT('G', RIGHT(CONCAT('00000', DIVISION), 1)) WHERE SUMLEV = '030';
;
UPDATE cph_2020_DHCa SET GISJOIN = CONCAT('G', RIGHT(CONCAT('00000', STATE), 2), '0') WHERE SUMLEV = '040';
,....
```
and so on for every geographic level.

* Add and compute the GN_GISJOIN columns on each dataset. Again, very fast.

```sql
alter table cph_2020_DHCa add column if not exists nation_gn_gisjoin varchar;
alter table cph_2020_DHCa add column if not exists region_gn_gisjoin varchar;
alter table cph_2020_DHCa add column if not exists division_gn_gisjoin varchar;
alter table cph_2020_DHCa add column if not exists state_gn_gisjoin varchar;
alter table cph_2020_DHCa add column if not exists county_gn_gisjoin varchar;
alter table cph_2020_DHCa add column if not exists cty_sub_gn_gisjoin varchar;
alter table cph_2020_DHCa add column if not exists place_gn_gisjoin varchar;

```
and so on, for all geographies on every dataset table. This is very fast.

The updates look like this:
```sql
UPDATE cph_2020_DHCa SET county_gn_gisjoin   = CONCAT('G', RIGHT(CONCAT('00000', STATE), 2), '0', RIGHT(CONCAT('00000', COUNTY), 3), '0') WHERE SUMLEV IN ('310', '311', '312', '313', '314', '315', '316', '320', '321', '322', '323', '324', '332', '333', '341');
```
These occur for every geography on each dataset. These are also fast.

* Add and compute the PUMA columns. These are "Public Use Microdata Area" values useful for matching geography to microdata published only with PUMA identifiers for geographic location. The update runs quickly and is easy to iterate on.

```sql
create table puma_x_tract as  select * from read_csv_auto(layouts/pumas.csv, header=true); ;

    
        UPDATE cph_2020_DHCa
        SET puma = puma_x_tract.PUMA5CE
        from puma_x_tract
        where cph_2020_DHCa.STATE = puma_x_tract.STATEFP AND 
            cph_2020_DHCa.COUNTY = puma_x_tract.COUNTYFP AND 
            cph_2020_DHCa.TRACT = puma_x_tract.TRACTCE 
            and cph_2020_DHCa.SUMLEV IN ('080', '085', '090', '091', '140', '144', '150', '154', '158', '511', '631', '636');
    ;


        UPDATE cph_2020_DHCb 
        set puma = puma_x_tract.PUMA5CE
        from puma_x_tract
        where  cph_2020_DHCb.STATE = puma_x_tract.STATEFP AND 
            cph_2020_DHCb.COUNTY = puma_x_tract.COUNTYFP AND 
            cph_2020_DHCb.TRACT = puma_x_tract.TRACTCE  and 
            cph_2020_DHCb.SUMLEV IN ('080', '085', '140', '144', '158', '511', '631', '636');
    
```

Adding this sort of geographic information to each record is extremely valuable, and in the past has also been extremely time consuming and error prone. I can't overstate how useful DuckDB has been in allowing us to accelerate this phase of ingest and iterate over the data until we get it right.

### QA Checks

Finally, we use this database to check data against the metadata USCB gave us and make corrections; perhaps some geography shows up in the data that's not in the metadata, or labels don't quite match, or many other things. We make spot corrections to data and metadata until they are ready to publish. 

Having this database in DuckDB format is a great advantage to the checking phase as the checks can run in split seconds instead of hours. Querying for specific values in a single column or collecting stats on a few columns is extremely fast with DuckDB compared to row-oriented databases or with text files. When we make corrections, the updates typically run very fast as well.

Here's a very basic example of a quality check query. This is launching the DuckDB cli tool and loading a database file (this is the 2020 DHC DB which is 44 GB) and reading it off of shared storage. The server it's running on isn't particularly fast.
```shell
ccd@gp1:/pkg/ipums/istads/ingest/census_2020/dhc/05_data/db$ time duckdb-71 new_cleaned_tmp.nhgis.data.db  -c "select count(*) as areas, region from cph_2020_DHCa group by region"                                                                                                                                                                     
┌─────────┬─────────┐                                                                                                                                                       
│  areas  │ REGION  │                                                                                                                                                       
│  int64  │ varchar │                                                                                                                                                       
├─────────┼─────────┤                                                                                                                                                       
│ 4307349 │ 3       │                                                                                                                                                       
│ 2221626 │ 4       │                                                                                                                                                       
│ 3443783 │ 2       │                                                                                                                                                       
│ 1547447 │ 1       │                                                                                                                                                       
│   89424 │ 9       │                                                                                                                                                       
│   51175 │         │                                                                                                                                                       
└─────────┴─────────┘                                                                                                                                                       
                                                                                                                                                                            
real    0m2.626s                                                                                                                                                            
user    0m2.241s                                                                                                                                                            
sys     0m0.555s                                                                                                                                                            

```

This is on a 11,660,804 row, 3212 column table without indexing on the columns in the query.

### Finalizing the Database

After transforming the database it looks like this:

```shell
ccd@gp1:/pkg/ipums/istads/ingest/census_2020/dhc/05_data/db$ duckdb-71 new_cleaned_tmp.nhgis.data.db                                                                        
v0.7.1 b00b93f0b1                                                                                                                                                           
Enter ".help" for usage hints.                                                                                                                                              
D show tables;                                                                                                                                                              
100% ▕████████████████████████████████████████████████████████████▏                                                                                                         
┌───────────────┐                                                                                                                                                           
│     name      │                                                                                                                                                           
│    varchar    │                                                                                                                                                           
├───────────────┤                                                                                                                                                           
│ cph_2020_DHCa │                                                                                                                                                           
│ cph_2020_DHCb │                                                                                                                                                           
│ cph_2020_DHCc │                                                                                                                                                           
│ geo           │                                                                                                                                                           
└───────────────┘                                                                                                                                                           
D
```

Here's the shape of the data. We have three tables with loads of columns (this output is a bit confusing - the "6 columns" refers to the number of columns in the _describe_ table whereas the "3212 rows" refers to the number of _columns_ in the actual dataset table). Geographic columns come first followed by table data and our constructed GN_ columns at the end.

```sql
D describe select * from cph_2020_DHCa;                                                                                                                             
┌─────────────┬─────────────┬─────────┬─────────┬─────────┬─────────┐                                                                                                       
│ column_name │ column_type │  null   │   key   │ default │  extra  │                                                                                                       
│   varchar   │   varchar   │ varchar │ varchar │ varchar │ varchar │                                                                                                       
├─────────────┼─────────────┼─────────┼─────────┼─────────┼─────────┤                                                                                                       
│ FILEID      │ VARCHAR     │ YES     │         │         │         │                                                                                                       
│ STUSAB      │ VARCHAR     │ YES     │         │         │         │                                                                                                       
│ SUMLEV      │ VARCHAR     │ YES     │         │         │         │                                                                                                       
│ LOGRECNO    │ INTEGER     │ YES     │         │         │         │                                                                                                       
│ GEOID       │ VARCHAR     │ YES     │         │         │         │                                                                                                       
│ GEOCODE     │ VARCHAR     │ YES     │         │         │         │                                                                                                       
│ REGION      │ VARCHAR     │ YES     │         │         │         │                                                                                                       
│ STATE       │ VARCHAR     │ YES     │         │         │         │                                                                                                       
│ COUNTY      │ VARCHAR     │ YES     │         │         │         │                                                                                                       
│    ·        │    ·        │  ·      │    ·    │    ·    │    ·    │                                                                                                       
│    ·        │    ·        │  ·      │    ·    │    ·    │    ·    │                                                                                                       
│    ·        │    ·        │  ·      │    ·    │    ·    │    ·    │                                                                                                       
│ P1_001      │ INTEGER     │ YES     │         │         │         │                                                                                                         
│ P2_001      │ INTEGER     │ YES     │         │         │         │                                                                                                         
│ P2_002      │ INTEGER     │ YES     │         │         │         │                                                                                                         
│ P2_003      │ INTEGER     │ YES     │         │         │         │                                                                                                         
│ P2_004      │ INTEGER     │ YES     │         │         │         │                                                                                                         
│    ·        │    ·        │  ·      │    ·    │    ·    │    ·    │                                                                                                       
│    ·        │    ·        │  ·      │    ·    │    ·    │    ·    │                                                                                                       
│    ·        │    ·        │  ·      │    ·    │    ·    │    ·    │                                                                                                       
│ GN_state    │ VARCHAR     │ YES     │         │         │         │                                                                                                       
│ GN_county   │ VARCHAR     │ YES     │         │         │         │                                                                                                       
├─────────────┴─────────────┴─────────┴─────────┴─────────┴─────────┤                                                                                                       
│ 3212 rows (40 shown)                                    6 columns │                                                                                                       
└───────────────────────────────────────────────────────────────────┘                                                                                                       
D

```

```sql
D describe cph_2020_DHCb;                                                                                                                                                   
┌─────────────┬─────────────┬─────────┬─────────┬─────────┬───────┐                                                                                                         
│ column_name │ column_type │  null   │   key   │ default │ extra │                                                                                                         
│   varchar   │   varchar   │ varchar │ varchar │ varchar │ int32 │                                                                                                         
├─────────────┼─────────────┼─────────┼─────────┼─────────┼───────┤                                                                                                         
│ FILEID      │ VARCHAR     │ YES     │         │         │       │                                                                                                       
│ STUSAB      │ VARCHAR     │ YES     │         │         │       │                                                                                                       
│ SUMLEV      │ VARCHAR     │ YES     │         │         │       │                                                                                                       
│ LOGRECNO    │ INTEGER     │ YES     │         │         │       │                                                                                                       
│ GEOID       │ VARCHAR     │ YES     │         │         │       │                                                                                                       
│ GEOCODE     │ VARCHAR     │ YES     │         │         │       │                                                                                                       
│ REGION      │ VARCHAR     │ YES     │         │         │       │                                                                                                       
│ STATE       │ VARCHAR     │ YES     │         │         │       │                                                                                                       
│ COUNTY      │ VARCHAR     │ YES     │         │         │       │                                                                                                       
│    ·        │    ·        │  ·      │    ·    │    ·    │   ·   │                                                                                                         
│    ·        │    ·        │  ·      │    ·    │    ·    │   ·   │                                                                                                         
│ PCT1_001    │ INTEGER     │ YES     │         │         │       │                                                                                                         
│ PCT1_002    │ INTEGER     │ YES     │         │         │       │                                                                                                         
│    ·        │    ·        │  ·      │    ·    │    ·    │   ·   │                                                                                                         
│ PCT1_016    │ INTEGER     │ YES     │         │         │       │                                                                                                         
│ PCT1_017    │ INTEGER     │ YES     │         │         │       │                                                                                                         
│ PCT2_001    │ INTEGER     │ YES     │         │         │       │                                                                                                         
│ PCT2_002    │ INTEGER     │ YES     │         │         │       │                                                                                                         
│    ·        │    ·        │  ·      │    ·    │    ·    │   ·   │                                                                                                         
│ PCT2_018    │ INTEGER     │ YES     │         │         │       │                                                                                                         
│ PCT2_019    │ INTEGER     │ YES     │         │         │       │                                                                                                         
│    ·        │    ·        │  ·      │    ·    │    ·    │   ·   │                                                                                                         
│    ·        │    ·        │  ·      │    ·    │    ·    │   ·   │                                                                                                         
│ GN_state    │ VARCHAR     │ YES     │         │         │       │                                                                                                       
│ GN_county   │ VARCHAR     │ YES     │         │         │       │                                                                                                       
├─────────────┴─────────────┴─────────┴─────────┴─────────┴───────┤                                                                                                         
│ 5767 rows (40 shown)                                  6 columns │                                                                                                         
└─────────────────────────────────────────────────────────────────┘                                                                                                         
D  
```

```sql
D describe cph_2020_DHCc;                                                                                                                                                   
┌─────────────┬─────────────┬─────────┬─────────┬─────────┬───────┐                                                                                                         
│ column_name │ column_type │  null   │   key   │ default │ extra │                                                                                                         
│   varchar   │   varchar   │ varchar │ varchar │ varchar │ int32 │                                                                                                         
├─────────────┼─────────────┼─────────┼─────────┼─────────┼───────┤                                                                                                         
│ FILEID      │ VARCHAR     │ YES     │         │         │       │                                                                                                       
│ STUSAB      │ VARCHAR     │ YES     │         │         │       │                                                                                                       
│ SUMLEV      │ VARCHAR     │ YES     │         │         │       │                                                                                                       
│ LOGRECNO    │ INTEGER     │ YES     │         │         │       │                                                                                                       
│ GEOID       │ VARCHAR     │ YES     │         │         │       │                                                                                                       
│ GEOCODE     │ VARCHAR     │ YES     │         │         │       │                                                                                                       
│ REGION      │ VARCHAR     │ YES     │         │         │       │                                                                                                       
│ STATE       │ VARCHAR     │ YES     │         │         │       │                                                                                                       
│ COUNTY      │ VARCHAR     │ YES     │         │         │       │                                                                                                       
│    ·        │    ·        │  ·      │    ·    │    ·    │   ·   │                                                                                                         
│    ·        │    ·        │  ·      │    ·    │    ·    │   ·   │                                                                                                         
│ PC1_001     │ INTEGER     │ YES     │         │         │       │                                                                                                         
│ PC1_002     │ INTEGER     │ YES     │         │         │       │                                                                                                         
│    ·        │    ·        │  ·      │    ·    │    ·    │   ·   │                                                                                                         
│ PC1_038     │ INTEGER     │ YES     │         │         │       │                                                                                                         
│ PC1_039     │ INTEGER     │ YES     │         │         │       │                                                                                                         
│ PC2_001     │ INTEGER     │ YES     │         │         │       │                                                                                                         
│ PC2_002     │ INTEGER     │ YES     │         │         │       │                                                                                                         
│    ·        │    ·        │  ·      │    ·    │    ·    │   ·   │                                                                                                         
│ PC2_038     │ INTEGER     │ YES     │         │         │       │                                                                                                         
│ PC2_039     │ INTEGER     │ YES     │         │         │       │                                                                                                         
│    ·        │    ·        │  ·      │    ·    │    ·    │   ·   │                                                                                                         
│    ·        │    ·        │  ·      │    ·    │    ·    │   ·   │                                                                                                         
│ GN_state    │ VARCHAR     │ YES     │         │         │       │                                                                                                       
│ GN_county   │ VARCHAR     │ YES     │         │         │       │                                                                                                       
├─────────────┴─────────────┴─────────┴─────────┴─────────┴───────┤                                                                                                         
│ 442 rows (40 shown)                                   6 columns │                                                                                                         
└─────────────────────────────────────────────────────────────────┘                                                                                                         
D  

```

The table row-counts:
```shell
D                                                                                                                                                                           
D select count(*) from cph_2020_DHCa;                                                                                                                                       
┌──────────────┐                                                                                                                                                            
│ count_star() │                                                                                                                                                            
│    int64     │                                                                                                                                                            
├──────────────┤                                                                                                                                                            
│     11660804 │                                                                                                                                                            
└──────────────┘                                                                                                                                                            
D select count(*) from cph_2020_DHCb;                                                                                                                                       
┌──────────────┐                                                                                                                                                            
│ count_star() │                                                                                                                                                            
│    int64     │                                                                                                                                                            
├──────────────┤                                                                                                                                                            
│      2388853 │                                                                                                                                                            
└──────────────┘                                                                                                                                                            
D select count(*) from cph_2020_DHCc;                                                                                                                                       
┌──────────────┐                                                                                                                                                            
│ count_star() │                                                                                                                                                            
│    int64     │                                                                                                                                                            
├──────────────┤                                                                                                                                                            
│        31722 │                                                                                                                                                            
└──────────────┘                                                                                                                                                            
D  
```

This represents the number of different "places" in each of the datasets. Since dataset A goes all the way down to the "block" summary level and there are nearly 11 million census blocks in the US, we see there are more than 11 million rows in dataset A (accounting for all the other summary levels present as well).

### Exporting

You might think that we are now done, and could serve our extract system with this database directly, or export each of these dataset tables as three big Parquet files and serve NHGIS' data extracts from those. However, our existing vast repository of NHGIS data has another, more complex layout that conveys important information and is also designed to be extracted with Apache Spark. The export arranges the data into a structure representing the harmonized-across-time NHGIS geography scheme which isn't contained in our prepared database -- we only have the 2020 specific geography from USCB. We have separate processing code to deal with preparing data for dissemination in this way, but it expects inputs to be one summary level per file. 

So, we need to export from DuckDB into one summary level per file: we will use DuckDB `copy()` to export to CSV files in a hierarchical structure by geography. 

The export queries look like this (the details aren't terribly important; the key idea is that we need to export large amounts of data to CSV using DuckDB):
```sql
-- Export data to files for each sumlev-geocomp combination for each dataset.;
copy (select * from cph_2020_DHCa where geocomp='00' and sumlev = '010' and not (STUSAB = 'US' and SUMLEV in ('040', '050', '060', '070', '155', '160', '170', '172', '230', '500', '610', '620')) order by STUSAB, LOGRECNO ) to '/tmp/2020dhc_data/work/export_data/cph_2020_dhca/2020/nation_010/ge00_file.csv' (HEADER, DELIMITER '|');
copy (select * from cph_2020_DHCa where geocomp='01' and sumlev = '010' and not (STUSAB = 'US' and SUMLEV in ('040', '050', '060', '070', '155', '160', '170', '172', '230', '500', '610', '620')) order by STUSAB, LOGRECNO ) to '/tmp/2020dhc_data/work/export_data/cph_2020_dhca/2020/nation_010/ge01_file.csv' (HEADER, DELIMITER '|');

```
There's one export for every geography and dataset (and "geocomp" which we don't need to get into.) This works, but DuckDB has some trouble on the largest geographies. Since we're generating the queries in a Python script, we can break the largest result sets into chunks and call them separately. An even better solution is to pass the in-memory results of the queries to Polars to export to CSV. Here we used the Python DuckDB library along with `polars` to help export data quickly.

(This is simplified)

```python
import duckdb
import polars as pl

con = duckdb.connect(str(db_name), read_only=True)
for ds in datasets:
	con.execute(dataset_files_query(ds))
	results = con.fetchall()
	datafiles = []
	
	for data_file in results:
		sumlev, geocomp, ct = data_file
		output_table = f"export_{data_dirname}_{geocomp}_{ds}"
		...
		output_query = dataset_slice_query(ds, sumlev, geocomp)                
		con.execute(output_query).pl().write_csv(
			output_csv, has_header=True, separator="|")
                
```

Notice how we took the result of the query and passed it to Polars to actually write the CSV? The results are in Arrow and can be passed to Polars.  DuckDB + Polars can be a powerful combination.

In the end we have a directory structure organized by geography. We hand off this file structure to our Parquet format producing tool to make data compatible with the existing Spark NHGIS extract engine. While DuckDB can export directly to Parquet, our format requires some particular nested map type columns.

## Why DuckDB

Our story with DuckDB has three pillars:
1. An in-process database solution is now technically feasible. Since the last U.S. Census in 2010, computer permanent storage and memory grew a lot; the Census only grew a little.
2. In 2010 open source database software had severe limits on the maximum number of columns per table and NHGIS data has thousands of columns per dataset table. The backend storage didn't favor some of the operations we needed -- column store was just beginning its rise in popularity and was mostly only available commercially.
3. DuckDB offers a uniquely convenient set of features including columnar storage with tens of thousands of columns allowed in tables and great performance for our quality checking tasks.

With enough local memory and disk, a single database server solution was finally usable, and DuckDB had the features to make that solution easy to build.

With this approach, you can have a single database file. Deployment can be as easy as copying the file. Versioning data is as simple as versioning the database files. To formalize and automate versioning one could also put the database files into <a href="https://dvc.org/"> DVC</a>.

### Why not Sqlite?

DuckDB in many respects serves as a drop in replacement for Sqlite. It can persist data locally in a database file or in memory. As with Sqlite, you can embed DuckDB into your application to programmatically use its features as part of your app; there's no server, it is an in-process database. Like Sqlite, you can get DuckDB as a stand-alone binary. It's a virtually zero-setup tool -- just download it to where you want to work and get going. 

DuckDB focuses on flexibility and performance.  It can import from CSV, Parquet and JSON and export to CSV or Parquet, and do so quite fast.  DuckDB uses a physical layout for storing data by column rather than row as traditional RDBMS do; this allows for extremely fast aggregate functions. The huge number of columns per table allowed also makes it attractive for use with flat aggregated data like census or survey data tables. 

In addition to persisting data in DuckDB native format, it can treat external CSV and Parquet files as read-only tables. In many applications you don't need to formally import data at all. In addition, DuckDB can now query Sqlite format database files. Together, these features offer a very practical advantage for simple number crunching or data shaping jobs, as they don't need an import step at all.

In contrast, while we could have done most tasks with Sqlite (after rebuilding Sqlite with a higher max column value,) a number of steps would have been much slower and we wouldn't get the excellent CSV and Parquet import/export. Extracting data from the final database would have been a lot slower too.

#### Why not Spark?

Spark would also work, but at least in past versions, SparkSQL doesn't perform well on datasets wider than one thousand columns or so. That's actually one reason we developed a complicated format for our exported data that the Spark-driven extract engine reads.

In addition, DuckDB is a super simple, no-setup tool using standard SQL which you can use from the command line or directly from Python or Rust or C++. Spark is more complicated to set up on a developer box and to maintain in production. If you need to distribute work across many compute cluster nodes Spark makes sense, but when your servers are powerful enough to do the job on one node it's overkill and you pay a performance penalty for distributed computation. For data within DuckDB's grasp, queries run substantially faster than on Spark.

### Why not Polars?

We could have used Polars and it would have performed the steps quickly -- as fast or faster than DuckDB in most cases. It would not give a single database artifact, however. Also, we wanted to preserve the data transformations in accessible language (which is SQL for our researchers on NHGIS.) They have the ability to launch the DuckDB CLI tool and independently inspect the NHGIS data -- they already do so with the NHGIS metadata which we store in Sqlite. So again, it was a great fit.

In a decade from now it may be that any database engine can execute our SQL whereas a Python Polars program might be a little harder to understand and get running for a non-expert. That said, Polars is great and if you like dataframes it's going to serve you well.

## Conclusion

When the 2020 DHC census data was released in a legacy format, we really had to improvise to figure out an efficient way to ingest it into NHGIS. Thanks to advances in computing technology and database software, it's now feasible to load entire NHGIS datasets into a database for processing. Our choice of DuckDB as the particular database engine brought additional benefits of a stand-alone/embeddable database, a column-store backend, strong import/export support for Parquet and CSV, and an easily versionable and deployable database artifact. This project has created a more efficient, accessible, and sustainable process for performing NHGIS data ingest, which will benefit future IT and research staff and allows us to refocus efforts to the parts of the process which intrinsically require more of our attention. DuckDB has been a great tool to add to our toolbox, and we're looking forward to seeing where else we can apply it within our workflows. 
