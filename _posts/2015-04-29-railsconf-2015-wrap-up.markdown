---
layout: page
title: RailsConf 2015 Wrap-Up
author: marcus
teaser: The entire IPUMS web development team saddled up and headed to
  Atlanta for RailsConf 2015. Here's our summary.
date: '2015-04-29 13:40:06 -0500'
date_gmt: '2015-04-29 18:40:06 -0500'
categories: DevCulture
tags: []
---
Last week, the entire IPUMS web development team saddled up and headed to Atlanta for <a href="http://railsconf.com/">RailsConf 2015</a>. Having attended my first RailsConf just last year in Chicago, I'm not exactly a grizzled RailsConf veteran, but the warm, inclusive vibe of this conference feels like something you can count on as an attendee. RailsConf seems to embody the very best aspects of the Ruby developer community. Like all my favorite developer conferences, RailsConf leaves me feeling recharged and excited about programming, and the welcoming atmosphere provides a perfect backdrop for learning.

<b>"Meeting" Tenderlove</b>

Hands down, the highlight of my RailsConf 2015 experience was getting to meet Aaron Patterson (a.k.a <a href="https://twitter.com/tenderlove">Tenderlove</a>, all-around swell guy, core Rails <i>and</i> core Ruby team member). Well, maybe "meet" isn't exactly the right verb to use here. More accurately, my coworkers and I <i>insinuated ourselves </i>into a conversation Aaron was having with some other conference attendees. We hovered self-consciously near Aaron for several long-seeming minutes waiting for a moment to jump in before he finally noticed our presence and included us in the conversation. This immediately made us feel much less awkward. He then hooked each of us up with a coveted a <a href="https://twitter.com/gorbypuff">Gorbachev Puff-Puff Thunderhorse</a> sticker. Aaron is everything that is friendly and welcoming about the Ruby and Rails communities in human form.

<b>DHH's Keynote and the State of Rails</b>

Friendly and welcoming doesn't mean RailsConf is without its controversies. Last year, David Heinemeier Hansson (a.k.a.<a href="https://twitter.com/dhh"> DHH</a>, the creator of Rails) dropped several bombs in his opening keynote, most notably the claim that "Test-driven development is dead." Nearly every subsequent speaker I saw that year made some sort of (mildly snarky) comment about this statement. During and after the conference, the impact of "TDD is dead" continued to snowball, eventually reaching the larger software development community and culminating in a series of video hangouts in which DHH debated <a href="https://twitter.com/kentbeck">Kent Beck</a>, one of TDD's most well-known advocates. (Incidentally, I watched most of these hangouts, and it turned out they found more common ground than not.)

DHH took a much more measured approach with this year's opening keynote. Using a "<a href="http://en.wikipedia.org/wiki/Survivalism">prepper</a>" analogy, he likened the Rails stack to a backpack that contains everything a web developer might need to survive; this line of thought led to his most controversial contention: a defense of the "monolith" architecture, an argument against straying outside the Rails ecosystem with component-based systems and client-side MVC. Feeling that the term monolith has developed pejorative connotations, DHH suggested (half-jokingly?) abandoning the term in favor of "integrated systems." If nothing else, DHH is extremely consistent in these sorts of arguments: he believes that the Rails stack (as is) contains everything you need and that there's rarely any good reason to pull in external tools or depart from Rails conventions.

DDH also described several Rails 5 features, including ActionCable (a persistent, real-time, WebSockets-based connection that allows interactive message passing between a server and multiple clients), Turbolinks 3 (refinement of the Turbolinks library that allows asynchronous updates to specific parts of the DOM without requiring the developer to write any JavaScript), and a baked-in option to use Rails as a web API framework (stripping out the view layer as in<a href="https://github.com/rails-api/rails-api"> Rails API</a>). DDH made it clear that he isn't particularly thrilled about the web API feature but is willing to concede that there is obvious demand for it. While the lack of mind-blowingly innovative features planned for Rails 5 left <a href="http://railsbird.tumblr.com/post/117076597115/existential-crisis-at-railsconf">some attendees</a> worried about the future of Rails, <a href="https://www.amberbit.com/blog/2015/4/22/why-rails-5-turbolinks-3-action-cable-matter-and-why-dhh-was-right-all-along/">others</a> believe these new features are exactly what server-side Rails needs to maintain relevancy in a client-side world. What these three Rails 5 features have in common is that they're generally unobtrusive, non-breaking changes and can be ignored if you don't need them, which leads me to wonder if perhaps we're beginning to see a more mature and stable framework that isn't always changing so much under developers' feet. It does feel as though Rails is nearing some sort of inflection point, but interpreting what this means for its future is tricky. As Yoda would say, "Difficult to see. Always in motion is the future."

