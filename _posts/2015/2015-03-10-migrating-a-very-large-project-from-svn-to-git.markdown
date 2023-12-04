---
layout: page
status: publish
published: true
title: Migrating a Very Large Project from SVN to Git
author: jayandra
teaser: 'Jayandra shows us how to migrate a large, complex project from Subversion to Git.'
wordpress_id: 535
wordpress_url: http://tech.popdata.org/?p=535
date: '2015-03-10 12:59:54 -0500'
date_gmt: '2015-03-10 17:59:54 -0500'
categories: Infrastructure
tags: []
---
IPUMS is one of the oldest projects at the MPC, having been in active development for decades. Its first commit dates back to 2003, when IPUMS was first added to a version control system (VCS), which happened to be Concurrent Versions System (CVS), a popular VCS of that era. Several years later the project was migrated to Subversion (SVN), an improvement in terms of functionality and ease of use. Recently, however, the flexibility and increasing popularity of Git, combined with the University of Minnesota's introduction of its own enterprise GitHub instance, made a compelling case for the migration of the IPUMS codebase from SVN to Git. Based on this information, the IPUMS team decided to proceed with the code migration.

The first tool of choice was "git svn", which is built into Git and acts as a bidirectional bridge between SVN and Git. However, in digging further I learned about the <a href="https://rubygems.org/gems/svn2git">svn2git</a> gem, and ended up using it instead. The gem basically implements "git svn" under the hood, but additionally does the conversion of all SVN branches and tags to Git branches and tags. The fact that github suggests the use of svn2git in an <a href="https://help.github.com/articles/importing-from-subversion">article</a> regarding importing from svn to git also tempted me to use the gem.

Converting smaller SVN repositories to Git using the gem is quick and easy. However, in the case of IPUMS, the massive size of the existing SVN repository turned out to be a major challenge. The SVN repository for the IPUMS project was over 4GB in size and comprised 113 branches, 830 releases, and 30,943 commits. Running the conversion locally turned out to be more than my poor development box could handle: the process would often get killed due to memory issues. So, I had to run it on one of our compute machines, which had more physical memory than my local machine. I ran the svn2git conversion command using Unix <a href="https://www.gnu.org/software/screen/manual/screen.html">screen</a> tool, such that I could detach the screen session and reattach it anytime to peek into the progress made:

{% highlight bash %}
screen svn2git https://[<i>svn domain</i>]/repos/mpc/ipums/ --trunk trunk/ --tags releases/ --branches branches/
{% endhighlight %}

The conversion process was tough even for the powerful compute machines, often resulting in the process getting terminated. Whenever the process got terminated, I would resume it using the "rebase" command in svn2git such that the conversion would pick up where it left off.

{% highlight bash %}
cd <conversion_folder> && svn2git --rebase
{% endhighlight %}

After babysitting the process for a number of days, the conversion finally completed. The converted git repository was 2.02 GB in size.

After completing the conversion from SVN to GIT, I performed a number of Git cleanup activities. As we were permanently moving from svn to git, the SVN metadata used by svn2git to keep track of SVN repository could be deleted.

{% highlight bash %}
cd <conversion_folder> && rm -rf .git/svn
{% endhighlight %}

This decreased the size of our git repository from 2.02 GB to 1.27 GB.

The VCS at its root level had multiple projects in it. The IPUMS team opted to separate these projects into their own repositories such that each project contained only the commits specific to that project. For this purpose the "git filter-branch" tool with the "subdirectory-filter" option was used:

<code>git filter-branch --subdirectory-filter [directory name] --tag-name-filter cat -- --all</code>

The tool scanned through the whole repo and filtered out the commits that were related to the specified subdirectory. This filter operation was fast, and in no time the individual projects were separated to their own git repositories. Finally our capistrano deployment tasks were modified such that they would use the Git repository instead of SVN, and the conversion process was completed.

Some of the key points to be noted while converting a very large project from SVN to Git have been listed below:

* Depending upon project size, the svn to git conversion can be done on a local development machine or a dedicated remote server. When running in remote server, using "<em>screen</em>" to detach/reattach to your session is a must.
* When the conversion gets interrupted, the process can be resumed by using the rebase functionality of svn2git.
* In the case of one way conversion from SVN to GIT, the <em>.git/svn</em> subfolder can be deleted to reduce the size of converted git repository.
* The "<em>git filter-branch</em>" command can be used to filter out commits that are related to a specific directory.
