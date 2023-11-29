---
author: ccd
title: How We Used DuckDB to Incorporate the Full 2020 U.S. Census into IPUMS-NHGIS
teaser: DuckDB made it possible for us to reshape the U.S. Census with pure SQL and a  sprinkling of classic UNIX   utilities
categories: Code
tags:
- Parquet
- NHGIS
---

## Introduction

Our NHGIS service takes public U.S. Census releases and makes them easy to use. Upon the recent 2020 full U.S. Census release last June, we discovered it didn't at all match our expected format -- something like the ACS format,  for which we were very prepared. Instead 2020 DHC (Demographic Household Census) was in the legacy 2010 format (mostly.) To quickly incorporate it into our <a href="http://nhgis.ipums.org"> NHGIS</a> system we had to improvise. 

What to do?  Unfortunately, we had abandoned development on a modern Rust and Python application to consume this 2010 format, believing it would never be produced again. (The ACS had been distributed in this format as well, when it got updated to a more modern arrangement, we dropped it in our "ingest" app.) Sadly, we couldn't simply reuse our process from 2010 either. In the end, <a href="https://duckdb.org"> DuckDB</a> was a key tool.


## Background

We update the <a href="http://nhgis.ipums.org"> NHGIS </a> with new Census data tables every decade, and with American Community Survey data every year. The Census makes their results publically available in a reasonable format, and we download it and reshape it into what we need to match all our existing data (what we term an "ingest" of the data.) 

The 2010 "ingest" and large ACS ingests  took considerable time. Many hours were spent literally reading and reshaping the data -- many days -- but as well time was needed for our experts to iteratively evaluate the data and the metadata needed to describe the data in our extract system. We had to consume the Census's metadata and transform it into our system which describes all aggregate Census data back to 1790. The process took several weeks.  

Some of this effort is irreducible:  The work is in finding quirks and mistakes in the Census published data and metadata and addressing them with code or hand-crafted data and metadata changes. Next, we look at the differences -- what has been added mostly -- since the last Census. New geographic locations appear, new questions get asked, new cross-tabulations published. All that new stuff has to get identified and incorporated into our NHGIS extract system and documentation.

## Changing Course

Reusing the 2010 scripts wouldn't have been ideal, but had it been possible we'd have done it.  Looking over the scripts we concluded they'd be quite difficult to update for 2020. At the same time, Reviving our dead branch with the legacy format support would be nearly as hard, and this instance really would be the last, so building it as solid reusable engineered software seemed a poor use of our resources. After all, the real goal was to get the Census into NHGIS, not write software that got  retired immediately.

Much of the original ingest was expressed in a series of Ruby `rake` tasks. This made sense as the tasks were derived from a Rails app. They used Active-Record models found in our NHGIS Rails web application. These are very easy to read and understand, and match the app. However, a lot of logic isn't close to the Active-Record modeling, there're a lot of input and output steps. The Ruby is 2010 vintage and is broken into many disconnected pieces. To top it all off, Ruby is pretty slow. The real problem, though, was that the system required a lot of complexity -- it had to work around the storage and compute limitations of our 2005 vintage hardware.

While learning about the workflow expressed in the old process, it dawned on me that the underlying transformations on the data tables looked like pretty straightforward operations in relational database terms. Could we boil things down to a series of `select`s and `update`s? That would be so nice. Preserving the data reshaping tasks as SQL would bring it much closer to  self-documenting for the future when we've all forgotten  what the heck was going on and it turns out we need to totally reprocess the 2010 and 2020  Census for  some reason I'm sure makes sense in the year 2029. 

The big picture transformation goes something like this:
* Combine/ union  state segment files into one file / table per segment 
* Join groups of segments into a smaller set of "datasets"
* Join dataset tables with a geography table
* Update each dataset table with richer geographic keys and label columns and remove redundant column data
* Export from each dataset into small tables representing a single geographic level 

Obviously in theory these map directly to `union`, `join` and `update`, maybe with some `select`s to create temporary tables.

IN 2010, the obstacles to executing some of the queries would have been twofold: The simple version of the schema would have required many thousands of columns (not something databases available to us could support,) and  more raw memory than available to us in 2010. Well, we have servers with 256GB and even one TB now and dozens of cores! And solid-state storage. And very fast ethernet between servers. It's so much better.

