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

# Tackling the Excel Overhead
------------------------------
We operate in a multi-platform environment here at Minnesota Population Center. Much of the metadata work done by our demographic researchers is accomplished on Windows using Microsoft Excel, and then saved to .xls/.xlsx files. These files can often be VERY large, in some cases approaching 1 million lines. Further, we have _30,000+ individual worksheets_ that define metadata across the many microdata projects here. Downstream from this, however, we need more power. We run linux servers with loads of RAM and CPU to do the heavy lifting. We have an IT staff that use a mix of OS X and Linux as their day-to-day productivity environments. So, when we have tasks that involve e.g., auditing a large set of Excel data to summarize issues, Excel itself can be a bottleneck to accomplishing those tasks efficiently. We do not want to burden our processing time with the overhead of the Excel GUI, nor is this often even particularly feasible.

[Pandas] is an open-source tool for the Python language that provides incredibly fast methods for reading and working with tabular data. Out-of-the-box [Pandas] supplies a read_excel() method that will read in a worksheet of Excel data directly into a [Pandas] table, referred to as a data frame. Once in the data frame format, pulling information out is both simple and _insanely_ efficient. But, even reading the xlsx file via Pandas can add a fair bit of overhead, especially if you are reading very large worksheets and/or several thousand worksheets.

To get around the xls[x] read overhead, the data frame can be saved to disk using [Pickle], Python's object serialization library. After building a framework for pickling data frames, in practice it's a matter of deciding whether the pickled data is "fresh", i.e., an accurate reflection of the current Excel worksheet. If the pickle is fresh, we can load the data frame very quickly into memory via the pickled data frame. If it's not, we (justly) suffer the penalty and execute Pandas read_excel()...but also pickle it as soon as we read it so the next time will be quick.

[Pandas]: http://pandas.pydata.org/
[Pickle]: https://docs.python.org/3.6/library/pickle.html

# The Two Hardest Things in Programming
------------------------------
The two hardest things in programming: naming things, cache validation, and off-by-one errors.

XXX describe spreadsheet class and how to load via read_excel/pickle

You'll notice in the docstring discussion of child classes to MpcSpreadsheet. It's beyond the scope of the article here, but suffice it to say that we build _a lot_ of object intelligence into the child classes to provide child-specific methods for efficiently accessing information. As the read_excel() and pickling logic are all here in the parent class though, every child class benefits from this architecture.

``` python
"""Parent class for MPC Spreadsheet objects."""
import pandas as pd
import os.path
import pickle
from . import utilities


class MpcSpreadsheet(object):
    """Parent class for all ipums.metadata spreadsheet child classes.

    All spreadsheet classes in the ipums.metadata namespace inherit from
    the MpcSpreadsheet parent class. MpcSpreadsheet provides generic
    methods for accessing spreadsheet information by parsing Excel files
    and storing them in a Pandas data frame.
    """

    def __init__(self, xlpath, pklpath):
        """Initialize parent class."""
        self.xlpath = xlpath
        self.just_pickled = False
        fresh = utilities.fresh_pickle(xlpath, pklpath)
        if fresh:
            self.ws = pickle.load(open(pklpath, 'rb'))
            self.is_pickled = True
        else:
            if os.path.exists(xlpath):
                self.ws = pd.read_excel(
                           xlpath,
                           na_values=['', ' '],
                           keep_default_na=False
                          )
            else:
                raise FileNotFoundError("File not found: " + xlpath)
            self.is_pickled = False

        # as convention, uppercase all columns and strip trailing whitespace
        self.ws.columns = map(str.upper, self.ws.columns)
        self.ws.columns = map(str.rstrip, self.ws.columns)

```


XXX describe get_pickle_path() method

``` python
"""utilities.py helper methods for ipums-metadata library."""

def get_pickle_path(project, xlpath, suffix='all', mock_windows=False):
    """Return path to a pickle file based on project and path to xls file.

    get_pickle_path will take a project and a path to a spreadsheet and
    return the correct path to its associated pickle file, whether that
    pickle file exists or not. There is an optional third argument, suffix,
    which will append to the filename (before the extention) with an _
    Since these pickle files are Pandas data frames, they are in pandas
    version specific directories.
    Example:
        utilities.get_pickle_path(
            'ipumsi', 'metadata/variables.xlsx', 'integrated')
        returns:
        /pkg/ipums/ipumsi/metadata/.pickle/0.17.1/metadata/variables_integrated.pkl

    optional argument of mock_windows is for testing purposes, to test
    windows paths on unix.
    """
    projDir = project_to_path(project, mock_windows=mock_windows)
    if mock_windows:
        xlPath = PureWindowsPath(xlpath)
    else:
        xlPath = Path(xlpath)
    relpath = xlPath.relative_to(projDir)
    root = str(relpath.parent)
    pandas_version = get_pandas_version()
    if suffix == 'all':
        pklpath = projDir + "/metadata/.pickle/" + \
                    pandas_version + "/" + root + "/" + relpath.stem + '.pkl'
    else:
        pklpath = projDir + "/metadata/.pickle/" + \
                    pandas_version + "/" + root + "/" + relpath.stem + '_' + \
                    suffix + '.pkl'
    if mock_windows:
        return str(PureWindowsPath(pklpath))
    else:
        return str(Path(pklpath))
```

XXX describe fresh_pickle() method

``` python
def fresh_pickle(xlpath, pklpath):
    """Return a boolean as to whether a spreadsheet's pickle file is fresh.

    A pickled spreadsheet is only valid if it is newer than the last updated
    time for the spreadsheet. This method is to identify whether the pickled
    file should be used.
    """
    if os.path.isfile(pklpath):
        if os.path.getmtime(pklpath) > os.path.getmtime(xlpath):
            return True
    return False
```

XXX describe pickle_dataframe() method

``` python
def pickle_dataframe(path, df):
    """Pickle data frame to disk.

    pickle_dataframe(path, df) will write a dataframe df to disk at path.
    Generally this is not called outside of __init__ methods for metadata
    child classes.
    """
    try:
        print("pickling to:", path)
        picklepath = Path(path)
        pickle_dir = str(picklepath.parent)
        if not os.path.exists(pickle_dir):
            os.makedirs(str(pickle_dir))
        f = picklepath.open(mode='wb')
        pickle.dump(df, f)
        f.close()
        return True
    except:
        return False
```

