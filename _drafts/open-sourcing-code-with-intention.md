---
layout: page
title: Open Sourcing Code with Intention
teaser: "A quick guide to what you need to think about before you open source your code."
author: fran
categories: code
tags: []
---

## Introduction

So you have a project that you think you'd like to open source? Great! While you may be tempted to simply throw it up on GitHub and see what happens, you can better position your open source project for success with a bit of forethought and preparation.

Recently at the MPC, we've been paying more attention to open sourcing our code, as we would like to be doing more of this, and we've also got some projects wrapping up that are obligated to release their code. We've learned a lot as we've studied the best way to release our code back to the community. This post will walk you through a checklist of considerations that
one should make before open sourcing a project.

### Step 1. Answer "Why?"

Ask yourself why you want to open source your code. There are lots of valid reasons you may want to do this, such as:

* You've made something that you think others would like to use.
* You would like to recruit others to help develop this project.
* You have a project that you no longer have time to work on, but want to put it out there so it can live on.
* You used or modified code in your project that has a license which requires you to release your modifications, or you have some other formal agreement to do so.
* You simply want to work on your project in the open to honor your personal principles and beliefs.

The answer to "Why?" informs a lot of the rest of the decisions I'm going to discuss in this article. Being crystal clear about why you are open sourcing the code will make these decisions easier.

### Step 2. Clarify Who Holds Copyright.

Let's start this step by answering a critical question.

_**What's the difference between Copyright and License?**_

This is a really important distinction to understand. Copyright is a huge topic of its own, and I Am Not A Lawyer, so we're not going to go too deep into copyright today. Having said that, here's a ballpark answer:

  * **_Copyright_ is a form of protection granted by law to the person or persons who created the code**. "Person" here can refer to a natural person or a legal entity like a corporation - more on this in a bit. Each person is said to _hold_ the copyright to the code.

  * A **_license_ describes the rights that the copyright holder grants to another person** regarding usage of the copyrighted software.

For the purposes of open sourcing software, it's crucial to figure out who holds the copyright to the software because the copyright holder decides whether to release the code or not, and if so, under what license terms.  Therefore, in the simplest case, where you wrote software by yourself on your own time, you are the sole copyright holder.  If you decide to open source your code, you get to choose the license.

Under copyright law, the person who writes the code is not always considered the copyright holder.  In work-for-hire situations where an employee or contractor creates software for a company, the company holds copyright to the code unless it's been explicitly re-assigned to the coder.  As staff of the MPC, the University of Minnesota is our employer, so the university holds copyright to software we write.

Similarly, if you wrote software for your employer or client, you need to obtain their permission to release the work.

An interesting case regarding the work-for-hire is the US Government.  Works by the US Government have no copyright; therefore software written by federal employees is in the public domain.  Of course, they can restrict access to work for reasons such as national security.

 This absence of copyright does not extend to work done on behalf of the Government by a contractor, or by a grantee such as the MPC.  In the vast majority of those cases, the government gives the contractor or grantee (the University of Minnesota in our case) authorization to assert copyright to their work but requires them to grant the Government an unrestricted license to that work.

If you contribute code to an existing open source project, the authors still hold copyright.  So, larger open source projects will potentially have many different copyright holders.  If there is ever a need to change the project's license, the project would need the permission of every contributor.  For this reason, some larger projects require that contributors assign their copyright rights to a single entity organized for that purpose -- for example, the [Apache Software Foundation][] or the [Software Freedom Conservancy][] -- in order to ease management of the project's copyright and any future license changes.

[Apache Software Foundation]: https://www.apache.org/
[Software Freedom Conservancy]: https://sfconservancy.org/

Once copyright has been clarified, add that information to your project.  A top-level file called NOTICE or COPYRIGHT is one common way to do this. See the resources in the [Further Reading][] below for more information.  Although this file isn't required to hold copyright -- the law automatically grants copyright at the moment the code is created -- it informs others using the code who holds the copyright.

[Further Reading]: #further-reading


