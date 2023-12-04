---
layout: page
status: publish
published: true
title: Importing Fixed Length Data Using Ruby (Part Two)
author: ccd
teaser: A follow-up to my post discussing my 'hflr' Ruby gem for reading hierarchical data in FLR format, today I'll demonstrate how to combine 'hflr' with a simple importer class to load a database with the data.
wordpress_id: 667
wordpress_url: http://tech.popdata.org/?p=667
date: '2015-05-07 00:08:41 -0500'
date_gmt: '2015-05-07 05:08:41 -0500'
categories: Code Infrastructure
tags: []
---
<em>Read [part one]({% post_url 2015-01-28-fixed-length-record-data %}) first.</em>

Last time, I discussed the Fixed Length Record (FLR) format and showed how to use the 'hflr' Ruby gem to read in hierarchical data in FLR format and produce Ruby structs. In this post I'll demonstrate how to combine 'hflr' with a simple importer class to load a database with the FLR data. Then I'll show you how to get some real-world FLR data to import. Finally, I'll discuss specific issues that come up when importing this data, and explore the IPUMS microdata just a bit.

<h4>Efficiently Import Data</h4>

One could simply write code such as the following to import small numbers of records into a database:

{% highlight ruby %}
flr_file.each_record do |record|
  customer = Customer.new
  customer.name = record.name
  customer.street = record.street
  customer.zip = record.zip
  customer.save
end
{% endhighlight %}

However, performance will degrade unacceptably as the size of the import grows to a few thousand records.

What's needed is a way to avoid: (1) Instantiating all records as ActiveRecord objects, and (2) Issuing an insert statement to the database for each of those records. The 'activerecord-import' gem groups the inserts and, optionally, avoids instantiation into ActiveRecord objects altogether. In essence, activerecord-import allows you to pass in a large set of data as arrays or hashes or AR objects and do one insert for the lot of them. Doing this improves import time by around 50x. The speed-up will depend on the database type, hardware, and validations (they can be enabled or disabled.) Passing data to activerecord-import as arrays or hashes is substantially faster than passing ActiveRecord objects.

Using activerecord-import, Your code would look like

{% highlight ruby %}
records_to_import = []
batch_size = 20_000 # arbitrary but reasonable batch size
fields = [:name, :street, :zip]

flr_file.each_record do |record|
  records_to_import << record.to_a
  if records_to_import % batch_size == 0
    Customer.import(records_to_import,fields)
    records_to_import = []
  end
end

# Import the remaining records % batch_size
Customer.import(records_to_import,fields)
{% endhighlight %}

The 'import' method can take an array of arrays, and a 'fields' argument giving the order of fields in each inner array. Alternatively 'import' may take an array of hashes, removing the necessity for the 'fields' argument as the names of fields and their values are linked in the hashes.

You may instead pass in already instantiated Active Record models, but this will be slower than the first two options.

We can package up the buffering logic shown in the code snippets above, along with a way to manage the various options for passing data to 'import'. In the file 'importer.rb' you can find the full source. <a href="https://github.com/ccdavis/flrdata"> flrdata example code on github.com</a>.

<h4>Example Data</h4>

In the Git repository there's an 'input_data' directory with a sample data file 'usa_00001.dat'. This is a slice of a much larger data file created with the IPUMS-USA data extraction service. The dataset will let us study the housing boom, bust and recovery. The data comes from the American Community Survey, covering the years 2001 to 2013. We have both household records and person records in this dataset. We can create some interesting tables using just the household records, but some tabulations will require the people associated with those households.

The example tabulations that will follow later on were done with the full dataset. The slice of data provided in the example source is only for testing the import code.

<em>[To learn more about the IPUMS and to recreate the full 3.3 GB dataset in our example, See <a href="http://usa.ipums.org"> usa.ipums.org</a>. You may browse the system and begin requesting data without signing in, but to get your data you must create a free account.]</em>

The 'codebook.txt' and 'usa_0001.sps' files were created by the data extract system and were downloaded with the data file. The 'codebook.txt' is a human readable description of the data file, and the .sps file is for the SPSS statistics analysis software to read, to help you to use the data in SPSS. The extract system also produces files for SAS and Stata. For extracts with only one record type, the extraction service offers CSV and native binary formats of all three stats applications.

To figure out what to pass to the FLRFile class initializer, you'd look at the code book or possibly the SPSS file supplied with the dataset:

