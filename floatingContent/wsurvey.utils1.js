// wsurvey.utils (2022). Based on older versions in wsurveyUtils1.js

// intialize the wsurvey. "namespace" if not already initialized by some other wsurvey.xxx.js
if (typeof(wsurvey)=='undefined')  {
    var wsurvey={};
}

 
wsurvey.version=function(x) { return  '20220128.1'} ;

// --------------
// convert an argument(ado) to a jquery object.
// This is designed to be used to convert the evt argument (say from an .on('click',funcname) assignation), or an athis
// (from an  onClick="funcname(this)" ) to the jQuery instance of the button that was clicked (or similar)
// It can also look for an id, if ado is a string ('#' prepended if necessary)
// The which argument is used to control which element is returned. By default, the 'target' -- the element clicked on
// But if  a higher level (in the dom tree) element has the event handler, use of 'delegateTarget' will return that element
// (rather than the one clicked on)

wsurvey.argJquery=function(ado,which) {
    if (ado instanceof jQuery)  return ado ;  // already jquery object
    if (arguments.length<2) which='target';

    if (which!='target' && which!=='currentTarget' && which!=='delegateTarget' && which!=='relatedTarget') which='target';

    if (typeof(ado)=='string') {       // a bit of overkill to use this, but will deal with prepended #
       let ado2=jQuery.trim(ado);
       ado2= (ado.substr(0,1)!='#') ? '#'+ado2 : ado2 ;
       oof=jQuery(ado2);
       if (oof.length==0) return false ;
       return oof ;
    }
     if (typeof(ado)!=='object') return false ;   // should rarely happen

     if (typeof(ado.originalEvent)!=='undefined' && typeof(ado.target)!=='undefined') {  // .on ()
         let e1=jQuery(ado[which]);  // from an .on
         e1['argJqueryData']={} ;
         if (typeof(ado['data'])!='undefined') e1['argJqueryData']=ado['data'];
         return e1;
     }

     if (typeof(ado.currentTarget)!=='undefined' && typeof(ado.target)!=='undefined') {    // addeventlistener
         let e1=jQuery(ado[which]);  // from an .on
         e1['argJqueryData']={} ;
         if (typeof(ado['data'])!='undefined') e1['argJqueryData']=ado['data'];
         return e1;
     }

     oof=jQuery(ado);                  // a inlicne call this (no .data)
     if (oof.length==0) return false;  // but maybe not an inline call
     return oof;

}
//===============
// find "closest" matchto a selector -- an augmented .closest()
// 1) does self match (.filter) ? If not--
// 2) Does parent match (.parent)? If not
// 3) Either look at parent's children (.children), or all descendants (.find). If no match
// 4) Set parent= parent's parent (grandparent)
// 5) Repeat 2-5 until match, or until parent is <body>. If <body>, return false
// If match, return jQuery object pointing to the element
// Note that actual parent (step 3) children and .find are the same. But in later steps, find can be much broader
//  aid:  string id, or jQuery selector -- where to start the search
//   sel : jquery selector. I.e. '.gotInfo, or '[name="infoBug"], or 'input[type="file"]'

wsurvey.findRelative=function(aid,sel,doFind,maxDepth,showIter,iter) {

 if (arguments.length<2) return false;       // must be at least 2 argumetns
 if (arguments.length<3) doFind=1;      // descendants (not kids) search is the default
 if (arguments.length<4) maxDepth=220;      // not typically used
 if (arguments.length<5) showIter=0;      // for internal use only
 if (arguments.length<6) iter=0;      // for internal use only

 let eid=wsurvey.argJquery(aid);
 if (eid===false) return false ; // no match

  if (iter==0) {          // check self only on first (on later, "self" is a parent checked before the recursion call
    let egoo=eid.filter(sel);
    if (egoo.length>0) {
        if (showIter==1) return [eid,iter];
        return eid ;  // own self is  a match
    }
    let tagP=eid.prop('tagName').toLowerCase();  // probably never happens, but wth
    if (tagP=='body') {
      if (showIter==1) return [false,iter+0.5];
      return false ;      // top of tree, can't look no more
    }
  }

  let eparent=eid.parent();
  if (eparent.filter(sel).length>0) {
     if (showIter==1) return [eparent,iter];
     return eparent ;  // sel is a match
  }

// look at parents chilredn or all descendants. In iter 0 is the same, but wth
  var ekids ;
  if (doFind==1) {
      ekids=eparent.find(sel);
  } else {
      ekids=eparent.children(sel);
  }
  if (ekids.length>0) {
      if (showIter==1) return [$(ekids[0]),iter+0.5];
      return $(ekids[0]);  // return first match, if any
  }

// kids don't match. Go up a level?
 let tagP=eparent.prop('tagName').toLowerCase();
 if (tagP=='body') {    
    if (showIter==1) return [false,iter+0.5];
    return false ;      // top of tree, can't look no more

 }

 iter++;
 if (iter>maxDepth){
    if (showIter==1) return [false,iter];
    return false  ;    // arbitrary max (in case of error)
 }

 let agot=wsurvey.findRelative(eparent,sel,doFind,maxDepth,showIter,iter+1);
 return agot;  // agot will be element or array already
}

//=============
// quick stack trace  -- returns list of calling functions. As array or if ado='s', as a csv
// limitation: for xx.yy=function() -- can not read name ('' is used)
// Kind of deprecated; it is not depenadeable. SUggest use of console.trace() instead
wsurvey.quickStackTrace=function(ado)  {
     var list=[],sendString;
     if (arguments.length<1) sendString=0 ;
     if (typeof(ado)=='string' && jQuery.trim(ado).substr(0,1).toLowerCase()=='s') sendString=1;

     let foo1=arguments.callee.caller  ;
//     if (ado=='foo1' || foo1=='undefined') return 'No callers '; // should hever happen
     if (foo1=='undefined') return 'No callers '; // should hever happen
     if (typeof(foo1['name'])!='string') return 'No callers with name ';
     list.push(foo1['name']);

     for (var j=0;j<10;j++)  {  // 10 back max
       let a1=typeof(foo1['caller']);
       if (a1!=='function') break ;
       foo2=foo1['caller'];
       if (typeof(foo2['name'])!='string') break ;  // all done
       list.push(foo2['name']) ;
       foo1=foo2 ;
     }
     if (sendString==1) return list.join(', ');
       alert('try console.trace');
     console.trace('aaa') ;

     return list ;
}



//==================
// quick stack trace  -- returns list of calling functions. As array or if ado='s', as a csv
// limitation: for xx.yy=function() -- can not read name ('' is used)
// Kind of deprecated; it is not depenadeable. SUggest use of console.trace() instead
wsurvey.quickStackTrace=function(ado)  {
     var list=[],sendString;
     if (arguments.length<1) sendString=0 ;
     if (typeof(ado)=='string' && jQuery.trim(ado).substr(0,1).toLowerCase()=='s') sendString=1;

     let foo1=arguments.callee.caller  ;
//     if (ado=='foo1' || foo1=='undefined') return 'No callers '; // should hever happen
     if (foo1=='undefined') return 'No callers '; // should hever happen
     if (typeof(foo1['name'])!='string') return 'No callers with name ';
     list.push(foo1['name']);

     for (var j=0;j<10;j++)  {  // 10 back max
       let a1=typeof(foo1['caller']);
       if (a1!=='function') break ;
       foo2=foo1['caller'];
       if (typeof(foo2['name'])!='string') break ;  // all done
       list.push(foo2['name']) ;
       foo1=foo2 ;
     }
     if (sendString==1) return list.join(', ');
       alert('try console.trace');
     console.trace('aaa') ;

     return list ;
}




//-------------
// split a string into 2 parts, at achar. Returns array with part1 (before the achar), and part2. If no achar. part2=''
wsurvey.parseAt=function(theString,achar) {
     var iat,a1,a2;
     if (arguments.length<2) return [theString,''];
     iat=theString.indexOf(achar);
     if (iat<0) return [theString,''];
     if (iat==0) return ['',theString.substr(achar.length)];;
     a1=theString.substr(0,iat );
     a2=theString.substr(iat+achar.length);
     return [a1,a2];
}

