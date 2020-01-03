
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

As my co-worker Joe put it succinctly, "using [Black]([https://github.com/psf/black](https://github.com/psf/black)) is so freeing."

[Black]([https://github.com/psf/black](https://github.com/psf/black)) is really well described in [the first paragraph of its documentation](https://black.readthedocs.io/en/stable/):

> By using _Black_, you agree to cede control over minutiae of hand-formatting. In return, _Black_ gives you speed, determinism, and freedom from pycodestyle nagging about formatting. You will save time and mental energy for more important matters.

Well said. Since adopting [Black]([https://github.com/psf/black](https://github.com/psf/black)) in my workflow (and adopting automatic blackening as described in the next item), I don't really pay much attention to formatting any more. There's no need. 98% of what [Black]([https://github.com/psf/black](https://github.com/psf/black)) does looks great. The remaining 2% is passable, and if that 2% really grates at you because it isn't *just so*, consider re-evaluating what matters in code writing.

## 2. Automatically Excecute Black and Flake8 Before Git Commits

[Black]([https://github.com/psf/black](https://github.com/psf/black)) (auto-formatting) and [Flake8](http://flake8.pycqa.org/en/latest/) (PEP8 linter) are great tools for writing clean code, but they only work if you use them. Using them manually: sure. Using them automatically: YES PLEASE!

There are a number of ways one might fashion a precommit git hook to do black and flake8 before allowing a commit, but I found [Precommits using Black and Flake8](https://ljvmiranda921.github.io/notebook/2018/06/21/precommits-using-black-and-flake8/) to be just the ticket. This is a *really* cool way of doing automatic execution of Black and Flake8 before a git commit, which for my (and maybe your!) purposes is *exactly* where I want those tools to do their magic.

## 3. Jupyterhub/Jupyterlab (especially the terminal)

Explain why the Terminal in Jupyterlab via Jupyterhub is Certified Fresh

## 4. Using print() Smarter

Link to Real Python article, credit to Talk Python to Me

## 5. TQDM

Talk about wrapping TQDM

## 6. Python's stdlib has so. much. stuff.

Sure, there's a positively stunning amount of 3rd party libraries available at [PyPi ](https://pypi.org/search/?c=Programming%20Language%20::%20Python%20::%203), but I have to remind myself: always start with the libraries provided by the Python Standard Libraries (stdlib). Writing a program using only `stdlib` makes it far more portable and deployable. Some personal favorites:
* [collections.defaultdict](https://pymotw.com/3/collections/defaultdict.html): create dicts where missing keys return a default value. Avoids the tedious pattern of `my_dict = {}; if someKey not in my_dict: do_this() else: do_that()`. Since no checking of existing keys is necessary, it reduces to `do_that()`.
* [pathlib.Path](https://pymotw.com/3/pathlib/index.html): treat filepaths as objects. Stop it with the `os.path()` already! The most important library you can learn if you deal with filepaths.
* [functools.lru_cache](https://pymotw.com/3/functools/index.html): when you use the `@lru_cache` decorator, subsequent calls with the same arguments to a function will fetch the value from the in-memory lru_cache instead of re-running the function. This is supremely useful if your function is computationally expensive to run from scratch each time. Be careful though, you can really chew up a lot of RAM if you `@lru_cache` indiscriminately, as you are holding the results of the functions in memory.

stdlib modules I should use but keep forgetting to:
* [collections.Counter](https://pymotw.com/3/collections/counter.html) stop writing your own counting code!
* [string.Template](https://pymotw.com/3/string/index.html) how many hand-cobbled, complicated format strings do I need to write before using `string.Template`?

Two invaluable resources for exploring stdlib:
* [PyMOTW3](https://pymotw.com/3/index.html): Python3 Module of the Week is a great resource of code-by-example style writeups of stdlib modules. Indeed, all of the above links go right there!
* [Modern Python Standard Library](https://www.packtpub.com/application-development/modern-python-standard-library-cookbook) If books are your thing, this is the one for stdlib info. Like PyMOTW3, it adopts a code-by-example model for teaching stdlib, and is a more comprehensive resource. I know price is a fungible thing, but at the time of writing this post the ebook version of this was $5. Money well spent.

## 7. VSCode + RemoteSSH + Python

VSCode, the IDE for IDE haters. RemoteSSH and Python supercharge it.

## 8. [better_exceptions](https://github.com/Qix-/better-exceptions)
Stack traces from raised exceptions are obviously a key command-line tool in debugging Python programs. With [better_exceptions](https://github.com/Qix-/better-exceptions), it gets even better.
 
 For example, here's a program intended to convert a list of fahrenheit temperatures to celsius temperatures, but there's a bug:

    gp1  ~$ cat buggy.py
    fahrenheit_temps = [
    32, 5, 6, 15, 26, 212, 24, 33,
    -55, 30, '20', 31, 55, 15,
    15, 60, 1, -20, 1, ]
    
    celsius_temps = []
    for temp in fahrenheit_temps:
        celsius_temps.append(int((temp-32)-(5/9)))

Running this program will result in a `TypeError` when it hits the string in the list:
![Screenshot of exception without better_exceptions](https://benklaas.com/badexceptions.png)
That's the stack trace without [better_exceptions](https://github.com/Qix-/better-exceptions). Now let's take a look at the same exception with [better_exceptions](https://github.com/Qix-/better-exceptions) installed:
![Screenshot of exception with better_exceptions](https://benklaas.com/betterexceptions.png)
In the enhanced exception, [better_exceptions](https://github.com/Qix-/better-exceptions) improves on the standard stack trace by:

 1. Pointing directly at the part of the code that failed
 2. Printing the values of variables at the code line of failure
 3. Color coding the exception in a helpful manner.

In this trivial example, you can see that the `TypeError` was hit when hitting the string '20', and not for example when hitting a negative value earlier in the list of numbers.

So that's a simple example, but you (hopefully) are writing more complicated code, with objects and very big data structures and outside libraries, etc. This is where [better_exceptions](https://github.com/Qix-/better-exceptions) truly shines.

[better_exceptions](https://github.com/Qix-/better-exceptions) is also wonderful in that it is a "set it and forget it". Once you have it installed, you get a free lifetime subscription to [better_exceptions](https://github.com/Qix-/better-exceptions) in all the code you execute from the terminal.

## 9. bpython

There's a better command-line REPL than iPython? YES!

## 10. Attend PyCon


> Written with [StackEdit](https://stackedit.io/).