One additional issue we often face at ISRDI with our work sstyle and database servers is that we end up doing a lot of import, transform, export workflows and having a database server as a bottleneck slows this down. Plus, we may want many versions of the same "database" set of data at once. These are things expensive commercial products can accomadate, but we use open source tools. So while the query execution is something we could really use, the client server model wasn't a great fit. `DuckDB` is a stand-alone tool and doesn't concern itself with running a server.

## A Closer Look at  the 2020 DHC NHGIS Data Ingest

Census distributed data as one `.zip` file per state, and one for the whole nation. D.C. and Puerto Rico are included as "states," so there were fifty-three files in total.

When you unzip one of these files you get a set of "segment" files which are delimited text (not in UTF-8 as it turned out.) Every file has the same number of segments. A segment is a set of records comprising many actual published tables from the Census.  

NHGIS groups these tables into "datasets (broadly similar topical or geographic tables)"; datasets will be composed of one or more segments full of tables; they aren't split. In the 2020 DHC we create three datasets for NHGIS. The task is to combine these segment files, essentially joining them. 

All segment table files within a dataset have the same number of rows and each row represents the same geography within the dataset. Assuming they're sorted it's a simple join that can actually be accomplished with the UNIX `paste` utility (but you'll have to drop some redundant columns afterward.) Then we must concatenate the same dataset files from each state into one big table. Or, you could have concatenated the segment files from each state first and then join them into dataset files. 

Along with the segment files, Census provides a "geos.csv" file with one row per every geographic location in the 2020 Census. This has columns for the nested geographies; for instance a county is in a state, so the state column has a value and the county has one as well. There are many more geographic levels. Names of places are in this geography table and keys to link to the segment file rows. At some point this geography information must be joined to the segmented data tables. The "geos.csv" table data has as many rows as the longest segment table does, and more than many. It's a simple inner join that's needed.

Finally, we must extract all the column headings from all the segment files and use them as the names for the columns when we join the segments into dataset tables.

So those are the sorts of things we needed to do. If we use a database tool there would be essentially two broad phases: Cleaning + loading, then transforming + enhancing. Finally, if the prepared database can't be used for outside technical reasons, there's an export phase.

Looking at `DuckDB`'s home page:

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

NOTE: Since all the segments include all states and the nation, they have the same number of rows per dataset (this is crucial -- you can distinguish segment files that aren't in the same dataset sometimes by differences in row counts.)

All segment files will be in the same order as long as the concatenation process reads the state directories in the same order. 

An alternative cheap, low-memory way to make the datasets before loading into the database would be to use `paste` like so:
```
$ paste seg1.psv seg2.psv seg8.psv ... -d '|' > dataset_a.psv
```

Then the loading process would simply be one database `copy()` per dataset, no join needed. The database would need a robust CSV reader to support the large number of columns which might differ from the number of columns allowed in a internally created table. This turned out to be an issue on the version of DuckDB we used, so that's why we loaded segments into temporary tables and joined in the DB. 

This first part was all light-weight shell scripting. 

## Transforming

This part is all pure SQL.

The process is roughly:
* Join segment tables into dataset tables. In DHC there are three datasets.  Our segment files happen to all be in the same order so that the join is simple. All segment tables in the same dataset have the exact same number of rows. There are about 11 million in dataset "A", 2.5 million in dataset "B" and 38 thousand in dataset "C". The join runs fairly fast considering there are 3500 and 5700 columns in A and B. The memory foot print is pretty large. 
* Join the `geo` table to each of the dataset tables; this can be an inner join using STUSAB and LOGRECNO as the key on both sides -- the temp dataset tables will have columns like s01_STUSAB, s01_LOGRECNO and so on, indicating their origin on different segments. The values all match. These joins take some time and is one place where a row-oriented DBMS may have performed better.
* Drop redundant columns such as the segment variants of LOGRECNO and STUSAB; drop the temporary dataset tables and segment tables
* Add a US convenience column
* Add and compute the GISJOIN columns to each dataset. This is a rather complex update but with DuckDB it runs quite fast. So if we find we made a mistake it's cheap to redo.
* Add and compute the GN_GISJOIN columns on each dataset. Again, very fast.
* Add and compute the PUMA columns. These are "Public Use Microdata Area" values useful for matching geography to microdata published only with PUMA identifiers for geographic location. The update runs quickly and is easy to iterate on.

Finally, we use this database to check data against the metadata the Census gave us and make corrections; perhaps some geography shows up in the data that's not in the metadata, or labels don't quite match or many other things. We make spot corrections to data and metadata until they are ready to publish. 

Having this database in DuckDB format is a great advantage to the checking phase as the checks can run in split seconds instead of hours. Querying for specific values in a single column or collecting stats on a few columns is extremely fast with DuckDB compared to row-oriented databases. When we make corrections, the updates typiclly run very fast as well.

Here's a very basic example of a quality check query. This is launching the `DuckDB` cli tool and loading a database file (this is the 2020 DHC DB which is 44 GB,) and reading it off of shared storage. The server it's running on isn't particularly fast.
```shellccd@gp1:/pkg/ipums/istads/ingest/census_2020/dhc/05_data/db$ time duckdb-71 new_cleaned_tmp.nhgis.data.db  -c "select count(*) as areas, region from cph_2020_DHCa group by region"                                                                                                                                                                     
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

## Exporting

At this point we have three large dataset tables with column names contained in our NHGIS metadata. That means if you request variables SXYZ, ABC, from tables A1, A2 etc, the extract engine can easily form a query to select the right columns from the right dataset table by consulting the metadata which maps variable and Census tables to datasets.

Here's the database:
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

Here's the shape of the data. We have three tables with loads of columns. Geographic columns are on the left and on the right.
```SQL
D describe select * from cph_2020_DHCa limit 5;                                                                                                                             
┌─────────────┬─────────────┬─────────┬─────────┬─────────┬─────────┐                                                                                                       
│ column_name │ column_type │  null   │   key   │ default │  extra  │                                                                                                       
│   varchar   │   varchar   │ varchar │ varchar │ varchar │ varchar │                                                                                                       
├─────────────┼─────────────┼─────────┼─────────┼─────────┼─────────┤                                                                                                       
│ FILEID      │ VARCHAR     │ YES     │         │         │         │                                                                                                       
│ STUSAB      │ VARCHAR     │ YES     │         │         │         │                                                                                                       
│ SUMLEV      │ VARCHAR     │ YES     │         │         │         │                                                                                                       
│ GEOVAR      │ VARCHAR     │ YES     │         │         │         │                                                                                                       
│ GEOCOMP     │ VARCHAR     │ YES     │         │         │         │                                                                                                       
│ CHARITER    │ VARCHAR     │ YES     │         │         │         │                                                                                                       
│ CIFSN       │ VARCHAR     │ YES     │         │         │         │                                                                                                       
│ LOGRECNO    │ INTEGER     │ YES     │         │         │         │                                                                                                       
│ GEOID       │ VARCHAR     │ YES     │         │         │         │                                                                                                       
│ GEOCODE     │ VARCHAR     │ YES     │         │         │         │                                                                                                       
│ REGION      │ VARCHAR     │ YES     │         │         │         │                                                                                                       
│ DIVISION    │ VARCHAR     │ YES     │         │         │         │                                                                                                       
│ STATE       │ VARCHAR     │ YES     │         │         │         │                                                                                                       
│ STATENS     │ VARCHAR     │ YES     │         │         │         │                                                                                                       
│ COUNTY      │ VARCHAR     │ YES     │         │         │         │                                                                                                       
│    ·        │    ·        │  ·      │    ·    │    ·    │    ·    │                                                                                                       
│    ·        │    ·        │  ·      │    ·    │    ·    │    ·    │                                                                                                       
│    ·        │    ·        │  ·      │    ·    │    ·    │    ·    │                                                                                                       
│ GN_sd_sec   │ VARCHAR     │ YES     │         │         │         │                                                                                                       
│ GN_sd_uni   │ VARCHAR     │ YES     │         │         │         │                                                                                                       
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
│ GEOVAR      │ VARCHAR     │ YES     │         │         │       │                                                                                                         
│ GEOCOMP     │ VARCHAR     │ YES     │         │         │       │                                                                                                         
│ CHARITER    │ VARCHAR     │ YES     │         │         │       │                                                                                                         
│ GEOID       │ VARCHAR     │ YES     │         │         │       │                                                                                                         
│ REGION      │ VARCHAR     │ YES     │         │         │       │                                                                                                         
│    ·        │    ·        │  ·      │    ·    │    ·    │   ·   │                                                                                                         
│    ·        │    ·        │  ·      │    ·    │    ·    │   ·   │                                                                                                         
│    ·        │    ·        │  ·      │    ·    │    ·    │   ·   │                                                                                                         
│ PCT16_006   │ INTEGER     │ YES     │         │         │       │                                                                                                         
│ PCT17B_021  │ INTEGER     │ YES     │         │         │       │                                                                                                         
│ PCT18C_049  │ INTEGER     │ YES     │         │         │       │                                                                                                         
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
│ STUSAB      │ VARCHAR     │ YES     │         │         │       │                                                                                                         
│ SUMLEV      │ VARCHAR     │ YES     │         │         │       │                                                                                                         
│ GEOVAR      │ VARCHAR     │ YES     │         │         │       │                                                                                                         
│ CHARITER    │ VARCHAR     │ YES     │         │         │       │                                                                                                         
│ LOGRECNO    │ INTEGER     │ YES     │         │         │       │                                                                                                         
│ REGION      │ VARCHAR     │ YES     │         │         │       │                                                                                                         
│    ·        │    ·        │  ·      │    ·    │    ·    │   ·   │                                                                                                         
│    ·        │    ·        │  ·      │    ·    │    ·    │   ·   │                                                                                                         
│    ·        │    ·        │  ·      │    ·    │    ·    │   ·   │                                                                                                         
│ AITSCC      │ VARCHAR     │ YES     │         │         │       │                                                                                                         
│ PCO1_016    │ INTEGER     │ YES     │         │         │       │                                                                                                         
│ PCO2_011    │ INTEGER     │ YES     │         │         │       │                                                                                                         
│ PCO4_004    │ INTEGER     │ YES     │         │         │       │                                                                                                         
│ PCO4_008    │ INTEGER     │ YES     │         │         │       │                                                                                                         
│ PCO6_038    │ INTEGER     │ YES     │         │         │       │                                                                                                         
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

In principle we could serve our extract system with this database directly, or export each of these dataset tables as three big Parquet files and serve the extract system from those. However, our existing vast repository of NHGIS data has another more complex layout (still  Parquet) served by Spark. We'd have to convert all that to the new simpler format, then rewrite the extract engine.

So we have an export step: Use DuckDB `copy()` to export to CSV files in a hierarchical structure by geography. Or we can use a small Python script that uses a DuckDB Python library and passes queries matching each geographic slice to Polars and has Polars write it out as CSV (this can be somewhat faster and more reliable on very large queries like block groups and blocks.) The Polars approach highlights another nice feature of working with `DuckDB`: You can get query results as an Arrow table and pass that to Polars, getting the best of both tools.

This file structure is consumed by our old Parquet format producing tool to make data compatible with the existing Spark NHGIS extract engine.

### Why DuckDB

Our story with `DuckDB`  has three pillars:
1. An in-process database solution is now technically feasible: Since the last U.S. Census in 2010, computer permanent storage and memory  grew a lot; the Census only grew a little.
2. In 2010 open source database software had severe limits on the maximum number of columns per table (NHGIS data has thousands of columns per "dataset" table); the backend storage didn't favor some of the operations we needed -- column store was just beginning its rise in popularity and was mostly only available commercially.
3. `DuckDB` offers a uniquely convenient set of features including Parquet support and columnar storage with tens of thousands of columns allowed in tables and great performance for our quality checking tasks.

With enough local memory and disk, a single database server solution was finally reasonable, and `DuckDB` had the features to make that solution easy to build.

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

In a decade from now it may be that any database engine can execute our SQL whereas a Python Polars program might be a little harder to understand and get running. That said, Polars is great and if you like dataframes it's going to serve you well.


### Other advantages

With `DuckDB` you can have a single database file. Deployment can be as easy as copying the file; versioning data is as simple as versioning the database files. Certainly there are more sophisticated ways to version data but again it's dead simple for the simple cases.  To formalize and automate versioning one could put the database files into <a href="https://dvc.org/"> DVC</a>.