//====================
// return the value of an index (aindex) in an object (aobj).
// If no such index, return adef.
// aobj: the object (associative array) to be searched
// aindex: a string: the index (within aobj) to look for. Or a csv of several indices
// adef: value to return if no match of aindex in aobj is found  -- only used if all=0
// notExact: The matching can be exact, case insensitive, abbrevation, or substring -- notExact controls this
//   0: case  sensitive (exact )
//   1: case inensitive (the default).
//   2: abbrevation (case insensitive)
//   3: substring (case insensitive)
// all: if 1, returns a array, each row of which is a 2 element array containing [matchingIndex,matchingIndexValue]
//      if all=1, and no matches, returns an empty array
//      Default is 0 (just return first match, or adef if no matches)
//
//    IF all=0, and there are multiple matches to a aindex, the first match is returned. Which may be indeterminate.
//    If all=1, all matches are returned in an array.
//    If all=1, adef is ignored.
//
// aindex is usually a single word, naming an attribute But, it can be a csv of several attributes.
// These will be searched in order of appearance.
//    IF all=0, the first match is returned -- starting from the first word in aindex.
//       Note: an abbrev match to first match trumps exact match of 2nd index
//    If all=1, an array of object pairs is returned -- with entries for each word in a index (given a match occurs)
//  Example (all =0,exact=0):
//      aindex='data-color,color' would search for data-color first, and color if there was no match  to data-color
//
// If there is a specification error: return false.
// If all =1, also write to console.log('wsurvey.findObjectDefault error: aobj is not an object '] ;


wsurvey.findObjectDefault=function(aobj,aindex,adef,notExact,all0) {

  if (arguments.length<4) notExact=1;
  let texact=jQuery.trim(notExact).toLowerCase();
  if (texact.substr(0,1)=='e') notExact=0; // exact
  if (texact.substr(0,1)=='c') notExact=1;  // case insenstive
  if (texact.substr(0,1)=='a') notExact=2;  //  abbreviaton
  if (texact.substr(0,1)=='s') notExact=2;  // substring

  if (arguments.length<5) all0=0;
  if (arguments.length<3) adef=null; 

  let all=0;
  if (jQuery.trim(all0)=='1') all=1;

  if (typeof(aobj)!=='object') {
    if (all==1) console.log('wsurvey.findObjectDefault error: aobj is not an object ');
    return false ;
  }

  var saveEms=[];

// more than one index to look for (csv of space delimited)
  let vindex=aindex.split(/[\s\,]+/g) ;

// start with first index.

  for (var jj=0;jj<vindex.length;jj++) {  // often just one  index, but could be more

     let aindex=jQuery.trim(vindex[jj]);
     if (typeof(aobj[aindex])!=='undefined') {
        if (all==0) return aobj[aindex];  // exact match? always use
        let goob=[aindex,aobj[aindex]];
        saveEms.push(goob);
     }

// not an exact match, perhaps try other case-insensitive match .   or all ==1
      var taindex=jQuery.trim(aindex).toUpperCase(), lenTa=taindex.length;
      for (var a1 in aobj) {             // get all of the keys (and convert to uppercase
          let aa1=jQuery.trim(a1).toUpperCase();

          if (notExact==1) {  // case insensitive match
             if (aa1==taindex)  {
               if (all==0) return aobj[a1]
               let goob=[aindex,aobj[a1]];
               saveEms.push(goob);
             }
          }
          if (notExact==2) {     // abbreviation match?
             if (aa1.substr(0,lenTa)==taindex) {
                if (all==0)  return aobj[a1];
                let goob=[aindex,aobj[a1]];
                saveEms.push(goob);
             }
          }
          if (notExact==3) {     // case insensitive substring match
             if (aa1.indexOf(taindex)>-1) {
                if (all==0) return aobj[a1] ;
                let goob=[aindex,aobj[a1]];
                saveEms.push(goob);
             }
          }    // non-exact matches
      }   // for a1 in aobj
  }       // more than one synonym

// no match, return default
  if (all==0) return adef;
  return saveEms;

} ;

//======================
// update fields in an vals object, using fields in newVals object
//       When examining newVals:
//            Case insensitive (and space trimmed) matching is used -- so fooBar in vals matches FOOBAR in newVals
//            A field name in newVals that does NOT exist (using a case insensitive match) in vals is ignored
//            You can choose to ignore fields in newVals whose type does not match the type in vals
//       Returns the updated vals object
//
//   Arguments:
//       vals : object with values.  This sets the "default values" of the updatable fields
//       newVals: object with values that will be used to reset values in vals (if a match occurs
//       checkType: optional. If 1, then  a match in newVals to vals only occurs if the type of the value is the same
//       okFields : optional. If specified, shouuld be an array (or csv) of fieldnames in vals that can be updated.
//                   Thus, if okFields is specified; if newVals has a field that matches a field in vals, it ALSO much match a field specified in okFields.
//                   If it does not match a field specified in okFields, updating does not occur (the value in vals is unchanged)
//      synonyms: optional.   If specified, should be an associative array.  Each field is an alternate name, whose value should be a field in vals
//                Thus: if a newVals field matches a field (case insensitive), it is converted into the value of the field.
//                Example synonynms='FieldA':'field1','fieldB':'field2','field':'field1'};
//                   A newValues field of fieldA, field1, or field will set the value of the vals['field'] (the "field" is case insensitive)

wsurvey.updateObject=function(vals,newVals,checkType,okFields,synonyms){
  var okLookup={},doLookup=0,checkT=0,tt,itt,att,vaf,af,taf,doSynonyms=0;
  var valsLookup={};
  var tasyn,synLookup={},asyn;

  if (arguments.length<3) checkType='0';
  if (jQuery.trim(checkType)=='1') checkT=1;

  if (arguments.length>3) {
     if (typeof(okFields)=='string'  && jQuery.trim(okFields)!=='' )  {
       doLookup=1;
       tt=okFields.split(',');;
    }
    if (jQuery.isArray(okFields) && okFields.length>0) {
        tt=okFields;
        doLookup=1;
    }
    if (doLookup==1) {
        for (itt=0;itt<tt.length;itt++) {
            att=jQuery.trim(tt[itt]).toUpperCase();
            okLookup[att]=1;
        }
     }
  }

//  synonyms:
  if (arguments.length>4) {
     doSynonyms=1;
     for (asyn in synonyms ) {
        tasyn=jQuery.trim(asyn).toUpperCase();
        synLookup[tasyn]=jQuery.trim(synonyms[asyn]).toUpperCase();
     }
  }


// find fieldnames in vals
   for (af in vals) {
      taf=jQuery.trim(af).toUpperCase();
      valsLookup[taf]=af;           // note: if multiple matches (i.e.; 'fooBar' and 'foobar'), last match is what is updated
   }

//

// now do the updating by examinig fields in newVals
  for (af in newVals) {
     taf=jQuery.trim(af).toUpperCase() ;
     if (doSynonyms==1) {              // synonymn convert?
        if (typeof(synLookup[taf])!=='undefined') taf=synLookup[taf];
     }
     if (typeof(valsLookup[taf])=='undefined') continue ;   //  no match in vals
     if (doLookup==1)  {
        if (typeof(okLookup[taf])=='undefined') continue  ;  // no match in okfields
     }
     vaf=valsLookup[taf];
     if (checkT==1) {
        if (typeof(vals[vaf])!==typeof(newVals[af]) ) continue  ; // type mismatch
     }
     vals[vaf]=newVals[af];                         // use this new value!
  }

  return vals;
}



//====================================================
// add an event handler to a (or several) jQuery objects. CHECK to make sure this isn't already an event handler!
// doList:  jQuery list of elements to add event to
// forEvent: type of event (i.e. 'click','mouseup')
// afunc: function to use in an .on(forEvent,dobj,afunc). Should be a function reference, NOT a string
// dobj : optional. dataobject to use. If false (the default), no dobj is used
// noMultipleHandler : optional. if 1 (the default)-- if an event handler of type forEvent exists, for an item in ado, dont add afunc to to this dom element.
//  This is to prevent multiple event handlers for the same event i.e.; not allow two 'click' handlers.
//           if :0, allow multiple event handlers for same event
//
// returns false if afunc not afunction. Otherwise # of event handlers added (could be 0)

wsurvey.addEventIfNew=function(doList,forEvent,afunc,dObj,noMultipleHandler) {
  var azz, nargs=arguments.length;

  if (nargs<4) dObj=false;    // default is to NOT add if any forEvent event handler exists  -- don't allow multiple handlers for same event
  if (nargs<5) noMultipleHandler=1;    // default is to NOT add if any forEvent event handler exists  -- don't allow multiple handlers for same event
  if (typeof(afunc)!='function') return false;

  var zz0=jQuery(doList);
  var idid=0;
  for (var iz=0;iz<zz0.length;iz++) { // can check multiple items in a jQUery collection
        azz=zz0[iz];
        let ev = jQuery._data(azz, 'events');   // this does the work of finding events assigned to this dom object
        let gotmatch =0;
        if (ev && ev[forEvent]) {         // event list non empty, and an event handler for this event (forEvent) exists.
          if (noMultipleHandler==1) continue;    // don't add multiple handlers for same event ... (leave the exsiting one as is)
          for (var izz=0;izz<ev[forEvent].length;izz++) { // multiple event handlers okay, BUT not multiple instances of the same handler (same function)
              let aev=ev[forEvent][izz];
              if (aev['handler']==afunc) {
                 gotmatch=1;
                 break;
             }
          }
          if (gotmatch==1) continue ;    // skip, afunc   already defined as a   forEvent event handler for dom element azz
        }   // ev && ev[forEvent]

        idid++;     // number of elements the afunc  event handler was added to
        ezz=jQuery(azz);     // jquery it...
        if (dObj===false) {      // no dataobject
           ezz.on(forEvent,afunc);
        } else {
           ezz.on(forEvent,dObj,afunc);
        }
  }
  return idid ;

}
wsurvey.addEventsIfNew=wsurvey.addEventIfNew ; // a synonym

