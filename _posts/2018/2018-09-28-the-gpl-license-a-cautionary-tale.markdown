---
title: "The GPL license: A Cautionary Tale"
date: "2018-09-28 21:34"
---

It all started with an simple idea from my colleague who maintains our [ipumsr R package](https://cran.r-project.org/web/packages/ipumsr/index.html), which we released on CRAN under the Mozilla Public License v2. His idea was "I'd like to modify the [readr package from CRAN](https://cran.r-project.org/web/packages/readr/index.html) to deal with hierarchical data so I can use it in ipumsr, but it has a GPLv3 license."

From there, it got anything but simple.

There are two key properties of the GPL that are critical to this discussion. Ther first is that it's a very "sticky" or "viral" license - it's what is known as a _strong copyleft_ license, which means that all derived works of the GPL'ed work must also be distributed under GPL. The second is that the GPL requires that the source code be freely available to anyone who wants it. Combined, these properties mean that you cannot use GPL code in any software system you intend to distribute (even as a cloud-based software as a service) unless you are willing to give your source code away under a GPL license too.

In contrast, our ipumsr package is released as MPLv2, which is the preferred license we use at IPUMS when releasing open source code. MPL is a _weak copyleft_ license, which means that if you modify the MPL code, you need to make those modifications available, but if you simply use our code you're not required to also make your own code available under MPL. We chose MPL because it strikes a good balance between keeping our own work freely available while not restricting what people can do with their software just because they find our library useful. In other words, we don't want to impose our licensing philosophy on other people beyond our own code.

Sometimes the GPL sort of restriction and "viral license propagation" is what you want, but it's not what we want, so my colleague knew we had an issue to solve. He had some ideas about how to work around that and comply with GPL, and he was coming to me for a second opinion.

# Let's Create an Intermediary

Our idea was that we would create a third package, "hipread" (hierarchical ipums reader). hipread would be a fork of readr, which we would then modify to add the hierarchical support. We would release hipread as GPL, which is naturally required since we would take GPL readr code and modified it to make hipread.

Essentially, hipread would be a small wrapper/extension of readr, we'd release it as GPL, we'd use that library in our ipumsr library, and we're all good. Right?

Not so fast...

# What Constitutes a Derived Work?

When we started researching our proposed solution to see if it met all the licensing requirements and goals, we determined that the first part of our idea - writing hipread as a wrapper extension around readr and releasing hipread as GPL - would be a fine option. However, we then came across quite the surprise...

**It seems that there's quite a bit of debate around whether or not simply _using_ a GPL'ed library (e.g. via an `import` or `use` statement) in your code constitutes creating a derived work and therefore subjects your code to the GPL license!**

At first, this seemed like it couldn't possibly be true. But the more we researched it, the more confusing it became.

Let's first examine what the GPLv3 license itself has to say about this. The relevant section is titled "Corresponding Source" in the license text:

>The “Corresponding Source” for a work in object code form means all the source code needed to generate, install, and (for an executable work) run the object code and to modify the work, including scripts to control those activities. However, it does not include the work's System Libraries, or general-purpose tools or generally available free programs which are used unmodified in performing those activities but which are not part of the work. For example, Corresponding Source includes interface definition files associated with source files for the work, and the source code for shared libraries and dynamically linked subprograms that the work is specifically designed to require, such as by intimate data communication or control flow between those subprograms and other parts of the work.

"Corresponding Source for a work means all the source code needed to...run the object code... Corresponding Source includes...the source code for shared libararies and dynamically linked subprograms that the work is specifically designed to require." Well, that sure makes it sound like if ipumsr imports readr, it has created a larger derivative work of readr.

The (https://www.gnu.org/licenses/gpl-faq.html#GPLStaticVsDynamic)[GPL FAQ] confirms this strict interpretation:

>Linking a GPL covered work statically or dynamically with other modules is making a combined work based on the GPL covered work. Thus, the terms and conditions of the GNU General Public License cover the whole combination.

I suppose the FSF's position isn't that surprising. Richard Stallman invented the GPL in 1989. Stallman is one of the world's foremost "Free as in Free Speech" free software proponents. Agree with his viewpoint or not, it makes perfect sense that his intent would be that anyone who uses GPL'ed code to build a software system should have to release their source code back to the world.

The FAQ goes on to say:

>If the main program dynamically links plug-ins, and they make function calls to each other and share data structures, we believe they form a single combined program, which must be treated as an extension of both the main program and the plug-ins. If the main program dynamically links plug-ins, but the communication between them is limited to invoking the ‘main’ function of the plug-in with some options and waiting for it to return, that is a borderline case.

Now we're getting oddly situational about what does and does not constitute a combined work. That last bit about "only invoking main" is a bit confusing in how that would apply to the readr-ipumsr relationship. readr has a function to read a csv file. The file is an option to that function. Is that use case covered under this exception? Or because the function is returning a data structure which ipumsr is going to interact with, are we indeed creating a combined work? Not very clarifying.

It gets even stranger when you dig into the FSF's answer to this FAQ question: _What is the difference between an “aggregate” and other kinds of “modified versions”?_

>An “aggregate” consists of a number of separate programs, distributed together on the same CD-ROM or other media. The GPL permits you to create and distribute an aggregate, even when the licenses of the other software are nonfree or GPL-incompatible. The only condition is that you cannot release the aggregate under a license that prohibits users from exercising rights that each program's individual license would grant them.
>
>Where's the line between two separate programs, and one program with two parts? This is a legal question, which ultimately judges will decide. We believe that a proper criterion depends both on the mechanism of communication (exec, pipes, rpc, function calls within a shared address space, etc.) and the semantics of the communication (what kinds of information are interchanged).
>
>If the modules are included in the same executable file, they are definitely combined in one program. If modules are designed to run linked together in a shared address space, that almost surely means combining them into one program.
>
>By contrast, pipes, sockets and command-line arguments are communication mechanisms normally used between two separate programs. So when they are used for communication, the modules normally are separate programs. But if the semantics of the communication are intimate enough, exchanging complex internal data structures, that too could be a basis to consider the two parts as combined into a larger program.

The interesting part of this answer is not whether we've distributing an aggreate or not (we'll talk about distribution more soon), but the insight this answer offers into what FSF considers to be a single program. They come back to "if the semantics of the communication are intimate enough", but also assert "this is a legal question, which ultimately judges will decide."

However, I think it's fair to conclude at this point that in the opinion of the FSF, they want what we're doing to be bound by GPL. Our ipumsr library doesn't work without significant interaction with readr, so therefore in their eyes we've created a combined work.

But what do others think? (reference Larry and others who fall in the "linking doesn't count" camp.)

Ultimately, it has not been sorted out in a court yet, so there's no clear answer as to the enforcibility of the GPL as the FSF wants it to be.

# Are We Actually Distributing the GPLed Library?

The second core question we need to explore is "Are we distributing any GPL code?"

The reason that's an important question is because lost in all of this thus far is the fact that copyleft only refers to the **distribution** of GPLed code. I can take all the GPLed code I want and build a completely proprietary system, as long as I'm the only one using it. So, are we distributing GPLed code?

With a language like R that has a central package repository, when someone downloads ipumsr from CRAN they're not downloading readr with ipumsr. Rather, ipumsr has a dependency on readr, and _the end user_ is the one who needs to satisfy that dependency by downloading readr. So, in one sense, it's the end user that's creating the derivative work by downloading GPL code onto their system to work with our MPL code.

If that interpretation is valid, then we would not be considered to be distributing the GPLed library at all, and this whole copyleft business doesn't apply to us.

Even if this interpretation is valid, this isn't terribly fair to our users. After all, they're taking ipumsr and working it into _their_ code, so now _their_ code could be considered a larger combined work subject to GPL (depending on if and how they want to redistribute it) even though readr is two steps removed from their code. Boo. We ought to be able to do better than that.

There's not a lot of discussion out there around how GPL is meant to apply in a world with centralized package repositories and tools which assemble dependencies on the fly on the end user's system. GPL came into being when that was not a very common paradigm, and it hasn't really been discussed as a potential loophole that I've seen, but it's a topic that seems worthy of exploring further.

# Open Source Libraries and the GPL Don't Mix Well: Enter LGPL

As we've now seen, the GPL can make writing and sharing libraries very confusing. This is partially because the GPL was written in a time when it was common to take all of the code your program needed, including libraries, compile it up as a single binary file, and ship it out on CDs, often as commercial software, without the source. Richard Stallman and the FSF wanted to prevent their code being used in that way. They wanted to keep the source code of any derivative software that benefited from free software freely available itself. In that context, the GPL makes a lot of sense.

It makes a lot less sense in the "open source is everywhere, interpreted language dominated, package repository driven, write something useful and throw it up on GitHub, take each other's libraries and build useful things any way you want" world that we live in today.

In fact, the need for something different was realized by the FSF way back in 1991, when they released the first version of the GNU Libary General Public License, now known as the Lesser General Public License, or LGPL. The LGPL is a "weak copyleft" license and it's very similar to the MPL that we use in that regard.

The basic idea of a "weak copyleft" license is "I want to ensure that if you modify my code, you give that modification back to the world freely, but I really don't care to restrict how you can simply use my code as part of your larger system." This license was envisioned for exactly the use case we have. If someone writes a library and wants to ensure that the source code for modified versions of that library remain available, but does not care to require everyone using their library to have to make their own source code freely available, then the LGPL was designed for them.

Why so many libraries in the CRAN choose to use GPL instead of LGPL is curious to me, when LGPL would be so much less restrictive in terms of how their library could be used. If a library author's goal is to give a library to the world for it to benefit from, no strings attached, then the GPL is not a good choice and LGPL would be much better. The GPL is really about enforcing the "free as in free speech" philosophy of the FSF pretty strongly on others. That's a totally valid approach, but one with a lot of consequences. It's giving -less- freedom to the recipient and is restricting the use cases for which your code can be used. If you don't feel strongly about free software as a philosophical movement, but rather tend to consider open source software from the more pragmatic, "good way to build good software" point of view, then the GPL is not the license for you.

# What Do We Do?

Certainly, the R community is full of examples of non-GPL libaries that depend on GPL libraries. Whether that's because those library authors are using the "simply using a library isn't creating a combined work" interpretation, or the "not distributing" interpretation, or that they're simply unaware of the licensing issue altogether, I don't know (though I suspect it's mostly the latter.)
