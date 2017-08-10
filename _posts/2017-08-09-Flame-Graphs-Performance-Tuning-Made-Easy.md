---
author: ccd
title: 'Flame Graphs: Making the Opaque Obvious'
teaser: 'With a flame graph style profile of your application, you can spot poor  performance hotspots even at a glance'
categories: Code
tags:
- IPUMS
- C++
---

Sometimes you suspect   your application runs substantially longer to run than you believe it should, but you can't find the slow parts just by intuition (educated guessing) or putting in simple benchmarks. You could waste a lot of time using this semi-random approach. What if there actually aren't any easy optimizations to be made? How would you know? Or, what if you incorrectly believed your application ran so tight there weren't any worthwhile improvements to make, but you were wrong?

The standard approach to learning more about performance has been to use a profiling tool and generate call graphs or lists of calls sorted by time spent. Indeed this approach will be pretty helpful but it's rather tedious to read over one of these, and if your application is extremely large it's harder to humanly parse the output. Also, some profiling tools for C++ will cause the application, once instrumented, to run unacceptably slow.  You can gather data for a flame graph with, among other tools, __dtrace__ and __perf_events__ which do not seriously slow down the process being monitored.

The  Flame Graph represents statistical samples of a running process, with the X-axis representing percentage of time spent. Levels of the stack are layered from bottom to top with outer calls at the bottom. Thus height represents stack depth. The shape resembles flames, or mountains if you have a pretty flat graph.  Calls are sorted alphabetically, not order of execution. 

As a very simple example, imagine this program:

```c++

	int main(){
		auto records = load_data();
		auto new_records = transform_data(records);
		save_data(new_records);				
	}
```

The main() function takes all the time of the program; everything which happens in the program is called from main(). If load_data() takes five percent of the time spent in main(), process_data() takes ninety percent of the time and save_data() takes another five percent then the flame graph would divide the base of the graph, just above a line for main(), into three parts, where process_data() takes up ninety percent of the width and the other two functions take five percent each. All functions called from these three will appear above them and further sub-divide the width of the section below them.

Flame graph data typically would be gathered by sampling the stack as a process runs, so in the above example your sample would need to encompass time from when the program started until it ended. A common use of a flame graph profile would graph behavior of a process during execution and ignore startup and shutdown. You might even sample a process only during problematic behavior, for instance if a particular query seemed to abnormally slow down a database system you might sample its performance   while the system processed that query.

In principle you could produce flame graphs from any sufficiently detailed profiling information you can gather. However you'd need to organize it correctly and then produce the graphs with labels and make them easy to read and navigate. Fortunately, the inventor of flame graphs, Brendan Gregg, made a set of tools to process profile data and to generate interactive flame graphs in SVG.


### Flame Graphs on Linux Using GCC

You will want to build your program with the '-Og' flag (only include optimizations which don't interfere with debugging)  and '-g' (include debugging symbols. 

Make sure you have the 'perf' utility. You can get it from the 'linux-tools-common' package in Ubuntu, 'perf' on Redhat, and it is available for other distributions as well or you can build from source. You may need to install a version specific to your kernel version, such as 'linux-tools-4.4.0-52'. Use 'uname -r' to get your kernel version.