//  ----------------------------
// https://stackoverflow.com/questions/359788/how-to-execute-a-javascript-function-when-i-have-its-name-as-a-string
// Converts a string containing a function or object method name to a function pointer.
// @param  string   func
// @return function
// you can used the return as a function, providing your own params
//
// example, assuming
//   myFuncs={};
//   myFuncs.sayHi={};
//   myFuncs.sayHi.hello=function(x) { alert('hello to '+x)};
//   myFuncs.sayHi.bighello=function(x) { alert('a BIG hello to '+x)};
//   useFunc=wsurvey.getFuncFromString('myFuncs.sayHi.hello');
//   useFunc('Joe');

wsurvey.getFuncFromString=function(func) {

    if (typeof func === 'function') return func;      // if already a function, return

 // if string, try to find function or method of object (of "obj.func" format)
   if (typeof func === 'string') {
        if (!func.length) return null;
        var target = window;
        var func = func.split('.');
        while (func.length) {
            var ns = func.shift();
            if (typeof target[ns] === 'undefined') return null;
            target = target[ns];
        }
        if (typeof target === 'function') return target;
    }

    // return null if could not parse
    return null;
}


// This is called as  jQuery(someThing).wsAttr(theAttr,adef,notExact,all) -- it is an extension to jQuery
// Returns the value of the attribute, or a default.
// What is returned depends on the arguments:
//  No arguments: return associative array containing all attributes (as indices) and their values
//  theAttr: look for this attribute. Or, a csv of several attributes to look for
//           If a csv (or space delimited), the first attribute is looked for (using doExact).
//             If no match, or if all=1, the 2nd one.
//            And so forth
//            Special case: ':aname' -- look in the data object (not in the attributes). Exact match!
//           Thus: if doExact=2, an abbreviation match for the first of two attributes trumps an exact match of a 2nd attribute
//  adef:  the default, if no match is found. If not specified, null is used
//  notExact:      0: case  sensitive (exact) match
//               if 1,  ci  match (the derfault)
//               if 2, look for an abbreviation match (after exact and case insensitive)
//               if 3, look for a  substring match.
//    An exact match is always done first. If found, it is returned (or the first pair saved)
//  doAll:
//        if doAll=0 (or if not specified), the first match found is returned. Exact, case insensitive, and then abbrev or substring (the order is indeterminate)
//        if 1, an object contianint the matched attributes (from the element) and their values.
//          This object does NOT contain how the mathc occured (such as 2nd value in theAttrS, abbrev match)
//     Note: if doExactOnly=1, doMultiple is ignored (it is set to 0) -- the value is returned (or the default)
//           if doAll=1, adef will be returned if no match. Adef could be specified to be an empty object. Or a null. Up to the caller!
//

//      Return false if elem not a jquery element with attributes

jQuery.fn.wsurvey_attr = function (lookForAttrs,adef,notExact,doAll) {

     var elem = this;         // this is alreach a jQuery object
     if(!(elem && elem.length)) return false ;  // not a legit jquery object (minimal test)

     var nargs=arguments.length;
     var lookFors, mainLookFor,justList=0 ;
     let attList={},attListLcLookup={},matches={}  ;  // list of attributes, and matche s

     if (nargs<1) {
        justList=1;
     } else {
        lookForAttrs=jQuery.trim(lookForAttrs);
        lookFors=lookForAttrs.split(/[\s\,]+/g) ; // , or space delimited
        mainLookFor=jQuery.trim(lookFors[0]);       // first one is special
     }
     if (nargs<2) adef=null;

     if (nargs<3) notExact=1;
     notExact=parseInt(notExact);
     if (notExact<0 || notExact>3) notExact=1;

     if (nargs<4) doAll=0;
     doAll=parseInt(doAll);
     if (doAll!=1) doAll=0;
     if (notExact==0) doAll=0;   // notExact=0 means "exact match only" -- either find an attribute, or return the default

     var allAttsOrig=elem.get(0).attributes ;  // .each is a pita if finding exact match. Do it the old fashioned way

// Note that  justlist is special   (list of attributes). Does not consider .data object
     for (var mm=0;mm<allAttsOrig.length;mm++) {
           let n0=allAttsOrig[mm]
           let n = n0.nodeName||n0.name;
           let v = elem.attr(n);
           if (justList==1) {
              matches[n]=[v,n,'list'] ;
           } else {
              attList[n]=v;
              let nLc=jQuery.trim(n.toLowerCase());
              attListLcLookup[nLc]=n;        // this is used to avoid redundant checks (if an actual attribute mathces an earlier lookfor, don't try to match)
           }
     }
     if (justList==1) return matches;  // if not juslit, attListLcLookup is used below

     if (doAll==0 && mainLookFor.substr(0,1)!=':')  {    // since exact match  to first lookFor attr is often achieved, do this first
       for (var mm=0;mm<allAttsOrig.length;mm++) {
             let n0=allAttsOrig[mm]
             let n = n0.nodeName||n0.name;
             let v = elem.attr(n);
             if (n==mainLookFor)    return v ;   // done if exact match to first lookFor. This is redundant with below, but may be a common case.
       }             // m<allattsorig
    }   // doall=0 exact match first try

// if here no exact match to first attribute (or to a :data), (or doall=1)
// Look at each attribute: exact match (or :data), case insensitive, than either abbrev or substring (if specified)

   var elemData={};  // used in :attrName lookups
   if (typeof(elem[0]['data'])!='undefined') {
        elemData=elem[0]['data'];
    } else {   // perhaps wsurvey.argJquery was used?
       if (typeof(elem['argJqueryData'])!='undefined') {
          elemData=elem['argJqueryData'];
      }
   }
   var nmatches=0;  // a shortcut

   for (var jj=0;jj<lookFors.length;jj++) {
       aLookFor=jQuery.trim(lookFors[jj]);
       if (aLookFor=='') continue ;
       let isDataLookup=0;
       if (aLookFor.substr(0,1)==':') {
           isDataLookup=1;
           aLookForData=aLookFor.substr(1);
           if (typeof(elemData[aLookForData])!='undefined') {
              aval=elemData[aLookForData];
              if (doAll==0) return aval;
              matches[aLookFor]=[aval,aLookFor,'data'];
              nmatches++;
           }
      } else {           // not a .datalookup
          if (attList.hasOwnProperty(aLookFor) ) {  // exact match   (perhaps others match also?)
                let aval=  attList[aLookFor];
                if (doAll==0) return aval;      // this should be caught above, but wth
                matches[aLookFor]=[aval,aLookFor,'exact'];
                nmatches++;
          }   // no existing entry in matches
      }  //  attlist has own property

      if (notExact==0 || isDataLookup==1) continue ;          // exact only (or dataLookup). If exact occurd and doall=0, returned above

      let aLookForLc=aLookFor.toLowerCase();    // ci match

// these are for attribut lookup (ci, abbrev, substring)
      if (attListLcLookup.hasOwnProperty(aLookForLc) ) {  // the actual attribute of this ci version
        let origAttr=attListLcLookup[aLookForLc]; // the original attribute
        if (!matches.hasOwnProperty(origAttr)) { ; // earlier matches (to an actual/origional attribute) are left as is
           let aval=attList[origAttr];
           if (doAll==0) return aval ;
           matches[origAttr]=[aval,aLookForLc,'ci'];
           nmatches++;
        }  // no existing entry in matches
      }         // attclistlclookup

// if here, no exact or ci match. Perhaps try an abbrev or index (ci) match
     if (notExact==0 || notExact==1) continue ;   // not abbrev or index. Get next lookFors

     let aLookForLcLen=aLookForLc.length;
     for (var anAttrLc in  attListLcLookup) {     // abbrev or substring to these actual attribures
        if (anAttrLc.length<aLookForLcLen) continue ; // can't be an abbrev or substirng if  what is looked for is longer than a dom atribute
        let kmatch=anAttrLc.indexOf(aLookForLc);  // is the lookforLc attribute any kind of substring of  element-attribute (ci comparison)

        if (kmatch<0) continue ; // no match for this attribute (in dom). Check next one
        if (kmatch==0 || notExact==3 ) {                       // 0 is both abbrev and substring, but > 0 is only substring
           let orig1=attListLcLookup[anAttrLc];
           if (!matches.hasOwnProperty(orig1)) { ; // earlier matches are left as is
              let aval=attList[orig1];
              if (doAll==0) return aval ;    // got an abbrev match
              if (notExact==2) {
                 matches[orig1]=[aval,aLookForLc,'abbrev'];  // might be overwriteing
              } else {
                matches[orig1]=[aval,aLookForLc,'substring'];  // might be overwriteing
              }
              nmatches++;
           }   // no existing entry in matches
        }  // kmatch
     } //  anAttrlc in..
   }   // jj < lookfors

   if (nmatches==0 || doAll==0) return adef;       // no matches ... return default   (if here and doAll=0, no match occured above

   return matches ;  //; the ojbect containing [origAttr]=valueOfOrigAttribute  -- for all origAttr that "match" any of the lookFors

}  // wsurvey_attr


