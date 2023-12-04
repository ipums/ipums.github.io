---
layout: page
status: publish
published: true
title: Fixed Length Record Data
author: ccd
teaser: Dealing with fixed-length record (FLR) data is a reality for us at the MPC. Colin introduces readers to his Ruby Gem, HFLR, which makes processing hierarchical fixed-length record data a bit easier.
wordpress_id: 500
wordpress_url: http://tech.popdata.org/?p=500
date: '2015-01-28 11:10:23 -0600'
date_gmt: '2015-01-28 17:10:23 -0600'
categories: Code
tags: []
---
## What it is and How to Make it Go Away Using Ruby

Do you have data that looks like this ...

{% highlight text %}
01059en mountain0010
02326es montagne0001
05525fr montagne0033
05525it montagna0034
01059de berg0073
01066no fjell0085
03063po gara0089
{% endhighlight %}

or this?

{% highlight text %}
H010599999999
P05525
P02326
A12344001201
W230
P01916
H010599999999
P02516
A2212320601
A2232320602
W100
{% endhighlight %}

The above examples show two varieties of fixed length record data. Typically fixed length record data is a legacy of old survey or census data or other data that's rarely updated. Whatever it is, if you have it you know it's annoying to work with if you need to code a new application to consume it.

Fixed length data adheres to a layout (defined outside the data file.) The data is separated into records delimited by line breaks or possibly ASCII record separator (ASCII code 30.) See <a href="http://www.theasciicode.com.ar/ascii-control-characters/record-separator-ascii-code-30.html"> ASCII Record Separator</a>. Within each record, fields have no delimiters and instead depend on column locations specified elsewhere. Therefore each field must take the same number of columns to store in every record in the file.

The first example shows standard FLR (Fixed Length Record) data. The second example shows hierarchical FLR data. In this format, multiple records live in the same file. One column must provide record type information, in order to find the correct layout for that record type. Different record types may have different record lengths. In the example the first character indicates the record type. Some HFLR formats may have a record type identifier buried in the record or put at the end of each record (meaning the type identifier character could be at different locations on different record types.)

Before going on, I should point out that the FLR format has benefits. It's all a question of data volume and balancing various trade-offs. During the time these formats flourished, disk space, RAM and CPU time were all expensive, compared to this century. While now we might store a group of one hundred thousand records in a JSON or even XML format, during the dark ages of 1979 that would have taken too much disk space, and too much computation to parse into an application. Even now, a fixed-length format, especially when compressed, will be very fast to read and take a reasonably small space to store relative to JSON, while still remaining (somewhat) human readable, unlike highly packed binary formats, which would typically be the alternative to JSON, or standard databases. Single record type FLR data lends itself to be used by parallelized processes and fast streaming (as does CSV, as is often done with Hadoop.)

Single record type FLR data has the additional very nice property that you can very simply access any record randomly in constant time -- assuming it's in a 8-bit, 16-bit or 32-bit per character format -- unlike most other text based formats. (Note that UTF-8 will <em>not</em> work for this optimization.)

Hierarchical FLR data is a reasonable trade off between storage space and speed and simplicity of access for some applications. Additionally, relationships between records can be extracted from the structure of the file if it's read as a stream or at least as groups of records with the highest level record as the group separator.

All that said, if you need to frequently update your dataset or need to routinely use data either by retrieving and updating existing records or perform regular analysis and reporting off the data, you'd best get it into a database.

As I said, FLR data comes in two varieties. The usual single record type data file, given a code book, can easily be parsed and converted to CSV or JSON or imported to a database. Hierarchical fixed length data isn't so simple, since it has records of two or more types in one file, with different layouts. Furthermore, the arrangement of the records in the file usually carries information, as I mentioned above. For instance, you may have customer records followed directly by their orders, followed by shipping records. Sometimes the only thing linking the records together is their proximity -- foreign keys may not exist, but you may inferr that any order records directly following a customer record belong to that customer. When more than one record type lives in one file, you need a way to determine the type of each record, naturally. Good formats will use the first character of the record as a record type identifier, or possibly the last character. Bad formats will use a character at some offset within the line.

One other obvious knock on FLR data formats is that they are in no way self documenting, unlike CSV with a header line or XML or JSON. Without external metadata you can't even parse the data correctly. You need a "codebook" something like this:

