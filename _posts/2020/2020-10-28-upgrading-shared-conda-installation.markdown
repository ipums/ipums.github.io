---
author: kjthomps
title: "Upgrading the Shared Conda Installation at ISRDI"
teaser: "A shared conda installation provides a multitude of benefits for an organization, but upgrading it can be a challenge. This is that journey."
categories: Code
tags:
- Python
- Conda
- Reproducibility
- PackageManagement
- DevOps
---
 
## Background

The Python ecosystem offers many ways to manage Python and third-party libraries, pip + virtualenv being a very common solution. At ISRDI, we have a fairly specific need not met by most of these solutions: we develop and deploy a large amount of software, mostly command-line tools, for our researchers to process large-scale demographic data. These scripts reside on multi-user linux servers, and it's a requirement that they perform consistently and reproducibly for all team members. For this purpose, we've arrived at conda as being the solution that works best for our needs, as it has the ability to create named, first-class citizen Python environments in which dependencies can be managed by safe and controlled means. 

From the Conda website:

> [Conda](https://conda.io/en/latest/) is an open source package management system and environment management system that runs on Windows, macOS and Linux. Conda quickly installs, runs and updates packages and their dependencies. Conda easily creates, saves, loads and switches between environments on your local computer. It was created for Python programs, but it can package and distribute software for any language.

It's clear from this description, especially the "environments on your local computer" part, that the main focus of this technology is for local development. In our case, we both want conda to be a server-based solution and *serve as a shared installation in which named environments can be used by multiple users on-demand*. Everyone working on our production servers uses these shared conda environments when running Python scripts to do data work. We have a custom conda channel where we serve builds of our own internal Python libraries, and we also use a number of these named environments as custom kernels for our shared JupyterHub/Lab installation (more on this to come in a separate blog post!). This setup has been a viable and beneficial solution for years at ISRDI, but it has its challenges, most notably *upgrading conda itself*.

Updating to new conda versions has been nearly impossible in the past because `conda update conda` has broken lots of things every time we've done version updates. We desperately wanted to update our conda however, as we were at a stage where the current conda version was no longer supported. Even more critically, [as a result of unfixed bugs in the version of conda we were using, many of our shared environments were not able to be updated](https://github.com/conda/conda-build/issues/3915). Outside of the perils of `conda update conda`, we also wanted a way to reduce cruft as we moved from version to version, so we wanted more of a "migration" than an "update" process to allow us some intentional housekeeping focus to remove some unused environments and package caches.

To achieve this goal, we devised a way to install multiple installations of conda side-by-side so that we can symlink conda to the `current` version installation while doing quality checking on the new `qa` version installation. This allows a full qualification before changing the symlink to the newer version (and thus putting the new installation into production for all users). We perform what is essentially an environment migration by exporting environment specs from `current`  recreating them in the `qa`. By directly invoking the python executables in the `qa` conda bin, we are able to test these environments before a zero-down-time cutover to the new installation via a one-line command to point the `current` symlink to the new installation.


## Directory organization

We install all conda installations under one folder:
```
/pkg/ipums/programming/:

└─ conda/
│
├─ current ⇒ e.g. v4.3 ← symlink to current conda version 
├─ qa ⇒ e.g. v4.8 ← symlink to next conda version undergoing QA
│
├─ envs ⇒ current/envs ← symlink to folder with current environments
│
├─ v4.3/ ← conda 4.3 root (base) environment
│ ├─ bin/
│ ├─ envs/ ← default location for conda 4.3 environments
│ ├─ pkgs/ ← default location for conda 4.3 package cache
│ └─ ...
├─ v4.8/ ← conda 4.8 root (base) environment
│ ├─ bin/
│ ├─ envs/ ← default location for conda 4.8 environments
│ ├─ pkgs/ ← default location for conda 4.8 package cache
│ └─ ...
├─ kernels/ ← for JupyterHub/JupyterLab, each points to environment-specific ipykernel
├─ mpc/ ← our custom conda channel for local packages
└─ tools/ ← installation directory for the code in this repository
```
The path `/pkg/ipums/programming/conda/current` is what all users get as the path to the shared conda environment, with that path's `bin/` folder being in all user's $PATH when logged in via a bash shell. This structure allows us to leave our production, or "`current`" conda intact while allowing us to test and qualify a new `qa` version in a separate installation. When we are ready to update to the `qa` version, we simply change the `current` symlink to point to this new version.

## Migration process

To begin a migration to a new conda version, we first use a miniconda installer to install the new version in the directory as described above. Then we symlink `qa` to the new version directory to allow us to both programmatically and manually access the `qa` environment in the following steps.

### Getting information about the current conda install

We then capture some information about the current conda install so we can get ready to reproduce it. We manually created an .ini file with a list of all current environments. This can be done by inventorying the `current` directory `envs/` or with `conda env list` in the `current` conda install. We communicate with all of the people responsible for those environments on Slack about whether or not they would like to have this environment migrated into the `qa` conda installation. If so, we indicate this in the .ini file with ` = REPLICATE`. If not, we mark it as ` = export` to flag it for exporting YAML but not creating it. By doing this we have available specs to recreate any of these environments should the need arise.

Further, we need to take care to make sure that all environments currently used as kernels in our shared JupyterLab/Hub are replicated.

Here is an example .ini file:
```
[environments]

# v4.3 environments as of 2020-10-19
# keep
hlink = REPLICATE
nhis_reformat = REPLICATE
super_important_jupyter_kernel = REPLICATE

# do not migrate
old_not_used = export
```
### Exporting YAML spec files for all environments

We wrote a script to export one .yml file per environment in the .ini file to an `env_specs` directory in the conda directory structure. As stated above, we are exporting YAML specs for all existing environments, not just those we are migrating.

The script uses the command `conda env export --name ENV_NAME --no-builds`. The `--no-builds` flag is important because many of the exact builds[^1] are no longer available in package repositories, and pretty much ever single environment build will fail with them in our situation. Because we were on version 4.3.22, and the `--no-builds` flag was broken in that minor version, we chanced a minor in-place conda version update to 4.3.31 where this bug fix was applied so that we didn't need to do post-processing of the yaml files on the command line (with tools such as sed, cut, grep, etc.) before recreating the environments.

[^1]: to be clear, in the conda ecosystem build hashes specifically tag a *specific build* for a specific version. While we want to control the specific version of software in a particular environment, getting the specific build of that version is not important to us, especially when those specific builds sometimes disappear from repositories. In other words, we're going to trust that v1.3.4 of a package is exactly v1.3.4 no matter where or when it was built.

### Replicating current environments in the QA installation

We wrote a second script to sequentially replicate the environments marked as ` = REPLICATE` in the .ini file in the `qa` conda installation. We observe the error output to the console as the script runs to see which envs fail. How we managed this during the first migration was to create a spreadsheet from the .ini file, and paste errors form the CLI output into the spreadsheet for manual remediation on an env-by-env basis. We hope future iterations automate this error capture.

One thing to note is that we had to add special handling in the script for local `noarch` conda packages. We identified the list of noarch packages in our custom conda channel and saved these in a text file. If the script found any of these packages in the YAML spec for an environment, it would strip it from the YAML before replicating it, then run a subsequent process to conda install each noarch package once the initial environment was created. We are hoping to rebuild these noarch packages now that we have migrated to a newer conda version to avoid this step in future migrations/updates.

### Troubleshooting failed environments

Out of the 60 environments we migrated from 4.3 to 4.8.5, 48 replicated using conda 4.8.5 successfully, while 12 had failures. Some common issues causing failures were:

-   Custom conda channel packages with really old versions no longer housed in our custom channel
    
-   Noarch packages listed in the pip installed package list often needed to be moved to the conda section of the .yml file. If the package had been installed with both conda and pip in the old environment, it needed to be removed from the list of pip installed packages in the .yml file.
    
-   Packages installed from git clones with pip needed to be removed from the .yml file and manually installed in the `qa` environment after the new env is recreated.

### Testing

We ran tests in several of the `qa` environments once we had recreated them to make sure the environment seemed to be behaving as expected with the `qa` conda. We took extra care to make sure we tested the environments that initially failed and needed some manual intervention, especially because several of these support essential internal services (mesos cluster, JupyterLab, etc.)

## Wrapping up loose ends

There will be a follow-up blog post to describe our shared JupyterHub/Lab installation, and how we have reconfigured that to make the conda update process easier and less interdependent. For now, the gist is that we have now containerized this deployment, and it needs to be pointed at the new conda installation when it is made current.

Finally, we change the `current` conda symlink to the `qa` version and remove the old `qa` symlink. If everything is broken and things are falling apart, our old `current` installation is still just hanging out in the conda directory, and we can simply switch the symlink back to buy us time for investigation and a fix without blocking our users work during that time.

## Some final thoughts

If Stackoverflow posts are any indication, we are far from the first work group to have `conda update conda` ruin our week with broken environments. We struggled to find much if anything written about managing a shared conda environment such as we have set up. Now that we have a path forward for updating our conda, we are even more convinced this is the right architecture for us. The shared environments ensure replicable and reproducible results with our software across users and/or data sets, and save enormous amounts of time in project on-boarding and set-up because the environments are automatically the same across users.

Are you using a shared conda installation at your institution? Please let us know because we'd love to compare notes!

