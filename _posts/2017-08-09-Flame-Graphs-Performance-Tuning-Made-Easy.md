---
author: ccd
title: 'Flame Graphs: Making the Opaque Obvious'
teaser: 'With a flame graph style profile of your application, you can spot poor  performance hotspots even at a glance'
categories: Code
tags:
- IPUMS
- C++
---


Sometimes you suspect   your application runs substantially slower than you believe it should, but you can't find the slow parts just by intuition (educated guessing) or putting in simple benchmarks. You could waste a lot of time using this semi-random approach, especially when you're not so familiar with the source code. What if there actually aren't any easy optimizations to be made? How would you know? Or, what if you incorrectly believed your application ran so tight there weren't any worthwhile improvements to make, but you were wrong? When you know your code well you have a good chance of avoiding any really  terrible inefficiencies, but can you be sure? And what about when you don't know the code so well, and you add or change features? It happens, you know.

#### Use a Profiler Rather than Your Gut

The standard approach to learning more about performance has been to use a profiling tool, instrumenting your executable,  and generate call graphs or lists of calls sorted by time spent. Indeed this approach will be pretty helpful but it's rather tedious to read over one of these, and if your application is extremely large it's harder to humanly parse the output.    We made do with forty columns and all capital  letters at one time on our computers. In ancienttimesscribesdidnotusespacesorpunctionandsomehowgotby. There was room for improvement. In the world of  performance profiling flame graphs built on 'perf' or 'dtrace' output is a similar advancement.

#### Flame Graphs: Spot the Slow Parts Quickly, Without the Guesswork

The "Flame Graph" represents statistical samples of a running process sampled once per some unit of time (like 100 times a second), with the X-axis representing percentage of time spent. A sampling program records what the program was doing at each sampled point in time. Levels of the stack are layered from bottom to top with outer calls at the bottom. Thus height represents stack depth. The shape resembles flames, or mountains (or even plateaus) if you have a pretty flat graph.  Calls are sorted alphabetically, not order of execution. 

As a very simple example, imagine this program:

```c++
	int main(){
		auto records = load_data();
		auto new_records = transform_data(records);
		save_data(new_records);				
	}
```

The main() function takes all the time of the program; everything which happens in the program is called from main(). If load_data() takes five percent of the time spent in main(), process_data() takes ninety percent of the time and save_data() takes another five percent then the flame graph would divide the base of the graph, just above a line for main(), into three parts, where process_data() takes up ninety percent of the width and the other two functions take five percent each. All functions called from these three will appear above them and further sub-divide the width of the section below them.

Typically Flame graph data would be gathered by sampling the stack while  a process runs, so in the above example your sample would need to encompass time from when the program started until it ended. A common use of a flame graph profile would graph behavior of a process during execution and ignore startup and shutdown. You might even sample a process only during problematic behavior, for instance if a particular query seemed to abnormally slow down a database system you might sample its performance   while the system processed that query.

You would get a similar graph from a program where the functions take turns running; the graphing process will sort out the inter-leaved calls and organize them by function name, as with this trivial example:

```c++
$ cat example.cpp 
	

	void func_a(){
		long count=0; for(long a=0;a<150000000;++a){ count = a;}
	}
	
	void func_b(){
		for(long b=0;b<250000000;++b){}
	}
	
	void func_c(){
		for(long c=0;c<350000000;c++){}
	}
	
	int main(){
		while(true){
			func_a(); func_b(); func_c();
		}	
	}	
```

Here's the graph:


<a href="/images/flamegraph-a.svg"><img   src="/images/flamegraph-a.svg" alt="Graph of example code" width="800" height="600" /></a>


#### A Real-World Example of an Easy Win

Well, you can frame the following story as an "easy win" or "spotting a mistake." In any case, here's the short version:

At MPC we produce our public IPUMS micro-data  with the DCP (Data Conversion Program,) a C++ 11 application. It has to handle very large and very small datasets and must run as fast as possible, in a single process or in parallel on a compute cluster. There's an API layer which provides functions to "edit" the data in complex ways; this editing enhances the usefulness of the public data. For instance we  make "family pointer" variables which  indicate how people in households (person records in our data are typically grouped by households) relate to each other. Spouses get linked to each other; children to parents.  There are cost of living adjustments, poverty threshold calculations and many, many others. 

Anyhow, for a particular need when handling the large number of CPS (Current Population Survey) datasets --  there are 554 and growing -- I needed 
a way to determine if a "Record" class instance contained a certain piece of data, using a "__hasVariable(MDVarInfo)__ method. "Variables" in this context are  similar to columns belonging to a database table, though not exactly the same thing. Most uses of the API don't need this; it's abstracted away nicely. But with certain CPS datasets it would allow for a much more streamlined API to do some edits. Turned out I had such a function __hasVariable(string)__. It checks records given any arbitrary variable name  before printing them out, in cases where a single record needs to be displayed for human inspection with a list of names supplied by a person (they might mistype or mis-remember the names.) The function isn't especially fast; it doesn't need to be.  That's the key difference, because the data editing API potentially exposes the function to a huge number of calls, many times  for every record fed into the application.

