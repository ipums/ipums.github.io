---
author: jakew
title: Implementing The Fastest (Psuedo) Jaro-Winkler Algorithm in Rust 
teaser: Creating one of the fastest jaro winkler implementations available
categories: Code
tags:
- Rust
- Linking
---

After binging these very nerdy conference videos focused on performance improvements:
  - [CppCon 2019: Andrei Alexandrescu "Speed Is Found In The Minds of People"](https://www.youtube.com/watch?v=FJJTYQYB1JQ&t=4117s)
  - [CppCon 2016: Timur Doumler "Want fast C++? Know your hardware!"](https://www.youtube.com/watch?v=BP6NxVxDQIs)
  - [CppCon 2015: Andrei Alexandrescu "Declarative Control Flow"](https://www.youtube.com/watch?v=WjTrfoiB0MQ&t=1973s) (this one I actually used as a sleep aid..) 

I got the itch to try to speed something up that I’ve been struggling with for at least 5 years: the Jaro-Winkler algorithm.

This is a blog series that is separated into 2 separate posts. The first post is one the Jaro Winkler similarity measure itself, how it is constructed, and my implementation of this formula in rust using bitwise operations. The second is an interesting technical journey I went on in order to improve the performance of the "trailing_zeros()" function.


## Part 1: Speeding up Jaro Winkler with rust and bitwise operations

The Jaro Winkler distance is a string metric used to calculate the similarity between two strings. We use it extensively at IPUMS in order to create links between US censuses, because often people will have variations in their names between enumerations. For example, one year someone could have "Jakub" as their name and the next census it could be "Jacob".

### Jaro-Winkler metric explained

For those that aren’t familiar with the Jaro Winkler metric, here’s a quick rundown of what it is.

The Jaro Winkler algorithm computes a similarity score between two strings and is calculated in two parts. The "Jaro" part checks for matching characters and transpositions of characters between the two strings. The "Winkler" part is an adjustment to the "Jaro" score by weighting characters matched at the beginning of the string more than those at the end.  

#### The "Jaro" part

To calculate the Jaro part:

```
jaro(s1, s2) = ⅓ * ( m / ||s1|| + m / ||s2|| + (m-t) / m)

s1 = the first string
s2 = the second string
||s1|| = length of the first string
||s2|| = length of the second string
m = # of "matching characters"
t = # of "transpositions"
```

This looks complicated, but is really just calculating an average of 3 different things:
  - The percent of "matching" characters in the first string: `m / ||s1||`
  - The percent of "matching" characters in the second string: `m / ||s2||`
  - The percentage of matching characters that aren’t "transposed": `(m-t) / m`

The secret sauce in the jaro formula is how it defines "matching" and "transposition". A character is considered "matching" if it occurs in both strings within a specified maximum distance "d". This distance "d" is defined as `max(||s1||, ||s2||) / 2 - 1`, which means half of the length of the longest string minus 1. The number of transpositions is defined as half the number of "matching" characters that are out of sequence.

#### Examples:
  1. `jaro("jake", "joe")`
      - First find the maximum distance "d" that two characters can be from each other and still considered matching: `d = max(||s1||, ||s2||) / 2 - 1 = 4 / 2 -1 = 1`
      - Then go through each character of the first string and find if it has a match. I’m writing the matches in the form of: (character in s1, index in s1) -> (character in s2, index in s2)
```
j,0 -> j,0
a,1 -> NO MATCH
k,2 -> NO MATCH
e,3 -> e,2
```
      - So in this case there are 2 matches and m = 2. The matching characters are "j" and "e", which occur in the exact same order in both strings, so there are no transpositions. This gives us the formula: `jaro("jake", "joe") =  ⅓ * ( m / ||s1|| + m / ||s2|| + (m-t) / m) = ⅓ * (2 / 4 + 2 / 3 + 2 / 2) = .722`
  2. `jaro("amy", "mary")`
      - Here’s another example with a transposition. First find the maximum distance "d": `d = max(||s1||, ||s2||) / 2 - 1 = 4 / 2 -1 = 1` 
      - Then find the matches:
```
a,0 -> a,1
m,1 -> m,0
y,2 -> y,3
```
      -  Because the "a" and "m" matches are out of sequence, then the number of transpositions "t" is equal to 2 / 2 = 1. Therefore: `jaro("amy", "mary") = ⅓ *  ( m / ||s1|| + m / ||s2|| + (m-t) / m) = ⅓ *  (3 / 3 + 3 / 4 + (3-1) / 3) = 0.806`

#### The "Winkler" part

Finally, we can move on to the "winkler" part of the jaro-winkler formula. The change is small but powerful and can be described with the following formula:

```
jaro_winkler(s1, s2) = jaro(s1, s2) + L *  P * (1 - jaro(s1, s2))

L = length of common prefix at the start of the 
    string up to a maximum of 4 characters

P = scaling factor for for how much the score is adjusted
    upwards for having common prefix
```

The "winkler" addition allows for a boost to the Jaro score when there are matching characters at the beginning of the strings. The size of this boost is controlled by the scaling factor "P", which is usually set to 0.1. This is a very useful addition to the Jaro score for our use case of name comparison, because often the beginning characters of names are more useful than other characters. For example nicknames, such as "Jake" for "Jacob", usually begin very similarly to their full counterparts.

The Jaro-Winkler measurement is very useful for us because it gives results which are quite similar to how a human would rate the similarities of two names and is able to be computed very quickly in comparison to other algorithms. At IPUMS, some of the largest datasets that we need to link are the 1930 and 1940 full count historical US censuses. In 1940 there were about 130,000,000 people in the United States, and in 1930 there were about 123,000,000 people. If we were to naively run a Jaro Winkler on every single pair of people then it would take about 1.6e+16 comparisons to see who might be a match. That would take an unreasonable amount of computational power to do, so we start by narrowing down the scope of the problem by only comparing people’s names who match on other attributes like sex, age, and birth place. Unfortanuetly, even after narrowing down the number of people that we compare, we still have significant performance issues with computing all these string comparisons.

### Performance improvements

There are two performance improvements that we have been experimenting with to speed up that process.


#### Lookup tables

The first major improvement to performance came from the batch_jaro_winkler implementation by Dominik Bousquet. The idea behind this implementation is to create a lookup table for one of the datasets that has tuples of names and pointers to the records with that name. This lookup table is keyed on the letters which are present in the names. For example:
```
{
  "a" => [("anne", [p1, p2, p3]]), ("jane", [p4, p5, p6]), ("aaron", [p7, p8, p9]), …]
  "b" => [("bob", [p9, p10, p11]), ("kalib", [p12, p13, p14]), ("bruno", [p15, p16, p17]), …]
}
```

Then for each name in the other dataset, you use the lookup table to only compare it against names which have at least one matching letter. For example if you were going to try to find matches for the name "joe", then you would look up the letters "j", "o", and "e" in your lookup table to get the possible matches. This avoids doing computations that would result in very low similarity scores.

#### Character bitmasks

The second major improvement was related to how the strings were stored. Generally, programmers think of strings as a sequence of contiguous characters in memory. For example, in the c programming language, the string "Jake" is stored as an array of 5 bytes. One byte for each letter in its ascii representation and a final null character "\0" which signifies the end of the string. It would be quite natural to implement the Jaro Winkler algorithm using this representation, and almost all implementations do so. This works great most of the time, but starts to run into trouble when comparing very large datasets of strings where each individual pair may have little in common. 

This is where a new representation of strings comes into play that I’ll call the "bitmask representation". In the bitmask representation the string "jake" would be stored as the following structure:

`[("j", "‘1000"), ("a", "0100"), ("k", "0010"), (e, "0001")].`

Each unique character in the string is stored as a 2-tuple (a pair of elements). The first element of the pair is the character and the second element are flags which indicate where in the word that character appears, with a 1 indicating the character occupies that position in the string and a 0 indicating it does not. If the character appears twice in a string, then two of the flags are set to 1. For example "mom" in binary representation is:

`[("m", "101"), ("o", "010")].`

This new representation allows for the use of bitwise operations. These operations act on binary data – each digit can only be a zero or a one – and because computer architecture is natively binary these operations are very fast. In fact many of the bitwise operations can be performed in a single machine instruction. Further thse operations are sometimes able to take advantage of a processor’s SIMD features, which allows for the processor to run a single instruction on multiple pieces of data in parallel.

A very common example of a useful bitwise operation is the ‘&’ (bitwise AND) operator, which compares two bit strings digit by digit and returns a bit string with 1’s where there was a 1 in both  bit strings. In our use case this can tell us when a letter was in the same position in the two names. Let’s say that I want to see if there are any "m"s matching in the strings "mom" and "martha". The bitmask representations for the "m"s in "mom" and "martha" are: "101000" and "100000" (you’ll notice that I padded the "mom" representation to a length of 6 with extra zeros so that the two matched in length). If you do the ‘&’ operation on those two bitmasks then you get  "100000", which is a new bitmask where all the "1" values represent places where the m’s match each other. Because "mom" and "martha" only have matching "m"s in the first place, the new bitmask has only one "1" in it. So in this example it took only a single machine instruction to check if there were matching "m"s. However if we did this in the traditional way then we would have to traverse each string and check if the characters are "m"s, which would take many many more machine instructions as you are now maintaining pointers, converting ascii to binary, and so on.

It would be extremely verbose for me to explain all of the small bitwise operations that are in use within the algorithm and would probably require an entire blog post of its own. If you are curious about the full implementation of the algorithm you can check out the code in our (relatively well-documented) repo on [github](https://github.com/ipums/pseudo_jaro_winkler).

#### SIMD

When running this algorithm on an architecture that supports SIMD operations, the compiler will optimize the code to compare many names all at once with a single machine instruction. In our use case if we have a "jake" in 1940 and are trying to find potential matches in 1930, then we can compare "jake" to many 1930 names all at once. For instance we can look for ‘j’s in a set of 1930 names and find all of the matching ‘j’s in that set with one machine instruction. This is incredibly efficient. The compiler can only do SIMD optimizations like this under very specific conditions. Code complexity such as branching logic often makes this type of optimization impossible. However the core of this implementation of the Jaro Winkler algorithm is a loop exclusively composed of bitwise operations which the compiler can optimize easily. If you are interested in learning more about SIMD optimization you can check out this video from [CppCon](https://www.youtube.com/watch?v=BP6NxVxDQIs).

#### Performance Results

In the end I was able to achieve a 10-15x speedup compared to the [batch_jaro_winkler](https://github.com/dbousque/batch_jaro_winkler) library, and a 40-50x speedup compared to common string comparison libraries. However there is one caveat: in some cases the algorithm over counts transpositions resulting in occasionally depressed scores from other implementations. This difference is relatively minor in the average error size is 0.002 or less when testing against names from the 1880 U.S. census. Our next steps with the algorithm will be to extend it to include computing Jaro Winkler scores on multiple names for the same record (first and last), which will be required before we integrate it into our larger linking pipeline.
