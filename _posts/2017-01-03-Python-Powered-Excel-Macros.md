---
author: benklaas
title: 'Towards a Sustainable Excel: Building Macros With Python'
teaser: 'Excel macro development can cause shudders amongst developers. While VBA is an antiquated language not even Microsoft recommends using, there is an option outside of a bulky .NET solution: Python.'
---

intro
------------------------------
This is the third post in our Unicorn Rainbow series. In previous posts we examined [Excel menu creation][] and [handling version control][] in VBA and Excel. In this article I will describe how we incorporated Python into our Excel toolkit.

[Excel menu creation]: {{site.url}}/unicorn-1-menu/
[handling version control]: {{site.url}}/unicorn-1-menu/

Excel macros. Just uttering these words can cause shudders amongst developers. Historically, Visual Basic for Applications (VBA) was the only option for writing macros in Excel. Microsoft now recommends using .NET for Applictions, however for software teams that are otherwise focused on open-source languages, like Python, this is a solution that carries a lot of overhead. Using Felix Zumenstein's excellent Python-to-Excel library and bridge technology [xlwings][], it is now possible to develop Excel macros in Pyhon.

[xlwings]: https://xlwings.org

# Why Python?
------------------------------

Any "why this language" discussion can be contentious for a variety of valid and not-so-valid reasons. In our case, Python is a great choice because:

* The Excel-to-Python link is already possible, implemented, and readily available.
* We have in-house Python expertise.
* Iterating and debugging Python is much quicker than VBA. Much. Quicker. You can attach a dollar figure on that but it has the added benefit of leaving work with a smile and an unclenched jaw.
* Our behind-the-scenes data processing code runs on Linux and heavily leverages Python. Further, we use in-house metadata Python libraries to efficiently harvest information by reading spreadsheets into [pandas][] dataframes. Having those libraries also usable from Windows via Python-based Excel macros is HUGE for us.

[pandas]: https://pandas.pydata.org

# background xlwings and our implementation
------------------------------
In order to call Python in Excel, a bridge technology is needed. There are a few different solutions for this problem, including [PyXLL][] and [DataNitro][]. After evaluating our options, we settled on [xlwings][]. It had a few advantages over competing technologies:

* xlwings is callable from outside Excel. Of particular interest is the ability to interact with Excel inside [Jupyter Notebooks][]. So while creating Python-based Excel macros was our primary goal, this added bonus was a big deal.
* We like free and open-source software, and xlwings is both.
* We liked the relatively clean API xlwings provides for interacting with Excel workbooks.

[PyXLL]: https://www.pyxll.com
[DataNitro]: https://datanitro.com
[Jupyter Notebooks]: https://jupyter.org/

Getting xlwings running inside Excel at a superficial level involves adding a xlwings.bas file that xlwings provides. In our implementation there's a little more to it than that, but beyond the scope of this article. Suffice it to say, xlwings has the link covered.

# putting xlwings into action in our menu-driven system: python-based "tools"
--------------------------------------
# XXX Step through how to add a menu item, connect it to a tool, and build a Python-based tool. KEEP IT SIMPLE

# add_in: handling messaging with msg_box
--------------------------------------
# XXX Step through how to push a message using msg_box

# the future: using conda to install and manage Python environments in production (including ipums-metadata and custom channel), using the cluster, via macros, to do things that benefit from faster computers
----------
