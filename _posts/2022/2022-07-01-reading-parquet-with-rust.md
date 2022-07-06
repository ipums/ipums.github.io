---
author: ccd
title:  Reading the Parquet Data Format in Rust
teaser: "Move Beyond the Basic Examples"
categories: Code
tags:
- Rust
- Parquet
---

Effectively using the "parquet" ___Rust___ crate to read data in the Parquet format isn't too dificult, but more detailed examples than those in the official documentation would really help. In this article I'll present some sample code to fill that gap.

I assume basic ___Rust___ knowledge. You should know how to set up a project with Cargo and know some ___Rust___. The code here is kept simple and skips most error handling for brevity.

## Introduction 

Recently, a new IPUMS utility needed to read Parquet data, and it needed to be fast and use low amounts of memory. We chose ___Rust___ because of its performance, and the fact it had good Parquet support.  It required use of a few key "parquet" crate features I'll outline in the post. The project was to allow the ___Stata___ statistical software to read from Parquet data. While that code has too many ___Stata___ specific quirks to make it easy to present as the first example code in an introductory article, the main points outlined next were what made it possible. The utility had to feed ___Stata___ data at a fast rate, as if it were reading directly from a data file. 

### What and Why of Parquet

The Parquet data format groups data into "files" that you can think of as collections of records, or tables. Unlike typical record oriented formats, Parquet physically organizes data first by column, to accelerate operations concerned with only a few columns at once. The Parquet format supports high-performance analytic workloads or really any type of data task that you might characterize as requiring a long vertical slice out of horizontally wide data. 

On top of the fundamental columnar structure, Parquet employs powerful compression and encoding of data to reduce on-disk storage and retrieval times.

Parquet files have a "schema", much like a database table has a schema, though a Parquet schema is potentially more complex than a flat table, with nested schemas.

Read <a href="https://parquet.apache.org/docs/file-format/"> more here. </a>

### Parquet in Rust

Since Parquet is built for high performance, it makes sense that you may wish to use it with a high-performance language like ___Rust___

The ___Rust___ ___Arrow___ library, <a href="http://github.com/apache/arrow-rs"> arrow-rs </a>  has recently become a first-class project outside the main <a href="https://github.com/apache/arrow"> Arrow </a> project. The official Apache ___Rust___ crate supporting ___Parquet___ lives in the ___arrow-rs___ project.  

The Arrow and Parquet projects have undergone a lot of development over the last few years.  Last year when I began using the Apache "parquet" crate it was at version 4.0, and they're now up to 15.0 with many features recently available.

I'll give example source code to accomplish each of the following:
* Printing the schema including logical and physical column types, column numbers and names
* Getting parquet file metadata statistics like numbers of rows and row groups
* Reading a subset of columns from the file (a "schema projection".) Doing this could vastly speed up reads.
* Extracting data row by row and working with the values

All these are possible and fairly easy with  the ___Rust___ "parquet" crate if you can see it done. The documentation has some extremely basic example code which may not be enough to get you started, especially if you're not super familiar with the Parquet and Arrow APIs for ___Java___ or ___C++___. To work out what to do you'll need to read the source code to the ___Parquet___ crate, but even then  it helps to know where to look. Reading the test source code can help too.

"Arrow-rs" gives you three ways to work with data from Parquet: For reading Parquet data as records there's a high-level Arrow backed "record batch" API, a row oriented record Parquet file interface, and also a low-level column API.

Those who have worked with Parquet schema types for the ___Java___ and ___C++___ Parquet and Arrow APIs will find the ___Rust___ implementation familiar. 