{% highlight sql %}
record type "H".
data list /
RECTYPE 1-1 (a)
YEAR 2-5
DATANUM 6-7
SERIAL 8-15
HHWT 16-25 (2)
HHTYPE 26-26
STATEICP 27-28
METAREA 29-31
METAREAD 32-35
CITY 36-39
CITYPOP 40-44
GQ 45-45
OWNERSHP 46-46
OWNERSHPD 47-48
MORTGAGE 49-49
MORTGAG2 50-50
ACREHOUS 51-51
MORTAMT1 52-56
MORTAMT2 57-60
TAXINCL 61-61
INSINCL 62-62
PROPINSR 63-66
OWNCOST 67-71
RENT 72-75
RENTGRS 76-79
CONDOFEE 80-83
HHINCOME 84-90
VALUEH 91-97
.
record type "P".
data list /
RECTYPE 1-1 (a)
YEAR 2-5
DATANUM 6-7
SERIAL 8-15
PERNUM 16-19
PERWT 20-29 (2)
RELATE 30-31
RELATED 32-35
SEX 36-36
AGE 37-39
MARST 40-40
RACE 41-41
RACED 42-44
HISPAN 45-45
HISPAND 46-48
BPL 49-51
BPLD 52-56
YRIMMIG 57-60
SPEAKENG 61-61
RACESING 62-62
RACESINGD 63-64
INCTOT 65-71
INCINVST 72-77
.
end file type.
{% endhighlight %}

This is fairly convenient, and if you regularly needed to import IPUMS data you might write a simple script to parse this sort of code book. Whatever the source of your FLR data you'll need a description with comparable information.

In our example, we're loading data into a database, so we need to define database tables with corresponding columns. See the 'schema.rb' for the translation of the above SPSS code into an Active Record migration script like one found in a Rails project. Again, you'd probably write a migration generator script if importing extracts was a frequent task.

As you can see from the 'schema.rb' migrations we're making two tables, corresponding to the two record types in the data file 'usa_00001.dat': Household and person. We'll use Rails conventions and call these tables 'households' and 'people'.

Since the data come with keys to link the two tables together, we'll make sure to index the two columns holding those keys. The 'households' table has a column 'serial' which will get the value of the SERIAL variable -- it's a unique household serial number. Within one dataset SERIAL is unique; since we're extracting data across thirteen datasets, we'll need to use 'ACSYR' (the year) to differentiate records. The 'people' table has a 'serialp' column that will hold the SERIALP variable; SERIALP has the value of the household serial number for the household the person record belongs to. Again, we'd need the ACSYR (which is on the people table as well) to differentiate between datasets within the 'people' table. The tables already have the Rails standard 'id' columns as unique keys. A nice feature for the importer would be to add a 'household_id' column to the people table and copy the value of 'id' from the correct household record, so we wouldn't need to use composite keys in our joins. (I've done this in production code but it's rather specialized and gets in the way of the example code.)

To read the data we use the 'hflr' gem as in the above example code and in the previous post. We need to provide a layout to 'hflr'. To see the HFLR layout data, look in 'extract_layout.rb'.

To run the example, just do <code> # ruby import.rb </code>. You may use JRuby instead. The required gems are given at the top of the 'import.rb' file.

The import process should take a few seconds on the data included with the example code. Before importing data, the script executes the migrations in the 'schema.rb' file, rebuilding the database schema from scratch. The full dataset referenced in the 'codebook.txt' file has approximately thirty-one million person records and fourteen million household records. It will take between one and five hours to import depending on your storage hardware, CPU and Ruby version.

Once the import has finished we should do a few simple queries to verify that all records got imported. To make effective use of this data you'd need to read documentation at <a href="http://usa.ipums.org">usa.ipums.org</a>. You can begin exploring the data just with the variable category labels included in the codebook, however. For now, you just need to know that each household record has a weight variable and each person record has a person weight variable. The value of these variables, in the 'households.HHWT' and 'people.PERWT' columns respectively, indicates the number of people or households the record represents from the larger population, as this dataset is only a sample of the entire United States population. Divide the weight values by 100 (the two least significant digits are fractional amounts) to get a useful whole number version of the weight. For instance, the value 10100 really means "this record represents 101.00 records like it."

So, to see how many people the U.S. Census estimated were in the country in 2013, you would do:

