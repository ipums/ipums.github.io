---
author: jerdmann
title: 'Automated Analysis of a Data Workflow - Part 1' 
teaser: 'The story of how we created DCP Analytics - our in-house automated, web-based analysis tool using Pandas, Bokeh, Jupyter and Conda to help our researchers quickly find data anomalies and processing errors in our data production pipelines.'
---

At the MPC we have several microdata projects, each with varied characteristics.  Some have thousands of variables, some have hundreds of samples, and some have both. When researchers are preparing new samples, they will often want to compare the new samples to previous samples from the same dataset, to see how things are changing between samples (e.g. from one census or survey year to the next). This can be challenging because of the sheer number of variables and samples that some of our projects contain.

Consistent and thorough automated checks were difficult to come up with because of the variation across projects.  Researchers on each project were mainly left to their own devices to manually check the metrics they thought were most likely to show errors in the data preparation.  They would do this by loading the data into the stats package of their choice.  This can be effective because researchers do in fact have great intuition about the types of problems we tend to have during data preparation, but it also leaves huge holes in coverage and is a much more time consuming process than it needs to be. 

For each variable in a sample, there are a set of possible answers (referred to as values, codes or categories somewhat interchangably). To give a simple example, a question about marital status might have as valid responses "married", "single", "divorced" or "widowed", so in our metadata the variable might be called MARST and it might have four valid codes which map to "married", "single", "divorced" and "widowed". In any given sample, say 1990 US Census, you can count up all the responses and generate a frequency table, such as 32% married, 34% single, 20% divorced, and 14% widowed.  These frequencies naturally change over time, usually gradually, but often when there is a metadata or other processing error you will observe a huge frequency change from sample to sample. For instance, if the frequency of divorce is 22% in one sample and 0% or 95% in the next, you likely have a problem. So, frequency tables are a useful debugging tool.

Our goal with our DCP Analytics project was to create a tool that would use freqency data to help researchers do their data checks more easily, thoroughly and efficiently. Our specific aim was to create a tool that would automatically analyze the frequency differences between samples and highlight them by presenting a report with two parts, an overview and a detail area. The overview would be a visualization showing the biggest rate of change for each variable's codes between the samples. The variables that had a code with a huge change from sample to sample would jump out on such a chart. This overview chart would then be followed by a more detailed analysis of the subset of variables which show the greatest change between samples.  

Luckily, these diverse projects are all fed through a common tool, the [Data Conversion Program (DCP)]({{site.url}}/harmonizing-data-at-the-mpc/), and this gives us a single point to hook into to try to add automated data quality checks. One byproduct of a run through the DCP is a set of frequency tables for every value of every variable of every sample for every project. These frequency tables are stored as CSV files by variable and sample.  So, if one sample has 1,000 variables and another sample has 800 variables, between them there are 1,800 CSV files regardless of how many variables are in common between the two.  

That's not great for humans trying to sort through looking for problems, but it is a great data source for tools to leverage to help identify what are the biggest differences between two samples and highlight potential problems for human review.  In this this two-part series of articles, we'll discuss how we leverage these frequency tables to automatically generate our DCP Analytics reports, which researchers can utilize to quickly verify that they're getting expected results, and if they aren't, to see where a data preparation run may have gotten into trouble.  In part one, we'll discuss reading the frequency tables and doing some manipulations using Pandas, as well as how Bokeh can be used to visualize parts of the data to quickly highlight how the data is changing from sample to sample.

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

With such a small number of codes and samples, it is easy to determine what is going on with this variable. The set of possible responses to the census question changed between 1981 and 1991, grouping two distinct categories from 1981 into a single new category from 1991 on.  The other notable change is the growth of non-citizens.  Presumably some of these are the British retirees we heard so much about during the Brexit talk earlier in 2016. 

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

Similarly, we can render a more detailed view of any individual variable. You'll notice a few quirks about this plot.  First, there is no key.  Some variables have hundreds of codes to plot so a key will not always fit and could hide some data.  We could do things to calculate whether a key would be useful and where to place it, but for expediency we opted to have tooltips for every plotted point that show the details when a user hovers over the point.  

The second quirk is that small differences in values, especially with the small rendering size shown below, will be difficult to see. The user tools provided by Bokeh to manipulate the plot make this much more manageable for the user.  In this case, the 1991 dataset has a frequency of 0.02% of cases with the code 5, "Without citizenship, stateless".  In the default view this is practically invisible.  While we do provide a table of data backing the plot in full report the use can still get this information visually.  Use the scroll zoom tool to zoom in on points of interest like the 1ipumsi_es1991a sample near the zero line.  Eventually you will see the separation between code 5 and the rest.  You can use the reset tool to go back to the default view of the plot. Generally for the purpose of our analysis small differences aren't of interest, but in other use cases those small differences can mean a lot. 

The final quirk is related to the fact that it would be difficult to pick enough colors to represent hundreds of codes.  We haven't generated an upfront set of colors optimized for visual distance, rather we generate random colors and use the luminecence function to determine whether a color will show up on a white background well enough or not.  Sometimes that results in similar colors for different codes.  Future work could be done to better assign colors and ensure less color overlap.

<iframe width="575" height="425" src="{{site.url}}/assets/dcp_analytics/citizen_line_plot.html"></iframe>

<<<<<<< HEAD:_posts/2016-08-24-Jupyter-and-Bokeh-reports-part1.md
In part 2 we will discuss the role of Jupyter in creating a comprehensive report that is both portable and has the ability to be interactive as well as Conda in deploying the tool to ensure a consistent environment for all users that will not conflict with other tools.
=======
In part 2 we will discuss the role of Jupyter in creating a comprehensive report that is both portable and has the ability to be interactive as well as Conda in deploying the tool to ensure a consistent environment for all users that will not conflict with other tools.
>>>>>>> master:_posts/2016-08-24-Jupyter-and-Bokeh-reports-part1.md