* If you need to work with large amounts of Parquet data efficiently in memory or perform calculations on the data in memory you will want to investigate the "arrow" module and the <a href="https://docs.rs/parquet/latest/parquet/arrow/arrow_reader/struct.ParquetFileArrowReader.html"> Arrow Parquet reader.</a> 
* If you need to get high performance when accessing a few columns at once you should look at the low-level column reader and writer support in the "parquet" crate: <a href="https://docs.rs/parquet/latest/parquet/column/index.html"> column API.</a> (It's not the simplest approach though.)
* The simplest and potentially most memory efficient way to access Parquet data is by using the `parquet::file` and `parquet::record` <a href="https://docs.rs/parquet/latest/parquet/record/index.html">modules.</a> That's what we'll look at here. 

### Setting Up

Create a new project with `cargo new parquet_examples`. Then add the "parquet" crate as a dependency.

To use the "parquet" crate in your own project, add `parquet = "15.0.0"` to your "Cargo.toml" file (15.0.0 is the latest version available for download as of this writing.) The 15.0.0 Parquet version requires a recent ___Rust___ version. I used version 1.59.0. You can update using the <a href="https://rustup.rs/"> Rustup</a> utility.

Now you should be able to add the example code to your `src/main.rs` file.

### Simple Parquet Reader Example

From the documentation for the `parquet::record::Row` struct, , you see how to set up a reader and process records (not columns) from a Parquet file. 

```rust
use std::fs::File;
use std::path::Path;
use parquet::file::reader::{FileReader, SerializedFileReader};

let file = File::open(&Path::new("/path/to/file")).unwrap();
let reader = SerializedFileReader::new(file).unwrap();
let mut iter = reader.get_row_iter(None).unwrap();
while let Some(record) = iter.next() {
    println!("{}", record);
}
```

This gets you started, but leaves a few questions unanswered. How do I work with data? How do I select only the columns I need? You can dig into the Parquet source code and learn how to extract column values from the records; if you have an IDE like VScode that task will be easier. However, it's not obvious how to use the API effectively for some essential tasks.

### Reading the Schema

Parquet allows nested schema definitions, but I'm not going to go into that much here. To start with you probably at least want to know how to read  column information from a simple Parquet file made up of a group of columns.

To begin with, understand that Parquet files have file metadata, and schema information. The file metadata has statistics like number of rows and row groups; the schema has the description of columns in the file. A schema can  be a group or primitive node: A group node has inside of it a list of other schema nodes which in turn may be group or primitive nodes. In the simplest (and most common) type of Parquet file the schema is a group node that holds a list of primitive columns. The file metadata holds the schema.

Note: A Parquet "file" can actually be multiple files in a directory (normally with a ".parquet" suffix on its name.) These are sometimes produced by big data  frameworks because they're transforming data in parallel; each individual file represents one worker's output. Sometimes each file could be part of a partitioned dataset where the files contain related data, like states, provinces, or ranges of serial numbers -- really anything sortable. To start with we'll stick to reading single files.

#### File Metadata

```rust
let file = File::open(&Path::new(&self.parquet_path)).expect("Couldn't open parquet data");
let reader = SerializedFileReader::new(file).unwrap();
let parquet_metadata = reader.metadata();
let _rows = parquet_metadata.file_metadata().num_rows();
```

#### Schema

You get the schema from the file metadata:

```rust
let fields = parquet_metadata.file_metadata().schema().get_fields();

// Iterate over fields
// We use the enumerate() so that we can get the column number along with the other information
// about the column/ column number can be  used to access a column in a Parquet file.
for (pos, column) in fields.iter().enumerate() {
	let name = column.name();
	println!("Column {}: {}", pos, name);
}
```

#### Column Types

The `parquet::schema` module  supports general "Logical" types, or as a  specific physical type. Until recently the generic types were called "Logical Types." These are now known as "converted types," (this is for the transition to ___Parquet___ version 4.0.)  

The actual type names have changed: Check the documentation in the source code carefully and use the "converted type" to avoid confusion. Just Googling for "logical types Rust" will serve up old or contradictory information.

You may actually want the physical Parquet type names to assist moving data into other ___Rust___ variables.  These type names include "double", "float", "int64", "int32", "byte array", "bool," and others. The physical type names correspond  to types a programming language might use. To make things even more confusing, in the ___Rust___ module where the physical types are defined the enum is named "Type"." You alias it to something else to avoid a name clash:

```rust
use parquet::basic::Type as PhysicalType;
```

Here's how you could print a flat Parquet schema. This is a complete program:

```rust
extern crate parquet;
use parquet::file::reader::{FileReader, SerializedFileReader};
use parquet::basic::Type as PhysicalType;
use std::fs::File;
use std::path::Path;
use std::env;
use std::process;

fn main(){
	let args: Vec<String> = env::args().collect();
	if args.len()<2{
		println!("Usage: print_{} file.parquet",&args[0]);	
		process::exit(1);
	}
	
	let parquet_path = &args[1];	
	let file = File::open(&Path::new(parquet_path)).expect("Couldn't open parquet data");
	let reader = SerializedFileReader::new(file).unwrap();
	let parquet_metadata = reader.metadata();               
	let fields = parquet_metadata.file_metadata().schema().get_fields();              
	
	for (pos, column) in fields.iter().enumerate() {
		let name = column.name();
		        
		let p_type = column.get_physical_type();
		// print type names you'd need if a Rust program consumed the data...
		let output_rust_type = match p_type {					
			PhysicalType::FIXED_LEN_BYTE_ARRAY=>"String",
			PhysicalType::BYTE_ARRAY=> "String",
			PhysicalType::INT64=>"i64",
			PhysicalType::INT32=> "i32",
			PhysicalType::FLOAT => "f32",
			PhysicalType::DOUBLE=> "f64",
			_ =>panic!(
				"Cannot convert  this parquet file, unhandled data type'{}'  for column {}",
				&p_type, name),									
		};
		println!("{} {} {}",pos, name, output_rust_type);			
	} // for each column
}		
```
If you only want to print types and names rather than validating the schema and printing the ___Rust___ equivalent type, you could skip the match and print the type names:

```
println!("{} : {}", name, &p_type);
```

### Read a Schema Projection to Unlock Parquet's Superpower

Reading only a part of the full schema saves time if you don't need all the values in the rows. Not only will the retrieved rows be smaller but the big advantage is that the Parquet reader will only need to visit the parts of the Parquet file that have the data you want. 

Imagine an extreme  scenario where you need to access all records in a very large amount of data. It could be in a database  or a raw file of records. We have delivery records for packages handled by a home delivery service. there are a lot and they're big records.

The problem: You need only an delivery date and shipping time for every delivery out of the "orders" table. That table also has eighty other columns and in particular one column full of very large data: A picture of the delivery location and package. You want to access all records at once for some analytical purpose, but only need those delivery times. The whole file of 50,000 orders might take three hundred gigabytes, but the  delivery date and ship time would only take up 800 KB or so on their own.   

In a traditional arrangement, you might only store a link to the image data to keep the orders table smaller.  In a columnar structure you can maintain a simpler system and keep everything together, because you're reading only the columns you're interested in. The file is organized not by record, but by column. So, if you don't care about pictures you don't read the pictures column, so you don't read that region of the file. Since the delivery date and ship time columns are each stored in contiguous blocks in the file it takes no longer than it would normally take to read less than a megabyte of data.

Parquet gives you that power. To read serialized records only containing  your columns of choice, you must construct a "schema projection" which is a schema definition with only the columns you want. You pass this to the  serialized reader's `get_row_iter()` method. If you pass in `None` the reader reads the entire schema stored in the Parquet file; otherwise you would do something like:

```rust
	let mut row_iter = reader.get_row_iter(Some(schema_projection)).unwrap();
```


#### Building a Schema Projection

We'll pass in the column names we want to extract as arguments on the command line. We want to retain the part of the Parquet schema that has columns with these same names.

```rust
// consider everything on the command line after the parquet file 
// name to be a column name
let requested_fields = &args[2..];
		
let mut selected_fields = fields.to_vec();
if requested_fields.len()>0{
	selected_fields.retain(|f|  
		requested_fields.contains(&String::from(f.name())));
}			

// Now build a schema from these selected fields:
let schema_projection = Type::group_type_builder("schema")
	.with_fields(&mut selected_fields)
	.build()
	.unwrap();
```


#### Reading Selected Data

Now that we have a schema projection we can make a reader and pass the projection to it:

```rust
use parquet::file::reader::{FileReader, SerializedFileReader};

let reader:SerializedFileReader<File> = SerializedFileReader::new(file).unwrap();
let mut row_iter = reader.get_row_iter(Some(schema_projection)).unwrap();
```

As we read rows, we'll want to manipulate data on the rows, or display it somehow depending on the task. Let's start with formatting the rows returned by the reader. Here's a small formatter to make a row with values separated by a delimiter. You can see how data from individual columns can be accessed:

```rust	
// This is for demonstration purposes; if you have string data to format
// consider using the CSV Writer library or picking your delimiter carefully.
fn format_row(row : &parquet::record::Row, delimiter: &str) -> String {    
	row.get_column_iter()
		.map(|c| c.1.to_string())
		.collect::<Vec<String>>()
		.join(delimiter)
}
```

The main loop to read Parquet data and turn it into records would look like this.

```rust
while let Some(record) = row_iter.next() {	
	println!("{}",format_row(&record, &delimiter));
}
```


## A Working Program

Let's finish up by putting all the pieces together. The final program will be able to print a flat schema if it consists of simple data types that could reasonably be formatted as a CSV or other type of delimited text data. The same program will alternatively accept a list of column names to extract and format into CSV output or print all data if no column names are given. 

While this isn't much, it's an actually useful program that lets us convert to CSV so that some tools that can't read Parquet can work with data originally stored in the Parquet format. Note that string data isn't escaped, so pick you're delimiter carefully or add that logic, preferably a proper CSV writer.


```rust
extern crate parquet;
use parquet::file::reader::{FileReader, SerializedFileReader};
use parquet::record::Row;
use parquet::schema::types::Type;
use parquet::basic::Type as PhysicalType;

use std::fs::File;
use std::path::Path;
use std::env;
use std::process;
use std::sync::Arc;


fn print_schema(
		fields:&[Arc<parquet::schema::types::Type>]
	){
	
	for (pos, column) in fields.iter().enumerate() {
		let name = column.name();		       
		let p_type = column.get_physical_type();
		let output_rust_type = match p_type {					
			PhysicalType::FIXED_LEN_BYTE_ARRAY=>"String",
			PhysicalType::BYTE_ARRAY=> "String",
			PhysicalType::INT64=>"i64",
			PhysicalType::INT32=> "i32",
			PhysicalType::FLOAT => "f32",
			PhysicalType::DOUBLE=> "f64",
			_ =>panic!(
				"Cannot convert  this parquet file, unhandled data type for column {}", 
				name),									
		};
		println!("{} {} {}",pos, name, output_rust_type);			
	} // for each column	
}


fn print_data(
	reader: &SerializedFileReader<File>, 
	fields:&[Arc<parquet::schema::types::Type>], 
	args:Vec<String>){
	
	let delimiter = ",";	
	let requested_fields = &args[2..];
		
	let mut selected_fields = fields.to_vec();
	if requested_fields.len()>0{
		selected_fields.retain(|f|  
			requested_fields.contains(&String::from(f.name())));
	}			
	
	let header: String = format!("{}",
		selected_fields.iter().map(|v| v.name())
		.collect::<Vec<&str>>().join(delimiter));
				
	let schema_projection = Type::group_type_builder("schema")
			.with_fields(&mut selected_fields)
			.build()
			.unwrap();

	let mut row_iter = reader
		.get_row_iter(Some(schema_projection)).unwrap();
	println!("{}",header);
	while let Some(record) = row_iter.next() {	
		println!("{}",format_row(&record, &delimiter));
	}
}

fn format_row(
		row : &parquet::record::Row, 
		delimiter: &str) -> String {  
	
	row.get_column_iter()
		.map(|c| c.1.to_string())
		.collect::<Vec<String>>()
		.join(delimiter)
}


fn main(){
	// Keeping argument handling extra-simple here. 
	// For anything more complex consider using the 
	// "clapp" crate.
	let args: Vec<String> = env::args().collect();
	if args.len()<2{
		println!("Usage: print_{} file.parquet [--schema] [column-name1 column-name2 ...]",
			&args[0]);					
		process::exit(1);
	}
	
	let parquet_path = &args[1];	
	let file = File::open(
		&Path::new(parquet_path))
		.expect("Couldn't open parquet data");
		
	let reader:SerializedFileReader<File> = SerializedFileReader::new(file).unwrap();
	let parquet_metadata = reader.metadata();               
	
	// Writing the type signature here, to be super 
	// clear about the return type of get_fields()
	let fields:&[Arc<parquet::schema::types::Type>] = parquet_metadata
		.file_metadata()
		.schema()
		.get_fields();              
	
	if args.len()>2 && args[2] == "--schema"{
		print_schema(fields);
	}else{
		print_data(&reader, fields, args);
	}	
}	

```

