---
layout: page
status: publish
published: true
title: 'Optimizing for Developer Happiness: Migrating from Java to Ruby Without Missing
  a Beat'
author: marcus
wordpress_id: 126
wordpress_url: http://tech.popdata.org/?p=126
date: '2014-09-09 16:41:12 -0500'
date_gmt: '2014-09-09 16:41:12 -0500'
categories: Infrastructure DevCulture
tags:
- JRuby
- Java
- Happiness
---

>"The goal of Ruby is to make programmers happy."
> - Yukihiro "Matz" Matsumoto

This is a story about how MPC IT walked the path from being a Java development shop to becoming a Ruby on Rails shop.  While it's now a few years old, we thought it would be a fun tale to share during the launch of our new team blog, and we also know that there are teams out there today that find themselves in the same position now that we were in back then.

## Stuck in Java Land

If you develop Java code long enough, there often comes a time when the warts of developing in Java finally wear you down to a point where you start daydreaming of how good life would be if only you could start using a different language.  After years of pumping out XML-configured web applications in various heavyweight Java frameworks, the MPC development team found ourselves at that very spot.  We had become enamored with the Ruby language and in particular the Rails web framework. We were excited about Rails' reliance on convention over configuration, its clean implementation of MVC, and perhaps most compellingly, ActiveRecord, the elegant ORM solution packaged with Rails.

At the time, many of us were using Hibernate, the Java-based ORM framework, to map Java objects to our often complicated database schemata and in the process, spending large amounts of time wrangling massive XML configuration files. ActiveRecord demanded no such ceremony and felt like a revelation.

From that point forward, we developed all greenfield web applications in Rails using (MRI) Ruby. However, our flagship and largest application was still a Struts-based behemoth, containing popular Java ecosystem components like Hibernate, Maven, ActiveMQ, and Apache Axis, all running in the Java web container Tomcat.

Lacking the time, resources, and buy-in for a from-scratch rewrite, two questions emerged: 1) is there some way to migrate bits of functionality to Rails without disrupting the working Struts application? 2) can a migration be done without altering the existing deployment infrastructure? Fortunately for the rest of the development team, Justin Coyne, a particularly insightful (now alumnus) MPC developer, answered both questions with an emphatic "yes!"

## JRuby to the Rescue

<a href="/images/java_jruby1.png"><img class="alignright wp-image-128 size-full" src="/images/java_jruby1.png" alt="Java to Jruby" width="203" height="80" /></a>

Justin realized that to pull off this delicate mission, he would need to deploy Ruby on Rails to a Java container. Lucky for him and us, we happened to be in exactly the right place at the right time.  The vibrant Twin Cities OSS community had recently released JRuby, the JVM Ruby implementation, along with a toolchain (Warbler, JRuby-Rack) tailor-made for this exact situation. So, with JRuby and friends in hand, our intrepid developer selected a small, self-contained segment of the app as his migration guinea pig.

Through some pattern-matching magic in the web.xml file, Justin configured the web application so that the Struts and Rails frameworks could <em>both</em> serve content from the <em>same</em> Tomcat-deployed WAR file. Based on the pattern matched in a requested URL, Tomcat would route certain requests to Rails and others to Struts. This setup allowed features to be ported from Struts to Rails in a controlled, piecemeal fashion while the app remained deployable and fully functional at each stage.  Let's stop for a moment to underscore the significance of this: our web application was now running both Struts and Rails in production!

Aside from the URLs for each chunk of functionality changing during this process, this transition was seamless from the end users' perspective, and the user interface was essentially unaffected. Key to this migration, of course, was a robust set of automated unit and integration tests to ensure that functionality was neither lost nor broken along the way.

Over the next several months, our team proceeded to migrate each aspect of the live web application from Struts to Rails until we had eliminated every line of Java code. Now, a couple of years later, we continue to enjoy the performance benefits of JRuby (though our code runs happily under MRI), but our app is 100% Rails.

If you are looking for a path off of Java, this strategy might be a compelling candidate.  If your development shop truly requires apps to be written in the Java language, porting to Ruby is probably not an option. However, if your shop merely requires that apps be JVM-deployable, JRuby might be your path to developer happiness.

In our case, it's certainly <strong>developer happiness achieved.</strong>

<a href="/images/keep-calm-code-in-ruby-e1411412083867.png"><img class="alignnone size-full wp-image-140" src="/images/keep-calm-code-in-ruby-e1411412083867.png" alt="keep-calm-code-in-ruby" width="600" height="338" /></a>
