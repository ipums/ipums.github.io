---
author: jerdmann
title: 'Pandas, Bokeh, Jupyter and Conda in Templated Reporting'
teaser: ''
---

At the MPC we have several microdata projects, each with varied characteristics.  Some have thousands of variables, some have hundreds of samples, and some have both.  One of the challenges we have when we are preparing these datasets is how to check for expected results across all of these variables and/or samples. Consistent and thorough automated checks were difficult to come up with because of the variation across projects.  Researchers on each project were mainly left to their own devices to manually check the metrics they thought were most likely to show erros in the data preparation.  They would do this by loading the data into the stats package of their choice.  This can be effective because researchers do in fact have great intuition about the types of problems we tend to have during data preparation, but it also leaves huge holes in coverage and is a much more time consuming process than it needs to be.  

Luckily, these diverse projects are fed through a common tool, the [Data Conversion Program (DCP)]({{site.url}}/harmonizing-data-at-the-mpc/), and this gives us a single point to hook into to try to add automated data quality checks. One byproduct of a run through the DCP is a set of frequency tables for every value of every variable of every sample for every project. Thes frequency tables are stored as CSV files by variable and sample.  So, if one sample has 1,000 variables and another sample has 800 variables, between them there are 1,800 CSV files regardless of how many variables are in common between the two.  

That's not great for humans trying to sort through output looking for problems, but it is a great data source for tools to leverage to help identify what are the biggest differences between two samples and highlight potential problems for human review.  In this post, we'll discuss how we leverage these frequency tables to automatically generate what we call DCP Analytics, which researchers can utilize to quickly verify that they're getting expected results, and if they aren't, to see where a data preparation run may have gotten into trouble.

