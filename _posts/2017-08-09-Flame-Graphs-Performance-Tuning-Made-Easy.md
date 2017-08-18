---
author: ccd
title: 'Flame Graphs: Making the Opaque Obvious'
teaser: 'With a flame graph style profile of your application, you can spot poor  performance hotspots even at a glance'
categories: Code
tags:
- IPUMS
- C++
---

Sometimes you suspect that your application runs substantially slower than you believe it should, but you can't find the slow parts just by intuition or putting in simple benchmarks. You could waste a lot of time hunting for the issue, especially when you're not so familiar with the source code. What if there actually aren't any easy optimizations to be made - how would you know? Or, what if you incorrectly believed your application ran so tight there weren't any worthwhile improvements to make, but you were wrong? And what about when you add or change features which change the performance profile in unpredictable ways?

#### Use a Profiler Rather than Your Gut

The standard approach to learning more about a difficult performance issue for decades now has been to use a profiling tool, instrumenting your executable and generating call graphs or lists of calls sorted by time spent. Indeed, this approach can be fruitful, but it can also be rather tedious to read over the archaic output, which as your application gets larger becomes harder and harder for a human to parse.

With this sort of profiling it can start to feel like we're stuck in ancient computing times. You know, when we made do with forty columns and ALL CAPITAL LETTERS on our computers. It's true that in ancienttimesscribesdidnotusespacesorpunctuation and somehow we got by. But there was room for improvement. In the world of performance profiling, flame graphs built on profiler output is a similar advancement.

#### Flame Graphs: Spot the Slow Parts Quickly, Without the Guesswork

The "Flame Graph" is a visual representation of a  process' execution which is created based on sampling the running process once per some unit of time (like 100 times a second). A sampling program records what the program was doing at each point in time, and then creates a graph where the X-axis is percentage of overall run time, the Y-axis is execution stack depth, and the body of the graph displays the execution stacks. Because the x-axis represents overall run time, the wider an execution stack, the larger share of overall runtime it has. Here's what a flame graph looks like (click on it for a larger version):

<a href="/images/cps1970_before_fix_dwarf_gcc53.svg"><img   src="/images/cps1970_before_fix_dwarf_gcc53.svg" alt="Graph of DCP processing CPS 1970 data before the fix" width="800" height="600" /></a>

Don't worry about understanding it fully yet; we'll come back to this graph later.

In a flame graph, levels of the execution stack are layered from bottom to top with outer calls at the bottom. The overall shape resembles flames or mountains (or even plateaus if you have a pretty flat graph).  Note that the x-axis is sorted alphabetically, not by order of execution.

To repeat, the main idea of a flame graph is that the wider a function stack is on the graph, the bigger percentage of overall runtime that stack is consuming. Therefore, wide stacks may indicate areas of the code that are ripe for optimization.

As a simpler example, consider this program:

```c++
void do_work(){
  for (long w=0; w<5; ++w) {
    long n = w * 3;
  }
}

void func_a(){
  long count=0;
  for (long a=0; a<100000000; ++a) {
    count = a;
  }
}

void func_b(){
  for (long b=0; b<100000000; ++b) {
    if (b % 2 == 0) do_work();
  }
}

void func_c(){
  for (long c=0; c<100000000; c++) {
    if (c % 25 == 0) do_work();
  }
}

int main(){
  while (true) {
    func_a();
    func_b();
    func_c();
  }    
}
```

In this program the functions simply take turns running forever. Note that func_a() does not call any other functions while func_b() and func_c() both call do_work(). However, because of the logic in the code, func_b() will call do_work() a lot more frequently than func_c() will. The flame graphing process will sort out the inter-leaved calls and organize them by overall time spent in each function.

Here's the graph (click on it for a larger version):

<a href="/images/flamegraph-example.svg"><img   src="/images/flamegraph-example.svg" alt="Graph of example code" width="800" height="600" /></a>

The first thing to notice is that main() and all of the built-in C++ plumbing below main() span the entire graph - this makes sense because the program execution starts and ends at main() so no matter where we're at in the execution stack, we're always somewhere on top of main().

