---
author: benklaas
title: "The 3 P's: Slurping Up Excel Data on the Quick with Python, Pandas, and Pickle"
teaser: 'If you have very large tables of data in a vendor-locked Excel jail, consider caching worksheets using Python+Pandas+Pickle.'
categories:
tags:
- IPUMS
- Excel
- Python
- Pandas
- Pickle
- Caching
---

# Tackling the Excel Overhead
------------------------------
We operate in a multi-platform environment here at Minnesota Population Center. Much of the metadata work done by our demographic researchers is accomplished using Microsoft Excel, and saved in .xls/.xlsx files. These files can often be VERY large, in some cases approaching 1 million lines. Further, we have _30,000+ individual worksheets_ that define metadata across the many microdata projects here. Downstream from this, however, we need more power. We run linux servers with loads of RAM and CPU to do the heavy lifting. We have an IT staff that use a mix of OS X and Linux as their day-to-day productivity environments. So, when we have tasks that involve e.g., auditing a large set of metadata to summarize issues, Excel itself can be a bottleneck to accomplishing those tasks. We do not want to burden our processing time with the overhead of the Excel GUI, nor is this often even feasible.

[Pandas] is an open-source tool for the Python language that provides incredibly fast methods for reading and working with tabular data. Out-of-the-box [Pandas] supplies a read_excel() method that will read in a worksheet of Excel data directly into a [Pandas] table, referred to as a data frame. Once in the data frame format, pulling information out is both simple and _insanely_ efficient. But, even reading the xlsx file via Pandas can add a fair bit of overhead, especially if you are reading very large worksheets and/or several thousand worksheets.

To get around the xls[x] read overhead, the data frame can be saved to disk using [Pickle], Python's object serialization library. After building a framework for pickling data frames, in practice it's a matter of deciding whether the pickled data is "fresh", i.e., an accurate reflection of the current Excel worksheet. If the pickle is fresh, we can load the data frame very quickly into memory. If it's not, we suffer the penalty on the initial read, but also pickle it as soon as we read it so the next read will be fast.

[Pandas]: http://pandas.pydata.org/
[Pickle]: https://docs.python.org/3.6/library/pickle.html

``` python

-- insert python code here

```

# The Two Hardest Things in Programming
------------------------------
The two hardest things in programming: naming things, cache validation, and off-by-one errors.

``` python

-- insert python code here

```

