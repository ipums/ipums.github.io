---
layout: page
status: publish
published: true
title: 'Feeling Fuzzy: Name Matching at the MPC'
author: fran
teaser: "The MPC's data has been cited thousands of times.  In this article,
  we explore how we connected those citations with our user accounts using fuzzy name matching."
wordpress_id: 171
wordpress_url: http://tech.popdata.org/?p=171
date: '2014-10-10 18:04:38 -0500'
date_gmt: '2014-10-10 18:04:38 -0500'
categories: Code
tags:
- Blarticle
---

The MPC's data has been cited thousands of times by publications as varied as the academic journal Demography to the New York Times.  In this article, we explore how we make connections between those citations and the user accounts in our data dissemination products to help connect users to their work and to others doing similar work.

Here at the MPC, one of the ways that we measure the impact of our work is by tracking publications which cite our data.  This helps us understand how our work is impacting research areas such as global health, the welfare of women and children, immigration patterns and socioeconomic changes.  Our data show up in a lot of different types of publications, including newspapers, online media, PhD dissertations, governmental policy documents and non-profit charity reports, but the majority of citations are in the form of academic journal articles.  We track these in our internal bibliography database.  Our website users are obligated to cite us when they user our data in a publication, but they don't need to directly report their publications to us, so we rarely learn about citations from the authors.  Rather, our user support staff proactively searches for citations to our data on the web and within the common journal article repositories and conference proceedings.  We then enter them directly into our database.  We've done this for many years now and so far we've found more than 11,000 citations to our work.

We've always wanted to make links between the users using our data dissemination websites and the authors of the citations in our database.  Logic says that authors who are citing our data are very likely to also have a user account with us which they used to retrieve the data in the first place.  If we could make those links, we'd be able to display a user's citations as part of their profile page in the webapp.  This might encourage our users to let us know about additional publications of theirs that have used our data.  We'd be able to use these links to help users find other users who are doing similar work and publishing on similar topics.

To make these links, we'd have to find a way to match records between the two databases.  We have the user's first and last name from their account registration, so we can attempt to match that to the authors on each citation.  I recently tackled this task, and thought it was a good peek into the sorts of data munging we end up doing around here.

Name matching is a problem with lots of wrinkles.  People make typos when entering their account registration info or submitting citations to our database.  People get married and change their name.  Accented characters get modified or stripped by some citation systems.  Middle names or initials are included or excluded.  And so on.  Any matching strategy would have to be more complex than an exact string match on the names.

Luckily, we're no strangers to fuzzy matching around here.  When you deal with 200-year-old census data that was originally gathered by hand and digitized decades or centuries later, you come to expect dirty data.  We've written some pretty sophisticated code to try to cluster census strings like birthplace and occupation so that common typos, omissions, and transpositions don't result in a whole new occupation or place of birth.  For instance, "laborer" and "laborrer", or "Philadelphia" and "Philadelpha".  We've even tackled harder cases such as "farmer" and "framer".  Since both could be valid, we can look at the surrounding context (Do they reside on a farm or in a city? How is the rest of their family employed?) to determine the most likely truth.

But this name matching was just a side project, and I was looking for a quick-and-dirty approach.  I had one day to play with this problem, and I wanted to get this longstanding todo item off of our plate.  Even if I only uncovered some of the actual linkages, that represents potentially thousands of new links which didn't exist before.  That would kickstart our plans to enrich our user profiles and help our users network with each other.  In this case, great certainly seemed like the enemy of good.

When quick-and-dirty is the order of the day, I typically turn to Perl.  And I knew that Perl had a wealth of string comparison modules already written, a fact I hoped would save me precious time. The first class of modules I turned to were those which implemented phonetic string comparison algorithms.

## Phonetic String Comparison Algorithms
The idea with phonetic algorithms is to produce a code from the input string that encodes similar-sounding input strings into the same code.  For instance, the Soundex algorithm will encode both "Jonathan" and "Johnathan" as "J535".  This is accomplished via a set of rules that get applied to each character of the input string to distill it down to its phonetic code.

