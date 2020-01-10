---
title: "GPL: Do We Need to Wait for the Courts?"
teaser: "Is there another way to resolve the ambiguity with the GPL that doesn't involve the courts?"
author: jdomingo
categories:
  - Code
  - DevCulture
tags:
  - Open Source Licensing
---

In an [earlier post][], Fran, our IT director, shared the story of how we struggled with the ambiguity that arose from linking IPUMS software with GPL code.
I participated in some of the discussions, and provided feedback on that post.
I’m not an attorney, just a developer who’s had to wrestle with these issues throughout my career.

[earlier post]: https://tech.popdata.org/the-gpl-license-and-linking-still-unclear-after-30-years/

# Until the Court Decides

Midway through that story, Fran quoted the GPL FAQ where the Free Software Foundation (FSF) acknowledges the presence of legal ambiguity:

> Where’s the line between two separate programs, and one program with two parts?
> This is a legal question, which ultimately judges will decide.

He concluded the story, describing IPUMS’ decision to follow the less-than-ideal option that’s common practice in the R community for linking GPL and non-GPL code -- a practice which acquiesces to the uncertainty while waiting “for the legal community to clarify the issue, if ever”.

This need for legal clarification about GPL and linking is also noted by Van Lindberg -- an attorney, developer and author -- in his book [Intellectual Property and Open Source: A Practical Guide to Protecting Code][Lindberg book]:[^1]

[Lindberg book]: http://shop.oreilly.com/product/9780596517960.do

> Copyright law, especially as applied to computer software, is a difficult subject.
> Until a court rules on the exact terms of the GPL in exactly these circumstances, we just don’t know how the law deals with the issue of linking and derivative works.

But I wonder… do we have to wait for the courts?

Is the court the only way to resolve this ambiguity?
Statements like those above can easily be interpreted as the legal system is the only avenue to resolution.
But might there be another way forward?
Could this issue with the GPL be fixed outside of the courtroom?

# When & Where Does GPL Apply?

Lindberg devotes a whole chapter in his book to how to work with the GPL and its legal ambiguity.
The very first sentence in the chapter acknowledges the multitude of questions about the GPL:

> A lot of the most difficult questions in free and open source software revolve around the GPL.

Yet he continues the opening paragraph praising what the GPL has accomplished:

> The GPL has a lot of things going for it: it is the single most common open source software license, it has brought together a large and vibrant community of developers, and it is a brilliant hack, socially and legally.

He continues, that despite its accomplishments, the GPL has exasperated not just open source programmers, like us here in ISRDI IT, but legal professionals too:

> At the same time there is no single license that is more mistrusted or reviled than the GPL.
> Many open source developers refuse to accept or release code under the GPL because it imposes restrictions at the same time that it grants freedoms.
> I know from personal experience that the GPL gives most lawyers fits.

Lindberg identifies two key issues that drive people’s strong opinions of the GPL:

> In short, very few people have a balanced or nuanced view of the GPL -- they either love it or hate it.
> Speaking in broad generalizations, though, I think that these strong emotional reactions arise from two core issues.
>
> The first issue is the philosophy of free software.
> More than any other single document, the GPL has come to embody the free software movement, so people’s reactions to the GPL mirror their opinions of free software as a moral imperative. …
> These social issues are interesting but beyond the scope of this book.
>
> The second issue, though, is quite appropriate to our discussion: **legal ambiguity**. (emphasis added)
> There is basically no argument that the GPL is a valid and enforceable license.
> There is, however, a lot of confusion about when and where the GPL applies.

That’s the confusion that Fran recounted in the earlier post -- confusion that we spent a lot of time and effort struggling with.

# “We Just Don’t Know”

Fran observed that this confusion has been around for 3 decades.
Lindberg also highlights the issue’s longevity:

