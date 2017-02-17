---
author: benklaas
title: "Slurping Up Excel Data on the Quick: Python, Pandas, and Pickle"
teaser: 'If you have very large tables of data imprisoned in a vendor-locked Excel jail, consider setting them free by caching worksheets using Python+Pandas+Pickle.'
categories:
tags:
- IPUMS
- Excel
- Python
- Pandas
- Pickle
- Caching
---

# Tackling the Excel Overhead Problem
------------------------------
Much of the metadata work done by our demographic researchers at the Minnesota Population Center is accomplished on Windows using Microsoft Excel, and then saved to .xls/.xlsx files. These files can often be VERY large, in some cases approaching 1 million lines. Further, we have _30,000+ individual worksheets_ that define metadata across the many microdata projects here.

Downstream from this, however, we need more power. We run Linux servers with loads of RAM and CPU to do the heavy lifting. When we have tasks that involve e.g., auditing a large set of Excel worksheets to summarize issues, Excel itself can be a bottleneck to accomplishing that task efficiently. We do not want to burden our processing time with the overhead of the Excel GUI, nor is this often even particularly feasible.

[Pandas] is an open-source tool for the Python language that provides incredibly fast methods for reading and working with tabular data. Out-of-the-box [Pandas] supplies a <span style="hyphens: none">`read_excel()`</span> method that will read in a worksheet of Excel data directly into a [Pandas] table, referred to as a data frame. Once in the data frame format, pulling information out is both simple and _insanely_ efficient. But, even reading the xlsx file via Pandas can add a fair bit of overhead, especially if you are reading very large worksheets and/or several thousand worksheets.

To get around the xls[x] read overhead, the data frame can be saved to disk using [Pickle], Python's object serialization library. After building a framework for pickling data frames, in practice it's a matter of deciding whether the pickled data is "fresh", i.e., an accurate reflection of the current Excel worksheet. If the pickle is fresh, we can load the data frame very quickly into memory via the pickled data frame. If it's not, we (justly) suffer the penalty and execute Pandas `read_excel()`...but also pickle it as soon as we read it so the next time will be quick.

[Pandas]: http://pandas.pydata.org/
[Pickle]: https://docs.python.org/3.6/library/pickle.html


# Defining a Spreadsheet Class
------------------------------
Defining a class to read and store the Excel data as a data frame is the first step to the process. This is the basic logic of an `MpcSpreadsheet` object:

``` python
"""Parent class for MPC Spreadsheet objects."""
import pandas as pd
import os.path

class MpcSpreadsheet(object):
    """Parent class for all ipums.metadata spreadsheet child classes.

    All spreadsheet classes in the ipums.metadata namespace inherit from
    the MpcSpreadsheet parent class. MpcSpreadsheet provides generic
    methods for accessing spreadsheet information by parsing Excel files
    and storing them in a Pandas data frame.
    """

    def __init__(self, xlpath, projdir):
        """Initialize parent class."""
        self.xlpath = xlpath
        self.projdir = projdir
        if os.path.exists(xlpath):
            self.ws = pd.read_excel(xlpath)
        else:
            raise FileNotFoundError(
                    "File not found: " + xlpath)

        # as a convention, uppercase all columns
        # and strip trailing whitespace
        self.ws.columns = map(str.upper, self.ws.columns)
        self.ws.columns = map(str.rstrip, self.ws.columns)
```

A couple of things to note here. The object is initialized with a path to the Excel workbook, and the project directory path (more on that later). After confirming the file exists, the `__init__` method reads the Excel worksheet[^1] into a data frame with `Pandas.read_excel()`, then stores the frame in the object as `self.ws`. As a helpful convention and forced standardization, we uppercase and strip trailing whitespace from all of our column headings (Row 1 of the spreadsheet). This is to avoid issues of header formatting when comparing two worksheets, each with a comparable column of data. For example, one worksheet has column heading "Variable " and another is "VARIABLE".

