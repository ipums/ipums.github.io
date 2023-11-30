---
author: ccd
title: How We Used DuckDB to Incorporate the Full 2020 U.S. Census into IPUMS-NHGIS
teaser: DuckDB made it possible for us to reshape the U.S. Census with pure SQL and a  sprinkling of classic UNIX   utilities
categories: Code
tags:
- Parquet
- SQL
- DuckDB
- NHGIS
---

TODO
done 0. Show main ingest steps and where data transformation fits.
done 1. show file structure from Census download
done 2. Make point that all NHGIS  datasets are composed of entire segments
part 3. Show database state immediately after load
done 4. Show sample SQL for transformation
5. Clean up final database state table describes
done 6. Export data iis also a geography harmonization step: We map the Census SUMLEV column value (which is unharmonized but fairly consistent) to NHGIS geography levels expressed in a directory  structure.
done 7. Show a snippet of the export SQL


## Introduction

Our IPUMS-NHGIS service takes public U.S. Census releases and makes them easy to use. The U.S. Census publishes statistics from every Census and the annual American Community Survey. IPUMS NHGIS makes this information easier to navigate: Users can request data on specific topics, from specific times and places. The stats are available for different geographic levels: States, counties, tracts and even city blocks (there are many more.) When you hear about Census stats for your state or county or city  it's probably available from NHGIS. In addition to making the information easier to find, NHGIS makes the data comparable across many decades so you can more easily look at change over time.

Behind the scenes, IPUMS has to get the original form of the data from the public Census publication and transform it, along with metadata  provided by Census (labels of locations, names of tables and so forth.) The metadata helps us match up topics and labels to prior Censuses.  We download and reshape the data to match all our existing data. NHGIS consumes the Census's metadata and data, and transforms it into the NHGIS schema, which describes all aggregate U.S. Census data back to 1790.

The process of receiving data and transforming it into something we can use to drive our <a href="http://nhgis.ipums.org"> nhgis.org</a> website  is partly automated but always involves some amount of manual adjustment to data and metadata to "ingest" the latest Census or survey.

There are a few steps, all of which may be performed mostly automatically or mostly manually if necessary:

1. Download from Census
2. Prepare NHGIS "metadata" description of our NHGIS version of the Census
3. Extract and transform Census data into our format suitable for driving our NHGISdata extract
 system.
4. Evaluate and validate, going back to steps 2 and 3 when necessary until  reaching  a good quality release.
5. Publish to NHGIS.

 Most of this article is concerned with step 3, the data transformation. 
 
 ## The Problem
 
 Upon the recent 2020 full U.S. Census release last June, we discovered the public data didn't at all match our expected format -- something like the ACS format,  for which we were very prepared with a lot of automation. Instead 2020 DHC (Demographic Household Census) was in the legacy 2010 format (mostly.) To quickly incorporate it into our <a href="http://nhgis.ipums.org"> NHGIS</a> system we had to improvise.  `DuckDB` ended up as a valuable tool, letting us do our 2020 ingest in a completely different way from the 2010 ingest.
 
If we had extended our modern ingest software to support the 2020 format,  it would be the first and last time it got used. Building highly-engineered reusable software seemed a poor use of our resources. After all, the real goal was to get the Census into NHGIS, not write software that got  retired immediately.

Last time we did a full census ingest for 2010, it took considerable time. Many hours were spent literally reading and reshaping the data -- many days -- but as well time was needed for our experts to iteratively evaluate the data and the metadata needed to describe the data in our extract system.  The process took several weeks.  The data transformation work was slow,  and if that aspect could be improved we'd be able to focus more on the parts that are necessarily not automatable.

Some of this effort is irreducible:  The work is in finding quirks and mistakes in the Census published data and metadata and addressing them with code or hand-crafted data and metadata changes. Next, we look at the differences -- what has been added mostly -- since the last Census. New geographic locations appear, new questions get asked, new cross-tabulations published. All that new stuff has to get identified and incorporated into our NHGIS extract system and documentation.