{% highlight sql %}
sqlite> select sum(PERWT/100) from people where acsyr =2013;
316128839
sqlite>
{% endhighlight %}

And we can check the population growth:

{% highlight sql %}
sqlite> select sum(perwt/100), acsyr from people group by acsyr;
277075792|2001
280717370|2002
283051379|2003
285674993|2004
288398819|2005
299398485|2006
301621159|2007
304059728|2008
307006556|2009
309349689|2010
311591919|2011
313914040|2012
316128839|2013
sqlite>
{% endhighlight %}

From this result we know that not only were the right number of person records imported but they were records with correct weights, indicating that the data in those records is probably all correct. Of course we'd have to check every column to be absolutely sure. As a final check we can join the people with their household data to get geography and housing information for the state of Arizona (STATEICP=61) for every year in the data. The OWNERSHP variable will distinguish between people living in rented households (2) and owner occupied (1). OWNERSHP=0 is for other living situations like prisons, military bases, dormitories, etc.

{% highlight sql %}
sqlite> select people.acsyr,ownershp,sum(perwt/100)
>from households,people
>where people.serialp=households.serial and stateicp=61 and people.acsyr=households.acsyr
>group by people.acsyr,ownershp;
2001|1|3564953
2001|2|1618471
2002|1|3724464
2002|2|1625033
2003|1|3851262
2003|2|1638885
2004|1|3948678
2004|2|1689667
2005|1|4043947
2005|2|1762319
2006|0|109501
2006|1|4185780
2006|2|1871037
2007|0|109370
2007|1|4305747
2007|2|1923638
2008|0|119162
2008|1|4327201
2008|2|2053817
2009|0|119010
2009|1|4317435
2009|2|2159333
2010|0|139384
2010|1|4086287
2010|2|2188066
2011|0|143926
2011|1|4028111
2011|2|2310468
2012|0|149267
2012|1|3991930
2012|2|2412058
2013|0|147624
2013|1|4006706
2013|2|2472294
{% endhighlight %}

This all looks quite believable. It's interesting to notice how the ratio of people living in rentals to those living in owner-occupied households changed over the boom and bust cycle of the housing market. There are a few more tables included in the example source repository that explore the topic further.

<h4>More Efficient Analysis</h4>

The example pushes Sqlite3 to its limits; if you recreated my extract in full you'd need to wait an hour or two just to import it. Some of the queries require five or more minutes to run, even though the necessary indexes are present. (This shows why analyzing hierarchical data in a relational database can be challenging.)

The first option, clearly, is to use the same import script with a full fledged database server on the back-end. MySql or Postgres will not import much more quickly, but the queries will execute faster in many cases, especially if your server has a lot of memory and it's tuned correctly. I've provided a 'pivot()' and 'pivoted_html_table()' function because Sqlite3 doesn't support pivoting result sets. You won't need those helpers with a full featured database.

If you want to run frequent ad-hoc queries on this data, you might find that even MySql, Postgres or other databases are painfully slow, especially when joining the two tables. Column-store databases will allow for very fast tabulations across large tables when the tabulation involves limited numbers of columns. You could use a script similar to the example to load a column oriented database such as InfiniDB. Check <a href="https://mariadb.com/services/infinidb-services"> InfiniDB at Maria DB </a> to download it. Or try <a href="http://www.infobright.org/"> InfoBright</a>.

There's a plug-in for Postgres which may not perform quite as well as the above two options but integrates with a standard Postgres install and is super convenient. See <a href="https://www.citusdata.com/blog/76-postgresql-columnar-store-for-analytics">Citus Data</a> for a quick introduction and installation instructions.

<h4>Alternatives to Databases</h4>

Consider looking into the iPython / iRuby projects. iPython provides tools to analyze data locally and has visualization tools. iRuby is built on the same libraries as iPython but lets you script your work in Ruby.

Get the iRuby project source and documentation from <a href="https://github.com/minad/iruby"> iRuby on github.com</a>. You can also install iRuby with <code> # gem install iruby </code>. You should look into the JuPytR project as well (Julia, Python, Ruby). There are now many other languages supported as well as these three. Get it on the <a href="http://ipython.org/">iPython page</a>.

When using iRuby or JuPyter you'd find the HFLR gem useful in formatting your hierarchical fixed-length data into sets of CSV files for easy consumption. You may run into size limitations, but not with even the full-sized example extract in my example code.

Have fun.