So, this class defines a Python object that reads an Excel worksheet into Pandas. Once in Pandas, we can access information really quickly, but how much overhead is there in getting the data from Excel to Pandas?

Benchmark[^2] of reading in 1 very large Excel file:

```shell
    %%timeit
    v  = MpcSpreadsheet('metadata/variables.xlsx', '/my/work/dir')

    1 loops, best of 3: 50.3 s per loop
```

Ouch.

How about 1,000 not so very large files?

```shell
    %%timeit
    for v in all_vars[0:1000]:
        sheet = MpcSpreadsheet('variables/' + v + '.xls', '/my/work/dir')

    1 loop, best of 3: 1min 49s per loop
```

Judging from those benchmarks, even with the power and speed Pandas promises once our tables are in data frame format, we still haven't solved the Excel bottleneck. Parsing in the data from the xlsx format is slow. This is where Pickle, from Python's standard library, can help.

Following a basic understanding of pickling Python objects to disk, the first thing needed is a strategy for caching the pickled data frames.

Let's say we have a project directory (in the object, this is `self.projdir`) with the following structure:

  * /my/work/directory
      * a/
          * foo.xlsx
      * b/
          * foobar.xlsx
      * c/
          * d/
              * test.xlsx
              * test2.xlsx

There are lots of potential organizational schemes for where the pickles should go. For example, right alongside the excel files is one option. In our case we don't want to add noise to the Excel file lists that our researchers are frequently browsing. Instead, a completely mirrored structure within a .pickle/ subdirectory of `self.projdir` is what we use:

  * /my/work/directory
      * a/
          * foo.xlsx
      * b/
          * foobar.xlsx
      * c/
          * d/
              * test.xlsx
              * test2.xlsx
      * .pickle/
          * a/
              * foo.pkl
          * b/
              * foobar.pkl
          * c/
              * d/
                  * test.pkl
                  * test2.pkl

Alright, that's a plan! Now all that's left is implementing it!

To build this structure we add several methods to our `MpcSpreadsheet` class:

1. `get_pickle_path()` evaluates the object's xlpath to determine where the path to the pickle needs to be. This is where knowing the base directory for the project's work, stored in `self.projdir` is essential, as the .pickle/ subdirectory builds from that directory.
2. `fresh_pickle()` compares the file mtime of the pickle (if it exists) to the spreadsheet file. If it's present and newer, the pickle is "fresh" and the cache is validated[^3].
3.  `pickle_dataframe()` takes the data frame at `self.ws` and pickles it to self.pklpath (along with creating whatever directories are necessary using `os.makedirs`) for future use.

``` python
def get_pickle_path(self):
    """Return path to a pickle file based on project and path to xls file.

    get_pickle_path will take a project and a path to a spreadsheet and
    return the correct path to its associated pickle file, whether that
    pickle file exists or not.
    Since these pickle files are Pandas data frames,
    they are in pandas version-specific directories.
    Example:
        utilities.get_pickle_path('ipumsi', 'metadata/samples.xlsx')
        returns:
        /pkg/ipums/ipumsi/metadata/.pickle/0.19.1/metadata/samples.pkl

    """

    xlPath = Path(xlpath)
    relpath = xlPath.relative_to(self.projdir)
    root = str(relpath.parent)
    pklpath = '/'.join(['.pickle', root, relpath.stem, '.pkl'])
    # stringify Path object makes return string cross-platform
    return str(Path(pklpath))

def fresh_pickle(self):
    """Return a boolean as to whether the pickle file is fresh.

    A pickled spreadsheet is only valid if it:
        1. exists
        2. is newer than the last updated time for the spreadsheet.
    fresh_pickle() identifies whether the pickled file should be used.
    """
    if os.path.isfile(self.pklpath):
        if os.path.getmtime(self.pklpath) > os.path.getmtime(self.xlpath):
            return True
    return False

def pickle_dataframe(self):
    """Pickle data frame to disk.

    pickle_dataframe() writes the data frame self.ws to disk.
    """
    try:
        print("pickling to:", self.pklpath)
        picklepath = Path(self.pklpath)
        pickle_dir = str(picklepath.parent)
        if not os.path.exists(pickle_dir):
            os.makedirs(str(pickle_dir))
        f = picklepath.open(mode='wb')
        pickle.dump(self.ws, f)
        f.close()
        return True
    except:
        return False
```

