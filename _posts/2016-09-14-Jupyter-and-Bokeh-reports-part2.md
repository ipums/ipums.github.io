---
author: jerdmann
title: 'Pandas, Bokeh, Jupyter and Conda in Templated Reporting - Part 2'
teaser: ''
---

In [part 1]({{site.url}}/Jupyter-and-Bokeh-reports-part1/) we discussed how Pandas and Bokeh work to find and highlight potential concerns for our researchers in the data they are producing across a broad range of samples and variables.  In part 2 we tackle the role of Jupyter in pulling all these variables into a static, easily shared report as well as a reusable notebook that can be used to explore any identified issues. Finally, we'll discuss how Anaconda is used to package the tool and isolate it's dependencies from other Python tools we provide.

[Jupyter](http://jupyter.org/)
------------------------------

The report generated includes information about variables that appear in only a subset of samples, variables that have varying ranges of codes, a full plot on the maximal frequency change for a code each variable and a user configurable number of detailed plots for the variables with the greatest changes. 

![Sample Jupyter]({{$site.urlimg}}/dcp_analytics_jupyter.png)

The bulk of the code is in a Python module to do the analysis and generate the plots.  We import this in a template notebook that breaks the analysis into sections with a table of contents.  A wrapper script is executed by the users that takes input to configure the report to be generated.  This configuration is also stored as an .ini file the users can edit to refine subsequent generations of the reports and passed to the wrapper script in lieu of the more detailed configuration command line options.  

This configuration file is injected that into an in memory version of the notebook that is executed using the nbconvert library. The tool finishes by emitting a static HTML report for purpose of easy redistribution via e-mail, via the shared file system, etc.  We have users of varying degrees of techinical inclination and toleration, so the primary output is the one that requires the least effort to review the output.  The following code shows the basic outline of turning the template notebook into a static HTML report.

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
```

This handles the majority of user needs. The configuration can be altered and the report regenerated as often as is necessary. However, this can be a bit clunky especially for our more technologically inclined users who are already exploring Jupyter notebooks for their own purposes. What happens when a variable of interest is found in the overview outside of the configured range of variables that are fully displayed in the default report?  We mentioned most of the code is packaged as a library imported into the notebook, there is already example code for generating the plots and tables for a given variable.  Why couldn't users simply duplicate a cell and alter it to display the variable they care about?  A few more lines of code are used to emit an .ipynb notebook file next to the static HTML report.

``` python
(output, resources) = html_exporter.from_notebook_node(nb)
file_writer.write(output, resources, os.path.join(reports_dir, nb_name))
```

We have a few general purpose computing servers available with JupyterHub installed and users are able to put the reports in a directory under their home directory. Therefore we are able to inject a link into the static report to the notebook on one of the general purpose JupyterHubs.  This allows the users to add more plots for specific variables of interest identified in the overview sections without altering the configuration and rerunning the report from the command line.  Users could also fix identified errors, rerun effected datasets in the background, and rerun the report from within Jupyter to see whether the fixes worked as intended.

More importantly, we have other Python libraries for interogating the metadata used to produce the datasets.  Users can use these libraries to investigate metadata issues manifesting in the report itself. One common action will be to examine the expected "universe", or expected range of results for a variable across samples, to validate that identified frequency variations are indeed related to a change in how the input data was collected rather than a problem with our metadata.  In the future we hope to improve the tooling such that in addition to investigating the output, users will be able to rerun samples from within the notebook, and, utilizing the interactive mode of the [Data Conversion Program (DCP)]({{site.url}}/harmonizing-data-at-the-mpc/), to investigate individual cases that are triggering unwanted outcomes.

While this templating works well for us in the short term, we do have our eyes on [Jupyter Dashboards](https://github.com/jupyter-incubator/dashboards) and [JupyterLab](https://github.com/jupyter/jupyterlab) as ways we could better deliver these reports in the future. In the meantime, the configuration files allow researchers to define related sets of samples or variables to use on a regular basis.  They can also run test versions of updates on a sample and compare the two versions of the same sample to see the total effect of the changes.

[Conda](http://conda.pydata.org/docs/)
--------------------------------------

The final consideration we have is deployment.  How do we get the tool in front of users without them having to think about setting up a Python environment and ensuring dependencies are satisfied?  There are many options available, but we're fond of Conda.  We package the script, the module and dependecies using `conda build`.  We can then install that package to our own custom channel on our shared file system.  From there we install the package in a new environment of its own that has only its dependencies installed.  

This process wraps our script in another script that will only run in the enviroment where the tool was installed.  By ensuring that wrapper is in the users PATH we know the tool will always be run in a clean environment with the correct libraries available.  It doesn't matter which or even if Python is in the user's path. Nor does it matter what other tools a user runs during their session.  Each Python tool is executed in an environment with its and only its dependencies installed. 

Conclusions
-----------

This tool chain made it fairly easy to get a functional prototype in front of users quickly and push out updates as requests for new features come in.  Jupyter is especially helpful as we hope the combination programming, documentation and visualization environment give both research staff and IT staff a common environment to collaborate in. We are excited to see where this set of tools let us go in the future.