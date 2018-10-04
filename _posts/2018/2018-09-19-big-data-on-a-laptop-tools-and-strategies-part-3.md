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

In the  [first part]({{site.url}}/large-data-on-a-laptop-tools-and-strategies-part-1/) of this series, we looked at how to get out of Excel and work with big datasets more effectively. In the [second part]({{site.url}}/big-data-on-a-laptop-tools-and-strategies-part-2/), we introduced Parquet to achieve better performance and scalability. In today's final part, we will discuss how to harness the power of all of the cores of your system to do work in parallel using Spark.

# Introducing Spark: Spark + Parquet, Harness all the Cores on Your System and Beyond

Spark is a distributed data processing engine that supports batch, iterative, and streaming types of workloads. Learning to use<a href="https://spark.apache.org/">Apache Spark</a> can seem intimidating, but don't worry, getting started is pretty easy. While true that learning everything about the Spark API and how to exploit Spark on a cluster as well as mastering performance tuning is a big undertaking, here I'm showing that limited but very useful Spark applications are simple to create and run.

You can start Spark in "local" mode with almost no configuration. You can run interactively with Python, Scala or even Ruby. When your data outgrows your local machine you can put your Spark application onto a larger machine or even a cluster of machines, and as long as you move the data to the new environment the application should function identically (except faster).

## The Spark API, Very Briefly

Spark was written in Scala (a JVM language) and provides a Java API in addition to the Scala API. There's also an extensive Python API. The main disadvantage to Python is simply slower performance as a language compared to Java and Scala, but in many cases, where Python acts mainly as the glue code, the difference is negligible since most of the data processing load gets handled by the Spark libraries, not Python.

Spark supports Spark SQL for a query language, as well as user-defined functions callable from Spark SQL, so you can rely on your SQL skills if that makes the most sense. Spark provides other ways to manipulate data as well.

The foundational data abstraction in Spark is the RDD (Resilient Distributed Datasets.) An RDD distributes data across nodes in a Spark cluster so that a Spark application can access the data in parallel, running on multiple cores and machines. You can work directly with RDDs, but the interface is fairly low level. Generally, you will want to work with Spark's higher level APIs instead: DataFrames and DataSets. Today, we'll use DataFrames for working with our data.

DataFrame is an API for working with structured data in a table-like form, which will be familiar to users of relational databases or spreadsheets. Results of Spark SQL queries can be returned and further processed using the DataFrame API. For importing and exporting data, the API includes lots of functionality to ingest and output various formats, including JSON, text, CSV, and Parquet.

## When to Use Spark

It's important to understand a little bit about how Spark executes queries so that you know what to expect performance-wise and when to use Spark vs. the [previously discussed approach]({{site.url}}/big-data-on-a-laptop-tools-and-strategies-part-2/) with Python and Parquet. Spark imposes a bit of overhead due to its need to coordinate multiple processes/processors. In "local" mode this overhead is small, but for certain problems, it can become a factor. Also, Spark's implementation of Parquet is not the most efficient, so there is some performance cost if your dataset has many variables (columns).

What does this mean in practice? Spark will be great if you have lots of rows of data and a reasonable number of variables (say, < 100), which is a pretty common use case. However, if you use Spark to perform a simple aggregation on relatively large data with many columns you may start to notice slightly _worse_ performance compared to directly using Parquet with C++ or with the PyArrow library, just because of the overhead of inter-process communication and the way Spark implements Parquet.

Using Spark even for these sorts of queries may still make sense if you're developing a solution that you eventually need to scale up to an actual compute cluster, since with Spark it will transition seamlessly. Another reason you may choose Spark may be to get the full SQL query support, or if you simply prefer to code in Java or Scala instead of Python.

Unlike the Parquet examples with PyArrow from the [last post]({{site.url}}/big-data-on-a-laptop-tools-and-strategies-part-2/), Spark can use a multi-core system for more than just reading columns in parallel - it can take full advantage of all the cores on your machine for computation as well. Assuming you have enough RAM to hold the data involved in the computation, you'll see a big speed-up.