{% highlight text %}
	Field Name, Start column, Column width
	CUSTID	2	4
	ZIP	6	5
	STREET	11	25
{% endhighlight %}

You'd also need to know if these column offsets start at 0 or 1.

#### Migrating to a More Modern Format

If you have data in fixed length record format, you probably have only one of four reasons for not already having migrated it into a standard database or converted to a more modern format:

1. The only operations on the data you care about require a full scan of the data and you have specialized software that already does this, or you have tools (like Stata or SPSS) which easily consume it.
1. Writing an importer script feels daunting as you don't have any off-the-shelf tools for this purpose provided by your database vendor. Perhaps the dataset has several record types mixed together making the task even more painful.
1. The specialized software that uses the data is so complex nobody knows how it works, and the effort to change the data source isn't deemed worth the effort.
1. You don't have an accurate codebook describing the dataset any more.

Even if your reason is (1) you may find that putting your data into a database would allow new uses of the data and easy linking with other data. In the case of (4), you should examine the data carefully. It may contain enough information to extract a few fields from the nonsense, and you could bootstrap yourself out of the problem. For (3), getting the data into an easy to use format may eliminate some of the complexity of that ancient, long forgotten software. You might find you can recreate at least some of the functions of the mystery application quite easily with modern tools. If, on the other hand, the import task just seems difficult, then you have nothing to complain about. Seriously, it's not a problem. At the end of this post, I'll show you how.

#### Uses of FLR in the Real World

At the Minnesota Population Center we consume a lot of hierarchical fixed length data. For example, the Current Population Survey from the BLS has been produced and archived in FLR format. The U.S. Census also put their data into hierarchical fixed length files. We use that data to build our CPS and IPUMS-USA data products. Sometimes third parties have distributed the data as separate files for each record type. For our purposes we recombine the data in order to simplify operations that need to examine groups of records. For instance, we calculate alternate poverty measures on households of people or on family groups within households. We do this in the process of building larger, richer datasets from these datasets, not to get the results of the individual calculations.

Over time the formats surveys were stored in have varied, usually using a variation of FLR. At some point we needed to standardize our tools for importing this data, so that in some instances we convert data back from native SAS or SPSS format or CSV into hierarchical FLR.

Another fixed length data source is the tabulated U.S. Census data which Census puts out every decade. Also Census puts out tabulated results of the American Community Survey. We consume this in the NHGIS application and distribute it in a searchable form with shape files at <a href="www.nhgis.org"> NHGIS </a>.

#### Reading FLR data with Ruby

For the most part at the MPC we have powerful software to consume and convert the fixed length formats given to us. However, in some cases it would be nice to access that directly with the language we use in our web applications, Ruby. Also, when the scale of the data is on the smaller side, the performance disadvantages of Ruby don't matter so much and the expressiveness is compelling.

A naive approach to reading FLR data with Ruby might look like this:

{% highlight ruby %}
	File.open(filename).each do |record_data|
	  custid = record_data.slice(2,4)
	  zip_code = record_data.slice(6,5)

	  # Do something with the extracted data....
	end
{% endhighlight %}

At first, To extract a few selected census tables out of large NHGIS fixed length files, I used this approach. However, the performance was unacceptably bad. So I optimized the code using Array's pack() and unpack(). I created a Ruby gem to parse simple FLR data. To allow myself to also reformat hierarchical FLR data and import it into relational databases, I added the ability to read multiple record types from one input file.

The gem is suitable for reading through and retrieving moderate sized data files on the order of ten million or fewer records (all depending on your patience, of course.) On a single record type FLR file you can randomly access any record in constant time. For that use case there's no size / performance tradeoff.

I spent a good deal of time tuning the code to be the best pure Ruby solution possible to parsing FLR data and it does quite well. The usefulness will depend a lot on whether you want to keep retrieving data at runtime or if you want to do a one-time import to another format. If you need a data extraction tool to run as fast as possible, write it with Perl or a compiled language like Java or C. I've considered writing native extensions for the HFLR gem to increase performance, but haven't done it yet.

You can get the HFLR gem at <a href="www.rubygems.org"> Rubygems.org </a>. Just do 'gem install hflr'. To read the code, run the tests or read the example code, do

