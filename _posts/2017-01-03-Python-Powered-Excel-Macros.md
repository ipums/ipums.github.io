---
author: benklaas
title: 'Towards a Sustainable Excel: Building Macros With Python'
teaser: 'Excel macro development can cause shudders amongst developers. While VBA is an antiquated language not even Microsoft recommends using, there is an option outside of a bulky .NET solution: Python.'
---

intro
------------------------------
Excel macros. Just uttering these words can cause shudders amongst developers. Historically, Visual Basic for Applications (VBA) was the only option for writing macros in Excel. Microsoft now recommends using .NET for Applictions, however for software teams that are otherwise focused on open-source languages, like Python, this is a solution that carries a lot of overhead. Using Felix Zumenstein's excellent Python-to-Excel library and bridge technology [xlwings](http://xlwings.org/), it is now possible to develop Excel macros in Python.

# describe previous blog posts

# background xlwings and our implementation
[xlwings](http://xlwings.org/)
------------------------------
...xlwings goes into detail with regards to how to make it work inside Excel. In the blog post go into detail about our own implementation of linking it.

# using our installer to install miniconda, create ipums_excel conda environment (which includes xlwings), and use it for the macros
[Conda](http://conda.pydata.org/docs/)
--------------------------------------

# putting xlwings into action in our menu-driven system: python-based "tools"
--------------------------------------

# add_in: handling messaging with msg_box
--------------------------------------

# back to conda: pulling in ipums-metadata library via conda custom channel
--------------------------------------

# the future: using the cluster, via macros, to do things that benefit from faster computers
----------