//================
// simple version of wsurvey_attr : just look for ci  of one attribute. First match (regardless of case) is returend
jQuery.fn.wsurvey_attrCi =function(theAttr,adef) {
    theAttr_2=jQuery.trim(theAttr).toUpperCase();
    if (arguments.length<2) adef=null;
    elem=wsurvey.argJquery(this);
    if (!elem) return adef;
    if (elem.length==0) return adef;

    let elem0=elem.get(0);
    var alist=elem0.attributes;
    for (var jj=0;jj<alist.length;jj++) {
         aelem=alist[jj];
         n = aelem.nodeName||aelem.name;
         v = elem.attr(n);
         tattr=typeof(v);
         if (tattr=='undefined' ||  tattr=='null' || tattr===false )    continue ;    // should never happen
         if (theAttr_2==jQuery.trim(n).toUpperCase()) return v  ;
     }        // check all attributes
     return adef;
 }        //   wsurvey_attrCi

jQuery.fn.wsurvey_attrCI = jQuery.fn.wsurvey_attrCi;  // a synonmy

///=====
//return an integer representing the number of pixels given this size (or location) measure
// aa is the size to be converted to pixels. In particular xx% and xxEm are converted to pixels.
//  asize00 is  a size used for % measures -- it should // be "screen" size. Or use 'h' or 'w' and screen.height or screen.width will be used.
// bodyFontSize is the size of an em. If not speciified, it will be read from the (body)'s css styles

 wsurvey.toPx=function(aa,asize00,bodyFontSize) {
      var asize0;

       if (arguments.length>1) {
          asize0=asize00;
      } else {
        asize0= parseInt(jQuery(window).width()) + parseInt(jQuery(window).height())  ;
        asize0=asize0 / 2; // a compromise
        asize00='no 2nd arg';   // this should NEVER be needed...
      }
      if (arguments.length<3) bodyFontSize=jQuery("body").css('font-size');

      let ss=jQuery.trim(asize0).toLowerCase();
      if (ss.substr(0,1)=='h') {
          asize0=jQuery(window).height();
      } else if (ss.substr(0,1)=='w') {
          asize0=jQuery(window).width();
      }
      if (isNaN(asize0)) wsurvey.flContents.container.error('Can not convert to pixel size: bad value for size ('+asize00+')');

      var asize=parseFloat(asize0);

      aa=jQuery.trim(aa).toUpperCase();

      if (aa.indexOf('PX')>-1) return parseInt(aa);

      if (aa.indexOf('%')>-1) {
         let a1=parseFloat(aa);
         let a2=parseFloat(asize);
         let a3=(a1*a2)/100;
         let a4=parseInt(a3);
         return a4;
       }
      if (aa.indexOf('EM')>-1) {
          let a1=parseFloat(aa);
          let a2=parseInt(bodyFontSize);
          let a3=a1*a2;
          let a4=parseInt(a3);
          return a4;
      }
      return parseInt(aa);  // simple numbers are px
  }   ;  // end of toPx


// from:  http://www.mredkj.com/javascript/numberFormat.html
wsurvey.addComma=function(nStr) {
	nStr += '';
	x = nStr.split('.');
	x1 = x[0];
	x2 = x.length > 1 ? '.' + x[1] : '';
	var rgx = /(\d+)(\d{3})/;
	while (rgx.test(x1)) {
		x1 = x1.replace(rgx, '$1' + ',' + '$2');
	}
	return x1 + x2;
}

//====================================
// ----------
// return time and/or date
//  If no arguments: return  hh:mm:ss xM
// timeType:
//      0 = javascript milliseconds   (and ingure 2nd argument))
//      1 =  mm:hh:ss xM
//      11 = same as 1 , using 24 hr time (so no xM)
//      2  = same as 1, with GMT offset noted
//      21= same as 2, using 24 hour time (so no xM0
//     31: short (hh:mm) 24 hr time  (no xM)
//   otherwise: same as 0
//    default is 1
//
// dateType:
//      1=  date Month Year
//      2 = day-of-week, date Month Year
//
// if timeType and dateType ==2 : return as: xday Month date year hh:mm:ss GMT-xxxx (tz)

// if both time and date specified, format is date-string, time-string
//
// 28 April 2020: if 3rd argument is a unix time stamp, return stamp for that (rather than current time)



wsurvey.get_currentTime=function(timeType,dateType,useTime) {
  var Hours,Mins,Time,Sec,atime,adate,jdate,amonth,ayear,aday;

   if (arguments.length<1 ) timeType=1;
   if (arguments.length>0) {
       if (typeof(timeType)=='object' || jQuery.trim(timeType)==='') timeType=1;
    }
   if (arguments.length<2) dateType=0 ;

  if (arguments.length<3) {
     Stamp = new Date();
  } else {
     Stamp=new Date(useTime);;
  }
  atime=''; jdate='';

  if (timeType==0) return Stamp.getTime()  ;                    // internal time (milliseconds since 1970)

  if (timeType==2 && dateType==2) {  // fullblown time -- use javascript default
        adate=Stamp.toString();
        return adate ;
   }

  if (timeType==2 || timeType==21) {   // GMT time. default is hh:mm:ss Xm GMT offset
      Hours = Stamp.getUTCHours();
      Time= '';
      if (timeType!=21)  {     // not 24 hr
        if (Hours >= 12) {
           Time = "PM";
          }     else {
              Time = "AM";
          }
          if (Hours > 12) {
            Hours -= 12;
         }
          if (Hours == 0) {
              Hours = 12;
         }
       }
       Mins = Stamp.getUTCMinutes();
       if (Mins < 10) {   Mins = "0" + Mins } ;

       Secs = Stamp.getUTCSeconds();
       if (Secs < 10) {   Secs = "0" + Secs } ;
       atime=Hours + ':' + Mins + ':' +  Secs + ' ' + Time +' GMT';

   }  else if (timeType==31) {  // hh:mm
          Hours = Stamp.getUTCHours();
          Mins = Stamp.getMinutes();
          if (Mins < 10) {   Mins = "0" + Mins } ;
          atime=Hours + ':' + Mins ;

   }  else {   // default is hh:mm:ss Xm   -- drop xm if 11

         Hours = Stamp.getHours();
         Time='';
        if (timeType!=11) {
           if (Hours >= 12) {
             Time = "PM";
           }   else {
              Time = "AM";
           }
           if (Hours > 12) {
              Hours -= 12;
           }
           if (Hours == 0) {
              Hours = 12;
           }
         }
         Mins = Stamp.getMinutes();
         if (Mins < 10) {   Mins = "0" + Mins } ;

         Secs = Stamp.getSeconds();
         if (Secs < 10) {   Secs = "0" + Secs } ;
         atime=Hours + ':' + Mins + ':' +  Secs + ' ' + Time ;

    }  // timetype (21 or 2, 31, other)


  if (dateType!=0) {
     adate= (timeType==2 ) ?  adate=Stamp.toUTCString() : adate=Stamp.toString() ;
     var foo=adate.split(' ');
     aday=foo[0]; amonth=foo[1]; adate=foo[2] ; ayear=foo[3];
     jdate=adate+' '+amonth+' '+ayear+' ';
     if (dateType==2 )  jdate=aday + ', ' + jdate;
  }

  atime=jdate+atime ;
  return atime ;
}
wsurvey.CurrentTime=wsurvey.get_currentTime ;  // some synoynms
wsurvey.currentTime=wsurvey.get_currentTime ;


//===========
// convert a number of seconds to hh:mm:ss format
wsurvey.secondsToTime=function(towait,maxhrs) {
  if (arguments.length<2) maxhrs=Math.pow(2,32) - 1;
  if (isNaN(towait)) return towait ;              //ignore non numbers
  if (towait<10) return ':0'+towait ;
  if (towait<60) return ':'+towait ;
  var thr=0;                     // convert seconds to hr:min:sec
  var tmin=Math.floor(towait / 60);
  var tsec=towait -  (tmin*60) ;
  if (tsec<10) tsec='0'+tsec ;

  thr=Math.floor(tmin/60) ;
  tmin=tmin-(thr*60) ;
  if (tmin<10) tmin='0'+tmin ;
  thr1=''
  if (thr>0) {
     thr1=thr ;
     if (thr1<10) thr1='0'+thr1 ;
    if (thr1>=maxhrs) {
       goo=thr1;
       thr2=parseInt(thr1/24) ;
       thr1=thr2+'d '+(thr1 % maxhrs)+':' ;
    } else {
       thr1=thr1+':';
    }
  }
  var dahh=thr1 + tmin +':' + tsec ;
 if (dahh.indexOf('.')>0) {                     // strip out fractional seconds
        dahh=dahh.split('.');
        return dahh[0];
 }
  return dahh ;

}
wsurvey.seconds_ToTime=wsurvey.secondsToTime ;
wsurvey.seconds_toTime=wsurvey.secondsToTime ;