[Pandas](http://pandas.pydata.org/)
-----------------------------------

[Pandas](http://pandas.pydata.org/) is the first tool we turned to for building a more robust solution.  Pandas has been in heavy use in our Historical Census Projects to transform the full count 1790-1940 US Censuses from raw data entry to integrated datasets released via [IPUMS USA](https://usa.ipums.org/usa/).  In 1940 alone that means about 130,000,000 individual records with about 60 variables each, plus another 40 variables in the household summary records.  All told this represents a couple hundred gigabytes transformed from one form to another, then fed through the DCP to produce the final dataset for IPUMS USA.  From this experience with Pandas, we knew that Pandas was more than up to the task of analyzing these CSV frequency tables to determine things like which codes are changing the most and how the mean value of a variable drifts from sample to sample.

It is a fairly straightforward exercise to use Pandas' CSV loading library to read the individual frequency tables, insert a few columns of identifying information regarding which variable and which sample go with the particular table, then concatenate them into a larger DataFrame.  In the example below, we are exploring the data for Spain in [IPUMS-International (IPUMS-I)](https://international.ipums.org/international/), which has four datasets representing 1981, 1991, 2001, and 2011.  After we assemble the larger DataFrame, let's focus on one particular variable, 'CITIZEN', and look at the percentage of responses that align with each possible value of CITIZEN across samples.

``` python
pct_cols = ['_'.join(['percent', sample]) for sample in sample_list]
compare_df.ix[('citizen')].loc[:, ['label'] + pct_cols]
```

code|label|percent_es1981a|percent_es1991a|percent_es2001a|percent_es2011a
1|Citizen, not specified|0.00|99.10|96.19|88.48
2|Citizen by birth|98.28|0.00|0.00|0.00
3|Naturalized citizen|1.21|0.00|0.00|0.00
4|Not a citizen|0.52|0.88|3.81|11.52
5|Without citizenship, stateless|0.00|0.02|0.00|0.00
8|Unknown|0.00|0.00|0.00|0.00
9|NIU (not in universe)|0.00|0.00|0.00|0.00

With such a small number of codes and samples, it is easy to determine what is going on with this variable. The possible responses changed between 1981 and 1991, grouping two distinct responses from 1981 into a single new category from 1991 on.  The other notable change is the growth of non-citizens.  Presumably some of these are the British retirees we heard so much about during the Brexit talk earlier in 2016. 

However, some of the hundreds of variables in IPUMS-I have 100 or more codes across a total of 276 samples from 81 countries.  We obviously wouldn't be able look at that much data easily.  Instead, when we're in that situation we can do some quick operations to determine the largest changes across all codes and variables. Here we do that for CITIZEN, and now we can see a bit more clearly what has changed.

``` python
compare_df['pct_max'] = compare_df[pct_cols].max(axis=1)
compare_df['pct_min'] = compare_df[pct_cols].min(axis=1)
compare_df['pct_diff'] = compare_df['pct_max'] - compare_df['pct_min']
compare_df = compare_df.reset_index().set_index('var')
compare_df['max_pct_diff'] = compare_df['pct_diff'].max(axis=0, level=0)
compare_df.ix[('citizen')].loc[:, ['label'] + pct_cols]
```

code|label|pct_max|pct_min|pct_diff|max_pct_diff
1|Citizen, not specified|99.10|0.00|99.10|99.10
2|Citizen by birth|98.28|0.00|98.28|99.10
3|Naturalized citizen|1.21|0.00|1.21|99.10
4|Not a citizen|11.52|0.52|11.00|99.10
5|Without citizenship, stateless|0.02|0.00|0.02|99.10
8|Unknown|0.00|0.00|0.00|99.10
9|NIU (not in universe)|0.00|0.00|0.00|99.10

[Bokeh](http://bokeh.pydata.org/en/latest/)
-------------------------------------------

Back to the problem of summarizing all of those variables.  In this case, it would be handy to have a plot of the maximum difference on an individual code for each variable to see what the scope of the changes are. It would be even better if we could have nice tooltip to give us more information about individual points. 

That's where [Bokeh](http://bokeh.pydata.org/en/latest/) comes in. In the plot below you can see the variables arranged from greatest to least difference.  Citizen is the fifth variable from the left.  Try the wheel zoom tool on the toolbar and see how it allows you to get a clearer picture.  The plot can also be dragged around and resized which allows a better view of the data.  The tooltips provide the details needed to investigate further. 

<iframe width="575" height="425" src="{{site.url}}/assets/dcp_analytics/variable_frequency_variation.html"></iframe>

Visualizations like this allow researchers to quickly compare two samples and see which variables have changed the most between samples.  This allows them to confirm a change which they know took place between the two samples (e.g. the census authority changed the possible answers for a census question), to quickly learn that an error in their data preparation process has garbled a variable's values, or even to have a serendipitous research discovery that they didn't realize was hiding in the data!

The entirety of the code used to convert the Pandas DataFrame used above to the plot is as follows:

``` python
from bokeh.plotting import figure, ColumnDataSource
from bokeh.models import PanTool, BoxSelectTool, WheelZoomTool, HoverTool, ResizeTool, ResetTool, PreviewSaveTool
from bokeh.resources import CDN
from bokeh.embed import file_html

vis_df = compare_df.sort_values(by='pct_diff', ascending=False).reset_index()
vis_df = vis_df.drop_duplicates(subset='var', keep='first').reset_index()
data_source_dict = {
    'x': #vis_df['var'].tolist(),
        vis_df.index.tolist(),
    'y': vis_df.pct_diff.tolist(),
    'var': vis_df['var'].tolist(),
    'diff': vis_df['pct_diff'].tolist(),
    'code': vis_df['code'].tolist(),
    'label': vis_df[label_col].tolist(),
    'max_pct': vis_df['pct_max'].tolist(),
    'min_pct': vis_df['pct_min'].tolist(),
}
tooltip_list = [
        ("Variable", "@var"),
        ("On Code", "@code"),
        ("Label", "@label"),
        ("Pct Difference", "@diff"),
        ("Max Pct", "@max_pct"),
        ("Min Pct", "@min_pct")
]
source_dict = ColumnDataSource(data= data_source_dict)
hover = HoverTool(tooltips=tooltip_list)
tools = [PanTool(), BoxSelectTool(), WheelZoomTool(), hover, ResetTool(), PreviewSaveTool(), ResizeTool()]
sample_plot = figure(plot_width=525, plot_height=350, tools=tools, 
                        title="Variable Frequency Variation")#, x_range=vis_df['var'].tolist())
    
sample_plot.line([0, len(vis_df.index.tolist())], [compare_threshold, compare_threshold], 
                line_color='red', line_alpha = 0.5, line_dash='dotdash', line_width=2)
sample_plot.circle('x', 'y', size=10, source=source_dict, alpha=0.5)
sample_plot.xaxis.axis_label = 'Variable'
sample_plot.yaxis.axis_label = 'Max Pct. Difference by Code in Var'
html_out = open('variable_frequency_variation.html', 'w')
html_out.write(file_html(sample_plot, CDN, 'Variable Frequency Variation'))
html_out.close()
```

Similarly, we can render a more detailed view of any individual variable.  

<iframe width="575" height="425" src="{{site.url}}/assets/dcp_analytics/citizen_line_plot.html"></iframe>

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