## Setting Up Spark on Your Laptop

You can set up Spark on Linux, Windows or MacOS. You'll need Java 8. If you're on Windows 10 I recommend using WSL (Windows Subsystem for Linux) instead of installing under native Windows, because most of the examples you'll find online are Linux-based. My example below is on Linux.

Go to the Apache Spark <a href="https://spark.apache.org/downloads.html">downloads</a> page and select your version (I'll use the latest as of this writing.)

```
 # Untar with
 tar -xf  spark-2.3.1-bin-hadoop2.7.tgz

 # Now before anything else, set your SPARK_HOME directory.
 # Assuming you put Spark in /opt/spark/current:

 export SPARK_HOME=/opt/spark/current
```

# Spark and Python

If you want to work only in Python you can just install with 'pip':
```
pip install pyspark
```

Which installs pyspark with a bundled Spark engine. Then you can run 'pyspark' and begin an interactive session. (Beware if you already have a SPARK_HOME set, PySpark will try to use that version of Spark instead of the version you just downloaded as part of PySpark.)

If instead you downloaded Spark from spark.apache.org as I did above, you can go to the 'bin' directory in your Spark installation and run the 'pyspark.sh' program located there.

Once you get your PySpark shell up, you can read Parquet data directly and get the result as a DataFrame.
In this example, I'll use the "extract65.parquet" dataset again - the same one I used in the previous post. It contains individual person records from samples of the U.S. Census for years 1960-2016 and has columns full of IPUMS variables concerning commuting, work, industry and home ownership.

	$ pyspark

	>>> df=spark.sql("select count(*) from parquet.`./extract65.parquet`")
	>>> df.show()
	+-----------+
	|count(YEAR)|
	+-----------+
	|   17634469|
	+-----------+

The query isn't actually executed until you call "show()".

You can read the data into a dataframe:

	>>> df_extract65 = spark.read.load("./extract65.parquet")

then programmatically work with the data in SQL:

	>>> df_extract65.createOrReplaceTempView("travel")

	>>> df_commute = spark.sql("select YEAR,int(sum(TRANTIME*PERWT)/60) as hours_commuting from travel where YEAR> 1980 group by YEAR order by YEAR")

You can also see the schema for the data frame:

	>>> df_commute
	DataFrame[YEAR: int, hours_commuting: int]

and the query results:

	>>> df_commute.show()
	+----+---------------+
	|YEAR|hours_commuting|
	+----+---------------+
	|1990|       41527560|
	|2000|       52791989|
	|2010|       55293482|
	|2016|       63408548|
	+----+---------------+

The "TRANWORK" variable holds responses to the question of how many minutes it typically takes someone to travel to work. I have divided by 60 to give hours spent on a work-day commuting to work. (For total travel time you could roughly double these numbers.)

That's a lot of time spent in traffic. Americans spent more than 120 million hours per workday going to and from work! They aren't getting paid for that time - let's try to put a value on it. A quick check of the <a href="https://data.bls.gov/timeseries/CES0500000003">BLS data</a> for earnings shows a bit more than $25 per hour in 2016, giving an approximate "commuting cost" of three billion per workday or $750 billion per year, assuming 250 days working per person.

[Aside: to find a more accurate number we could adjust for systematic differences between commute time and income. This would require computing an hourly wage per person to produce a new variable, We could call it "COMMUTE_COST."  I'll leave that as an exercise for the reader.]

Now let's suppose you want to hand off a subset of the "extract65" dataset. It needs only people over age 50, their state of residence, and their travel time to work. You'll also need to include the PERWT variable to calculate numbers matching the U.S. population.

To deliver this you can work with the dataframe programmatically using the DataFrame API:

	>>> df_over_50 = df.filter(df['AGE'] > 50).select(df['YEAR'],df['TRANTIME'],df['STATEFIP'],df['PERWT'])

Now that we have just the data we want, we can convert to a different format:

	>> df_over_50.write.csv("over_50")

The ability to read and write many formats is extremely useful.

There's a ton more to learn, so check out the PySpark <a href="https://spark.apache.org/docs/latest/api/python/index.html">documentation</a>.

# Spark and Ruby

Ruby isn't directly supported by Spark but thanks to the JRuby project you have access to an interactive shell (REPL) for Ruby that also gives you access to compiled Java classes.

I used JRuby to create a small interactive Spark environment. JRuby can use Java classes directly, so all I had to do was instantiate Spark Java classes in JRuby and use the Java API from Ruby's "irb" REPL. What I'm doing here is calling the Java API for Spark; JRuby is simply a convenient way to script the use of the Java API so I don't have to compile Java programs every time I make a change. You should be able to achieve a similar setup with any interpreted JVM language such as Clojure.

The following example code shows how you could start up Spark and make an ad-hoc query from JRuby, and then work with the Java DataFrame API interactively to do similar tasks to what we did with Python.

## Spark JRuby example

There are two basic approaches you can take if you wish to run a Spark job from an unsupported language like Ruby:

1. Write a small Java class to issue Spark SQL queries and perform pre-determined actions on DataFrame instances. This allows you to skip importing all the Spark JAR files directly in your JRuby program, and is probably the right approach to take if your app requirements are known and you don't need interactive access to Spark through JRuby.
2. Simply import all necessary Spark Java libraries into your JRuby program. Then you can load your code in "jirb" and interact with Spark.

Here's an example of approach #1. I'm using a Spark "helper" library. All it does is put all the Spark libraries on the classpath and import all necessary packages so you can use them in JRuby.

```ruby

require 'spark_env_helper'

# For example:
df = $spark.sql("select int(sum(TRANTIME*PERWT)/60) as hours_commuting
	from parquet.`./extract65.parquet` where YEAR=2016 and AGE > 50")

# At this point you can manipulate the data frame with the Spark API
df.show
```

And now for an example of approach #2, the interactive approach.

Before starting an interactive session you may wish to reduce Spark's default log level, otherwise you'll get a large amount of informational messages. Change the first setting in the /conf/log4j.properties from `INFO,console` to `WARN` (see the comments.) Spark will read the `log4j.properties` file in the `conf` subdirectory of the directory pointed to by your SPARK_HOME environment variable. On the other hand, if you're iteratively developing a performance-critical task you should consider leaving the logging level on "INFO" because you can gain a lot of insight into how Spark distributes work and what resources Spark is using.

The interactive session would look like:

		irb> load "spark_env_helper.rb"
		Loading test helper, SPARK_HOME is /home/ccd/spark-2.3.1/spark-2.3.1-bin-hadoop2.7, setting classpath

		irb(main):004:0>  df = $spark.sql("select int(sum(TRANTIME*PERWT)/60) as hours_commuting
		irb(main):005:0>  from parquet.`./extract65.parquet` where YEAR=2016 and AGE > 50")

You will get an object of type:

		=> #<Java::OrgApacheSparkSql::Dataset:0x7b4619a3>

Now, to actually execute the job:

		irb(main):006:0> df.show

		+---------------+
		|hours_commuting|
		+---------------+
		|       19282789|
		+---------------+

		=> nil
		irb(main):007:0>

As with the Python examples you can save data and work with it more with commands like `df.write.csv("dataset_name"))`.

# A Note about Spark-Friendly Parquet

You should know that Spark doesn't deal especially well with very large monolithic Parquet files. While in principle -- and as [we've shown]({{site.url}}/big-data-on-a-laptop-tools-and-strategies-part-2/) with a C++ reader or PyArrow -- you could read from different parts of a Parquet file in parallel, the Spark Parquet reader doesn't automatically do this well unless you're using HDFS (Hadoop Distributed File System.) Additionally, extremely large numbers of columns in a Parquet dataset will hurt Spark performance, not due to a limitation of the Parquet format itself but rather the Spark implementation of it.

However, we can work around this by playing to the Spark Parquet reader's strengths. By breaking up the Parquet monolith into chunks (multiple Parquet files), you can take advantage of all the cores Spark can bring to bear without paying these excessive I/O costs. Spark prefers to have your dataset chunked out over multiple Parquet files rather than a single monolithic file.

If you're making your Parquet files with PyArrow you can save Parquet as "flavor=spark" to make Spark-friendly Parquet. Alternately, when constructing Parquet files manually, ensure "block groups" are around 1GB in size and consult Spark documentation for supported column data types. Sizes of "row groups" should be larger than the HDFS block size (this is 128mb by default but it's recommended to use larger HDFS block sizes for Spark and Hadoop.)

To calculate a good row group size first compute the approximate size of each row in the Parquet file by taking the data types of each column into account.

For instance given the schema:

	col1:int32, col2:int32, col3:int64, col4:double ......

Compute the size in bytes:

	row_size =  4 + 4 + 8 + 8 + ....

Then divide your target row group size by the row size in bytes:

	rows_in_group = 1000000 / row_size

You'll find that Spark will perform a bit better if the Parquet files have been tailored in this way.

# Conclusion

This brings us to the end of our "big data on a laptop" journey. Hopefully, you've found this series useful for learning how to leverage your local computer for more scalable and performant data analysis than you thought was possible!

The steps outlined in this series will take you just about as far as you can go for processing large-scale data on a local system. If you need more memory or performance, you'll need to graduate to a larger server or even a full-fledged compute cluster (or perhaps use some more esoteric tooling, which I refer to briefly in the appendix below). I've put some next steps in the appendix that you can take if you find yourself needing more.

Thanks for reading!

# Appendix: Next steps

## Spark on an Actual Cluster

One major benefit of working with Spark on your local system is that it is then very easy to "graduate" to an actual Spark cluster - just move the code and data over, and it should all essentially "just work", but perform faster.

* Learn about <a href="https://spark.apache.org/docs/latest/cluster-overview.html">running Spark on a cluster</a>
* Learn about submitting jobs to a Spark cluster with <a href="https://spark.apache.org/docs/latest/submitting-applications.html">spark-submit</a>
* Explore Spark tools beyond Spark SQL: <a href="https://spark.apache.org/mllib/"> Mllib</a> for machine learning, and <a href="https://spark.apache.org/streaming/"> Spark Streaming</a> for incorporating streams of data (Kafka, ZeroMQ, Twitter, others) into your Spark workflow.

##  Extreme Column Store Solutions

The following two products are designed for the fastest possible queries on analytic workloads. Neither are as approachable as what I've discussed in this series, but may be of interest to those seeking the absolute most performant tooling.

### Yandex ClickHouse

Yandex, the "Google of Russia", has open-sourced their column store database and it <a href="https://www.percona.com/blog/2017/03/17/column-store-database-benchmarks-mariadb-column store-vs-clickhouse-vs-apache-spark/">benchmarks quite impressively</a>. Think of ClickHouse as a standard relational SQL database but tuned for analytic queries. You get a relatively conventional relational database interface with a nice bulk loading system - see all <a href"https://clickhouse.yandex/docs/en/interfaces/formats/">supported formats</a>. You can productively run ClickHouse on a single machine -- it's designed to use hardware very efficiently -- but it scales easily to multiple servers for more resiliency and performance. For a quick introduction to loading, querying and deploying the server, just read the <a href="https://clickhouse.yandex/tutorial.html">tutorial.</a>

### Q and KDB

The <a href="https://kx.com/"> "Q" and "K" language and KDB+</a> database ecosystem, and the <a href="http://www.jsoftware.com/">J and JDB</a> open source variant, are what I consider the expert power tool for high speed data analysis on a single machine.  Here's some more <a href="https://scottlocklin.wordpress.com/2012/09/18/a-look-at-the-j-language-the-fine-line-between-genius-and-insanity/">background</a>. These are column oriented databases. Unlike Parquet format they allow very fast appends / inserts, while keeping very fast query times and compact size. JDB supports a fairly friendly query language, though it's not SQL. The actual J and K languages are, like APL from which they are derived, extremely terse with single ASCII symbols used as keywords.
