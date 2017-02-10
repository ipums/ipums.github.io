---
layout: page
title: Improving Menu Creation in Excel with VBA
teaser: In this series, we present some highlights from Team Unicorn Rainbows' work in the first round of MPC IT Shark Tank.  This first post describes how we improved menu creation in Excel.
author: jdomingo
categories:
tags:
- IPUMS
- Excel
- VBA
- UnicornRainbows
---


Last year, the IT Core tackled a lot of [technical debt]({{site.url}}/mpc-it-new-years-resolutions-technical-debt-edition/) here at the MPC.  A sizeable chunk of that debt is VBA legacy code.  This VBA code is a collection of 62 macros for Excel and Word that researchers use to work with metadata on [IPUMS projects](https://www.ipums.org/).  Over 80% of these macros are used in Excel.  As part of the [inaugural Shark Tank cycle]({{site.url}}/Shark-Tank-Cycle-1-Results/), our team, Unicorn Rainbows, tackled the Excel side of this code base.

The team's main strategy for debt reduction is replacing VBA code with Python.  For this, we leveraged [xlwings](http://xlwings.org/) and [Miniconda](http://conda.pydata.org/miniconda.html).  We'll cover that work in future posts.  To facilitate this strategy, we had to refactor the VBA code.  The initial phase of that refactoring focused on menu creation.

Our Excel add-in provides 51 metadata tools (i.e., macros) in a menu with several submenus.  Here's one of the submenus:

![screenshot of data dictionaries submenu]({{site.urlimg}}/data-dicts_menu.png)

The add-in's menu is defined in a complex 2-dimensional array.  Here's the snippet of VBA code that defines the submenu above:

``` vb
'Menu commands. The mac() sub-arrays have the following structure:
'    macro name (0 for submenus)
'    caption
'    whether to begin a group
'    type of control (button or popup)
'    whether to put item on current submenu (1) or main menu (0)

ReDim mac(0 To 56)
'Data dictionaries.

mac(0) = Array(0, "&Data dictionaries", False, msoControlPopup, 0)
mac(1) = Array("IpDdShowAllOrJustVars", "&Show all rows or just variables", False, msoControlButton, 1)

'    - workbooks
mac(2) = Array("IpDdNewWorkbook", "&New workbook", True, msoControlButton, 1)
mac(3) = Array("IpDdFormat", "&Format", False, msoControlButton, 1)
mac(4) = Array("IpDdFormatSvarStyle", "&Format (svar style)", False, msoControlButton, 1)
mac(5) = Array("IpDdSortRowByTargetCodesFront", "Sort this svar value &rows", False, msoControlButton, 1)
mac(6) = Array("IpDdSortAllRowsByTargetCodesFront", "Sort all svar value &rows", False, msoControlButton, 1)

'   - tagging
mac(7) = Array("IpDdTaggingView", "&Tagging view", True, msoControlButton, 1)
mac(8) = Array("IpDdImportEnumTagValues", "&Import Enumeration Tags", False, msoControlButton, 1)
mac(9) = Array("IpDdDTagAutomate", "&Autopopulate D Tags", False, msoControlButton, 1)

'    - checks
mac(10) = Array("IpDdRunAllChecks", "Run &all checks", True, msoControlButton, 1)
mac(11) = Array("IpDdCheckColSeq", "Check &column sequence", False, msoControlButton, 1)
mac(12) = Array("IpDdCheckLongVars", "Check for &long variable names", False, msoControlButton, 1)
mac(13) = Array("IpDdCheckDupVarNames", "Check &duplicate variable names", False, msoControlButton, 1)
mac(14) = Array("IpDdCheckDupSVarNames", "Check &duplicate source variables", False, msoControlButton, 1)
mac(15) = Array("IpDdCheckForMissingInfo", "Check for &missing info", False, msoControlButton, 1)
mac(16) = Array("IpDdCheckNonNumeric", "Check for &non-numeric input codes", False, msoControlButton, 1)
mac(17) = Array("IpDdCheckDupValues", "Check for &duplicate values", False, msoControlButton, 1)
mac(18) = Array("IpDdCheckVariableWidthToColumnValue", "Check for consistency of var &width to column value", False, msoControlButton, 1)

'    - syntax files
mac(19) = Array("IpDdMakeSyntaxFileYAML", "Create syntax file &YAML", True, msoControlButton, 1)
mac(20) = Array("IpDdMakeSPSSUnivCheck", "Make SPSS syntax for &universe checking", False, msoControlButton, 1)

'    - misc
mac(21) = Array("IpDdCheckSmallCells", "Check for &small cells", True, msoControlButton, 1)
mac(22) = Array("IpDdMasterPropagate", "&Propagate edits from a master data dictionary", False, msoControlButton, 1)

'    - reformatting tools
mac(23) = Array("IpDdAdjustColLocations", "Adjust &column locations", True, msoControlButton, 1)
mac(24) = Array("IpDdMakeLeftSideBClean", "Make metadata for &leftside-B cleaning", False, msoControlButton, 1)
mac(25) = Array("IpDdGetFrequencies", "Get &frequencies", False, msoControlButton, 1)
```

Even with comments, it's hard to visualize what all the array elements do without studying the code that creates the menu from the array.  It's not visually obvious whether an item is in the top-level menu or one of the submenus.  Or that `True` for the third element in an item's subarray -- "Begin a group" -- puts a line separator between that menu item and the preceeding item.

Furthermore, maintaining the menu definition in the master array is challenging.  Inserting a new menu item forces a developer to update the array indexes for all the items after the new item.

To address these issues, we explored how to simplify the menu's definition.  Since we're integrating Python into this project, we took inspiration from its use of indentation to indicate code structure.  We developed a simple text format to define a menu that's independent of any programming language.  This new definition format visibly reflects the menu's multi-level structure; here's the snippet of the new definition for the submenu above:

``` plaintext
&Data dictionaries  ==>
    &Show all rows or just variables  |  IpDdShowAllOrJustVars
    
    # workbooks
    -----------
    &New workbook               |  IpDdNewWorkbook
    &Format                     |  IpDdFormat
    &Format (svar style)        |  IpDdFormatSvarStyle
    Sort this svar value &rows  |  IpDdSortRowByTargetCodesFront
    Sort all svar value &rows   |  IpDdSortAllRowsByTargetCodesFront
    
    # tagging
    ---------
    &Tagging view             |  IpDdTaggingView
    &Import Enumeration Tags  |  IpDdImportEnumTagValues
    &Autopopulate D Tags      |  IpDdDTagAutomate
    
    # checks
    --------
    Run &all checks                     |  IpDdRunAllChecks
    Check &column sequence              |  IpDdCheckColSeq
    Check for &long variable names      |  IpDdCheckLongVars
    Check &duplicate variable names     |  IpDdCheckDupVarNames
    Check &duplicate source variables   |  IpDdCheckDupSVarNames
    Check for &missing info             |  IpDdCheckForMissingInfo
    Check for &non-numeric input codes  |  IpDdCheckNonNumeric
    Check for &duplicate values         |  IpDdCheckDupValues
    Check for consistency of var &width to column value  |  IpDdCheckVariableWidthToColumnValue

    
    # syntax files
    --------------
    Create syntax file &YAML                 |  IpDdMakeSyntaxFileYAML
    Make SPSS syntax for &universe checking  |  IpDdMakeSPSSUnivCheck
    
    # misc
    ------
    Check for &small cells                          |  IpDdCheckSmallCells
    &Propagate edits from a master data dictionary  |  IpDdMasterPropagate
    
    # reformatting tools
    --------------------
    Adjust &column locations                |  IpDdAdjustColLocations
    Make metadata for &leftside-B cleaning  |  IpDdMakeLeftSideBClean
    Get &frequencies                        |  IpDdGetFrequencies
```

The basic elements in the menu definition are:

| submenu   | _caption_ "==>"
| menu item | _caption_ \| _action_
| separator | a line of 4 or more hyphens

For additional readability, blank lines and comment lines (those where the first non-whitespace character is "#") are ignored.

The [VBA module][] to create a custom Excel menu from an array of strings with a menu definition is a little more than 100 lines of code.  This library module allows a menu to defined in a string literal.  As an example, here's VBA code to create the sample menu described in the module's comments:

[VBA module]:  https://github.com/mnpopcenter/vba-libs/blob/master/menu_lib.bas

``` vb
Const MENU_DEFINITION = _
    "Foo | FooMacro"                              & vbLf & _
    "Bar | BarMacro"                              & vbLf & _
    "---------"                                   & vbLf & _
    "Compression ==>"                             & vbLf & _
    "     Normal      | CompressData ""Normal"""  & vbLf & _
    "     Fast        | CompressData ""Fast"""    & vbLf & _
    "     Best        | CompressData ""Best"""    & vbLf & _
    ""                                            & vbLf & _
    "-------"                                     & vbLf & _
    "Version  |  DisplayVersion"

Sub MakeMenu()
    Dim menu_defn() As String
    menu_defn = Split(MENU_DEFINITION, vbLf)
    menu_library.AddCustomMenu("My Menu", menu_defn)
End Sub
```

This approach works fine with menu definitions of modest length.  Given that our complete menu definition is over a hundred lines with comments, we chose to read the definition from a text file.  This alternative approach provides several benefits; for example, we no longer need to escape double quotes in menu actions.  

Another significant benefit is that we can now change the menu outside of Excel's VBA editor while working on the project's new Python code. Because the menu data is now contained in a defined, formatted text file instead of embedded in VBA code, it's also much (much!) easier to visually parse. 

Finally, and perhaps most importanly, by using the "_caption_ \| _action_" syntax for defining menu items, we've architected a model in which the action of the menu item is abstracted from the code that's executed, **_including whether that action calls VBA or Python code_**. This is a critical piece of building an infrastructure that allows for incremental replacement of VBA with Python, one macro at a time.  There is no need to re-engineer a massive VBA codebase all at once in Python. In other words, that technical debt hole we talked about being dug into at the start of the article? We just built the ladder. Stay tuned for future posts, where we will talk about climbing out.

