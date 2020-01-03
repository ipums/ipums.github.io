
author: benklaas
title: '10 Small(ish) Things I've Recently Done To Be a Better Python Programmer'
teaser: 'One of the sublime pleasures of Python is discovering newer, better ways at doing Python. Here are 10 I've discovered recently.'
categories: 
- Python
- Tips
tags:
- Python
---

# More Better Python

It's the time of year when people compile lists of things, so I thought I'd join the fray with a quick list of 10 things I've recently folded into my Python toolbox.

## 1. Paint it Black

## 2. Automatically Excecute Black and Flake8 Before Git Commits

Black (auto-formatting) and Flake8 (PEP8 linter) are great tools for writing clean code, but they only work if you use them. Using them manually: sure. Using them automatically: YES PLEASE!

This is a really cool way of doing automatic execution of Black and Flake8 before a git commit, which for my (and maybe your!) purposes is *exactly* where I want those tools to do their magic.

[ find link for this trick ]

## 3. Jupyterhub/Jupyterlab (especially the terminal)

Explain why the Terminal in Jupyterlab via Jupyterhub is Certified Fresh

## 4. Using print() Smarter

Link to Real Python article, credit to Talk Python to Me

## 5. TQDM

Talk about wrapping TQDM

## 6. Python's stdlib has so. much. stuff.

Sure, there's a positively stunning amount of 3rd party libraries available at [PyPi ](https://pypi.org/search/?c=Programming%20Language%20::%20Python%20::%203), but I have to remind myself: always start with the libraries provided by the Python Standard Libraries (stdlib). 

Two invaluable resources for exploring stdlib:
* [PyMOTW3](https://pymotw.com/3/index.html): Python3 Module of the Week is a great resource of code-by-example style writeups of stdlib modules.
* [Modern Python Standard Library](https://www.packtpub.com/application-development/modern-python-standard-library-cookbook) If books are your thing, this is the one for stdlib info. Like PyMOTW3, it adopts a code-by-example model for teaching stdlib, and is a more comprehensive resource. I know price is a fungible thing, but at the time of writing this post the ebook version of this was $5. Money well spent.

## 7. VSCode + RemoteSSH + Python

VSCode, the IDE for IDE haters. RemoteSSH and Python supercharge it.

## 8. Better Exceptions
Stack traces from raised exceptions are obviously a key command-line tool in debugging Python programs. With [better_exceptions](https://github.com/Qix-/better-exceptions), it gets even better.
 
 For example, here's a program intended to convert a list of fahrenheit temperatures to celsius temperatures, but there's a bug

    gp1  ~$ cat buggy.py
    fahrenheit_temps = [
    32, 5, 6, 15, 26, 212, 24, 33,
    -55, 30, '20', 31, 55, 15,
    15, 60, 1, -20, 1, ]
    
    celsius_temps = []
    for temp in fahrenheit_temps:
        celsius_temps.append(int((temp-32)-(5/9)))

Running this program will result in a TypeError when it hits the string in the list:
![Screenshot of exception without better_exceptions](https://benklaas.com/badexceptions.png)
That's the stack trace without better_exceptions. Now let's take a look at the same exception with better_exceptions installed:
![Screenshot of exception with better_exceptions](https://benklaas.com/betterexceptions.png)
In the enhanced exception, better_exceptions improves on the standard stack trace by:

 1. Pointing directly at the part of the code that failed
 2. Printing the values of variables at the code line of failure
 3. Color coding the exception in a helpful manner.

In this trivial example, you can see that the TypeError was hit when hitting the string '20', and not for example when hitting a negative value earlier in the list of numbers.

So that's a simple example, but you (hopefully) are writing more complicated code, with objects and very big data structures and outside libraries, etc. This is where better_exceptions truly shines.

better_exceptions is also wonderful in that it is a "set it and forget it". Once you have it installed, you get a free lifetime subscription to better_exceptions in all the code you execute from the terminal.

## 9. bpython

There's a better command-line REPL than iPython? YES!

## 10. Attend PyCon


> Written with [StackEdit](https://stackedit.io/).

