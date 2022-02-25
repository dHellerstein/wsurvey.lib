25 Feb 2022
# wsurvey.lib
Various useful javascript libraries: dropdown menus, floating content, table sort, and more

wsurvey.lib.zip contains several different javascript libraries. Some of them work with companion .php programs.
All of them require jQuery!

You can download a few of these seperately -- 
  [floatingContent](floatingContent) and 
  [dropDown](dropDown)  


Or grab all of them in a .zip file!

### wsurvey.lib.zip contains 4 subdirectories

-  **js**   : the javascript (.js) code. <br> 
-  **php**   : php scripts (that work with the js libraries) <br>
-  **doc**  : documentation (seperate .txt files for each library) <br>
- **example** : some simple demos

## Short summary of the javacript libraries

### wsurvey.adminLogon
     javascript, and an associated php file, that support slightly-secure admin logon
     using a hashed (with crc32 or MD5) password.
### wsurvey.arrayToHtml
     convert a javascript "associativeArray" into an html "table".
     Actually: into a set of <divs> that use floats to create a table-like format.
###  wsurvey.canvasChart
      dynamically creates plots using html5 "canvas" tools.
      from a dataset saved in a javascript array. Each row of the array is an object that specifies
      an "x" and "y" value.   And (optionally) a "L" (label), an "ID", and a number of display specs.
###  wsurvey.dropdown
       quickly creates one or more dropdown menus.
       Each dropdown menu will be automatically formatted to display a vertical list of bullet-like boxes,
       with highlighting that changes as the mouse moves over ("hovers") over each box.
###  wsurvey.floatingContent
     create *floating* -- moveable and resizeable -- containers.
      Within a  floatingContent container there will be a fixed header area (top line of the container).
      And a scrollable content area.  Both which can easily be updated with new content.
###  wsurvey.getJson
      a javascript, and associated php library, that implement an ajax requester for retrieving 
      json'ized arrays from a php script running on a server.
      It main strength is integrated error handling, and a fairly simple interface.
###  wsurvey.resizer
      create "coordinated & adjacent" resizable containers - that when one element shrinks, the other grows.
###  wsurvey.sortTable
      easily enable user chosen sorting of an existing html table. Lots of options
###  wsurvey.uploadFiles
      simplify file uploads using <input type="file" ...>, and drop zones, and explicit strings.
      One function can do it all, or you can use specific functions for finer control.
###  wsurvey.utils1
     an assortment of possibly useful javascript functions.
     Several are is used by the 'wsurvey.' libraries and utilities noted above!  