### Step 3. Choose and Implement a License

Now that you've figured out who holds copyright over the code, you can turn your attention to choosing a license and getting agreement from the copyright holder(s), if that's not you. Choosing a license is hard. There are many to choose from - MIT, GPL, LGPL, MPL, BSD-3, BSD-2, EPL... just for starters. And they're written in legalese in a way that makes it hard to decipher what they're really trying to say. I'll link to some resources in [Further Reading][] that will help sort through the options.

Given all this complexity, you might think it's easier to have no license. You might think "Hey, I don't care what happens to this code, anyone can do anything with it."  Guess what? There's a license for that! (The MIT License) In fact, if that's really what you intend for your code, not choosing a license actually has an opposite effect, and can even lock you out of using your own project!

> Unless you include a license that specifies otherwise, nobody else can use, copy, distribute, or modify your work without being at risk of take-downs, shake-downs, or litigation. Once the work has other contributors (each a copyright holder), “nobody” starts including you. -- <http://www.choosealicense.com>

By including a license, you're being explicit about your intentions and make it easier for other individuals and organizations to use and contribute back to your project. Having a license allows you to protect your ability to define the terms for use of your work - so do this before you invite others to contribute to your project!

There are a lot of things one must consider when choosing an open source license, such as:

- **Does my project use other open source code?**
If so, what license(s) is that code using? What restrictions do those licenses put on my own choice of license? An open source license will grant you specific rights on how you can use the code, including how you *may* -- or in some cases, *must* -- redistribute your project that uses their code.  You must make sure you choose a license for your project that is compatible with the licenses used by all the components you used.
- **Do I want to ensure that modifications to my code remain available as open source under the same terms?** This is one of the main differentiators of the various classes of open source licenses. Some require that derivative works are licensed under the same terms ("strong copyleft"), while some are more flexible and give the user more choice while preserving the requirement to release modified source code ("weak copyleft"), and still others impose only minimal requirements ("permissive").
- **Do I have concerns regarding patents?** If patents are an issue, you'll want to pay special attention. Some open source licenses do not address this topic.
- **Do I have an opinion about topics such as jurisdiction for litigation, how credit for my work is attributed to me, or whether people using this project internally in their organization still need to distribute their modifications?** All of these and more are typically covered by open source licenses.

As you can see, there are a lot of facets to choosing the right license, and you may not have considered many of these before. Fortunately, there are a number of good sites on the web that can assist you. They are listed in the [Further Reading][] section below.

Once you have chosen a license, you need to add it to your project. Start by creating a LICENSE file at the top level of your code with the license text in it. Some licenses also come with instructions on how to apply the license, such as specifying boilerplate text that you can place at the top of each file in your project.

### Step 4. Hosting Your Project

Ok, you've figured out copyright and you've chosen a license. Now it's time to put the project out there!

Many people assume that open sourcing a project means providing a publicly available source code repository for it. While this is usually the case, it's not a requirement -- you can simply put up a tarball of your code with the proper license and copyright information and satisfy the requirements for your open source license.

Having said that, in most cases you'll need a source code repository. Assuming you use Git for your source code versioning tool, the default choice here is [GitHub.com](https://github.com), which offers free public repositories. There are other choices which may make sense for your case, if you want to host your repository on-premise. GitHub charges fees for this service, but it can be had for free with tools such as [Bitbucket](https://bitbucket.org/) or [GitLab](https://gitlab.com/). GitHub is still the elephant in the room, but you might want to check out these and other options before committing to one.

_IMPORTANT: Before you put your code up on a public repository site, make sure you've scrubbed it for anything sensitive, like passwords, API keys or company-specific information.  Once it's out, there is no going back._

### Step 5. Documentation Best Practices

Be clear about your intentions for your project, and that starts right in the README file. The README should cover the following topics:

