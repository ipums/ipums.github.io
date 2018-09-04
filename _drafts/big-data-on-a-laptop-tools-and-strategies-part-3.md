---
title: "Big Data on a Laptop: Tools and Strategies - Part 3"
comments: true
teaser: In our final installment of this series, we show how to harness all the compute cores available on your local system, turning it into a personal cluster for parallel computing.
author: ccd
categories:
  - Code 
  - Data
tags:
 - Python
 - CSV
 - Parquet
 - C++
 - Spark
 - Data Science
---

# Introduction

Doing analysis on big data doesn't have to mean mastering enterprise Big Data tools or accessing hundred-node compute clusters in the cloud. In this series, we'll find out what your humble laptop can do with the help of modern tools first.

In the first part of this series, we looked at how to get out of Excel and work with big datasets more effectively. In the second part, we introduced Parquet to achieve better performance and scalability. In today's final part, we will discuss how to harness the power of all of the cores of your system to do work in parallel.

#  Spark: Use Parquet, Harness all the Cores on Your System and Beyond

Spark is a  distributed data processing engine supporting batch, iterative, and streaming types of workloads.  Learning to use <a href="https://spark.apache.org/">Apache Spark</a> can be intimidating, but don't worry, getting started is pretty easy once you have a working installation.   Learning everything about the Spark API  and how to exploit Spark on a cluster as well as mastering performance tuning is a big undertaking; here I'm showing that limited but very useful Spark applications are simple to create and run.

You can start Spark in "local" mode requiring next to no configuration. You can run interactively with Python, Scala or even Ruby. When your data out grows your local machine you can put your Spark application onto a larger machine or even a cluster of machines, and as long as you move the data to be reachable by the new environment the application should function identically, except faster.

### The Spark API, Very Briefly

Spark was written in Scala -- a JVM language -- and provides a Java API in addition to the Scala API. There's also an extensive Python API, but a few things were missing from it until recent versions of Spark. With the most recent versions of Spark there's a first class Python API and you may write fully featured Spark programs in Python now as well as Java and Scala. The main disadvantage to Python is simply poor performance as a language compared to Java and Scala. In many cases, where Python acts mainly as glue code, the difference is negligible since most data processing load  gets handled by the Spark libraries, not Python.

Spark supports "Spark SQL", and user defined functions callable from Spark SQL, so you can rely on your SQL skills if that makes the most sense.  Spark provides other ways to manipulate data as well. 

The primary data abstraction in Spark is the  RDD (resilient Distributed Datasets.)  An RDD distributes data across nodes in a Spark cluster so that  a Spark application can access the data in parallel, running on multiple cores and machines. You can transform or take actions on RDDs: a transformation returns a new RDD(they are immutible)  resulting from applying some function to it; actions load, save or print the RDD. An RDD can get created from loading data from all sorts of external data sources, structured or unstructured: JSON, text, CSV, Parquet; you can programmatically create RDDs as well.

DataFrame is a higher level API for presenting data in a table-like form . Like RDDs DataFrames are immutible and distributed. The DataFrame API is part of the Dataset API  which collects data into rows of structured or unstructured data; there's a strongly typed data API available in Scala and Java called "Dataset" and also the "DataFrame" API available in all supported languages. Results of Spark SQL queries can be returned and further processed using the DataFrame API.

### Running Spark on Your Laptop

You can set up Spark on Linux by downloading it and ensuring you have Java 8. If you're on Windows 10 I recommend using WSL (Windows Subsystem for Linux.) You can install Java there and PySpark (as I'll show soon.) Spark has native Windows support as well. Nothing wrong with using Windows except that most examples you'll find use Linux.

If you use Spark to perform  a simple aggregation on relatively large data with many columns you will notice slightly worse performance compared to directly using Parquet with C++ or with the PyArrow library. However, using Spark for these sorts of queries is pretty easy and you could develop an application you want to eventually put on a powerful cluster.  And, of course, you get full SQL query support, and if you want to code your application in Java or Scala, Spark is the obvious choice.

Unlike the previous Parquet examples with PyArrow, you can use a multicore system for more than just reading columns in parallel: You can take full advantage of all the cores on your machine for computation. Anything you script with the Spark API will make use of all cores it's allowed to by its configuration (you can configure Spark to limit the number of cores and amount of memory used per worker.)  For instance you could run a map-reduce job using all four or eight cores on your local computer. Assuming you have enough RAM to hold the data involved in the computation you'll see a big speed-up. You could turn around and immediately use the result of the map-reduce job in another data processing stage, as the data will be in memory if there's room.