## Understanding the Data Transformations from Census to NHGIS

While learning about the 2010 workflow which handled a similar to 2020 data format, it dawned on me that the underlying transformations on the data tables looked like pretty straightforward operations in relational database terms. Our past system in 2010 employed a series of scripts to transform the data. But what they were doing was pretty much translatable to relational database terms.

In the big picture, the data transformations go in the following order. Not all need to be done within a database, but could be in principle:
* Concatenate / union  state "segment" files into one file / table per segment (I'll explain "segments" more shortly).  this may be simple enough to use `cat` to accomplish.
* Join groups of segments into a smaller set of "datasets" This is essentially grouping groups of Census tables into broad topics.
* Join dataset tables with a geography table
* Update each dataset table with richer geographic keys and label columns and remove redundant column data
* Export and "harmonize" from Census to NHGIS geographies:  Select from each dataset into small tables representing a single NHGIS harmonized geographic level 

In theory these activities map directly to `select` with `union`, `join` and `update`, maybe with some `create table from...`  to create temporary tables. 

Could we really boil things down to a series of SQL statements? That would be so nice. Preserving the data reshaping tasks as SQL would bring it much closer to  a self-documenting procedure for the future when we've all forgotten  what the heck was going on and it turns out we need to totally reprocess the 2010 and 2020  Census for  some reason I'm sure makes sense in the year 2029. 

The decennial census data presents challenges the annual ACS does not: It has "block group" data and "block" data, meaning we have some records for every block, about 11 million. That may not sound especially large except that these tables can have  thousands of columns and we need to do some checking on them all -- or did in the past anyhow. Some of the checks were format-specific and `DuckDB` removed the need for them.

IN 2010, the obstacles to executing some of the queries would have been twofold: The simple version of the schema would have required many thousands of columns (not something databases available to us could support,) and  more raw memory than available to us in 2010. Well, we have servers with 256GB and even one TB now and dozens of cores! And solid-state storage. And very fast ethernet between servers. It's so much better.

Another reason we hadn't used a database tool earlier was that our work style requires that we do a lot of import, transform, export workflows and having a database server as a bottleneck slows this down and prevents parallel workflows. We may want many versions of the same "database" set of data at once. These are things expensive commercial products can accomadate, but we use open source tools. So while the query execution is something we could have really used in the past, the client server model wasn't a great fit. `DuckDB` is a stand-alone tool and doesn't concern itself with running a server.

## A Closer Look at  the 2020 DHC NHGIS Data Ingest

Census distributed data as one `.zip` file per state, and one for the whole nation. D.C. and Puerto Rico are included as "states," so there were fifty-three files in total.

When you unzip one of these files you find a set of dozens of "segment" files which are delimited text (not in UTF-8 as it turned out.) 

Here's a sample:
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

We `gzip` all the state files to save space. These are pipe-delimited files and `DuckDB` can uncompress and parse them with its CSV loader.

Every state has the same number of segments. A segment is a set of records comprising many actual published Census tables from the Census.  

NHGIS groups these Census tables into NHGIS "datasets (broadly similar topical or geographic tables.)"; In the 2020 DHC we create three datasets for NHGIS.Luckily our "datasets" didn't split segments -- all segments belonged to one and only one NHGIS dataset.  The task was to combine these segment files, essentially joining them. 

All segment table files within a dataset have the same number of rows and each row represents the same geography within the dataset. Assuming they're sorted, it's a simple join that can actually be accomplished with the UNIX `paste` utility, a really neat low memory trick if you can pull it off.  (But you'll have to drop some redundant columns afterward.) Then we must concatenate the same dataset files from each state into one big table. 

Or, you could have concatenated the segment files from each state first and then join them into dataset files afterward, which is what we did.

We took these `cat` results for every state and loaded them into `DuckDB` and produced temporary "segment" tables.

Along with the segment files, Census provides a "geos.csv" file with one row per every geographic location in the 2020 Census. This has columns for the geographies; for instance a county is in a state, so the state column has a value and the county has one as well. There are many more geographic levels. Names of places are in this geography table and keys to link to the segment file rows. At some point this geography information must be joined to the segmented data tables. The "geos.csv" table data has as many rows as the longest segment table does, and more than many. It's a simple inner join that's needed. We did this inside the database.

Finally, we must extract all the column headings from all the segment files and use them as the names for the columns when we join the segments into dataset tables. 

Once joined, we then need to enhance some of the geography information to provide our "GISJOIN" geographic linking keys and add "PUMA" values and some other updates and enhancements before the datasets are ready to use in NHGIS.

To make the prepared datasets usable by the NHGIS public site, we have to export the datasets to CSV files in a particular structure matching the NHGIS universal geography scheme. 

So those are the sorts of things we needed to do. If we use a database tool there would be essentially two broad phases: Cleaning + loading, then transforming + enhancing. With luck the export is an afterthought.

Looking at `DuckDB`'s <a href="http://duckdb.org"> home page</a>:

	When to use DuckDB 
	• Processing and storing tabular datasets, e.g., from CSV or Parquet files
	• Interactive data analysis, e.g., join & aggregate multiple large tables
	• Concurrent large changes, to multiple large tables, e.g., appending rows, adding/removing/updating columns
	• Large result set transfer to client

Seems like a perfect match. 


## Loading

To initially load the DHC data into a database we first :
* Make files to serve as the headers for the pipe-delimited segment files provided by Census 
* Concatenate all the state + the nation files for each segment into consolidated files, one per segment: Use `cat` for this.
* Ensure the input files use the correct character encoding (in our case they had to get encoded from Windows 1252 to UTF-8.)
* In DuckDB, load those segment files in with "copy()" (similar to  Postgres ) -- there are similar functions in other database systems.
* Now we have an initial database and are ready to join the temporary segment tables..

All segment files will be in the same order as long as the concatenation process reads the state directories in the same order.  An alternative cheap, low-memory way to join the datasets before loading into the database would be to use `paste` like so:
```
$ paste seg1.psv seg2.psv seg8.psv ... -d '|' > dataset_a.psv
```

Then the loading process would simply be one database `copy()` per dataset, no join needed. The database would need a robust CSV reader to support the large number of columns which might differ from the number of columns allowed in a internally created table. This turned out to be an issue on the version of DuckDB we used, so that's why we loaded segments into temporary tables and joined in the DB. 

The concatenation was like this:

For instance
```shell
cat S44_heading.psv.gz /tmp/2020dhc_data/segmented_states/tx2020.dhc/tx000442020.dhc.gz /tmp/2020dhc_data/segmented_states/nc2020.dhc/nc000442020.dhc.gz /tmp/2020dhc_data/segmented_states/co2020.dhc/co000442020.dhc.gz /tmp/2020dhc_data/segmented_states/nv2020.dhc/nv000442020.dhc.gz
...
/tmp/2020dhc_data/segmented_states/nv2020.dhc/segment_42.gz
	
```
for every state, on every segment file up to segment 44. We end up with one directory per state with a complete set of segment files in each.

And here is a sample of the loading script:
```shell
ccd@build:/tmp/2020dhc_data/work$ head 02_load_into_duckdb.sh                                                                                                                                                      
duckdb-71 new_cleaned_tmp.nhgis.data.db -s "PRAGMA memory_limit='100GB';create table geo as select * from read_csv_auto('geou.psv', header=true, sep='|', sample_size=-1,all_varchar=1);alter table geo alter LOGRECNO type integer"                                                                                                                                                                                                  
duckdb-71 new_cleaned_tmp.nhgis.data.db -s "PRAGMA memory_limit='100GB';create table S01 as select * from read_csv_auto('segment_S01.psv.gz', header=true, sep='|')"                                               
duckdb-71 new_cleaned_tmp.nhgis.data.db -s "PRAGMA memory_limit='100GB';create table S02 as select * from read_csv_auto('segment_S02.psv.gz', header=true, sep='|')"                                               
duckdb-71 new_cleaned_tmp.nhgis.data.db -s "PRAGMA memory_limit='100GB';create table S03 as select * from read_csv_auto('segment_S03.psv.gz', header=true, sep='|')"                                               
duckdb-71 new_cleaned_tmp.nhgis.data.db -s "PRAGMA memory_limit='100GB';create table S04 as select * from read_csv_auto('segment_S04.psv.gz', header=true, sep='|')"                                               
duckdb-71 new_cleaned_tmp.nhgis.data.db -s "PRAGMA memory_limit='100GB';create table S05 as select * from read_csv_auto('segment_S05.psv.gz', header=true, sep='|')"                                               
duckdb-71 new_cleaned_tmp.nhgis.data.db -s "PRAGMA memory_limit='100GB';create table S06 as select * from read_csv_auto('segment_S06.psv.gz', header=true, sep='|')"                                               
duckdb-71 new_cleaned_tmp.nhgis.data.db -s "PRAGMA memory_limit='100GB';create table S07 as select * from read_csv_auto('segment_S07.psv.gz', header=true, sep='|')"                                               
duckdb-71 new_cleaned_tmp.nhgis.data.db -s "PRAGMA memory_limit='100GB';create table S08 as select * from read_csv_auto('segment_S08.psv.gz', header=true, sep='|')"                                               
duckdb-71 new_cleaned_tmp.nhgis.data.db -s "PRAGMA memory_limit='100GB';create table S09 as select * from read_csv_auto('segment_S09.psv.gz', header=true, sep='|')"                                               
ccd@build:/tmp/2020dhc_data/work$  

```

This first part was all light-weight shell scripting. 

We now have a database consisting of tables matching the concatenated segment files so that there are tables like "s01", "s02" ... "s043".

## Transforming

This part is all pure SQL. However, we can invoke `DuckDB` as a command line tool against the working database file, much like `Sqlite`. So we can still accomplish many tasks with a generated shell script that includes the query we want to execute.

Here is each transformation step with sample SQL

* Join segment tables into dataset tables. NHGIS groups DHC data tables (of which segments have a number)  into three "datasets."  Our segment files happen to all be in the same order so that the join is simple. All segment tables in the same dataset have the exact same number of rows. There are about 11 million in dataset "A", 2.5 million in dataset "B" and 38 thousand in dataset "C". The join runs fairly fast considering there are 3500 and 5700 columns in A and B. The memory foot print is pretty large. 

The joins were done like this:
```shell
duckdb-71 new_cleaned_tmp.nhgis.data.db -s  "create index S16_idx on S16(S16STUSAB,S16LOGRECNO);create index S17_idx on S17(S17STUSAB,S17LOGRECNO);drop table if exists tmp_dataset_cph_2020_DHCc;PRAGMA force_index_join;create table tmp_dataset_cph_2020_DHCc as select * from S16 left join S17 on S16.S16STUSAB = S17.S17STUSAB and S16.S16LOGRECNO = S17.S17LOGRECNO"

```
This is for "Dataset C" only, the smallest one.

* Join the `geo` table to each of the dataset tables; this can be an inner join using STUSAB and LOGRECNO as the key on both sides -- the temp dataset tables will have columns like s01_STUSAB, s01_LOGRECNO and so on, indicating their origin on different segments. The values all match. These joins take some time and is one place where a row-oriented DBMS may have performed better.
```sql
create table dataset_2020_DHCc as select * from geo inner join tmp_dataset_2020_DHCc on geo.STUSAB =tmp_dataset_2020_DHCc.S16STUSAB and geo.LOGRECNO = tmp_dataset_2020_DHCc.S16LOGRECNO"
```
We have now created the final dataset tables, but they still need some `update`s.

* Drop redundant columns such as the segment variants of LOGRECNO and STUSAB; drop the temporary dataset tables and segment tables

For example:
```sql
delete from cph_2020_DHCa where STUSAB = 'US' and SUMLEV in ('040', '050', '060', '070', '155', '160', '170', '172', '230', '500', '610', '620');
```
This is slightly slower than it would be on a row-store DB.

* Add a US convenience column
```sql
duckdb-71 new_cleaned_tmp.nhgis.data.db -s "--
-- Add the US convenience column to datasets.;alter table cph_2020_DHCa  add column  US varchar;update cph_2020_DHCa set  US=1 where SUMLEV=10;alter table cph_2020_DHCb  add column  US varchar;update cph_2020_DHCb set  US=1 where SUMLEV=10;alter table cph_2020_DHCc  add column  US varchar;update cph_2020_DHCc set  US=1 where SUMLEV=10"
```
This is very fast because of `DuckDB`'s column store.

* Add and compute the GISJOIN columns to each dataset. This is a rather complex update but with DuckDB it runs quite fast. So if we find we made a mistake it's cheap to redo.

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

Finally, we use this database to check data against the metadata the Census gave us and make corrections; perhaps some geography shows up in the data that's not in the metadata, or labels don't quite match or many other things. We make spot corrections to data and metadata until they are ready to publish. 

Having this database in DuckDB format is a great advantage to the checking phase as the checks can run in split seconds instead of hours. Querying for specific values in a single column or collecting stats on a few columns is extremely fast with DuckDB compared to row-oriented databases. When we make corrections, the updates typiclly run very fast as well.

Here's a very basic example of a quality check query. This is launching the `DuckDB` cli tool and loading a database file (this is the 2020 DHC DB which is 44 GB,) and reading it off of shared storage. The server it's running on isn't particularly fast.
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

## The finalized Database

After transforming the database it looks slike this:


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
We used `DuckDB` 0.7.1 for most of our work;  0.9.2 is available now and you should probably use that.

Here's the shape of the data. We have three tables with loads of columns. Geographic columns are on the left.

```SQL
D describe select * from cph_2020_DHCa limit 5;                                                                                                                             
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

```shell
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

```shell
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

## Exporting

You might think that  we are now done, and could serve our extract system with this database directly, or export each of these dataset tables as three big Parquet files and serve `nhgis.ipums.org` from those. However, our existing vast repository of NHGIS data has another more complex layout that conveys important information and also is compatible with Spark.   The export arranges the data into a structure representing the NHGIS geography scheme which isn't contained in our prepared database -- we only have the 2020 specific geography from Census, not our universal coding.

So we have an export step: Use DuckDB `copy()` to export to CSV files in a hierarchical structure by geography. 

The export queries look like this
```sql
-- Export data to files for each sumlev-geocomp combination for each dataset.;
copy (select * from cph_2020_DHCa where geocomp='00' and sumlev = '010' and not (STUSAB = 'US' and SUMLEV in ('040', '050', '060', '070', '155', '160', '170', '172', '230', '500', '610', '620')) order by STUSAB, LOGRECNO ) to '/tmp/2020dhc_data/work/export_data/cph_2020_dhca/2020/nation_010/ge00_file.csv' (HEADER, DELIMITER '|');
copy (select * from cph_2020_DHCa where geocomp='01' and sumlev = '010' and not (STUSAB = 'US' and SUMLEV in ('040', '050', '060', '070', '155', '160', '170', '172', '230', '500', '610', '620')) order by STUSAB, LOGRECNO ) to '/tmp/2020dhc_data/work/export_data/cph_2020_dhca/2020/nation_010/ge01_file.csv' (HEADER, DELIMITER '|');

```
There's one export for every geography and dataset (and "geocomp" which we don't need to get into.) This works but `DuckDB` has some trouble on the largest geographies. Since we're generating the queries in a Python script we can break the ones the largest result sets into chunks and call them separately. An even better solution is to pass the in-memory results of the queries to `Polars` to export to CSV. Here we used the Python `DuckDB` library along with Polars to help export data quickly.

(This is simplified)
```Python
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

Notice how we took the result of the query and passed it to `Polars` to actually write the CSV? The results are in Arrow and can be passed to Polars.  `DuckDB` + `Polars` can be a powerful combination.

In the end we have a directory structure organized by geography.

We hand off this file structure to our Parquet format producing tool to make data compatible with the existing Spark NHGIS extract engine. While `DuckDB` can export directly to Parquet, our format requires some particular nested map type columns.

### Why DuckDB

Our story with `DuckDB`  has three pillars:
1. An in-process database solution is now technically feasible: Since the last U.S. Census in 2010, computer permanent storage and memory  grew a lot; the Census only grew a little.
2. In 2010 open source database software had severe limits on the maximum number of columns per table (NHGIS data has thousands of columns per "dataset" table); the backend storage didn't favor some of the operations we needed -- column store was just beginning its rise in popularity and was mostly only available commercially.
3. `DuckDB` offers a uniquely convenient set of features including Parquet support and columnar storage with tens of thousands of columns allowed in tables and great performance for our quality checking tasks.

With enough local memory and disk, a single database server solution was finally usable, and `DuckDB` had the features to make that solution easy to build.

### Why not Sqlite? Why not Spark?

`DuckDB` in many respects serves as a drop in replacement for `Sqlite`: It can persist data locally in a database file or in memory. As with `Sqlite`, you can embed `DuckDB` into your application to programmatically use its features as part of your app; there's no server, it is an in-process database. Like `Sqlite`, you can get `DuckDB` as a stand-alone binary. It's a virtually zero-setup tool -- just download it to where you want to work and get going. 

`DuckDB` focuses on flexibility and performance.  It can import from CSV, Parquet and JSON and export to CSV or Parquet, and do so quite fast.  `DuckDB` uses a physical layout for storing  data by column rather than row as traditional RDBMS do; this allows for extremely fast aggregate functions.  The huge number of columns per table allowed also makes it attractive for use with some machine generated datasets like sensor data and flat aggregated data and census or survey data tables. 

In addition to persisting data in DuckDB native format, it can treat external CSV and Parquet files as read-only tables. In many applications you don't need to formally import data at all. In addition, `DuckDB` can now query `Sqlite` format database files. Together, these features   offer a very practical  advantage for simple number crunching or data shaping jobs:  They don't need an import step at all.

In contrast, while we could have done most tasks with Sqlite (after rebuilding Sqlite with a higher max column value,) a number of steps would have been much slower and we wouldn't get the excellent CSV and parquet import/export. Extracting data from the final  database would have been a lot slower.

#### Why not Spark?

Spark would work, but at least in past versions, SparkSQL doesn't perform well on datasets wider than one thousand columns or so. That's actually one reason we developed a complicated format for our  exported data that the Spark driven extract engine reads.

In addition, `DuckDB` is a super simple, no setup tool using standard SQL which you can use from the command line or directly from Python or Rust or C++. Spark is just more complicated to set up on a developer box, and what's the point? If you need to distribute work across many compute cluster nodes Spark makes sense, but when your servers are powerful enough to do the job on one node it's overkill. 

For data  within `DuckDB`'s grasp, queries run substantially faster than on Spark.

### Why not  Polars?

We could have used Polars pretty well and  it would have performed the steps quickly -- as fast or faster than  DuckDB in most cases. It would not give a single database artifact. Also, we wanted to preserve the data transformations in accessible language (SQL is that for our researchers on NHGIS.)  They have the ability to launch the `DuckDB` CLI tool and independently inspect the NHGIS data -- they already do so with the NHGIS metadata which we store in Sqlite. So again, it was a great fit.

In a decade from now it may be that any database engine can execute our SQL whereas a Python Polars program might be a little harder to understand and get running for a non-expert. That said, Polars is great and if you like data-frames it's going to serve you well.

### Other advantages

With `DuckDB` you can have a single database file. Deployment can be as easy as copying the file; versioning data is as simple as versioning the database files. Certainly there are more sophisticated ways to version data but again it's dead simple for the simple cases.  To formalize and automate versioning one could put the database files into <a href="https://dvc.org/"> DVC</a>.



