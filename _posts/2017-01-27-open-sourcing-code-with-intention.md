---
layout: page
title: Open Sourcing Code with Intention
teaser: "Here's what you need to think about before you open source your code."
author: fran
categories: code
tags: []
---

## Introduction

So you have a project that you think you'd like to open source? Great! While you
may be tempted to simply throw it up on Github and see what happens, with a bit
of forethought and preparation, you can better position your open source project
for success.

Recently at the MPC we've been paying more attention to open sourcing our code, as we would like to be doing more of this, and we've also got some projects wrapping up that are obligated to release their code. We've learned a lot as we've studied the best way to release our code back to the community. This post will walk you through a checklist of considerations that
one should make before open sourcing a project.

### Step 1. Answer "Why?"

Ask yourself why you want to open source your code. There are lots of valid reasons you may want to do this, such as:

* You've made something that you think others would like to use.
* You would like to recruit others to help develop this project.
* You have a project you no longer have time to work on, but want to put it out there so it can live on.
* You used or modified code in your project that has a license which requires you to release your code, or you have some other formal agreement to do so.
* You want to work on your project in the open to honor your personal principles and beliefs

The answer to "Why?" informs a lot of the rest of the decisions I'm going to discuss in this article. Being crystal clear about why you are open sourcing the code will make these decisions easier.

### Step 2. Choose and Implement a License

You might think you don't need a license. You might think "Hey, I don't care what happens to this code, anyone can do anything with it."  Guess what? There's a license for that! XXX In fact, if that's really what you intend for your code, not choosing a license actually has an opposite effect, and can even lock you out of using your own project!

> Unless you include a license that specifies otherwise, nobody else can use, copy, distribute, or modify your work without being at risk of take-downs, shake-downs, or litigation. Once the work has other contributors (each a copyright holder), “nobody” starts including you. - http://www.choosealicense.com

By including a license, you can be explicit about your expectations and make it easier for other individuals and organizations to use and contribute back to your project.

There are a lot of things one must consider when choosing an open source license, such as:
- Does my project use other open source code? If so, what license(s) is that code using? What restrictions do those licenses put on my own choice of license?
- Do I want to ensure that modifications to my code remain available as open source under the same terms?
- Do I have concerns regarding patents?
- Do I have an opinion about topics such as jurisdiction for litigation, how credit for your work is attributed to you, or whether people using this project internally in their organization still need to distribute their modifications?

As you can see, there are a lot of facets to choosing the right license, and you may not have considered many of these before. Fortunately, there are a number of good sites on the web that can assist you. Some of my favorites are:



- Prepare a license
- Prepare copyright
- Figure out where and how to host it
- Figure out what kind of support you are willing to provide
- Prepare the README and other documentation
- optional: document standards and best practices if you're going to do this in an organizational setting
- Other considerations (links)