* A one-sentence summary of what your project aims to do.
* Instructions on how to install and use the code.
* A clear statement on the current state of the code - alpha, beta, stable, broken?
* Known bugs and issues.
* A statement about how to get help and report problems. Be very clear about how much support you are able to provide. It's ok to say "I don't have time to provide support but I hope someone finds this useful." It's less ok to have a bug tracker for your repository but to just ignore it.

You might also include a wishlist or TODO items, some explanation of the motivation for your project, some architectural documentation, or whatever else you feel might be helpful for users or contributors of your project.

### Step 6. Document Your Open-Source Practices

*This step is optional*.

If you are part of a larger organization that will be releasing multiple open source projects, you might want to take this time to document your license choice and implementation rationale. At the MPC, we made a short document titled "MPC Open Source Software Licensing Policy", the full text of which is here:

>Guiding Principles
>
>The MPC desires to (and is also obligated to via funding agency rules) release portions of its software portfolio as open source.  We wish for interested third parties to be able to download, configure, run, modify, contribute to, and re-distribute our software.  We view this as a valuable secondary contribution we can make to the community in addition to our primary research goals.
>
>Approving Code Release
>
>Please speak with your supervisor before releasing any MPC code as open source. We have checks and safeguards in place to make sure we don’t inadvertently release sensitive data or valuable intellectual property, violate the terms of any grants or contracts, or release code before we’re ready to provide public support for the codebase.
>
>License Choice
>
>In consultation with the University’s Office of Technology Commercialization and after in-depth study of the available open source licenses, we have determined that the Mozilla Public License v2.0 (MPL) is the most appropriate license in the general case.  Unless otherwise warranted, when we release MPC software as open source, we will utilize the MPL v2.0.
The MPL was chosen because we believe its “weak copyleft” approach strikes the right balance between encouraging reuse of our code by giving developers the freedom to use our code in a variety of ways while still requiring that they share any modifications made to our code back to the community.  Other individuals and organizations can use our code in their projects, both open source and not. And MPL is compatible with a wide range of other open source licenses, from permissive (academic) like BSD and MIT to "strong copyleft" (full reciprocity) like GPL.  The MPL was also chosen because we've found it easier to read and understand than the longer LGPL, the other popular weak copyleft license.

We also created a short document with the specific steps developers should take to include the licensing and copyright information in their project.

### Summary

With a little bit of forethought and preparation, you can open source your project in a way that helps you clearly understand your goals for doing so, leading to a more informed license choice and a project that is more accessible and usable for both potential users and potential contributors. It's worth the extra time and effort to avoid unintended consequences and maximize the value of your contribution to the community. Here at the MPC, we are certainly happy we spent the time considering these factors, and it now feels much easier to move forward with open sourcing more of our work in the near future.

We'd love to hear your experiences, questions and opinions - leave us a comment below! In the meantime, the links below are full of great information to help you continue your journey towards open sourcing your project with intention!

### Further Reading
 * [Open Source Initiative](http://opensource.org/) - This site has a comprehensive list of open source licenses and their details. They also have a great FAQ.
 * [OSS Watch License Chooser](http://oss-watch.ac.uk/apps/licdiff/) - This is a site with a wizard that will guide you to the best license options for your use case.
 * [Choose A License](https://choosealicense.com/) - Another license-choosing site that tries to simplify things by focusing only on a handful of commonly used licenses.
 * [Software Freedom Law Center](http://softwarefreedom.org/resources/2012/ManagingCopyrightInformation.html) - This is a great article from the Software Freedom Law Center that describes some practical best practices about managing your copyright and license information in your repository.
 * [Free Software Foundation](http://www.fsf.org/licensing/) and [GNU License List](https://www.gnu.org/licenses/license-list.html) - These are the websites for the Free Software Foundation and their GNU free software licenses. This is a good source of info to determine whether your chosen open source license is also a free software license. _[The difference between free software and open source software is a topic with a long and complicated history. Perhaps I will write a post on that someday, but in the meantime, there's some information on that topic on these sites as well. You could also read the O'Reilly books Free as in Freedom and The Cathedral and the Bazaar to start getting at both sides of the story.]_
