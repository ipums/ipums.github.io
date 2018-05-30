---
title: "Big Data on a Laptop: Tools and Strategies - Part 3"
comments: true
teaser: In our final installment of this series, we show how to harness all the compute cores available on your local system, turning it into a personal cluster for parallel computing.
author: ccd
categories: Code, Data
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

<a href="https://spark.apache.org/">Apache Spark</a> can be intimidating, but don't worry, getting started is pretty easy once you have a working installation.  You can set it up in "local" mode requiring next to no configuration. You can run interactively with Python, Scala or even Ruby. When your data out grows your local machine you can put your Spark application onto a larger machine or even a cluster of machines, and as long as you move the data to be reachable by the new environment the application should function identically, except faster.

Spark supports "Spark SQL", so you can stick with SQL if that makes the most sense; Spark also provides other ways to manipulate data with RDDs (resilient Distributed Datasets) and user defined functions callable from Spark SQL. Spark imposes a bit of overhead due to its need to coordinate multiple nodes; in "local" mode this overhead is smaller. By the time you need to reach for a Spark cluster the overhead, given the size of the data, should not matter, except when sub-second response times are critical to your application. In that case you'll need to craft the data files for best performance as well as picking the right configuration for Spark.

Spark was written in Scala -- a JVM language -- and provides a Java API in addition to the Scala API. There's also an extensive Python API, but a few things were missing from it until recent versions of Spark.

I used JRuby to create a small interactive Spark environment; JRuby can use Java classes directly, so all I had to do was instantiate Spark Java classes in JRuby and use the Java API from Ruby's "irb" REPL. What I'm doing here is using the Java API for Spark; JRuby is simply a convenient way to script the use of the Java API so I don't have to compile Java programs every time I make a change.

This  shows how you could start up Spark and make an ad-hoc query from JRuby, and building on this you could script a Spark application. You can code the difficult parts directly in Java, then call those parts from JRuby.

# Spark JRuby example

```ruby

#
# This first part is the setup only, could be moved
# to a 'helper' file.

ENV['SPARK_HOME'] or raise "No SPARK_HOME defined."

puts "Loading test helper, setting classpath"

$SPARK_HOME = ENV['SPARK_HOME'].to_s

require 'java'
include Java

$CLASSPATH <<  $SPARK_HOME + "/conf"

$jars = %w{/lib/datanucleus-api-jdo-3.2.6.jar
/lib/datanucleus-core-3.2.10.jar
/lib/datanucleus-rdbms-3.2.9.jar
/lib/spark-1.6.3-yarn-shuffle.jar
/lib/spark-assembly-1.6.3-hadoop2.6.0.jar
/lib/spark-examples-1.6.3-hadoop2.6.0.jar
}

$paths = $jars.map{|j| $SPARK_HOME +  j}
$paths.each{|p| $CLASSPATH << p}

#puts $CLASSPATH.to_s

import 'org.apache.spark.api.java.JavaPairRDD'
import 'org.apache.spark.api.java.JavaSparkContext'
import 'org.apache.spark.api.java.*'

import 'org.apache.spark.api.java.JavaRDD'
import 'org.apache.spark.SparkConf'
import 'scala.Tuple2'
import 'org.apache.spark.api.java.function.Function'
#// Import factory methods provided by DataTypes.
import 'org.apache.spark.sql.types.DataTypes'
#// Import StructType and StructField
import 'org.apache.spark.sql.types.StructType'
import 'org.apache.spark.sql.types.StructField'
#// Import Row.
import 'org.apache.spark.sql.Row'
#// Import RowFactory.
import 'org.apache.spark.sql.RowFactory'
import 'org.apache.spark.sql.SQLContext'
import 'org.apache.spark.sql.DataFrame'
import 'java.util.Arrays'

#
# This next part uses the Spark API to make a simple query
# against our example Parquet data.
#

conf =  SparkConf.new
conf.setMaster("local")
conf.setAppName("tmp_query")

sc = JavaSparkContext.new(conf)
sql_context = SQLContext.new(sc)

data_frame = sql_context.sql("select sum(PERWT) as population, YEAR from parquet.`/mnt/c/Users/ccd/data/extract65.parquet`  group by YEAR")
data_frame.show

# At this point you can manipulate the data frame with the Spark API

```

Notice the slight overhead; you won't get any extra speed on a single machine compared to the direct access of Parquet files by a C++ program; but using Spark for these sorts of queries is pretty easy and you could develop an application you want to eventually put on a powerful cluster. And, of course, you get full SQL query support, and if you want to code your application in Java or Scala, Spark is the obvious choice.


# Spark-Friendly Parquet

Spark doesn't deal especially well with very large monolithic Parquet files: While in principle -- and easily with a C++ reader or PyArrow -- you could read from different parts of a Parquet file in parallel, the Spark Parquet reader doesn't automatically do this well unless you're using HDFS (Hadoop Distributed File System.) Additionally, extremely large numbers of columns in a Parquet dataset will hurt Spark performance, while this isn't intrinsic to the Parquet format.

However, the Spark Parquet reader has other strengths. By breaking up the Parquet monolith into chunks (multiple Parquet files) organized by some interesting column you can really take advantage of all the cores Spark can bring to bare without excessive I/O costs. Depending on how you expect your Parquet data to be queried, you can partition it into pieces to make those queries faster.

With PyArrow you can save Parquet as "spark" type Parquet data; when constructing it manually, ensure "block groups" are around 1GB in size and consult Spark documentation for supported column data types. Sizes of "row groups"  need to be larger than the HDFS block size; this is 128mb by default but it's recommended to use larger HDFS block sizes for Spark and Hadoop.

### Beyond Parquet, Spark andSQL

There's one more type of software out there which I'd consider the  expert power tool of high speed analytic data for single machines: The <a href="https://kx.com/"> "Q" and "K" language and KDB+</a> database ecosystem, and the <a href="http://www.jsoftware.com/">J and JDB</a> open source variant.  Here's some more <a href="https://scottlocklin.wordpress.com/2012/09/18/a-look-at-the-j-language-the-fine-line-between-genius-and-insanity/">background.</a>

The "Q"  language is a humane coating of syntactic sugar for the "K" language; "J" is similar to "K". Both are descendents of APL. KDB and JDB are column oriented databases; unlike Parquet format they allow very fast appends / inserts, while keeping very fast query times and compact size. JDB supports a fairly friendly query language, though it's not SQL. The actual J and K languages are, like APL, extremely terse with single ASCII symbols used as keywords.

If you need the absolute maximum query speed against a constantly updated database -- which Parquet and similar formats don't enable -- you need "K" and KDB+. There's a free non-commercial 32 bit version; the "J" and JDB combination is free, but it doesn't scale as well.