<b>The Presentations</b>

This year, RailsConf was compressed into three days, although my sense was that overall attendance was at least as high as last year's four-day conference. Aside from the twice-daily keynotes, there were six concurrent tracks (occasionally including a sponsored talk) at any given time. This made for some densely packed days and difficult session choices. I attended a fairly wide range of talks, with a focus on web APIs, code craft, talent growth, client-side MVC framework integration with Rails, and the occasional session that just seemed interesting (like<a href="https://twitter.com/wycats"> Yahuda Katz</a> and<a href="https://twitter.com/tomdale"> Tom Dale'</a>s excellent, standing-room-only Rust presentation).

If you have time to watch just a few of the RailsConf presentations online, I recommend watching Kent Beck's thoughtful, introspective closing keynote about how he has been able to overcome the self-doubt he sometimes feels as a developer;<a href="https://twitter.com/searls"> Justin Searls</a>' awesome "Sometimes a Controller is Just Controller," a talk about the biases implicit in the subjective term "good code"; and of course Aaron Patterson's hilarious and insightful keynote (complete with a Windows-XP-hosted PowerPoint slide deck and inevitable Blue Screen of Death) about (among many things) profiling Bundler and RubyGems performance.

My favorite presentation of them all was<a href="https://twitter.com/sandimetz"> Sandi Metz</a>'s stunningly elegant "Nothing is Something," a talk about achieving more fully realized object-oriented design in Ruby through dependency injection and application of the Null Object Pattern. The pacing and precision of this talk was just fantastic. If you only watch one presentation, make it Sandi's. This is the one I was still thinking about on the plane back to Minneapolis. It'll make you want to go refactor some code.

<b>Recommended talks:</b>

<ul>
<li>Sandi Metz: <a href="http://confreaks.tv/videos/railsconf2015-nothing-is-something"> Nothing is Something</a></li>
<li>Kent Beck: <a href="http://confreaks.tv/videos/railsconf2015-closing-keynote"> Keynote</a></li>
<li>David Heinemeier Hansson: <a href="http://confreaks.tv/videos/railsconf2015-opening-keynote"> Keynote</a></li>
<li>Aaron Patterson: <a href="http://confreaks.tv/videos/railsconf2015-keynote-day-2-opening"> Keynote</a></li>
<li>Justin Searls: <a href="http://confreaks.tv/videos/railsconf2015-sometimes-a-controller-is-just-a-controller"> Sometimes a Controller is Just a Controller</a></li>
<li>Kerri Miller: <a href="http://confreaks.tv/videos/railsconf2015-why-we-re-bad-at-hiring-and-how-to-fix-it">Why We're Bad at Hiring</a></li>
<li>Bree Thomas: <a href="http://confreaks.tv/videos/railsconf2015-burn-rubber-does-not-mean-warp-speed">Burn Rubber Does Not Mean Warp Speed</a></li>
<li>Joe Mastey: <a href="http://confreaks.tv/videos/railsconf2015-bringing-ux-to-your-code"> Bringing UX to Your Code</a></li>
<li>Yahuda Katz and Tom Dale: <a href="http://confreaks.tv/videos/railsconf2015-bending-the-curve-how-rust-helped-us-write-better-ruby">Bending the Curve: How Rust Helped Us Write Better Ruby</a></li>
<li>Derek Prior: <a href="http://confreaks.tv/videos/railsconf2015-implementing-a-strong-code-review-culture">Implementing a Strong Code Review Culture</a></li>
</ul>