> Nevertheless, there is a persistent issue that won’t go away -- whether linking programs together creates a derivative work.
> If linking creates a derivative work, the GPL applies to the linked program; otherwise, the GPL doesn’t apply.
>
> In legal practice, this arises as a common concern of clients just getting into open source.
> This question is usually phrased as either, “Can I load and use a GPL-licensed library without applying the GPL to my application?” or, “Do I have to apply the GPL to my plug-in for a particular program if that program is licensed under the GPL?
>
> I won’t keep you in suspense; the short answer is that we don’t know.

We still don’t.
As Fran explained, because there’s no definitive answer, we used our best judgment to navigate through all the confusion and make a decision, so we could get on with other work.

# Linking = Derivative Work?

According to Lindberg, the crux of the matter is “whether linking creates a derivative work.”

> If linking creates a derivative work, the GPL applies to the linked program; otherwise, the GPL doesn’t apply.

In other words, “the scope of the GPL is intrinsically tied to the scope of copyright”.

> The GPLv2 makes an explicit tie between derivative works under copyright and the reach of the GPL; the GPL applies to **“either the Program or any derivative work under copyright law:** that is to say, **a work containing the Program or a portion of it, either verbatim or with modifications”** (emphasis added in the book).
> The GPLv3 similarly ties its interpretation to copyright law.
>
> … Copyright law must be interpreted to determine what constitutes derivative work; the GPL intends to go only as far as copyright law does.

The ambiguity arises because GPL extends the definition of a derivative work beyond the law.

> The more fundamental problem is that the arguments over linking and licensing are really arguments over the scope of copyright…
>
> … The problem is that in a number of public statements from the FSF, the tactical decision has been to take an expansive view of copyright, applying the GPL in the broadest range of situations possible.
>
> … The result is uncertainty and a perception, fed by the FSF itself, that the GPL is more infective than the license and the law may support.

Lindberg acknowledges that this long-running controversy has been very difficult to solve:

> The controversy over linking and licensing… isn’t an issue that is easily resolved.
> There are arguments and prominent open source experts on both sides of the divide.
> For example, Eben Moglen (attorney for the FSF and founder of the Software Freedom Conservancy) and Lawrence Rosen (former general counsel and director of the OSI[Open Source Initiative]) disagree on the scope of linking and licensing.

He devotes a lot of his GPL chapter examining the details of the controversy.
He concludes the chapter with a Q&A section, with the intent of providing guidance.
In one answer, he explains why his own interpretation of some linking scenarios differs from the GPL FAQ:

> The GPL FAQ was written in inexact language, and gives the impression that the rules regarding derivative works may have greater reach than current copyright law allows.
> The FSF has repeatedly stated, however, that they believe in copyright minimalism and that the GPL should not be interpreted to extend beyond the reach of copyright.

Of course, Lindberg's final answer acknowledges that the courts ultimately need to resolve the ambiguity:

> (Q) Can I depend on the answers in this Q&A to keep me out of trouble?
>
> (A) No. This is our best understanding of copyright law as it stands right now,[^2] but it could change tomorrow -- and nobody really knows until these questions are resolved in a court of law.

# Can FSF Resolve the Ambiguity?

But do we really need to wait for the courts?
Could the FSF resolve the issue outside of the courtroom?
Could the FSF modify the GPL and its FAQ to fix the ambiguity?
If they remove any confusing language that extends the definition of a derivative work, would the ambiguity be eliminated?

What if instead, they simply state the conditions under which the license applies.
So rather than trying to define linked programs as derivative works, the GPL simply stated that the act of linking with GPL code and distributing the linked program requires that the program be licensed under the GPL.
Avoid arguing whether the linked program is a derivative work or not.

Imagine if the FSF revised the GPL and its FAQ to eliminate all ambiguity without waiting for court action.
This long overdue clarity -- simply stating unambiguously that the GPL applies when linking to GPL code -- would benefit the whole free and open source community.

[^1]: It’s a well-written resource that I highly recommend for a open-source developer’s bookshelf.

[^2]: Note: the book was published a decade ago in 2009.