<code>gem unpack hflr</code>

and you'll get the code dropped into your current working directory. It runs fine on any Ruby 1.9+ version of Ruby, including JRuby.

The gem requires that you know some, but not necessarily all, of the layout of the data file. For instance you could have a file like:

{% highlight text %}
	Z99fa**00535100471r
	199fa**00511080173l
	....
{% endhighlight %}

You know: 8..12 is the employee ID, 13..18 is date of birth (in the 20th century.) Perhaps the rest is meaningless or useless now.

The HFLR gem was designed to handle more than one record type in one input file. While this first example only has one record type, you will need to name the record type(s) in the file and provide their layout:

{% highlight ruby %}
	layout=>{:employees=>{
	:empl_id=>8..12,
	:birthdate=>13..18
	}}
{% endhighlight %}

Now you can make a new HFLR file with the layout:

{% highlight ruby %}
	employee_file = FLRFile.new(
		File.new("mysterious_employee_file.dat"),
		:employee, layout, 1, [:line_number])
{% endhighlight %}

The first argument to the initializer of FLRFile is just a Ruby 'File' with the text data you want to parse. The second is the type or types of the records in the file (examples of multiple types will come soon.) The third is the structure containing the layout(s) for the record types named in the second argument. The '1' in the fourth argument indicates whether to count columns in the input from 0 or from 1. Starting from one used to be fairly common but leaving it as a hidden default might be very confusing to users who don't know that. The last argument is a list of auto-generated variables that will appear in the parsed structs that the FLRFile object will emit after parsing an input record.

An FLRFile will respond to 'each()' so you can pass in any code to operate on each record. The record gets sent to the block as a 'Struct' class instance. Struct behaves like an array (data is stored internally as an array,) as a hash and as an object with methods named after the field names it's created with. Unlike Hash, however, you use 'members()' to get the member names rather than 'keys()' to get the key names in a Hash instance.

You can read through the file and access the known fields with their names:

{% highlight ruby %}
    employee_file.each do |empl_record|
        puts "ID: #{empl_record.empl_id} Birthdate: #{empl_record.birthdate}"	  

	# or
  	puts "ID: #{empl_record[:empl_id]} Birthdate: #{empl_record[:birthdate]}"	  

      	# or
      	puts "ID: #{empl_record[0]} Birthdate: #{empl_record[1]}"
    end
{% endhighlight %}

Convert to tab-delimited:

{% highlight ruby %}
	employee_data = File.open("employee_data.tsv","w")
	employee_file.each do |record|
	  employee_data.puts "#{record.empl_id}\t#{record.birthdate}"
	end
	employee_data.close

{% endhighlight %}

If you don't know the field names or want to print all of them you can access field names via the 'members' method. You could thus write a trivial 'show' method:

{% highlight ruby %}
    def show(record)
	print record.members.map{|m| m.to_s + ": " + record[m].to_s}.join(", ") + "\n"
    end
{% endhighlight %}

Now, here's an example of reading from a hierarchical fixed length file. Let's say you have data like this:

{% highlight text %}
	CJoe Smith                 55455025.53
	O0005233110-10-2008
	CJane Smith                55404015.25
	O0054933310-11-2008
	O0075789110-12-2008
{% endhighlight %}

And we have information on the layout, so we can make a layout structure:

{% highlight ruby %}
	layout=>{
	:customer=>{
	:name=>1..25,
	:zip=>26..30,
	:balance=>31..35}

	:order=>{
	:order_num=>1..8,
	:date=>9..19
		}
	}

	customer_orders_file = FLRFile.new(
	  File.new("customer_orders.dat"),
	  {"C"=>:customer,"O"=>:order},# Use these characters as record type markers
	  layout,
	  0, # shift parsed string 0 columns to the left of the indicated start column
	  {:customer=>[:line_number,:record_type],:order=>[:line_number,:record_type]}) # Add these columns to the indicated record types post read

	customer_orders_file.each do |record|
	    show record
	end

{% endhighlight %}

In [part two of this post]({% post_url /2015/2015-05-07-importing-fixed-length-data-using-ruby-part-two %}), I'll show how to import FLR data into a database using Active Record to help with validating data, and how to import multiple record types at once and set foreign keys between them.
