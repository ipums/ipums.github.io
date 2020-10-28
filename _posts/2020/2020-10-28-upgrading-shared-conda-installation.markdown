# Upgrading the shared conda installation at ISRDI
a project by Kelly Thompson, Ben Klaas, and Jimm Domingo

## Background

One of the major responsibilities of the Data Team in the ISRDI IT core is to develop software (mostly command line tools) for our researchers to process large-scale demographic data.  Many of these scripts are written in Python.  To ensure that these scripts perform consistently for all team members and across time, we have a single shared conda installation with numerous shared conda environments on our servers.  Everyone working on our production servers uses these shared conda environments when running Python scripts to do data work.  We have a custom conda channel where we serve builds of local Python packages, and we also reuse a number of environments as kernels in our shared JupyterHub/Lab installation (more on this to come in a separate blog post!)

Updating to new conda versions has been nearly impossible in the past because `conda update conda` has broken lots of things every time we've done version updates.  We desperately wanted to update our conda however, as we were at a stage where the current conda version was no longer supported and many of our shared environments were not able to be updated.  We additionally wanted a way to reduce cruft as we moved from version to version, so we wanted more of a "migration" than an "update" process to allow us some intentional housekeeping focus to remove some unused environments and package caches.  

We devised a way to install multiple versions of conda side-by-side so that we can symlink conda to the "current" version installation and do quality checking on new version installations ("QA" version) before changing the symlink to the newer version.  We perform what is essentially an environment migration by exporting environment specs from the current conda installation and recreating them in the QA version.  By directly invoking the python executables in the QA conda bin, we are able to test these environments before zero-down-time cutover to the new qa installation via a one-line command to change the conda symlink.

## Directory organization

We install all conda installations under one folder:

```
/pkg/ipums/programming/
  └─ conda/
       ├─ current ⇒ v4.3  ← symlink to current conda version
       ├─ qa      ⇒ v4.8  ← symlink to next conda version undergoing QA
       │
       ├─ envs    ⇒ current/envs  ← symlink to folder with current environments
       │
       ├─ v4.3/        ← conda 4.3 root (base) environment
       │    ├─ bin/
       │    ├─ envs/   ← default location for conda 4.3 environments
       │    ├─ pkgs/   ← default location for conda 4.3 package cache
       │    └─ ...
       ├─ v4.8/        ← conda 4.8 root (base) environment
       │    ├─ bin/
       │    ├─ envs/   ← default location for conda 4.8 environments
       │    ├─ pkgs/   ← default location for conda 4.8 package cache
       │    └─ ...
       │
       ├─ installers/  ← Miniconda3 installers for different conda versions & OSes;
       │                 IPUMS Excel Toolkit's Install_on_Win.cmd script uses these
       ├─ kernels/     ← for JupyterHub/JupyterLab
       ├─ mpc/         ← our custom conda channel for local packages
       └─ tools/       ← installation directory for the code in this repository
```

This structure allows us to leave our production conda intact while allowing us to test new versions in separate installations.  When we are ready to update to the QA version, we simply change the current conda symlink to point to the new version.

## Migration process

To begin a migration to a new version, we first use a miniconda installer to install the new version in the directory as described above.  We set up the QA version symlinks to allow us to programmatically and manually access the QA environment in the following steps.

### Getting information about the current conda install

We then capture some information about the current conda install so we can get ready to reproduce it.  We manually created an .ini file with a list of all current environments.  This can be done by inventorying the current `envs/` directory or with `conda env list` in the current conda install.  We communicate with all of the people responsible for the environment on Slack about whether or not they would like to have this environment in the new conda install.  If so, we indicate this in the .ini file with ` = REPLICATE`.  If not, we mark it as ` = export` because we would still like to export a YAML specification for it, in case we actually do need it in the future and want to recreate it later.  

We need to take care to make sure that all environments currently used as kernels in our shared JupyterLab/Hub are replicated.

Here is an example .ini file: 

```
[environments]
# v4.3 environments as of 2020-10-19

# keep
hlink = REPLICATE
nhis_reformat = REPLICATE
super_important_jupyter_kernel = REPLICATE

# delete
old_not_used = export
```


### Exporting YAML spec files for all environments

We wrote a script to export one .yml file per environment in the .ini file to an `env_specs` directory in the conda directory structure.  As stated above, we are exporting YAML specs for all existing environments, not just those we are migrating. 

The script uses the command `conda env export --name ENV_NAME --no-builds`.  The `--no-builds` flag is important because many of the exact builds are no longer available in package repositories, and pretty much ever single environment build will fail with them in our situation.  Because we were on version 4.3.22, and the `--no-builds` flag was broken in that minor version, we chanced a minor version update to 4.3.31 where this bug fix was applied so that we didn't need to do post-processing of the files on the command line (with tools such as sed, cut, grep, etc.) before recreating the environments.

### Replicating current environments in the QA installation

We wrote a second script to sequentially replicate the environments marked as ` = REPLICATE` in the .ini file in the QA conda installation.  We observe the error output to the console as the script runs to see which envs fail.  How we managed this during the first migration was to create a spreadsheet from the .ini file, and paste errors form the CLI output into the spreadsheet for manual remediation on an env-by-env basis.  We hope future iterations automate this error capture.

One thing to note is that we had to add special handling in the script for local `noarch` conda packages.  We identified the list of noarch packages in our custom conda channel and saved these in a text file.  If the script found any of these packages in the YAML spec for an environment, it would strip it from the YAML before replicating it, then run a subsequent process to conda install each noarch package once the initial environment was created.  We are hoping to rebuild these noarch packages now that we have migrated to a newer conda version, so this should hopefully not be needed in future migrations/updates.

### Troubleshooting failed environments

Out of the ~60 environments we migrated from 4.3 to 4.8.5, we 12 failures.  Some common issues causing failures were:
Custom conda channel packages with really old versions that are no longer in the custom channel
Noarch packages listed in the pip installed package list often needed to be moved to the conda section of the .yml file.  If the package had been installed with both conda and pip in the old environment, it needed to be removed from the list of pip installed packages in the .yml file.
Packages installed from git clones with pip needed to be removed from the .yml file and manually installed in the QA environment after the new env is recreated.

### Testing

We ran tests in several of the QA environments once we had recreated them to make sure the environment seemed to be behaving as expected with the QA conda.  We took extra care to make sure we tested the environments that initially failed and needed some manual intervention, especially because several of these support essential internal services (mesos cluster, JupyterLab, etc.)

## Wrapping up loose ends

There will be a follow-up blog post to describe our shared JupyterHub/Lab installation, and how we have reconfigured that to make the conda update process easier and less interdependent.  For now, the gist is that we have now containerized this deployment, and it needs to be pointed at the new conda installation when it is made current.

Finally, we change the `current` conda symlink to the `qa` version and remove the old `qa` symlink.  If everything is broken and things are falling apart, our old `current` installation is still just hanging out in the conda directory, and we can simply switch the symlink back to buy us time for investigation and a fix without blocking our users work during that time.  

## Some final thoughts

If Stackoverflow posts are any indication, we are far from the first work group to have `conda update conda` ruin our week with broken environments.  We struggled to find much if anything written about managing a shared conda environment such as we have set up.  Now that we have a path forward for updating our conda, we are even more convinced this is the right architecture for us.  The shared environments ensure replicable and reproducible results with our software across users and/or data sets, and save enormous amounts of time in project onboarding and set-up because the environments are automatically the same across users.

Are you using a shared conda installation at your institution?  Please let us know because we'd love to compare notes!

