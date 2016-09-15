---
author: jerdmann
title: 'Pandas, Bokeh, Jupyter and Conda in Templated Reporting'
teaser: ''
---

At the MPC we have several microdata projects, each with varied characteristics.  Some have thousands of variables, some have hundreds of samples, and some have both.  One of the challenges we have when we are preparing these datasets is how to check for expected results across all of these variables and/or samples. Consistent and thorough automated checks were difficult to come up with because of the variation across projects.  Researchers on each project were mainly left to their own devices to manually check the metrics they thought were most likely to show erros in the data preparation.  They would do this by loading the data into the stats package of their choice.  This can be effective because researchers do in fact have great intuition about the types of problems we tend to have during data preparation, but it also leaves huge holes in coverage and is a much more time consuming process than it needs to be.  

Luckily, these diverse projects are fed through a common tool, the [Data Conversion Program (DCP)]({{site.url}}/harmonizing-data-at-the-mpc/), and this gives us a single point to hook into to try to add automated data quality checks. One byproduct of a run through the DCP is a set of frequency tables for every value of every variable of every sample for every project. Thes frequency tables are stored as CSV files by variable and sample.  So, if one sample has 1,000 variables and another sample has 800 variables, between them there are 1,800 CSV files regardless of how many variables are in common between the two.  

That's not great for humans trying to sort through output looking for problems, but it is a great data source for tools to leverage to help identify what are the biggest differences between two samples and highlight potential problems for human review.  In this post, we'll discuss how we leverage these frequency tables to automatically generate what we call DCP Analytics, which researchers can utilize to quickly verify that they're getting expected results, and if they aren't, to see where a data preparation run may have gotten into trouble.

[Jupyter](http://jupyter.org/)
------------------------------

Generating each of these plots and all of the other information we would like to present to the user would be cumbersome to say the least.  Plus we have all this other great tooling that users could take advantage of to really dig into identified issues, it would be great if they could start digging right in the same window as they identify them in.  Luckily for us, there's the Jupyter Notebook and Hub that we have deployed on our computing resources.

![Sample Jupyter]({{$site.urlimg}}/dcp_analytics_jupyter.png)

The bulk of the code is in a Python module to do the analysis and generate the plots.  We import this in a template notebook that breaks the analysis into sections with a table of contents.  Then, there is a wrapper script that takes input from the user to configure the report per user requierments.  This configuration is also stored as an .ini file the users can edit as they choose.  This configuration file is injected that into an in memory version of the notebook that is executed using the nbconvert library. Finally emitting a static HTML report as well as a configured .ipynb that can be opened in Jupyter Hub and modified as the user desires.

``` python
file_writer = FilesWriter()
with open(nb_file) as f:
     nb = nbformat.read(f, as_version=4)
nb.cells[1]['source'] = '\n'.join([nb.cells[1]['source'], 'config_file=\'{}\''.format(config_file)])
(output, resources) = nb_exporter.from_notebook_node(nb)
ep.preprocess(nb, {'metadata': {'path': exe_path}})
cssp = CSSHTMLHeaderPreprocessor()
(nb, resources) = cssp.preprocess(nb, {'metadata': {'path': reports_dir}, 'config_dir': reports_dir})
html_exporter = HTMLExporter()
html_exporter.template_file = 'full'
(output, resources) = html_exporter.from_notebook_node(nb)
file_writer.write(output, resources, os.path.join(reports_dir, nb_name))
```

While this templating works well for us in the short term, we do have our eyes on [Jupyter Dashboards](https://github.com/jupyter-incubator/dashboards) and [JupyterLab](https://github.com/jupyter/jupyterlab) as ways we could better deliver these reports in the future. In the meantime, the configuration files allow researchers to define related sets of samples or variables to use on a regular basis.  They can also run test versions of updates on a sample and compare the two versions of the same sample to see the total effect of the changes.

[Conda](http://conda.pydata.org/docs/)
--------------------------------------

The final consideration we have is deployment.  How do we get the tool in front of users without them having to think about setting up a Python environment and ensuring dependencies are satisfied.  There are many options available, but we're fond of Conda.  We package the script, the module and dependecies using `conda build`.  We can then install that package to our own custom channel.  Then we install the package in a new environment of its own that has only its dependencies installed.  

This process wraps our script in another script that will only run in the enviroment where the tool was installed.  By ensuring that wrapper is in the users PATH weknow the tool will always be run in a clean environment with the correct libraries available.  It doesn't matter which or even if Python is in the user's path.  

This tool chain made it fairly easy to get a functional prototype in front of users quickly and push out updates as requests for new features come in.  Jupyter is especially helpful as we hope the combination programming, documentation and visualization environment give both research staff and IT staff a common environment to collaborate in. We are excited to see where this set of tools let us go in the future.