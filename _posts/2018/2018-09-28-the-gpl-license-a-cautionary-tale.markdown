---
title: "The GPL License and Linking: Still Unclear After 30 Years"
date: "2018-09-28 21:34"
---

It all started with an simple idea from my colleague who maintains our [ipumsr R package](https://cran.r-project.org/web/packages/ipumsr/index.html), which we released on CRAN under the Mozilla Public License v2. His idea was "I'd like to modify the [readr package from CRAN](https://cran.r-project.org/web/packages/readr/index.html) to deal with hierarchical data so I can use it in ipumsr, but it has a GPLv3 license."

From there, it got anything but simple - we unwittingly waded into a decades-old debate.

# Understanding Why GPL Exists

It's useful to spend a few minutes getting some background context on the GNU General Public License (GPL).

Richard Stallman, author of the GPL and founder of the Free Software Foundation, wrote the first version of the Emacs text editor in 1975 and made the source freely available. In 1982, James Gosling wrote the first C version of Emacs. For a while, Gosling made the source code of his version freely available too, and Stallman subsequently used Gosling Emacs in 1985 to create GNU Emacs. Later Gosling sold the rights for Gosling Emacs to UniPress, which then told Stallman to stop distributing the source code. Stallman was forced to comply. After that experience, he set out to create a license to ensure that would never happen again. He wanted to preserve access to the source code of any derivative software that benefited from free software.

There are two key properties Stallman put into the GPL that are critical to this discussion. The first is that it's a very "sticky" or "viral" license. The GPL is what is known as a _strong copyleft_ license, which means that all derived works of the GPL'ed work must also be licensed under GPL if distributed. The second is that the GPL requires that the source code be freely available to anyone who wants it. Combined, these properties mean that you cannot use GPL code in any software system you intend to distribute (even as a cloud-based software as a service) unless you are willing to give your source code away under a GPL license too.

# IPUMS, We Have a Problem

In contrast, our ipumsr package is released as Mozilla Public License v2 (MPLv2), which is the preferred license we use at IPUMS when releasing open source code. MPL is a _weak copyleft_ license, which means that if you modify MPL'ed code, you DO need to make those modifications available, but you're not required to also make available your code that simply uses the MPL'ed code. We chose MPL because it strikes a good balance between keeping our own work, including improvements to it, freely available while not restricting what people can do with their own software just because they find our library useful. In other words, we don't want to impose our licensing philosophy on other people beyond our own code.

Sometimes the GPL sort of restriction and "viral license propagation" is what you want, but it's not what we want, so my colleague knew we had an issue to solve. He had some ideas about how to work around that and comply with GPL, and he was coming to me for a second opinion.

# Let's Create an Intermediary

Our idea was that we would create a third package, "hipread" (hierarchical ipums reader). hipread would be a fork of readr, which we would then modify to add the hierarchical support. We would release hipread as GPL, which is naturally required since we would take GPL readr code and modified it to make hipread.

Essentially, hipread would be a small wrapper/extension of readr, we'd release it as GPL, we'd use that library in our ipumsr library, and we're all good. Right?

Not so fast...

# What Constitutes a Derived Work?

When we started researching our proposed solution to see if it met all licensing requirements and goals, we determined that the first part of our idea - writing hipread as a wrapper extension around readr and releasing hipread as GPL - would be a fine option. However, we then came across quite the surprise...

**It seems that there's quite a bit of debate around whether or not simply _using_ a GPL'ed library (e.g. via an `import` or `use` statement) in your code constitutes creating a derived work and therefore subjects your code to the GPL license!**

At first, this seemed like it couldn't possibly be true. But the more we researched it, the more confusing it became.

Let's first examine what the GPLv3 license itself has to say about this. The relevant section is titled "Corresponding Source" in the license text:

>The “Corresponding Source” for a work in object code form means all the source code needed to generate, install, and (for an executable work) run the object code and to modify the work, including scripts to control those activities. However, it does not include the work's System Libraries, or general-purpose tools or generally available free programs which are used unmodified in performing those activities but which are not part of the work. For example, Corresponding Source includes interface definition files associated with source files for the work, and the source code for shared libraries and dynamically linked subprograms that the work is specifically designed to require, such as by intimate data communication or control flow between those subprograms and other parts of the work.

"Corresponding Source for a work means all the source code needed to...run the object code... Corresponding Source includes...the source code for shared libararies and dynamically linked subprograms that the work is specifically designed to require." Well, that sure makes it sound like if ipumsr imports readr, it has created a larger derivative work of readr.

The [GPL FAQ](https://www.gnu.org/licenses/gpl-faq.html#GPLStaticVsDynamic) confirms this strict interpretation:

>Linking a GPL covered work statically or dynamically with other modules is making a combined work based on the GPL covered work. Thus, the terms and conditions of the GNU General Public License cover the whole combination.

I suppose this isn't that surprising. Stallman is one of the world's foremost "Free as in Free Speech" free software proponents. Agree with his viewpoint or not, it makes sense that his intent would be that anyone who uses GPL'ed code to build a derived software system should have to release their source code back to the world, and that his interpretation of what makes a derived system would be fairly broad.

On that latter point, the FAQ goes on to say:

>If the main program dynamically links plug-ins, and they make function calls to each other and share data structures, we believe they form a single combined program, which must be treated as an extension of both the main program and the plug-ins. If the main program dynamically links plug-ins, but the communication between them is limited to invoking the ‘main’ function of the plug-in with some options and waiting for it to return, that is a borderline case.

Now we're getting oddly situational about what does and does not constitute a combined work. That last bit about "only invoking main" is a bit confusing in how that would apply to the readr-hipread-ipumsr relationship. readr has a function to read a csv file which is used by hipread which is in turn used by ipumsr. The file to read is an option to that function. Is that use case covered under this exception? Or because the function is returning a data structure which ipumsr is going to interact with, are we indeed creating a combined work? Not very clarifying.

It gets even stranger when you dig into the FSF's answer to th FAQ question: [What is the difference between an “aggregate” and other kinds of “modified versions”?](https://www.gnu.org/licenses/gpl-faq.html#MereAggregation)

>Where's the line between two separate programs, and one program with two parts? This is a legal question, which ultimately judges will decide. We believe that a proper criterion depends both on the mechanism of communication (exec, pipes, rpc, function calls within a shared address space, etc.) and the semantics of the communication (what kinds of information are interchanged).
>
>If the modules are included in the same executable file, they are definitely combined in one program. If modules are designed to run linked together in a shared address space, that almost surely means combining them into one program.
>
>By contrast, pipes, sockets and command-line arguments are communication mechanisms normally used between two separate programs. So when they are used for communication, the modules normally are separate programs. But if the semantics of the communication are intimate enough, exchanging complex internal data structures, that too could be a basis to consider the two parts as combined into a larger program.

The interesting part of this answer is not whether we're distributing an aggreate or not, but rather the insight this answer offers into what FSF considers to be a single program. They come back to "if the semantics of the communication are intimate enough", but also assert "this is a legal question, which ultimately judges will decide."

However, I think it's fair to conclude at this point that in the opinion of the FSF, they want what we're doing to be bound by GPL. Our ipumsr library doesn't work without significant interaction with readr, so therefore in their eyes we've created a combined work.

# Is the FSF Position Enforceable?

For a counterpoint, we can turn to Lawrence Lessig, general counsel of the Open Source Initiative. He wrote a concise article on his opinion of what constitutes a derivative work in 2003. His key conclusion is:

>The meaning of derivative work will not be broadened to include software created by linking to library programs that were designed and intended to be used as library programs. When a company releases a scientific subroutine library, or a library of objects, for example, people who merely use the library, unmodified, perhaps without even looking at the source code, are not thereby creating derivative works of the library.

and he goes on to assert why he feels this is important:

>You should care about this issue to encourage that free and open-source software be created without scaring proprietary software users away. We need to make sure that companies know, with some degree of certainty, when they've created a derivative work and when they haven't.

Malcolm Bain, a Barcelona lawyer, [explored this topic in depth](http://www.ifosslr.org/ojs/ifosslr/article/download/44/74) in a 2011 white paper, but frustratingly concludes, more or less, "it's unclear".

This pattern of confusion is reflected across the internet as a whole. You can find plenty of people who argue that using a library does expose your code to the GPL conditions. And you can find plenty who say no, it doesnt. Ultimately, it has not been sorted out in a court yet, so there's no clear answer as to the enforcibility of the GPL as the FSF wants it to be.

In the meantime, this has set up a potentially huge issue in the R community - spend a few minutes clicking around R's CRAN package repository and see just how many non-GPL packages are importing GPL'ed packages. Just looking at packages which import readr, a random sampling showed almost half of them were distributed with licenses other than GPL. If a court ever were to rule that merely importing a GPL'ed libary makes code GPL-exposed, there's going to be an awful lot of scrambling in the R community.

# LGPL: A Failed Attempt to Address This Problem

By 1991, shortly after the GPL was created, people started to realize that while the GPL is useful for protecting whole software applications, it created complications for library code. The FSF subseuently released the first version of the GNU Libary General Public License, now known as the Lesser General Public License (LGPL), as a compromise between the _strong copyleft_ of the GPL and the permissive nature of licenses like the MIT license. The LGPL is a "weak copyleft" license and it's very similar to the MPL that we use in that regard.

The basic idea of a "weak copyleft" license is "I want to ensure that if you modify my code, you give that modification back to the world freely, but I really don't care to restrict how you can simply use my code as part of your larger system." If someone writes a library and wants to ensure that the source code for modified versions of that library remain available, but does not care to require everyone using their library to have to make their own source code freely available, then the LGPL was designed for them.

Unfortunately, the Free Software Foundation also [says to NOT use LGPL for libraries](https://www.gnu.org/licenses/why-not-lgpl.en.html). They argue that doing so allows free libraries to be used in proprietary software, and that we shouldn't be giving proprietary software companies any more advantages. Rather, we should create unique functionality, release it as GPL, and force companies to release their code for free if they want to use the cool free functionality.

For a license that's supposed to promote freedom, that seems rather restrictive.

Why so many libraries in the CRAN choose to use GPL instead of LGPL is curious to me, when LGPL would be so much less restrictive in terms of how their library could be used. If a library author's goal is to give a library to the world for it to benefit from no strings attached, then the GPL is not a good choice and LGPL would be much better.

The GPL is about enforcing the philosophy of the FSF strongly on others. That's a valid approach, but one with a lot of consequences. It's giving -less- freedom to the recipient and is restricting the use cases for which your code can be used. If you don't feel strongly about free software as a philosophical movement but rather tend to consider open source software from the more pragmatic, "good way to build good software" point of view, then the GPL is not the license for you.

# So... What Do We Do?

XXX TO BE COMPLETED XXX