Soundex was the first popular phonetic algorithm, dating all the way back to 1918, and is still very popular today.  Most major programming languages and databases have a Soundex implementation.  I've used Soundex for similar problems at prior jobs, but it wasn't until I was researching this article that I realized that it was our very own industry that led to Soundex's popularity!  It was used in the 1930s for a retrospective analysis of the 1890-1920 US Censuses.

Soundex is good enough for many tasks, but because Soundex carries the first letter of the input string to the code, it misses some obvious cases.  For instance, "Catherine" encodes to C365 while "Katherine" encodes to K365.  Also, Soundex is designed for English names and does not handle surnames from other languages very well.

There have been a number of attempts to improve upon these deficiencies over the years.  The NYSIIS algorithm was designed to perform better with hispanic surnames, while Daitch-Mokotoff was an attempt to improve performance for Slavic and Yiddish surnames, and K&ouml;lner attempted the same for words of Germanic origin.  The Metaphone algorithm came along in 1990 as an improvement on the original Soundex algorithm, but was still focused on English words.

Since our users come from all over the world, none of these specialized algorithms were a perfect fit.  I was looking for one which was optimized to handle lots of language origins.  Luckily, in 2000 the author of Metaphone, Lawrence Philips, published Double Metaphone, which features a more complicated encoding scheme.  The "Double" refers to the fact that the algorithm returns not one but two codes, a primary and a secondary, in order to account for ambiguities and surnames which share a common ancestor.  Double Metaphone was also designed to account for the quirks and nuances of strings of many different origins.  It seems we had a winner.  Perl has the Text::DoubleMetaphone implementation, and this is what I chose to use for this project.

This algorithm proved to be great for catching many common cases of fuzzy name matches.  The table below has some examples of name pairs which produce a phonetic match using the Double Metaphone approach.

|String 1|String 2|
|-
|Gabriel Aquino|Gabrial Aquino|
|Albert Esteve|Alberto Esteve|
|Leticia Marteleto|Let&iacute;cia Marteleto|
|Rodolfo Gutierrez|Rodolfo Guti&eacute;rrez|
|Hoyt Bleakley|Hoty Bleakley|
|Alex Levkov|Alexey Levkov|
|Jeffrey Lin|Jeffery Lin|
|FlorenceMae Waldron|Florence Mae Waldron|

However, phonetic matching isn't perfect.  It can miss some cases, such as these real-world examples from our system which do not produce a phonetic match but are, in fact, referring to the same person:

|String 1|String 2|
|-
|Olivier Deschenes|Oliver Deschenes|
|Martin Fieder|Martin Fielder|
|Edward Levine|Edward Lewine|
|Keisuke Okada|Eisuke Okada|
|Melissa Moreno|Melissa Gearhart Moreno|
|Jeronimo Muniz|Jeronimo Oliveira Muniz|


Phonetic approaches can also generate some head-scratching false positives, such as the ones in the table below.

|String 1|String 2|
|-
|Christine O'Leary |Christopher H. Wheeler|
|Jie Wu|Zhou Yu|
|Donna Leicach|Daniel Koch|

Observing this, I then wanted to apply a second algorithmic approach to act as a check-and-balance to the phonetic algorithm.

## String Distance Algorithms
The second approach I wanted to explore was a string distance algorithm.  A string distance is simply a representation of how many edits (typically insertions, deletions and substitutions) would be required to transform one string into another - known as the "edit distance".  I had been familiar with this concept from prior work in bioinformatics, where it is common to categorize how alike two sequences of DNA are based on their edit distance from one another (pairwise alignment).  I wanted to include a distance algorithm to catch some of the cases where a phonetic algorithm would miss the match.