The next thing to notice is that the stack with func_b() has the most width, followed by the stack with func_c() and then the stack with func_a(), which has the least width. Examining the code, you can see that all three functions start out by doing the same for loop, but func_b() then does extra work by calling do_work() every other iteration, while func_c() only does the extra work every 25th iteration, and func_a() always does a simple assignment and never does the extra work. The flame graph clearly shows this pattern - the program spends more time in func_b() relative to func_c() or func_a().

Finally, we see that do_work() appears in both the func_b() stack and the func_c() stack, but we can tell from the graph that we spend more time in do_work() on the func_b() stack than we do on the func_c() stack, exactly what we expect to see based on the code logic.

This simple example illustrates the power of the flame graph to quickly show the programmer where a program is spending its time, not just by individual functions, but also by entire function stack code paths.

In this example we sampled the program during its entire execution. You might instead sample a process only during problematic behavior. For instance, if a particular query seemed to excessively slow down a database system, you might sample its performance   only while the system processed that query.

#### A Real-World Example

You can frame the following story as an "easy win" or "spotting a mistake." In any case, here's how I recently used flame graphs to solve a real problem in my code.

##### Setting Up the Problem

At IPUMS we produce our public microdata using the DCP (Data Conversion Program), a C++ 11 application. The DCP is a data processing and transformation pipeline. On the input side we have source data, such as the raw data collected from a particular census or survey. On the output side we have a transformed dataset that has been recoded and harmonized to IPUMS formats and specifications. In between, the DCP has a lot of logic to apply a significant number of transformations to the data.

The DCP includes an editing API which our researchers use to write rules to edit and transform the data in complex ways as it passes through the DCP pipeline. This editing enhances the usefulness of the public data. For instance, we use the editing API to make family pointer variables which indicate how people in a household are related to each other. Spouses get linked to each other, children to parents, and so on. We use the editing API for lots of other things as well - there are cost of living adjustments, poverty threshold calculations, and many, many others.

For one of our data products - IPUMS CPS (Current Population Survey) - we had a particular edit we wanted to implement which required being able to query whether a given variable instance (e.g. "RACE") was found in the current record type we were examining (e.g. a Person record, which would have a "RACE" variable, vs. a Household record, which would not). In other words, we needed something like a __record.hasVariable(variable)__ method.

As it happened, the program already had a similar function __hasVariable(string)__ in the back-end of the user facing API. It checks a record given an arbitrary variable name label. It was designed to be used on a single record as part of a DCP mode where a human would be supplying the variable label and interactively looking at a single record at a time (for QA or debugging purposes). In other words, it was not designed with scalability in mind, and the function isn't especially fast because it doesn't need to be.  

It was tempting to try to re-use this function for our new need. Of course, unlike an interactive debugging mode where a human is stepping through records one at a time, the editing API is designed to be applied on an entire dataset of millions of records as part of a non-interactive dataset processing mode, so performance is critical and any performance flaws are magnified.

You can probably guess what happened. The thought process went something like this:

"Hmm, I'll overload this function by wrapping the existing slow one, and see if it solves our problem in principle. If it's too slow I'll re-write it."  "Hey it works, great!" (insert something distracting.)  "Yep, all done."

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

The __hasVariable(const string &name)__ version is clearly kind of slow; the Metadata::Cache::getVar(name) just pulls something out of a hash, but the __count(name)__ call up-front is rather expensive. Nevertheless, it actually ran fast enough to not get noticed right away.

So we used this method in the editing API rules for our CPS editing API, and although CPS was taking a long time to run through DCP, we assumed that was because CPS has a ton of data - 554 datasets and counting. Additionally, any given dataset may run slow due to some legitimately complex data edits.

Recently, after a while of this solution being in production, I decided to take another look at the "CPS takes a long time to run" issue, and I started by generating a flame graph.

##### Flame Graphs to the Rescue

Take another look at the first flame graph I showed you and see how much of the width is covered by __hasVariable__:

<a href="/images/cps1970_before_fix_dwarf_gcc53.svg"><img   src="/images/cps1970_before_fix_dwarf_gcc53.svg" alt="Graph of DCP processing CPS 1970 data before the fix" width="800" height="600" /></a>