Spark imposes a bit of overhead due to its need to coordinate multiple nodes; in "local" mode this overhead is small. By the time you need to reach for a Spark cluster the overhead, given the size of the data, should not matter, except when sub-second response times are critical to your application. In that case you'll need to craft the external data files for best performance (see the "Spark Friendly Parquet" section) as well as picking the right configuration for Spark. 

In general, Spark is not meant  to serve real-time queries, though it comes close and is good enough for many uses. I'll briefly discuss two solutions  for serving up  extremely fast queries that will work on your laptop as well as larger scale hardware at the end of this post.


## Quick Setup 

Go to  the Apache Spark <a href="https://spark.apache.org/downloads.html"> downloads </a> page, and select your version (I'll use the latest as of this writing.) 

``` 
 #  Untar with 
 tar -xf  spark-2.3.1-bin-hadoop2.7.tgz
 
 #Now before anything else, set your SPARK_HOME directory. Assuming you put Spark in #/opt/spark/current:

 export  SPARK_HOME=/opt/spark/current
 ```

##  Spark Programs in Python

Alternatively, if you want to work only in Python you may install with 'pip':
```
pip install pyspark
```

Then you can run 'pyspark' and begin an interactive session. Beware if you already have a SPARK_HOME set; PySpark will try to use that version of Spark instead of the version it downloaded as part of PySpark.

Otherwise, if you downloaded Spark from spark.apache.org, go to  the 'bin' directory in your Spark installation and run the 'pyspark.sh' program located there. 

Once you get your PySpark shell up, you  can read Parquet data directly (it is the default format for Spark SQL, though others are possible) and get the result as a DataFrame. 

The "extract65.parquet" dataset is the same one I used in the previous "Big Data..." post: It contains individual person records from samples of the U.S. Census for years 1960-2016  and has columns ffull of IPUMS variables concerning commuting, work, industry and home ownership.

	$ pyspark
	
	>>> df=spark.sql("select count(*) from parquet.`./extract65.parquet`")
	>>> df.show() 
	+-----------+
	|count(YEAR)|
	+-----------+
	|   17634469|
	+-----------+

The query isn't actually executed until you call "show()".

You can read data into a data frame:

	>>> df_extract65 = spark.read.load("./extract65.parquet")

Then programmatically work with the data in SQL:

	>>> df_extract65.createOrReplaceTempView("travel")
		
	>>> df_commute = spark.sql("select YEAR,int(sum(TRANTIME*PERWT)/60) as hours_commuting from travel where YEAR> 1980 group by YEAR order by YEAR")
	
See the schema for the data frame:
	
	>>> df_commute
	DataFrame[YEAR: int, hours_commuting: int]
	
See the query results:
	
	>>> df_commute.show()
	+----+---------------+
	|YEAR|hours_commuting|
	+----+---------------+
	|1990|       41527560|
	|2000|       52791989|
	|2010|       55293482|
	|2016|       63408548|
	+----+---------------+

	
The "TRANWORK" variable holds responses to the question of  how many minutes it typically takes someone to travel to work; for total travel time you could roughly double these numbers. I have divided by 60 to give hours spent on a work-day commuting (to) work.

That's a lot of time spent in traffic. Seems like a waste of time, though if you're a podcaster or audio book publisher, it looks like an opportunity.

Americans spent roughly 120 million hours per workday going to and from work! They aren't getting paid for  that time. A quick check on the <a href="https://data.bls.gov/timeseries/CES0500000003"> BLS data</a> for earnings shows a bit more than $25 per hour in 2016, giving approximately  three billion per workday or  $750 billion per year assuming 250 days working per person. 

 To find a more accurate number we should  adjust for  systematic differences between commute time and income.  This would require computing an hourly wage per person to produce a new variable, We could call it "COMMUTE_COST."  I'll leave that as an excercise for the reader.

 Now let's suppose you want to hand off a very simple subset of the "extract65" dataset. It needs only people over age 50, their state of residence and their travel time to work. You'll need to include the PERWT variable to calculate numbers matching the U.S. population. 
 
To deliver this data you can work with the data frame programmatically using the Spark API:

	>>> df_over_50 = df.filter(df['AGE'] > 50).select(df['YEAR'],df['TRANTIME'],df['STATEFIP'],df['PERWT'])

Now that we have just the data we want, convert to a different format:
	
	>> df_over_50.write.csv("over_50")

The ability to read and write many formats is extremely useful.

There's a ton to learn, so check out the PySpark <a href="https://spark.apache.org/docs/latest/api/python/index.html"> documentation. </a>


## Scripting Spark in Ruby

Ruby isn't directly supported by Spark but thanks to the JRuby project you have access to an interactive shell (REPL) for Ruby that also gives you access to compiled Java classes. 

I used JRuby to create a small interactive Spark environment. JRuby can use Java classes directly, so all I had to do was instantiate Spark Java classes in JRuby and use the Java API from Ruby's "irb" REPL. What I'm doing here is calling the Java API for Spark; JRuby is simply a convenient way to script the use of the Java API so I don't have to compile Java programs every time I make a change. You should be able to achieve a similar setup with any interpreted JVM language such as Clojure. 

The following example code   shows how you could start up Spark and make an ad-hoc query from JRuby, and then work with the Java DataFrame API interactively to do similar tasks to what we did with Python.

### Spark JRuby example

There are two basic approaches you can take if you wish to run a Spark job from an officially unsupported language:

1. Write a small Java  class to issue Spark SQL queries and pre-determined actions on RDDs and DataFrame instances; this allows you to skip importing all the Spark JAR files directly in your JRuby program. Probably the right approach to take if your app  requirements are known and you don't need interactive access to Spark through JRuby. 
2. Simply import all necessary Spark Java libraries into your JRuby program. Then you can load your code in "jirb" and interact with Spark.

Here I'm using a Spark "helper" library. All it does is put all the Spark libraries on the classpath and import all necessary  packages so you can use them in JRuby.

```ruby

require 'spark_env_helper'



# For example:

df = $spark.sql("select int(sum(TRANTIME*PERWT)/60) as hours_commuting 
	from parquet.`./extract65.parquet` where YEAR=2016 and AGE > 50") 
	
# At this point you can manipulate the data frame with the Spark API

df.show
```

Before starting an interactive session you may wish to reduce Spark's default log level, otherwise you'll get a large amount of informational messages. Change the first setting in the /conf/log4j.properties from INFO,console to WARN (see the comments.) Spark will read the "log4j.properties" file in the "conf" directory located in the directory pointed to by your SPARK_HOME environment variable. If you're iteratively developing a performance critical task you should consider leaving the logging level on "INFO" because you can gain a lot of insight into how Spark distributes work and what resources Spark is using.

The interactive session would look like

		irb> load "spark_env_helper.rb"
		Loading test helper, SPARK_HOME is /home/ccd/spark-2.3.1/spark-2.3.1-bin-hadoop2.7, setting classpath
		
		irb(main):004:0>  df = $spark.sql("select int(sum(TRANTIME*PERWT)/60) as hours_commuting 
		irb(main):005:0>  from parquet.`./extract65.parquet` where YEAR=2016 and AGE > 50") 
		
You will get an object of type:

		=> #<Java::OrgApacheSparkSql::Dataset:0x7b4619a3>
		
		irb(main):006:0>
		
Now actually execute the job:
		
		irb(main):006:0> df.show

		+---------------+
		|hours_commuting|
		+---------------+
		|       19282789|
		+---------------+

		=> nil
		irb(main):007:0>


As with the Python examples you can save data and work with it more (df.write.csv("dataset_name") ) and so forth.

# Spark-Friendly Parquet

Spark doesn't deal especially well with very large monolithic Parquet files: While in principle -- and easily with a C++ reader or PyArrow -- you could read from different parts of a Parquet file in parallel, the Spark Parquet reader doesn't automatically do this well unless you're using HDFS (Hadoop Distributed File System.) Additionally, extremely large numbers of columns in a Parquet dataset will hurt Spark performance, while this isn't intrinsic to the Parquet format.

However, the Spark Parquet reader has other strengths. By breaking up the Parquet monolith into chunks (multiple Parquet files) organized by some interesting column you can really take advantage of all the cores Spark can bring to bare without excessive I/O costs. Depending on how you expect your Parquet data to be queried, you can partition it into pieces to make those queries faster.

With PyArrow you can save Parquet as "spark" type Parquet data; when constructing it manually, ensure "block groups" are around 1GB in size and consult Spark documentation for supported column data types. Sizes of "row groups"  need to be larger than the HDFS block size; this is 128mb by default but it's recommended to use larger HDFS block sizes for Spark and Hadoop.

To calculate a good row group size first compute the approximate size of each row in the Parquet file by taking the data types of each column into account.

For instance given the schema:

	col1:int32, col2:int32, col3:int64, col4:double ......

Compute the size in bytes:
		
	row_size =  4 + 4 + 8 + 8 + ....

Then divide your target row group size by the row size in bytes:

	rows_in_group = 1000000 / row_size


##  Spark Next Steps

*  Learn about submitting jobs to a Spark cluster with "spark-submit"
* Learn about configuring Spark to run  on a cluster
* Explore Spark tools beyond Spark SQL: <a href="https://spark.apache.org/mllib/"> Mllib</a> for machine learning,  and <a href="https://spark.apache.org/streaming/"> Spark Streaming</a> for incorporating streams of data (Kafka, ZeroMQ, Twitter, others) into your Spark workflow.


#  Extreme Column Store Solutions

The  following two  products are designed for the fastest possible queries on analytic workloads and support streaming data sources. 

In the case of ClickHOuse you get a relatively conventional relational database interface without the multistage data processing tools of Spark; in the case of KDB you get a powerful but unconventional programming language to manipulate and access your data.

### Yandex ClickHouse

Yandex -- the "Google of Russia" --  has open sourced their column store database and it's <a href="https://www.percona.com/blog/2017/03/17/column-store-database-benchmarks-mariadb-columnstore-vs-clickhouse-vs-apache-spark/"> quite impressive.</a>  Think of ClickHouse as a standard relational SQL database but tuned for analytic queries. In the linked benchmarks ?ClickHouse is compared with Maria DB Column Store and Spark with Parquet formatted data.

The quick start <a href="https://clickhouse.yandex/"> guide.</a> is on the main page and shows how to install. Yandex offers Debian packages for Ubuntu so you can use "apt-get" to install, or you can use Docker images on other operating systems.

ClickHouse can be run as a database server similar to any conventional DBMS like MySql or Postgres.  It supports bulk loading data into tables  from many data formats; it's actually the most convenient bulk loading system I've run across. See all <a href"https://clickhouse.yandex/docs/en/interfaces/formats/"> supported formats.</a>

You can productively run ClickHouse on a single machine -- it's designed to use hardware very efficiently -- but it scales easily to multiple servers for more resiliency and performance.

For a quick introduction to loading, querying and deploying the server, just read the <a href="https://clickhouse.yandex/tutorial.html"> tutorial.</a>


### Q and KDB

There's one more type of software out there which I'd consider the  expert power tool of high speed analytic data for single machines: The <a href="https://kx.com/"> "Q" and "K" language and KDB+</a> database ecosystem, and the <a href="http://www.jsoftware.com/">J and JDB</a> open source variant.  Here's some more <a href="https://scottlocklin.wordpress.com/2012/09/18/a-look-at-the-j-language-the-fine-line-between-genius-and-insanity/">background.</a>

The "Q"  language is a humane coating of syntactic sugar for the "K" language; "J" is similar to "K". Both are descendents of APL. KDB and JDB are column oriented databases; unlike Parquet format they allow very fast appends / inserts, while keeping very fast query times and compact size. JDB supports a fairly friendly query language, though it's not SQL. The actual J and K languages are, like APL, extremely terse with single ASCII symbols used as keywords.

KDB was designed to function as efficiently as possible on time series data speciffically tfor finance. Think of ticker data streaming into a database where you want to apply a model to the  most up-to-date information. Recently it is gaining use in <a href="https://news.efinancialcareers.com/us-en/284145/kdbq-banking-alternatives"> other fields as well.</a>

If you need the absolute maximum query speed against a constantly updated database -- which Parquet and similar formats don't enable -- you need "K" and KDB+. There's a free non-commercial 32 bit version; the "J" and JDB combination is free, but it doesn't scale as well.

Find video presentations <a href="https://www.youtube.com/channel/UCQmlgr0gb7eGiDAm9-FQkVQ"> here</a> and a basic <a href="https://code.kx.com/q/learn/"> Getting Started </a> tutorial. For a quick but impressive tour, check out <a href="https://code.kx.com/q4m3/1_Q_Shock_and_Awe/"> Q Shock and Awe.</a>