Finally, we build these method calls into the object's `__init__`, allowing the object to be instantiated from either a pickle or from the Excel file, whichever is deemed appropriate.

Further, if the file is read in from Excel the pickling automatically happens immediately, making the next read much faster via the pickle (provided the pickle is still "fresh").

``` python
import pandas as pd
import os.path
import pickle
from pathlib import Path

class MpcSpreadsheet(object):
    """Parent class for all ipums.metadata spreadsheet child classes.

    All spreadsheet classes in the ipums.metadata namespace inherit from
    the MpcSpreadsheet parent class. MpcSpreadsheet provides generic
    methods for accessing spreadsheet information by parsing Excel files
    and storing them in a Pandas data frame.
    """

    def __init__(self, xlpath, projdir):
        """Initialize parent class."""
        self.xlpath = xlpath
        self.projdir = projdir
        self.pklpath = self.get_pickle_path()
        fresh = self.fresh_pickle()
        if fresh:
            self.ws = pickle.load(open(pklpath, 'rb'))
        else:
            if os.path.exists(xlpath):
                self.ws = pd.read_excel(xlpath)
                utilities.pickle_dataframe(self.ws, pklpath)
            else:
                raise FileNotFoundError(
                    "File not found: " + xlpath)

        # as a convention, uppercase all columns
        # and strip trailing whitespace
        self.ws.columns = map(str.upper, self.ws.columns)
        self.ws.columns = map(str.rstrip, self.ws.columns)
```

Here's the same benchmark tests after those files have been pickled, first for reading a very large Excel file, then reading 1,000 smaller Excel files.

```shell
    %%timeit
    v  = MpcSpreadsheet('metadata/variables.xlsx', '/my/work/dir')

    1 loops, best of 3: 1.58 s per loop

    %%timeit
    for v in all_vars[0:1000]:
        sheet = MpcSpreadsheet('variables/' + v + '.xls', '/my/work/dir')

    1 loop, best of 3: 29.6 s per loop
```

Alright, that's quite an improvement! The biggest gain is in the large file read, where the 50s read is reduced to about 1.5 seconds, a 33x improvement. However, even reading 1,000 smaller files reduces the time required by 3x, from 1.5 minutes to 30 seconds.

In the MpcSpreadsheet docstring above, you'll notice discussion of child classes to MpcSpreadsheet. It's beyond the scope of the article here, but suffice it to say that we build _a lot_ of object intelligence into the child classes. Each child class provides class-specific methods for efficiently accessing information directly from the data frame. However, since the `read_excel()` and pickling logic are all here in the parent class, every child class benefits from this architecture. The only expectation of the child class is that there is a data frame initialized that is the exact representation of the spreadsheet. The object doesn't care whether it originates from a pickled data frame or from the Excel file itself. After all, if the pickle is fresh, they are going to be identical.

Summing it all up: without doing anything particularly groundbreaking, great utility can be had using the standard libraries Python provides. Especially when coupled with the processing power of Pandas, we're really making spreadsheet data analysis fly with Pickle.

[^1]: For simplification in the article I am treating all Excel workbooks as single worksheet workbooks. Pandas.read_excel() has the tools to read all worksheets in a workbook, either individually by name or as an ordered list. That extra layer of complexity wasn't going to add much to the topic at hand, which is why I'm making the 1-worksheet per workbook assumption here.

[^2]: Benchmarks were performed using iPython's `%%timeit` cell magic, which is not the most scientific measurement possible, but does the job in providing rough insight into the improvement gains we accomplish in this article.

[^3]: The two hardest things in programming: Naming things, cache validation, and off-by-one errors.