//=================
wsurvey.getWord=function(astring,nth,adelim)   {
  var   is2,foo,foonew,a1,j,n1,n2,aa;
  if (arguments.length<2) nth=0;
  if (arguments.length<3) adelim='';
  if (typeof(adelim)=='string') adelim=jQuery.trim(adelim);

  if (typeof(astring)=='object') return '' ;
  if (typeof(astring)=='number') {
        if (nth!=0) return '' ;
        return astring  ;
   }
   if (typeof(astring)=='undefined' || typeof(astring.split)!=='function' ) return false ;

  is2=0;
  if (jQuery.isArray(nth)) is2=1;
 

  if (adelim=='') {
//        var foo=astring.split(' ');
        var foo=astring.split(/\s+/g);

        var foonew=new Array() ;
        for (var j=0 ; j<foo.length;j++){
           var a1=jQuery.trim(foo[j]);
           if (a1=='') continue ;
           foonew[foonew.length]=a1 ;
        }
   } else {
        if (typeof(astring)=='undefined' || typeof(astring.split)!=='function') return false ;
         foonew=astring.split(adelim);
   }

   if (is2==1) {                        // subset of the words
       n1=parseInt(nth[0]) ; n2=parseInt(nth[1]);
       if (isNaN(n1) || isNaN(n2)) return ''  ;
       if (n1>foonew.length || n2 <1) return '';
       if (n1<1) n1=1 ; if (n2>foonew.length) n2=foonew.length ;
       if (n1==n2) return foonew[n1-1] ;
       aa=adelim ; if (aa.length==0) aa=' ';
       var arf=foonew.slice(n1-1,n2) ;
       arf=arf.join(aa);
       return arf ;
   }

   if (nth>0)  {
        if (nth>foonew.length) return '' ;
        return foonew[nth-1] ;
   }
   if (nth<0) {
     nthlast=-nth;
     if (nthlast>foonew.length) return '' ;
     return foonew[foonew.length-nthlast];
   }

   return foonew ;                       // return the array
} ;

wsurvey.getWords=wsurvey.getWord ;


//-------------------
// display number compactly, using K or M
// aval: numeric value to display
//  maxAsIs : the maximum value to display "as is" -- with commas. Anything larger is displayed using xxx.xK. Default is 10,000
// ndec: number of decimal. Default is -1 -- which means return no commas, no decimal

wsurvey.makeNumberK=function(aval,maxAsIs,ndec) {
   if (arguments.length<2) maxAsIs=10000;
   if (arguments.length<3) ndec=-1;
   aval=parseFloat(aval);

   if (aval<maxAsIs)   {
      if (ndec<0) {
     
          return aval.toFixed();   // no commas, no decimal
      }
       if (maxAsIs>=10000) return wsurvey.addComma(aval.toFixed(ndec));    // add comma if > 10k (and ndec >-1)
       return aval.toFixed(ndec);
   }
   if (aval<=100000 ) {    // 100k
      oof= (aval/1000);
      return oof.toFixed(1)+'k';
   }
   if (aval<=100000 ) {    //    1 million
      oof= (aval/1000);
      return oof.toFixed(0)+'k';
   }
   if (aval<10000000) {          // 10 million
      oof=Math.trunc(aval/1000);
      return oof+'k';
   }
   oof=Math. trunc(aval/1000000);
   return oof+'m';
} ;



// crc32 checksum https://stackoverflow.com/questions/18638900/javascript-crc32
wsurvey.crc32=function(str,ashex) {
   if (arguments.length<2) ashex=0;
   var a_table = "00000000 77073096 EE0E612C 990951BA 076DC419 706AF48F E963A535 9E6495A3 0EDB8832 79DCB8A4 E0D5E91E 97D2D988 09B64C2B 7EB17CBD E7B82D07 90BF1D91 1DB71064 6AB020F2 F3B97148 84BE41DE 1ADAD47D 6DDDE4EB F4D4B551 83D385C7 136C9856 646BA8C0 FD62F97A 8A65C9EC 14015C4F 63066CD9 FA0F3D63 8D080DF5 3B6E20C8 4C69105E D56041E4 A2677172 3C03E4D1 4B04D447 D20D85FD A50AB56B 35B5A8FA 42B2986C DBBBC9D6 ACBCF940 32D86CE3 45DF5C75 DCD60DCF ABD13D59 26D930AC 51DE003A C8D75180 BFD06116 21B4F4B5 56B3C423 CFBA9599 B8BDA50F 2802B89E 5F058808 C60CD9B2 B10BE924 2F6F7C87 58684C11 C1611DAB B6662D3D 76DC4190 01DB7106 98D220BC EFD5102A 71B18589 06B6B51F 9FBFE4A5 E8B8D433 7807C9A2 0F00F934 9609A88E E10E9818 7F6A0DBB 086D3D2D 91646C97 E6635C01 6B6B51F4 1C6C6162 856530D8 F262004E 6C0695ED 1B01A57B 8208F4C1 F50FC457 65B0D9C6 12B7E950 8BBEB8EA FCB9887C 62DD1DDF 15DA2D49 8CD37CF3 FBD44C65 4DB26158 3AB551CE A3BC0074 D4BB30E2 4ADFA541 3DD895D7 A4D1C46D D3D6F4FB 4369E96A 346ED9FC AD678846 DA60B8D0 44042D73 33031DE5 AA0A4C5F DD0D7CC9 5005713C 270241AA BE0B1010 C90C2086 5768B525 206F85B3 B966D409 CE61E49F 5EDEF90E 29D9C998 B0D09822 C7D7A8B4 59B33D17 2EB40D81 B7BD5C3B C0BA6CAD EDB88320 9ABFB3B6 03B6E20C 74B1D29A EAD54739 9DD277AF 04DB2615 73DC1683 E3630B12 94643B84 0D6D6A3E 7A6A5AA8 E40ECF0B 9309FF9D 0A00AE27 7D079EB1 F00F9344 8708A3D2 1E01F268 6906C2FE F762575D 806567CB 196C3671 6E6B06E7 FED41B76 89D32BE0 10DA7A5A 67DD4ACC F9B9DF6F 8EBEEFF9 17B7BE43 60B08ED5 D6D6A3E8 A1D1937E 38D8C2C4 4FDFF252 D1BB67F1 A6BC5767 3FB506DD 48B2364B D80D2BDA AF0A1B4C 36034AF6 41047A60 DF60EFC3 A867DF55 316E8EEF 4669BE79 CB61B38C BC66831A 256FD2A0 5268E236 CC0C7795 BB0B4703 220216B9 5505262F C5BA3BBE B2BD0B28 2BB45A92 5CB36A04 C2D7FFA7 B5D0CF31 2CD99E8B 5BDEAE1D 9B64C2B0 EC63F226 756AA39C 026D930A 9C0906A9 EB0E363F 72076785 05005713 95BF4A82 E2B87A14 7BB12BAE 0CB61B38 92D28E9B E5D5BE0D 7CDCEFB7 0BDBDF21 86D3D2D4 F1D4E242 68DDB3F8 1FDA836E 81BE16CD F6B9265B 6FB077E1 18B74777 88085AE6 FF0F6A70 66063BCA 11010B5C 8F659EFF F862AE69 616BFFD3 166CCF45 A00AE278 D70DD2EE 4E048354 3903B3C2 A7672661 D06016F7 4969474D 3E6E77DB AED16A4A D9D65ADC 40DF0B66 37D83BF0 A9BCAE53 DEBB9EC5 47B2CF7F 30B5FFE9 BDBDF21C CABAC28A 53B39330 24B4A3A6 BAD03605 CDD70693 54DE5729 23D967BF B3667A2E C4614AB8 5D681B02 2A6F2B94 B40BBE37 C30C8EA1 5A05DF1B 2D02EF8D";
   var b_table = a_table.split(' ').map(function(s){ return parseInt(s,16) });
    var crc = -1;
    for(var i=0, iTop=str.length; i<iTop; i++) {
        crc = ( crc >>> 8 ) ^ b_table[( crc ^ str.charCodeAt( i ) ) & 0xFF];
    }
    var  icrc=(crc ^ (-1)) >>> 0;
   if (ashex==0)  return icrc;

   if (icrc < 0) {
     icrc = 0xFFFFFFFF + icrc + 1;
   }
   acrc=parseInt(icrc, 10).toString(16);
   if (acrc.length==7) acrc='0'+acrc;
   return acrc;

};