Perhaps the earliest popular algorithm for string distance is the Hamming distance algorithm, developed in the 1950s and used in telecommunications to indicate the number of flipped bits in two binary sequences, as a measure of signal error.  The Hamming distance algorithm only considers substitutions, so it is limited to words of equal length.  We'd need something more flexible than that.  The Levenshtein algorithm, one of the most ubiquitous distance algorithms, allows insertions and deletions along with substitutions, and therefore is a promising alternative.  Damerau-Levenshtein is a refinement of Levenshtein which also allows transpositions to count as a single edit instead of as a delete-and-insert combo in the original Levenshtein.  Since transposition is a common typo when entering text by hand, Damerau-Levenshtein was an attractive choice.  Perl provides implementations for all of these, including Text::Levenshtein::XS and Text::Levenshtein::Damerau::XS.  I chose to proceed with the latter (for now - read on).

There's a lot more nuance with interpreting edit distance results vs. phonetic algorithm results.  The phonetic approach is pretty cut and dry; either two strings have the same phonetic code or they don't.  With edit distances, it's up to the user to determine how a distance should be interpreted.  The only generality that one can hope to conclude is that two strings with a smaller distance are more likely to be a match (although even here there are edge cases which violate this principle).  But where do we draw the quality line?  At some edit distance N, you're going to get into a gray area where you have enough confidence that something is a match to consider it, but not enough confidence that it is a match to automatically accept it.

So a critical question to ask is "What are the range of distances within which my confidence of a match is such that it's worth further review?"  This is largely a trial-and-error phase of the problem - you run some trial data and see where the rate of actual matches falls off relative to the distance calculation.  To encapsulate this idea for the user support personnel who were ultimately going to review the list of potential matches I produced, I wanted to produce a confidence score for each match that factored in the results from both the phonetic algorithm and the distance algorithm.

## Representing Match Confidence
I reasoned about my match confidence algorithm by considering all the possibilities:

1. If two strings have a phonetic match and a distance of zero, they are a match with 100% confidence.  (Identical strings)
1. If two strings have a phonetic match and a non-zero distance, my confidence should decrease as distance increases.  (Similar strings that sound the same)
1. If two strings do not have a phonetic match but have a non-zero distance, my confidence should decrease more rapidly as distance increases.  (Similar strings that don't sound the same)
1. If two strings do not have a phonetic match and have a zero distance, something has gone horribly wrong.  (Two identical strings that don't sound the same?!)

Case #1 is clear - if the two strings are exactly the same, you've got a match by definition.  And case #4 should never happen.  Luckily, my code has yet to produce an instance of case #4, so I've passed at least one sanity test!

Cases #2 and #3 are where all the fun and danger lurks.

At this point, an important observation should be considered: not all distances are created equal.  Compare these two distance calculations:

`"bear" and "beet" => 2`

`"cheeseburger" and "cheesebruger" => 2`

Despite that fact that one pair of words is a lot more related than the other, the distance calculations are identical.  Intuitively, a distance of 2 between two words of length 12 is a lot more impressive than a distance of 2 between two words of length 4.  I wanted to represent this in my confidence somehow, so I created a simple ratio calculation:

`ratio = distance / length of the longer string`

I use this ratio in two ways.  First, if the ratio is too high (meaning the number of differing characters is approaching the total length of the strings), I toss out the comparison as a non-match immediately by comparing the ratio to a "distance match threshold".  For my input data, 0.1 turns out to be an effective threshold - above that and almost all of the extra potential matches turned out to be false positives.

The second way I use the ratio is as the modifier in case #2's confidence calculation.  So now for case #2 I chose a simple match confidence formula:

`confidence = 1 - ratio`

As the distance increases, my ratio will be a bigger number and my confidence will decrease.  For smaller words, it will take fewer edits to make the confidence really plummet than it does for longer words.  To say this is a poor excuse for an elegant algorithm is an understatement... but remember, quick and dirty.  This captures the intended effect, if in a bit of a "blunt-force instrument" kind of way.

Case #2 also exposes some interesting false positives, such as the ones I discussed in the phonetic algorithm section above.  Those string comparisons all produce phonetic matches, yet have distance scores so poor their ratios are above the threshold to even be considered a potential distance match.  So here the distance approach is acting as an effective check-and-balance to the phonetic approach, as desired.

Case #3 is the most interesting - strings that don't sound the same but are close in distance.  To wit:

|String 1|String 2|
|-
|Olivier Deschenes|Oliver Deschenes|
|Roberto Hernandez|Roberto Fernandez|
|Martin Fieder|Martin Fielder|
|Edward Levine|Edward Lewine|
|Keisuke Okada|Eisuke Okada|
|Ying Fang|Ying Yang|


These name pairs all fail to match phonetically but have a distance score of 1.  This is the most difficult bunch to sort out automatically - even after human inspection there are several cases that probably need further investigation.  As distance scores increase, the likelihood of a true match falls off precipitously.  In fact, in my testing I determined it was only worth looking at name pairs in this category with a distance of 1 or 2.  So, to reflect this in my confidence score for case #3:

`confidence = 1 - ratio - (0.1 * distance^2)`

I still consider the ratio because it's a lot easier for two short, completely unrelated names to have a small distance than it is for two longer names. As for the distance penalty, trial and error determined that 0.1 * distance^2 was an appropriate penalty.  There was more intuition than science involved here, and it could certainly be tweaked more, but it achieved the desired effect of stratifying the possible matches well away from the ones almost certain to be non-matches.  And yes, this can result in a negative confidence score in some limited cases.  Remember, quick and dirty.

My results were getting better all the time, but there was one last group of names that was still bugging me.  It seemed to me that not all edits are created equal.  For example, these two name pairs both have an edit distance of 9:

| String 1 | String 2 | Edit Distance |
|-
| Guillaume Boucher | Guillaume Vandenbroucke | 9 |
| Melissa Moreno | Melissa Gearhart Moreno | 9 |

I felt that there ought to be some way that I could penalize the 9 edits it takes to go from Boucher -> Vandenbroucke more severely than the 9 edits it takes to insert Melissa's maiden (or middle) name Gearhart.  The presence/absence of a middle initial or name is a common case for us, but because these name pairs rarely phonetically match, and the distance calculations tended to be high, we were missing these types of matches.

Distance algorithms generally assign each type of edit the same cost.  But what if I could explicitly state that I wanted insertions and deletions to be less penalized than substitutions?  I went searching for an algorithm that allowed me to do this and came across Text::Levenshtein::Flexible.  This module by Matthias Bethke is an extension of the Levenshtein algorithm which allows the user to assign costs for insertion, deletion and substitution.  Perfect!

After some trial and error, I settled upon keeping insertions and deletions at 1 while penalizing substitutions with a distance score of 4 ([1,1,4] is my edit penalty array).  I had to remember to update my ratio calculation as well.  I now use:

`ratio = distance / 4 * length of longer string`

I have to do this because now my average distance score is going to be higher, and I want to make sure that my ratio doesn't cause lots of good matches to cross over the threshold for being discarded as a potential distance match.  (If the Text::Levenshtein::Flexible module allowed for non-integer edit costs, I could have specified [0.25, 0.25, 1] instead and then left the ratio calculation unaltered.)

This change had the desired effect.  Comparisons like Melissa Moreno <=> Melissa Gearhart Moreno which strictly involved insertions were no longer being penalized as strongly as Guillaume Boucher <=> Guillaume Vandenbroucke.

## Wrapping Up

<a href="/images/haster.jpg"><img class="size-medium wp-image-227 alignright" src="/images/haster-300x217.jpg" alt="hamster" width="300" height="217" /></a>

At this point, I was happy with my algorithm soup.  I ran the process over the entire set of over 100k users and 10k citations and by the end of the day I had forwarded a list of potential matches and their confidence scores to our user support team for verification.  Preliminary indications are that we should be able to make links for at least 50% of our citations.  Not bad for a day's work!

Another job crossed off the list.  It wasn't always pretty, and there's certainly room for improvement, but this was a job that called for the 80/20 rule and I'm pretty pleased with how it turned out.  I hope others find this article useful for your own fuzzy name matching challenges, and I also hope that it gives you a small window into the sorts of tasks we tackle day in and day out here at MPC IT!