As soon as my attention was drawn to that function it took less than two minutes to fix the issue and begin building a faster version.

The new code is:

```c++
bool Record::hasVariable(VarPtr var) const {
  return var->getRecordType() == recordType;
}
```

I'm no longer calling the other version of the function, the slow  __hasVariable(const string &name)__.

And here's a flame graph of the updated version:

<a href="/images/cps1970_after_fix_dwarf_gcc53.svg"><img   src="/images/cps1970_after_fix_dwarf_gcc53.svg" alt="Graph of DCP processing CPS 1970 data after the fix" width="800" height="600" /></a>

Not bad for a few minutes of investigation. The entire hasVariable stack has collapsed to where you can barely see it anymore, it's a pixel or two wide over towards the left side of the graph.

More importantly, overall the new version of DCP with this improvement runs several times faster on the CPS data. This one quick fix provided something like a 5x speedup.

Of course code optimization is iterative, and the flame graph now suggests other areas that might be ripe for optimization. Just remember to balance the cost of run time with the cost of premature optimization. CPS data is now running acceptably fast enough for us so we're happy for now!

### Making Flame Graphs on Linux Using GCC

In principle you can produce flame graphs from any sufficiently detailed profiling information you can gather from any interpreter or compiled program. However, you'd need to format it, organize it correctly and then produce the graphs with labels and make them easy to read and navigate. Fortunately, the inventor of flame graphs, [Brendan Gregg](http://github.com/brendangregg), made a set of tools to process profile data and to generate interactive flame graphs in SVG. Read [more](http://github.com/brendangregg/FlameGraph) about flame graphs and how to make them with a variety of tools on different platforms.

Here's the transcript of commands I used to create the trivial example flame graph above:

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

For GCC programs, you will want to build the program you're profiling with the '-Og' flag (only include optimizations which don't interfere with debugging) or -O0, and '-g' (include debugging symbols).  You don't need the '-p' flag; that's for the gprof profiler. Note that in the simple example we started with, compiling with -Og will optimize away the __do_work()__ function in the stack, as the compiler can predict the results every time. The behavior of __do_work()__ doesn't vary and  it takes no arguments.

One nice side benefit of using "perf": Some profiling tools for GCC will cause the application to run unacceptably slow.  The "callgrind" program can profile an application in fine grained detail but may make running your already slow program nearly impossible. This isn't the case for producing flame graphs using the process described here. You can gather data for a flame graph with, among other tools, __dtrace__ and __perf_events__ which do not seriously slow down the process being monitored.

To reproduce my example, you need the 'perf' utility. You can get it from the 'linux-tools-common' package in Ubuntu, 'perf' on Redhat, and it is available for other distributions as well, or you can build from source. You may need to install a version specific to your kernel version, such as 'linux-tools-4.4.0-52'. Use 'uname -r' to get your kernel version.  The __perf__ program will instruct you on this if it doesn't match your kernel.

Clone the https://github.com/brendangregg/FlameGraph repository and for convenience put it on your path. Then you should be able to do the following:

	./my_program &  # start your program in the background
	perf record -F 99 -p [pid of my_program]  --call-graph dwarf -- sleep 60

After sixty seconds, the perf program completes. Hopefully the 'my_program' binary is still running. Now you can get the results of 'perf' and graph them:

	perf script > my_program.perf
	stackcollapse-perf.pl my_program.perf > my_program.folded
	flamegraph.pl my_program.folded > my_program.svg

My application used C++ code, but there are now many languages with profiler output that can be used with flame graphs, including Python, Java, Ruby, Node.js, Perl, and many others. Brendan Gregg has many links on his website, and Google searches can quickly lead you to other resources.

### Conclusion

Hopefully this post demonstrated how flame graphs can be a powerful tool to quickly understand the execution profile of your program and identify trouble spots. You might even consider automating flame graph generation. Once automated, you could include the process as part of your continuous integration to snapshot performance profiles. That way you could more quickly identify exactly when and how any performance regressions got introduced into your application.
