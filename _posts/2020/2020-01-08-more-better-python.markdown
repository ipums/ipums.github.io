---
author: benklaas
title: "More Better Python: 10 Cool New (to me) Python Things"
teaser: "One of the sublime pleasures of Python is discovering newer, better ways at doing Python. Here are 10 I've discovered recently."
categories: Code
tags:
- Python
- Tips
- Black
- TQDM
- Flake8
- Napoleon
- VSCode
- bpython
- better_exceptions
- PyCon
---

It's the time of year when people compile lists of things, so I thought I'd join the fray with a list of 10 things I've recently folded into my own Python toolbox.

## 1. Paint it [Black](https://black.readthedocs.io/en/stable/)

[Black](https://black.readthedocs.io/en/stable/) is a code formatter that takes the reins over a tedious job.

As my co-worker Joe put it succinctly, "using [Black]([https://github.com/psf/black](https://github.com/psf/black)) is so freeing."

[Black]([https://github.com/psf/black](https://github.com/psf/black)) is really well described in [the first paragraph of its documentation](https://black.readthedocs.io/en/stable/):

> By using _Black_, you agree to cede control over minutiae of hand-formatting. In return, _Black_ gives you speed, determinism, and freedom from pycodestyle nagging about formatting. You will save time and mental energy for more important matters.

Well said. Since adopting [Black]([https://github.com/psf/black](https://github.com/psf/black)) in my workflow (and adopting automatic blackening as described in the next item), I don't really pay much attention to formatting any more. There's no need. 98% of what [Black]([https://github.com/psf/black](https://github.com/psf/black)) does looks great. The remaining 2% is passable, and if that 2% really grates at you because it isn't *just so*, consider re-evaluating what matters in code writing.

## 2. [Automatic Black and Flake8 Before Git Commits](https://ljvmiranda921.github.io/notebook/2018/06/21/precommits-using-black-and-flake8/)

[Black](https://github.com/psf/black) (auto-formatting) and [Flake8](http://flake8.pycqa.org/en/latest/) (PEP8 linter) are great tools for writing clean code, but they only work if you use them. Using them manually: sure. Using them automatically: YES PLEASE!

There are a number of ways one might fashion a precommit git hook to do black and flake8 before allowing a commit, but I found [Precommits using Black and Flake8](https://ljvmiranda921.github.io/notebook/2018/06/21/precommits-using-black-and-flake8/) to be just the ticket. This is a *really* cool way of doing automatic execution of Black and Flake8 before a git commit, which for my (and maybe your!) purposes is *exactly* where I want those tools to do their magic.

## 3. [Napoleon](https://sphinxcontrib-napoleon.readthedocs.io/en/latest/)

[Sphinx](http://www.sphinx-doc.org/en/master/#) is a technology for producing documentation for Python projects from the code's associated docstrings. It's an invaluable tool for delivering API documentation to developers. The docstrings you have to write in ReStructuredText though...seriously awful.

    :param path: The path of the file to wrap
    :type path: str
    :param field_storage: The :class:`FileStorage` instance to wrap
    :type field_storage: FileStorage
    :param temporary: Whether or not to delete the file when the File instance is destructed
    :type temporary: bool
    :returns: A buffered writable file descriptor
    :rtype: BufferedFileStorage
MY EYES!
With the [Napoleon](https://sphinxcontrib-napoleon.readthedocs.io/en/latest/) Sphinx extension, I can write the above in Google-style docstrings (Numpy-style also supported) like so:

    Args:
    path (str): The path of the file to wrap
    field_storage (FileStorage): The :class:`FileStorage` instance to wrap
    temporary (bool): Whether or not to delete the file when the File
       instance is destructed
       
    Returns:
        BufferedFileStorage: A buffered writable file descriptor

Napoleon under the hood takes these legible docstrings and pre-processes them to ReStructuredText to be fed into Sphinx to create your API docs. My library documentation is so much easier to write now.

## 4. How to use [print()](https://realpython.com/python-print/). Wait, WAT?

Really? I'm going to waste an entire part of this article on `print()`? I have no doubt if you're reading this you know how to `Hello World`. 

Hear me out though: have a read through [Your Guide to the Python Print Function](https://realpython.com/python-print/) and see if you can get through it without finding something new and valuable. For example, I've been using an awkward combination of `sys.stdout.write()` and  `sys.stdout.flush()` for years to cobble hold-the-newline print statements that don't buffer, when I could have been doing `print("isn't this easier?", end="", flush=True)`.



## 5. [TQDM](https://tqdm.github.io/)

If you write command-line programs that push feedback to the console, you've undoubtedly needed to deal with how best to message progress while long iterations are proceeding. The ideal UI for this in many cases is a progress bar, and my _de facto_ approach for this involves the low-overhead, full-featured library [TQDM](https://tqdm.github.io/).

> `tqdm`  means "progress" in Arabic (_taqadum_, تقدّم) and is an abbreviation for "I love you so much" in Spanish (_te quiero demasiado_).
> 
> Instantly make your loops show a smart progress meter - just wrap any iterable with  `tqdm(iterable)`, and you're done!

Well, not quite. The only rub I have with TQDM is that the defaults for the tqdm progress bar are a bit of a mess. 
![Screenshot of TQDM with TQDM defaults](/images/more_better_python/tqdm_defaults.png)
When I use TQDM, the typical thing I'm processing is files, and the thing I want to see progress for is how far along I am in processing those files as well as the percentage completion. So, I wrote this simple wrapper around TQDM that uses default values I'm happy with while still allowing the full power of customization by passing through arguments (or overriding those defaults) to `tqdm()`

    def progress_bar(iterable, **kwargs):                                                   
    """Wrapper on tqdm progress bar to give sensible defaults.                          
                                                                                        
    Args:                                                                               
        iterable: a data structure to be iterated with progress bar.                    
        kwargs: pass-through arguments to tqdm                                          
    Returns:                                                                            
        tqdm: progress bar with sensible defaults                        
    """                                                                                 
    defaults = {                                                                        
        "bar_format": "{l_bar}{bar}|{n_fmt}/{total_fmt} {percentage:3.0f}%",            
        "ncols": 80,                                                                    
        "unit": "files",                                                                
        "desc": "Files",                                                                
    }                                                                                   
    for k, v in defaults.items():                                                       
        if k not in kwargs:                                                             
            kwargs[k] = defaults[k]                                                     
    return tqdm(iterable, **kwargs)                                                     

This `progress_bar()` wrapper method can be invoked exactly as `tqdm()` is, but now the default progress bar is the much more sensible:
![Screenshot of TQDM with TQDM defaults](/images/more_better_python/tqdm_sensible_defaults.png)
Happy `progress_bar()`ing!

## 6. Python's stdlib has so. much. stuff.

Sure, there's a positively stunning amount of 3rd party libraries available at [PyPi ](https://pypi.org/search/?c=Programming%20Language%20::%20Python%20::%203), but I have to remind myself: always start with the libraries provided by the Python Standard Libraries (stdlib). Writing a program using only `stdlib` makes it far more portable and deployable. Some personal favorites:
* [collections.defaultdict](https://pymotw.com/3/collections/defaultdict.html): create dicts where missing keys return a default value. Avoids the tedious pattern of `my_dict = {}; if someKey not in my_dict: do_this() else: do_that()`. Since no checking of existing keys is necessary, when using a defaultdict that code pattern reduces to simply `do_that()`.
* [pathlib.Path](https://pymotw.com/3/pathlib/index.html): treat filepaths as objects. Stop it with the `os.path()` already! The most important library you can learn if you deal with filepaths.
* [functools.lru_cache](https://pymotw.com/3/functools/index.html): when you use the `@lru_cache` decorator, subsequent calls with the same arguments to a function will fetch the value from the in-memory lru_cache instead of re-running the function. This is supremely useful if your function is computationally expensive to run from scratch each time. Be careful though, you can really chew up a lot of RAM if you `@lru_cache` indiscriminately, as you are holding the results of the functions in memory.

stdlib modules I should use but keep forgetting to:
* [collections.Counter](https://pymotw.com/3/collections/counter.html) stop writing your own counting code!
* [string.Template](https://pymotw.com/3/string/index.html) how many hand-cobbled, complicated format strings do I need to write before using `string.Template`?

Two invaluable resources for exploring stdlib:
* [PyMOTW3](https://pymotw.com/3/index.html): Python3 Module of the Week is a great resource of code-by-example style writeups of stdlib modules. Indeed, all of the above links go there!
* [Modern Python Standard Library](https://www.packtpub.com/application-development/modern-python-standard-library-cookbook) If books are your thing, this is the one for stdlib info. Like PyMOTW3, it adopts a code-by-example model for teaching stdlib, and is a more comprehensive resource. I know price is a fungible thing, but at the time of writing this post the ebook version of this was $5. Money well spent.

## 7. [Visual Studio Code Insiders](https://code.visualstudio.com/insiders/) + [RemoteSSH](https://code.visualstudio.com/docs/remote/ssh) + [Python](https://code.visualstudio.com/docs/python/python-tutorial)

I will readily admit I am a caveman. I do a great deal of my code authoring via command-line vim. My first pass at debugging is almost always with `print()` statements, which is literally called "caveman debugging".

Lots of people are beholden to heavyweight IDEs like PyCharm. Pycharm _et al._ are great tools, but you either give yourself over to them or become disenchanted with the overhead, restrictions, and particulars of such tools. As a caveman, I lean strongly towards the latter. Microsoft's  [Visual Studio Code](https://code.visualstudio.com/insiders/) forges a middle ground, a lightweight IDE extensible for specific applications. For my purposes, the RemoteSSH and Python extensions make VS Code a compelling tool.

The work I do at ISRDI, including code development, requires access to a shared network drive with all of our data and metadata, accessible via ssh on linux servers. Using an IDE in this environment can be tricky. A typical solution might be to nfs mount or sshfs mount the drives locally and then use an IDE locally. Anyone that does this regularly knows it to be a shaky proposition as well as a hassle. The VS Code Remote-SSH approach is novel: over ssh to your remote host it drops in a remote headless "installation" (in quotes because nothing is actually compiled/installed). The VS Code front-end remains locally driven, giving you the speedy quickness of a desktop GUI, while the VS Code back-end is run on the host. Once initially configured, it's remarkably seamless and easy to use. While Jupyterlab via Jupyterhub is generally my go-to daily productivity tool, I lean on VS Code a lot for certain things. For example, it's really good at guiding you through git merge conflicts.

The "Insiders" version (a fancy name for a published beta branch) is what I went with early because that's how they released Remote-SSH and Python extensions initially. My guess is that these are all in the production version, but since Insiders has turned out to be totally stable for day-to-day use, I continue to recommend this version.

## 8. [better_exceptions](https://github.com/Qix-/better-exceptions)
Stack traces from raised exceptions are obviously a key tool in debugging Python programs. With [better_exceptions](https://github.com/Qix-/better-exceptions), it gets even better.
 
 For example, here's a program intended to convert a list of Fahrenheit temperatures to Celsius temperatures, but there's a bug:

    gp1  ~$ cat buggy.py
    fahrenheit_temps = [
    32, 5, 6, 15, 26, 212, 24, 33,
    -55, 30, '20', 31, 55, 15,
    15, 60, 1, -20, 1, ]
    
    celsius_temps = []
    for temp in fahrenheit_temps:
        celsius_temps.append(int((temp-32)-(5/9)))

Running this program will result in a `TypeError` when it hits the string in the list:
![Screenshot of exception without better_exceptions](/images/more_better_python/badexceptions.png)
That's the stack trace without [better_exceptions](https://github.com/Qix-/better-exceptions). Now let's take a look at the same exception with [better_exceptions](https://github.com/Qix-/better-exceptions) installed:
![Screenshot of exception with better_exceptions](/images/more_better_python/betterexceptions.png)
In the enhanced exception, [better_exceptions](https://github.com/Qix-/better-exceptions) improves on the standard stack trace by:

 1. Pointing directly at the part of the code that failed
 2. Printing the values of variables at the code line of failure
 3. Color coding the exception in a helpful manner.

In this trivial example, you can see that the `TypeError` was hit when hitting the string '20', and not for example when hitting a negative value earlier in the list of numbers.

So that's a simple example, but you (hopefully) are writing more complicated code, with objects and very big data structures and outside libraries, etc. This is where [better_exceptions](https://github.com/Qix-/better-exceptions) truly shines.

[better_exceptions](https://github.com/Qix-/better-exceptions) is also wonderful in that it is a "set it and forget it". Once you have it installed, you get a free lifetime subscription to [better_exceptions](https://github.com/Qix-/better-exceptions) in all the code you execute from the terminal.

## 9. [bpython](https://bpython-interpreter.org/)

It's hard not to have a pretty strong bias for [iPython](http://ipython.org/). As a REPL, it is a dependable workhorse and huge step up from the default python interpreter. More importantly perhaps, it provides the principal kernel that powers Jupyter Notebooks, which have been a game changer for reproducible code workflows. I've been using [iPython](http://ipython.org/) for years. It's great.

But...could there be a compelling alternative command-line REPL over [iPython](http://ipython.org/)? YES!

From the [bpython about page](https://bpython-interpreter.org/about.html):

> "bpython doesn't attempt to create anything new or groundbreaking, it
> simply brings together a few neat ideas and focuses on practicality
> and usefulness"

Check out these features:
-   In-line syntax highlighting
-   Readline-like autocomplete with suggestions displayed as you type.
-   Expected parameter list for any Python function.
-   "Rewind" function to pop the last line of code from memory and re-evaluate.
-   Send the code you've entered off to a pastebin.
-   Save the code you've entered to a file.
-   Auto-indentation.
 
If that's not enough to sway you to give [bpython](https://bpython-interpreter.org/) a try, [check out these screenshots](https://bpython-interpreter.org/screenshots.html)

[bpython](https://bpython-interpreter.org/) uses the curses library (ergo: no native Windows support) to do its magic, and as a result can provide a lot more interactivity than iPython can from a console. Give it a shot, my guess is you'll use it once or twice and it will win you over like it did me.

## 10. Attend [PyCon](https://us.pycon.org/)
Maybe this should have been the first one in the list...[PyCon](https://us.pycon.org/) is a GREAT way to get in touch with what's going on in the general Python community, and gets credit for a lot of the items listed above. For example, last year I both attended [a talk on Black by its author](https://youtu.be/esZLCuWs_2Y) and spoke on the conference room floor with Microsoft people about [Visual Studio Code](https://code.visualstudio.com/insiders/) and its new support for [remote ssh](https://code.visualstudio.com/docs/remote/ssh) and [Python](https://code.visualstudio.com/docs/python/python-tutorial). The conference is exceptionally well attended and organized and has something to offer across many perspectives and skill levels.

If you can't make it, browse through some of the talks from [PyCon 2019](https://www.youtube.com/results?search_query=pycon%202019), there's some great ones in there.

### Credits
* My co-worker Joe Grover is always jonesing for new tools, and a lot of the things above (e.g. Black, better_exceptions) first came on to my radar through Joe. 
* [PyCon](https://us.pycon.org/), as mentioned above, is a great spark generator for all things Python.
* I heard about the `print()` article on the [Talk Python to Me podcast](https://talkpython.fm/) episode [Top 10 RealPython Articles of 2019](https://talkpython.fm/episodes/show/244/top-10-real-python-articles-of-2019), which covered it and several other interesting articles. [RealPython](https://realpython.com/) is a great resource for focused Python articles and tutorials.
* I wrote this blog post using the browser-based markdown editor [StackEdit](https://stackedit.io/).