//====== several html tag functions 


// convert html tags to entties (<b> becomes &lt;b&gt;
wsurvey.htmlspecialchars=function(str) {
  if (typeof(str)!=='string') return str ;   // don't modify non strings
  str = str.replace(/&/g, "&amp;");
  str = str.replace(/>/g, "&gt;");
  str = str.replace(/</g, "&lt;");
  str = str.replace(/"/g, "&quot;");
  str = str.replace(/'/g, "&#039;");
  return str;
}

wsurvey.unescapeHtml=function(text) {
  return text
      .replace(/\&amp;/g,'&')
      .replace(/\&lt;/g,'<')
      .replace(/\&gt;/g,'>')
      .replace(/\&quot;/g,'"')
      .replace(/\&#039;/g,"'");
}

//======
// remove all html tags (and their attribute) -- using dom to convert to text
wsurvey.removeAllTags=function(str) {
  let strnew = jQuery("<div/>").html(str).text();  // strip out html tags
  return strnew ;
}

///====================
// check a string containing html for tag errors (unclosed tags). Uses text patterns (might be better to use dom engine?)
//  <x /> tags are okay
//  Returns number of errors found (0 if no errors)
//   text: string containing html marckup
//   ignore : string; space delimited list of "unclosed" tags to ignore (i.e.; 'br p input option'). If not specified 'br p input option li' is used
// useage:   numErrs=wsurvey. wsurvey.checkHtmlSyntax (stringOfHtml,okayTags);

 wsurvey.checkHtmlSyntax=function(text,ignore){

  var ignores=[];                     // space delimited list of tags to ignore (they do not require closure)
   var tags = [];
   var i=0;
   var j=0;
   var k=0;
   var tag='';
   var level=0;
 if (arguments.length<2) ignore='p br input option li  hr  '     ;
 ignore=jQuery.trim(ignore);
 ignore=(' '+ignore+' ').toUpperCase();

  i = text.indexOf('<');
  while (i>=0) {
        j = text.indexOf('>', i);
        if (j == -1) break;

        if (text.substr(j-1,1)=='/') {     // self closer are okay
                i = text.indexOf('<',j);
                continue ;
        }

        k = text.indexOf(' ',i);
        if (k > i && k < j) {
            tag = text.substr(i+1,k-i-1);
        } else {
            tag = text.substr(i+1,j-i-1);
        }


        if (tag.indexOf('/') == 0) {          // found </
            tag = tag.substr(1);
            var ttt=' '+tag.toUpperCase()+' ';
            if (ignore.indexOf(ttt)>-1)  {
                i = text.indexOf('<',j);
                continue ;
           }

            tag=tag+' '+level;
            if (tags[tag] == undefined) {
                tags[tag] = -1;
            } else {
                tags[tag]--;
            }
            level--;
        } else {
            var ttt=' '+tag.toUpperCase()+' ';
            if (ignore.indexOf(ttt)>-1)  {
                i = text.indexOf('<',j);
                continue ;
           }

            level++;
            tag=tag+' '+level;
            if (tags[tag] == undefined) {
                tags[tag] = 1;
            } else {
                tags[tag]++;
            }
        }
        i = text.indexOf('<',j);
    }
    // Everything should be zero
    var nprobs=0;
    for (tag in tags) {
        if (tags[tag] != 0) {
          nprobs++ ;
        } else {
       }
    }

    return nprobs;
};


//=========================
// strip out actiion tags (script, style, head) from html content.
// also remove attributes that are suspisions
//  hco : string with html
//  careful: if specified and 1, removes less dangerous tags (base, applet,frame,iframe,layer,embed,meta)
//  removeCt: if specified and 1, returns [newText,# removals]. Otherwise, returns newText
// note: # of removals isn't perfect -- it does not count Head, body, html and some other tags (but not necessarily content) removed

wsurvey.strip_active_tags=function(hco,careful,removeCt) {
  var found,q1,q1all,iq,spp;
  var nremoves=0;
  if (arguments.length<2) careful=0;
  if (arguments.length<3) removeCt=0;
  try {
      re=/<\s*body[^\>]*\>([\s\S]*?)<\s*\/body[^\>]*\>/im ;   // use \S\s instead of . (to included crlfs)
      found =hco.match(re);
      if (found!==null)  {
          hco=found[1];   // use inner portion of first <body>...</body>
      }

       q1=jQuery('<div>');                          // now make sure it isn't invalid.
       q1.html(hco);                           // Note nov 2018: html(hco) seems to remove head and body tags

       nremoves+=strip_active_tags2('script');
       nremoves+=strip_active_tags2('style');
       nremoves+=strip_active_tags2('head');

       if (careful==1) {
         nremoves+=strip_active_tags2('base');
         nremoves+=strip_active_tags2('applet');
         nremoves+=strip_active_tags2('iframe');
         nremoves+=strip_active_tags2('html');
         nremoves+=strip_active_tags2('head');
         nremoves+=strip_active_tags2('body');
         nremoves+=strip_active_tags2('frame');
         nremoves+=strip_active_tags2('layer');
         nremoves+=strip_active_tags2('ilayer');
         nremoves+=strip_active_tags2('embed');
         nremoves+=strip_active_tags2('meta');
       }

       q1all=q1.find('*');
       wsurvey.removeMostAttributes(q1all,['id','value','title','name','href','type','style'],[['type','submit']]);  // get rid of sketchy attributes
       for (var iq=0;iq<q1all.length;iq++) {
            spp=jQuery(q1all[iq]).css('position')  ;
           if (spp!=='undefined' && spp!=='static'  ) jQuery(q1all[iq]).css('position','relative') ;     // get rid of fixed & absolute position
       }
       hco=wsurvey.unescapeHtml(q1.html());

  } catch(err) {           // if here, problem with hconent, so don't use it
       if (jQuery.trim(hco)!=='') {
           hco=wsurvey.htmlspecialchars(hco);
          console.log('problem with wsurvey.strip_active_tags');
        }
  }

  if (removeCt==1) return [hco,nremoves];

  return hco     ;


 function  strip_active_tags2(datag) {
     var nq=q1.find(datag).length;

     if (nq>0) {
        q1.find(datag).remove();
     }
   return nq ;
 }

}   ;



//===========
// check for okay html content of email
// uses . wsurvey.checkHtmlSyntax  and .strip_active_tags
// Returns [status,safe Html]   or [status,safe html, nremoves]
// status=0 means some kind of html problem (such as unclosed markup); 1=ok
// if 0, return "tags stripped" version of atext    (all html removed)
// if 1, return "dangerous stuff version" of atext (retains basic html, remove script, style, and head sections)
// safe Html is the atext with most attiributes (such as onClick, etc) removed, and hazardous tags (such as <script>) removed.
// if dosafe is specified, and is 1, remove more attributes (such as meta, applet,.. that are outside of head )
// if dosafe is removeCt, and is 1, return count of removed tags
wsurvey.makeHtmlSafe=function(atext,dosafe,removeCt) {
  if (arguments.length<2) dosafe=0
  var zz,use1;
   zz=wsurvey.checkHtmlSyntax(atext);
   if (zz>0) {                // problems found, just convert everything to text
       use1= jQuery("<div/>").html(atext).text();   // convert to text
      return [0,use1];
   }
   use1=   wsurvey.strip_active_tags(atext,dosafe,removeCt);        // html is okay, so make it safe
   if (removeCt==1)   return [1,use1[0],use1[1]];
   return [1,use1];
}

//=======================
// remove attributes from elements in q1 jquery object
// whitelist: array of attribute names to NOT remove (case insensitive)
// blacklist: array of arrays 2nd check: if an attribute has a value in the blacklist, remove it.
//             each array should have the syntax [attributeName,val1,val2,...];
//             the attributeName should be in the whitelist (since only attributes in the whitelist are subject to blacklist testing)
//             attributeName and val1,.. are case insensitive comparisons
//
// Example -- remove "dangerous" attributes from a html text string
//
//  Note: see strip_active_tags for an alternative
//
// qq=jQuery('body').find('*');
// removeMostAttributes(qq,['value','title','style','class','name','type'],[['type','submit']]);

wsurvey.removeMostAttributes=function(q1,whitelist,blacklist) {

  var tatname,tavalue;
  var remlist,atname,atvalue;
  var exceptions=[];

  if (arguments.length<2) whitelist=[];
  if (arguments.length<3) blacklist=[];

  jQuery.each(whitelist,function(ith,aval){whitelist[ith]=jQuery.trim(aval).toUpperCase() ;}) ;        // capitalize all elements

  jQuery.each(blacklist,function(ith,aval){
      var ado=jQuery.trim(aval[0]).toUpperCase();
      exceptions[ado]={};
      jQuery.each(aval,function(ii2,aval2) {
          if (ii2==0) return 1 ;     // slice instead? eh.
          var ado2=jQuery.trim(aval2).toUpperCase();
          exceptions[ado][ado2]=1;
      });
  }) ;        // capitalize all elements

   q1.each(function() {          // now remove attributes
    var e = jQuery(this);
    remlist=[];
    jQuery.each(this.attributes, function(attr, avalue){
      atname=avalue.name ;
      atvalue=avalue.value ;
      tatname=atname.toUpperCase();
      if(jQuery.inArray(tatname, whitelist) == -1)  {       // not in whitelist
             remlist.push(atname);
       } else {                         // check exceptions
             if (exceptions[tatname]!==undefined) {
                tavalue=atvalue.toUpperCase() ;
                if (exceptions[tatname][tavalue]!==undefined)  remlist.push(atname);
             }      // exceptions check
       }        // whitelist check
    });         // this.attributes each

    for (var irem=0;irem<remlist.length;irem++) e.removeAttr(remlist[irem]);   
  });         // q1 each

} ;


//=========================================================
// display content in a new HTML window.
//
//       'content': A string to use as contents. If 'content' is specified, aid is ignored
//       'header' : A string to use as a header line. Top line in file (for html, top line in <body>
//       'title' : title to use for the new window. Otherwise, a generic title is used
//       'name' : name (target) of the new window. If not specified, '_blank' is used
//       'cssFiles': a space (or ,) delimited list of paths to css files. These are added to the <head> of
//                window created to show the content. Only used if type='html'
//       'jsFiles': a space (or ,) delimited list of paths to js files. These are added to the <head> of
//                window created to show the content. Only used if type='html'
//       'width': width of new window in px. If not specified, system determines
//       'height': height of new window in px. If not specified, system determines
//       'bars'  : default=0. If 0, don't show menubars, etc. If 1, do show
//       'type'   : How to open  new window.Default (or '') is 'text/html'. Possiblities are  such as 'text/xml' or 'text/plain'.


wsurvey.displayInNewWindow=function(aid,opts) {
  var stuff2 ;

  if (arguments.length<2) opts={} ;

  var jq ;
  var gotContent=wsurvey.findObjectDefault(opts,'content',null,1) ;
  if (gotContent===null) { // use aid
    if (typeof (aid)=='string') {
        let aid1=jQuery.trim(aid);
        let aid2= (aid1.substr(0,1)=='#') ? aid1 : '#'+aid1;
        jq=jQuery(aid2);
    } else {
       jq=jQuery(aid);
    }
    if (jq.length==0 || !(jq instanceof jQuery) || typeof(jq.html)=='undefined' ) {
       console.log('wsurvey.displayInNewWindow error: aid does not point to a jQuery object with an html() method ');
       return false;
    }
    gotContent=jq.html();
  }

  var winName=wsurvey.findObjectDefault(opts,'winName,name','_blank',1) ;
  var aHeader =wsurvey.findObjectDefault(opts,'header','',1) ;
  var winTitle =wsurvey.findObjectDefault(opts,'title','Info',1) ;
  var winHeight =wsurvey.findObjectDefault(opts,'height','',1) ;
  var winWidth =wsurvey.findObjectDefault(opts,'width','',1) ;
  var winBars =wsurvey.findObjectDefault(opts,'bars','0',1) ;
  var winType =wsurvey.findObjectDefault(opts,'type','html',1) ;
  var cssFiles =wsurvey.findObjectDefault(opts,'cssFiles,css','',1) ;
  var jsFiles =wsurvey.findObjectDefault(opts,'jsFiles,js','',1) ;

   var awidth='', aheight='';
  if (winWidth!='') awidth=",width="+winWidth+'px';
  if (winHeight!='') aheight=",height="+winHeight+'px';

  winType=jQuery.trim(winType).toLowerCase();
  winName=jQuery.trim(winName);


    if (jQuery.trim(winBars)!=='1') {
      var ww=window.open('',winName,"toolbar=0,menubar=0,directories=0,scrollbars=1,resizable=1"+awidth+aheight );
    } else {
       var ww=window.open('',winName,"toolbar=1,menubar=1,directories=0,scrollbars=1,resizable=1"+awidth+aheight  );
    }

  var  stuff2='';
  if (winType=='text')  {
      ww.document.open('text/plain; charset=utf-8');
       stuff2='<pre>'+aHeader+'\n';
        stuff2+=gotContent+'</pre>';
 //   let blob = new Blob([stuff2], {type: 'text/plain'})
//       let dataUri = window.URL.createObjectURL(blob)
//     window.open(dataUri);
//       ww.document.open();
       ww.document.write(stuff2);
        ww.document.close();
        ww.focus();
       return 1;
  }


 
// if here the default (html)

   var stuff2='<!DOCTYPE HTML><html><head><meta charset="utf-8"><title>'+winTitle+'</title>\n';
   if (cssFiles!='') {
         let vcss=cssFiles.split(/[\s\,]+/g) ;
         let others=[];
         for (var iv=0;iv<vcss.length;iv++) {
            let acss=jQuery.trim(vcss[iv]);
            others.push('<link rel="stylesheet" type="text/css" href="'+acss+'" >');
         }
         let cssSay=others.join('\n ');
         stuff2+='\n '+cssSay;
   }
   if (jsFiles!='') {
         let vjs=jsFiles.split(/[\s\,]+/g) ;
         let others2=[];
         for (var iv=0;iv<vjs.length;iv++) {
            let ajs=jQuery.trim(vjs[iv]);
            others2.push('<script  type="text/javascript" src="'+ajs+'" ></script>');
         }
         let jsSay=others2.join('\n ');
         stuff2+='\n '+jsSay;
     }

   stuff2+='\n</head><body>\n';
   stuff2+=aHeader+'\n' ;
   stuff2+=gotContent;
  stuff2+='\n</body></html>';
 
   ww.document.open('text/html; charset=utf-8') ; //  most browsers no longer take any arguments (2022) (used to use 'text/html; charset=utf-8');
  ww.document.writeln(stuff2);
  ww.document.close();
  ww.focus();

  if (winType=='html') displayInNewWindow2(ww,winTitle,0);
  return ;

// make sure  title of window is displayed ... might have to do wait for content to be fully loaded
  function displayInNewWindow2(ww1,winTitle1,nth) {
    if (nth>20) {
       console.log('Unable to change title of newly created window ');
        return 0;
    }
    if(ww1.document) { // is it loaded
        ww1.document.title = winTitle1 ; // set title
    } else { // if not loaded yet
        nth++;
        setTimeout(function() {displayInNewWindow2(ww1,winTitle,nth)}, 100); // check in another 100ms
    }
   return 1;
  }

}

// functions that convert unicode to base64. SOmewhat deprecated
//https://developer.mozilla.org/en-US/docs/Glossary/Base64
wsurvey.utf8_to_b64=function( str ) {
  return window.btoa(decodeURIComponent(encodeURIComponent( str )));
}

wsurvey.b64_to_utf8=function( str ) {
  return decodeURIComponent(encodeURIComponent(window.atob( str )));
}

// Usage:
//wsurvey.utf8_to_b64('? à la mode'); // "4pyTIMOgIGxhIG1vZGU="
//wsurvey.b64_to_utf8('4pyTIMOgIGxhIG1vZGU='); // "? à la mode"


//===================================
// add a style sheet to the head with a class of cid; or add   rule to an existing sytles
// cid: id of a stylesheet to add. If '', no id. cid is used if you want to make multiple calls to addCssRule, and add to the same stylesheet
// rules: optional. If specified, should be an object, each field being an object.
//        Each top level object's field name is used as a .class type of css rule
//        The value of each top level object should be objects with fields being css attributes
//        Example:   {'boldRed':{'color':'red','font-weight':600},
//                    'emGreen':{'font-style':'oblique','color':'green'}
//                   }
//  Example:
//        addCssRule('foo1',{'boldRed':{'color':'red','font-weight':600},
//                    '       emGreen':{'font-style':'oblique','color':'green'}
//    would be the same as specifying:
//   <style id="foo1" type="text/css">
//     .boldRed {color:red, font-weight:600 }
//     .emGreen {font-style:oblique; color:green}
//   </style>

//   jQuery('#cid').append(".redbold{ color:#f00; font-weight:bold;}")

wsurvey.addCssRule=function(cid,rules) {

 var acid , ij,v1,v2,aopt1;
 var q,cssrules,cidt;
 var arule,rstrings,daname,aopt,addme ;

 if (cid instanceof jQuery)    {       // this shoudl be a  jquery object pointing to a <style> sheet
    cssrules=cid;
 } else  {                      // a string to use as the id .. might have to create a <style> element if no  matching element
   cidt=jQuery.trim(cid);
   if (cidt!=='') {
     quse=jQuery('#'+cidt);
     if (quse.length<1) {    // doesn't exist, create
        cssrules =  jQuery('<style id="'+cidt+'" type="text/css"> </style>').appendTo("head");
     } else {
        cssrules=quse;
     }

   } else {         // create "anonymous" stylesheet
         cssrules =  jQuery("<style   type='text/css'> </style>").appendTo("head");
   }
 }                // jquery object first argument?

 if (arguments.length<2) return 1;                // nothing to add (just creating the style sheet

for (dname in rules) {
   arule=rules[dname];
   rstrings=[] ;
   for (aopt in arule ) {
        aopt1=aopt;
        if (aopt.substr(aopt.length-1,1)==':') aopt1=aopt.substr(0,aopt.length-1);
        rstrings.push(aopt1+':'+arule[aopt]);
  }
  if (dname.substr(0,1)!=='#') dname='.'+dname ;   // allow for complex rules: i.e.; #foobar .rule1 { .... }
  addme=dname+' {'+rstrings.join(';')+' } \n ' ;
  cssrules.append(addme);
}                                           // for each defined rule
return 1
}


//=======================
// looks in all active style sheets for a .class definition equaling aclass0
// For exmaple, if  .myclass {stuff } exists
// then cssClassExists('myclass') returns true.
// Obviously, if no such class found, return false

wsurvey.cssClassExists=function(aclass0) {
      var zoo,sx,cs,sheetclasses;
        aclass0=jQuery.trim(aclass0);
        var hasstyle = false;
        var fullstylesheets = document.styleSheets;
        var aclass1='.'+aclass0;

        for (var sx = 0; sx < fullstylesheets.length; sx++) {
          try {
            sheetclasses = fullstylesheets[sx].rules || document.styleSheets[sx].cssRules;
          }
          catch(err) {
              console.log('problem looking for '+aclass0+' in  cssClassExists: '+err.message);
              return false;
          }
           for (var cx = 0; cx < sheetclasses.length; cx++) {
                try1=sheetclasses[cx].selectorText ;
                if (try1 == aclass1) {
                    hasstyle = true; ;
                    break ;
                }
            }
        }
        return hasstyle;
 };


//=====================
// dump
//=============
// front end to dump0 -- adds a header string
// I worksx like PHP's var_dump().
//   To show the contents of the variable in an alert window: dump(variable)
//   To show the contents of the variable in the web page: dump(variable, 'body')
//   To just get a string of the variable: dump(variable, 'none')
//Parameters:
//  v:              The variable
//  howDisplay:     "alert"  (or 1), or "console" (alert is default). Otherwise, no display -- just return as string
//  recursionLevel: Number of times the function has recursed when entering nested
//                  objects or arrays. Each level of recursion adds extra space to the
//                  output to indicate level. Set to 0 by default. 0 is recommended on first call!
//
//Return Value:
//  A string of the variable's contents
//Limitations:
//  Can't pass an undefined variable to dump().
//  dump() can't distinguish between int and float.
//  dump() can't tell the original variable type of a member variable of an object.
//  These limitations can't be fixed because these are *features* of JS.

wsurvey.dumpObj=function(v, howDisplay, amess) {
    howDisplay = (typeof howDisplay === 'undefined' || jQuery.trim(howDisplay)=='') ? "alert" : howDisplay;
    howDisplay=jQuery.trim(howDisplay).toLowerCase();
    if (howDisplay==1 || howDisplay==0) howDisplay='alert';
    let recursionLevel = 0 ;
    if (arguments.length<3) {
        amess='';
    } else {
       amess+=' \n';
    }
    var out=wsurvey.dump0(v,recursionLevel);

    out=amess+out;
     if (howDisplay == 'alert') {
        alert(out);
    }  else if (howDisplay == 'console') {
       console.log(out);
    }
    return out;  // always return it
 }

//  derived from  http://stackoverflow.com/questions/603987/what-is-the-javascript-equivalent-of-var-dump-or-print-r-in-php
// backend of dump
wsurvey.dump0=function(v,recursionLevel) {
    var sContents ;
    var vType = typeof v;
    var out = vType;

    switch (vType) {
        case "number":
        case "boolean":
            out += ": " + v;
            break;
        case "string":
            out += "(" + v.length + '): "' + v + '"';
            break;
        case "object":
            //check if null
            if (v === null) {
                out = "null";
            }
            else if (Object.prototype.toString.call(v) === '[object Array]') {
                out = 'array(' + v.length + '): {\n';
                for (var i = 0; i < v.length; i++) {
                    out+= dump_repeatString('   ', recursionLevel) + "   [" + i + "]:  " ;
                    out+=wsurvey.dump0(v[i], recursionLevel + 1) + "\n";
                }
                out += dump_repeatString('   ', recursionLevel) + "}";
            }  else { //if object
                sContents = "{\n";
                cnt = 0;
                for (var member in v) {
                    //No way to know the original data type of member, since JS
                    //always converts it to a string and no other way to parse objects.
                    sContents += dump_repeatString('   ', recursionLevel) + "   " + member +
                        ":  " + wsurvey.dump0(v[member],   recursionLevel + 1) + "\n";
                    cnt++;
                }
                sContents += dump_repeatString('   ', recursionLevel) + "}";
                out += "(" + cnt + "): " + sContents;
            }
            break;

    }  // switch
    return out;

   function dump_repeatString(str, num) {  //   dump_repeatString() returns a string which has been repeated a set number of times
      var out = '';
      for (var i = 0; i < num; i++) {
        out += str;
      }
      return out;
    }
}   // function (recursive)



//--------------
//   select contents of a container  (id =containerid as a string,
// lifted from http://www.sitepoint.com/forums/showthread.php?459934-selecting-text-inside-lt-div-gt
// http://stackoverflow.com/questions/5669448/get-selected-texts-html-in-div
//
//  NOTE: clip does NOT seeem to work under firefox (april 2020)
//
// container id: id of a container to mark, copy, or copy to clipboard.  A string, without leading #
//  awhat: optional. 'MARK', 'COPY',   'CLIP' ,or UNNMARK:
//       MARK text in container.  returns true or false
//      COPY marked contents.  returns contents, retaining HTML
//      CLIP: copy to clipboard (case insensitive).  returns 1 on success, 0 on faiure, -1 if unsupported browser
//      UNMARK if any text is selected. returns true
//
//  jan 2021 modification. If one argument, assume this is an event handler. 
//   first argument is pointer to the element that was clicked on -- work with its contents
//   Find the "what" attribute_-- which should containt MARK, COPY, CLIP, or UNMARK. If not specified, MARK is used

wsurvey.selectText=function(containerid,awhat) {
   var node,awhat,e0,node0;
    if (arguments.length<2) awhat='mark';
    awhat=jQuery.trim(awhat).toUpperCase();
   if (arguments.length==1)   {          // event handler?
         e0=wsurvey.argJquery(containerid);

         if (e0.length==0) return false ;
         awhat=e0.attr('what');
         awhat= (typeof(awhat)=='undefined' || awhat===null )  ? 'MARK' : awhat;
         node=e0[0];  // dom object needed

   } else {
       containerid=jQuery.trim(containerid);    // uses
       if (containerid.substr(0,1)!=='#') containerid='#'+containerid;
       node0=$(containerid);
       if (node0.length!=1) return false ;
       node=node0[0];
   }

 // clear any open range
    if (document.selection) document.selection.empty();
    else if (window.getSelection)
    window.getSelection().removeAllRanges();
    if (awhat=='UNMARK' ) return true ;


// mark it
    if ( document.selection ) {
            var range = document.body.createTextRange();
            range.moveToElementText( node  );
            range.select();
   } else if ( window.getSelection ) {
            var range = document.createRange();
            range.selectNode( node );
           window.getSelection().removeAllRanges();
            window.getSelection().addRange( range );
     }
    if (awhat=='MARK') return true ;     // done

// copy all html within the container
  if (awhat=='COPY' || awhat=='GET') {
    var html = "";
    if (typeof window.getSelection != "undefined") {
        var sel = window.getSelection();
        if (sel.rangeCount) {                    // should always be the case (give tne above must marked some content)
            var container = document.createElement("div");
            for (var i = 0, len = sel.rangeCount; i < len; ++i) {
                container.appendChild(sel.getRangeAt(i).cloneContents());
            }
            if ($(container).children().length==1) {
               html=$(container).children().prop('innerHTML');   // strip out encompassing div
            } else {
               html = container.innerHTML;
            }
        }

    } else if (typeof document.selection != "undefined") {
        if (document.selection.type == "Text") {
            html = document.selection.createRange().htmlText;
        }
    }
    return html;
 }

// save to clipboard?
 if (awhat.substr(0,4)=='CLIP' || awhat=='SAVE') {
        try {
          var ok = document.execCommand('copy');        // The important part (copy selected text)

         if (ok) return 1;
             else  return 0 ;
       } catch (err) {
          return -1  ;
    }
 }

 return false ;
}



// ---- create a synonym
if (typeof(wSurvey)=='undefined')  {      // a synonym
    var wSurvey=wsurvey ;
}