You can probably guess what happened:

"Hmm, I'll overload this function by wrapping the old slow one, and see if it solves our problem in principle. If it's too slow I'll re-write it."  Hey it works, great (insert something distracting.)  "Yep, all done."

```c++
bool Record::hasVariable(VarPtr var) const {
  return hasVariable(var->getName());
}

bool Record::hasVariable(const string &name) const {
  if (Metadata::Cache::getVarsByName().count(name) > 0) {
    return Metadata::Cache::getVar(name)->getRecordType() == recordType;
  } else
    return false;
}
```

The __hasVariable(const string &name)__ version is clearly kind of slow; the Metadata::Cache::getVar(name) just pulls something out of a hash -- but that's not nothing -- and the __count(name)__ call up-front is rather expensive. Nevertheless it actually ran fast enough to not get noticed right away.

But take a look at the  flame graph and see how much of the width is covered by __hasVariable(const string &name)__:

<a href="/images/cps1970_before_fix_dwarf_gcc53.svg"><img   src="/images/cps1970_before_fix_dwarf_gcc53.svg" alt="Graph of DCP processing CPS 1970 data before the fix" width="800" height="600" /></a>

As soon as my attention was drawn to that function it took literally less than two minutes to fix the issue and begin building a faster version.

The new code is:

```c++
bool Record::hasVariable(VarPtr var) const {
  return var->getRecordType() == recordType;
}
```

The other version of the function, the slow  __hasVariable(const string &name)__ doesn't get called during typical use of the application.

And here's the new profile:

<a href="/images/cps1970_after_fix_dwarf_gcc53.svg"><img   src="/images/cps1970_after_fix_dwarf_gcc53.svg" alt="Graph of DCP processing CPS 1970 data after the fix" width="800" height="600" /></a>

Not bad for a few minutes investigation. The new version runs several times faster on the CPS data.

### Making Flame Graphs on Linux Using GCC

In principle you can produce flame graphs from any sufficiently detailed profiling information you can gather from any interpreter or compiled program. However you'd need to format it, organize it correctly and then produce the graphs with labels and make them easy to read and navigate. Fortunately, the inventor of flame graphs, [Brendan Gregg](http://github.com/brendangregg), made a set of tools to process profile data and to generate interactive flame graphs in SVG. Read [more](http://github.com/brendangregg/FlameGraph) about flame graphs and how to make them with a variety of tools on different platforms.

Here's the transcript of commands used to create the trivial flame graph:

	$ g++  -g -O0 example.cpp
	
	# Ran ./a.out
	# then, later ...
	
	$ pgrep a.out
	731
	$ sudo perf record -F 99 -p 731 --call-graph dwarf -- sleep 120
	[ perf record: Woken up 381 times to write data ]
	[ perf record: Captured and wrote 95.033 MB perf.data (~4152061 samples) ]
	
	$ sudo perf script > a.perf
	$ stackcollapse-perf.pl  a.perf > a.folded
	Filtering for events of type: cpu-clock
	
	$ flamegraph.pl  a.folded > a.svg


You will want to build the program you're profiling with the '-Og' flag (only include optimizations which don't interfere with debugging) or -O0,  and '-g' (include debugging symbols.  You don't need the '-p' flag; that's for the gprof profiler.

One nice side benefit: Some profiling tools for GCC will cause the application, once instrumented, to run unacceptably slow.  This isn't the case for producing flame graphs using the process described here. You can gather data for a flame graph with, among other tools, __dtrace__ and __perf_events__ which do not seriously slow down the process being monitored.

To reproduce my example, you need the 'perf' utility. You can get it from the 'linux-tools-common' package in Ubuntu, 'perf' on Redhat, and it is available for other distributions as well, or you can build from source. You may need to install a version specific to your kernel version, such as 'linux-tools-4.4.0-52'. Use 'uname -r' to get your kernel version.  The __perf__ program will instruct you on this if it doesn't match your kernel.

Clone the https://github.com/brendangregg/FlameGraph repository and for convenience put it on your path. Then you should be able to do the following:

	./my_program &  # start your program in the background
	perf record -F 99 -p [pid of my_program]  --call-graph dwarf -- sleep 60
	
After sixtey  seconds, the perf program completes. Hopefully the 'my_program' binary is still running. Now you can get the results of 'perf' and graph them:

	perf script > my_program.perf
	stackcollapse-perf.pl my_program.perf > my_program.folded
	flamegraph.pl my_program.folded > my_program.svg
	
You might consider automating these steps.	 Once automated you could include the process as part of your continious integration, to snapshot performance profiles. That way you could more quickly identify exactly when and how any performance regressions got introduced into your application.
	





