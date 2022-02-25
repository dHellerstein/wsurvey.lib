// =============  create and floatingContent containers  ==================

/* Copyright 2022. Daniel Hellerstein (danielh@crosslink.net)

    wsurvey.floatingContents  is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

     wsurvey.floatingContents  is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You might have received a copy of the GNU General Public License
    along with wsurveyfloatingContents   If not, see <http://www.gnu.org/licenses/>.

    See  wsurvey.floatingContents.txt for useage instructions

  Note:  wsurvey.floatingContents is a consolidation of older code found in
       wsurveyMoveBoxes.js, wsurveyShowContent.js, and wsurveyUtils1.js

       You may find those useful alternatives.

 Note on namespaces used:
   wsurvey. --- namespace for the suite of wsurvey. libraries (including  wsurvey.floatingContents)
   wsurvey.flContents -- sub namespace for the floatingContent functions
   wsurvey.flContents.container -- portion of sub nameSpace for "floating container manipulation" functions

 Note: to avoid conflict with other frameworks:  jQuery() is used instead of $()
*/

if (typeof(wsurvey)=='undefined')  {
    var wsurvey={};
}

wsurvey.flContents={} ;  // define a "namespace" for functions
wsurvey.flContents.container={} ;  // define a "sub namespace" for functions that work with the simple floating container (not the contents or header)

if (typeof(window['wsurvey_flContents_extendPrefix'])=='undefined') window['wsurvey_flContents_extendPrefix']='wsFl';  // customization of jQUery extended functions


//==================
// return jquery object of closest floatingContent container (might be self) to some element (that is inside of a floatingContent container
//  Just check "self" if selfOnly=1

wsurvey.flContents.closest=function(athis,selfOnly) {

   var ethis ;
   if (arguments.length<2) selfOnly=0;
   if (typeof(athis)=='string') {
       athis=jQuery.trim(athis);
       let athis1= (athis.substr(0,1)=='#') ? athis : '#'+athis;
       ethis=jQuery(athis1);
   } else {
      ethis=wsurvey.argJquery(athis);
   }
   if (ethis===false || ethis.length==0) return false;     // not a jquery object, so not a floatingPoint container .. and can't look at parents!

   if (ethis.hasClass('wsFloatingContent'))  {   // this is a floatingContent container
        if (selfOnly!=2) return ethis ;      // just want jquery ponter
        let adom=wsurvey.flContents.dom(ethis) ;         // 2: type of container (simple or complete)
        if ( adom['headers']!==null && adom['contents']!==null) return 'complete';
        return 'simple';
   }

   if (selfOnly!=0) return false ;   // selfonly, so giveup

   let eparent=ethis.closest('.wsFloatingContent');
   if (eparent.length==1) return eparent;
   return false;
}

wsurvey.flContents.container.closest=wsurvey.flContents.closest ;


//----------------
// esc handler for wsFloatingContent -- close "most recently created" boxes first. ONLY considers wsFloatingContent containers!
// For complex environments, where there are a lot of non-floatingContent containers that may be subject to esc handling,
// the use of some other esc handler (such as ws_escapeHandler) may be more effective.
//  Basically: the order of exectuion (this vs other escape handlers) is indeterminate
// defined here to make it available for the .create() function
//
// Feb 2022: 2 arg version. Called as standalong function.
//  first arg is ignored. 2nd arg is 0 or 1
//   0: find flContent  last to close. Return its jquery object
//  1 : find flContent fist to close. Return its jquery object
//    IF no flContents are visible, return false

wsurvey.flContents.container.doEsc=function(evt,findMe) {

  if (arguments.length<2) {      // a "close on esc" call 
     findMe=-1;
  } else {
     findMe=parseInt(findMe);
     if (findMe>1) findMe=1;
     if (findMe<0) findme=0;
  }

  var e1,akey,ee,aesc;

  if (findMe <0) {         // a "close on esc" call
    akey=evt.which ;
    if (akey!==27) return  ;       // this just consider ESC
  } // if 2 arg mode, not lkooking for escape. Looking for who would be closed

  ee=jQuery('.wsFloatingContent:visible');     // don't consider for  "hide" (due to esc hit) if already hidden
  if (ee.length==0) {
      if (findme<0)  return ;       // nothing visible,
      return false ;          // no matches
  }

  var icheck=0,wasEsc,use1;
  for (ii=0;ii<ee.length;ii++) {
    let ee2=jQuery(ee[ii]);
    aesc=ee2.attr('data-wsfloatingcontent_escapeorder');
    if (aesc.substr(0,1)=='n') continue ;   // this is not subect to close on esc
    if (aesc.substr(0,1)=='z') {         // use z-index (not a set-at-initilaization value, such as time of init)
        aesc=ee2.css('z-index');
    }
    aesc=parseInt(aesc);

    if (icheck==0) {   // first one
        use1=ii; wasEsc=aesc;icheck=1;
        continue ;
    }
    if (findMe<0 || findMe==1 ) {  // not the first one   -- is it the biggest
       if (aesc>wasEsc) {        // this has "highest" value (of the candidates), so its now the leader
            wasEsc=aesc;
            use1=ii;
       }
    } else {         // findme=0  -- is it the smallest
         if (aesc<wasEsc) {        // this has "lowest" value (of the candidates), so its now the leader
            wasEsc=aesc;
            use1=ii;
         }
     }    // findme

  }  // all visible  .wsFloatingContent


  if (findMe<0) {
     jQuery(ee[use1]).hide();               // and close the leader
     evt.stopImmediatePropagation();    // if one of the floatingCOntent containers was just closed, don't do any other esc handlers
     return 1;
  }

  return  jQuery(ee[use1]) ;  // the jqery object of the flContent that is next to close on escape , or last (findme=0)

}   ;  // end of doEsc


//============================
// uncreate --- remove wsFloatingContent attributes from a wsFloatingContent container
// e1 is either a jqauery objet, or string id
wsurvey.flContents.container.remove=function(e1) {

   if (typeof(e1)=='string') {       // if string, try to find id that matches
        if (e1.substr(0,1)!='#') e1='#'+e1;
        let e2=jQuery(e1);
        if (e2.length ==0) {
            wsurvey.flContents.container.error('remove error: no such id: '+e1);
            return 0;       // no such id
        }
        e1=jQuery(e2[0]) ;     // first element that matches
   } else {
       e1=wsurvey.argJquery(e1);
   }
   if (!e1.hasClass('wsFloatingContent')) {
            wsurvey.flContents.container.error('remove error: '+e1.attr('id')+' is not a wsFloatingContent container');
            return 0;       // no such id

   }
   let oldclass=e1.attr('data-oldClass');
   e1.removeClass()  ;              // remove all old classes
   let cclist=oldclass.split(/\s+/);
   for (var i1=0;i1<cclist.length;i1++) {
       let aclass=cclist[i1];   
       if (aclass!='wsFloatingContent') e1.addClass(aclass);
   }
   e1.removeAttr(' data-wsfloatingcontent_positionoriginal  oldclass data-wsfloatingcontent_escapeorder  '); // get rid of attributes added by  this coe
   let e1c=e1.find(".wsFloatingContent_control");   // the control buttons added everywhere (ne cordner and other spots)
   e1c.remove();
//
  return 1;
}   ;  // end of remove


//=============
// add a style sheet for internal use
// a few css rules

// do NOT set position in  cwsFloatingContent_mainC -- assume that that is done by .container.create!

wsurvey.flContents.container.createStyles=function(e1) {

  let ee=document.querySelector('[name="wsurveyFloatingContent_defaults"]');

  if (ee!==null) {
    if (ee.getAttribute('data-autocreate') ==null) {
       console.log('Using custom version of wsurveyFloatingContent_defaults (css style sheet)');
    } else {
//       console.log('Using default version of wsurveyFloatingContent_defaults (css style sheet)'); // don't bother
    }
    return 1;  // already exists, do nothign
  }

  let dd=Date.now();
  jQuery('<style  data-autocreate="'+dd+'" name="wsurveyFloatingContent_defaults">').prop("type","text/css")
 .html(" \
\
.cwsFloatingContent_mainC {opacity:1.0;left:10%;top:10%;width:70%;height:50%;  \
                           margin:2px 2px 1em 2px;  \
                           padding:2px 2px 1em 3px;\
                           border:1px solid   #989799;   \
                           border-bottom:2px dotted #989799; \
                           background-color:#ededed;border-radius:5px;z-index:50 ;}   \
          \
.cwsFloatingContent_mainShadow {box-shadow: 20px 20px 30px 20px tan ;background-color:#f3f3f3;} \
.cwsFloatingContent_simple {background-color:#f7f7f7;} \
.cwsFloatingContent_contentC {border:1px dotted #ababbb;xborder-right:none; \
                 height:96%;width:99%;overflow:auto;scrollbar-width:auto;scrollbar-color:auto} \
.cwsFloatingContent_contentThin {scrollbar-width:thin !important;      \
      scrollbar-color: #ccf9e8  #aae5fb    !important} \
 \
.cwsFloatingContent_headersC  {background-color:#dfdedf;min-height;0.5em;    \
                 font-size:70%;margin-top:3px} \
.cwsFloatingContent_maximize {display:none;padding:3px; margin:2px 1px 2px 1px; border:3px solid green; border-radius:3px; background-color:#fdfddf;} \
.cwsFloatingContent_headerCloser {cursor:pointer;margin:0px;padding:0px;font-size:100%;} \
.cwsFloatingContent_navbutton {color:blue;padding:1px; margin:-1em 1px 0px 1px; border:1px solid #bbaabb; \
     border-right:3px solid #bbb1bb; border-radius:1px; background-color:#fdfddf;font-size:85%} \
 \
.cwsFloatingContent_smallButton {font-size:8px;padding:0px;cursor:pointer } \
.cwsFloatingContent_showControls {font-size:8px;padding:0px;cursor:col-resize } \
.cwsFloatingContent_historyShow {       \
   border:1px dotted gray;               \
   margin: 3px 3px 3px 3px;    \
   padding:3px 5px 2px 5px;               \
} \
.cwsFloatingContent_historyShowActive {      \
   background-color:  #bdfee5 !important;  \
   margin: 2px 2px 2px 2px   !important;  \
   border:1px dashed gray;   !important ;    \
  } \
.cwsFloatingContent_moveButtonNE {z-index:2;opacity:1.0;font-size:8px;padding:0px;position:absolute;right:-3px;top:-3px; } \
.cwsFloatingContent_moveButtonNW {z-index:2;opacity:1.0;font-size:8px;padding:0px;position:absolute;left:-3px;top:-3px; }  \
.cwsFloatingContent_moveButtonSW {z-index:2;opacity:1.0;font-size:8px;padding:0px;position:absolute;left:-3px;bottom:-2px} \
.cwsFloatingContent_moveButtonSE {z-index:2;opacity:1.0;font-size:8px;padding:0px;position:absolute;right:-2px;bottom:-2px} \
.cwsFloatingContent_moveButtonSEi  {z-index:2;opacity:1.0;font-size:8px;padding:0px;}  \
.cwsFloatingContent_moveButtonSWi  {z-index:2;opacity:1.0;font-size:8px;padding:0px;}  \
.cwsFloatingContent_moveButtonNWi  {z-index:2;opacity:1.0;font-size:8px;padding:0px;}   \
.cwsFloatingContent_moveButtonNEi  {z-index:2;opacity:1.0;font-size:8px;padding:0px;}  \
.cwsFloatingContent_noSelect {user-select:none } \
.cwsFloatingContent_moveResizeHide {z-index:1;border-radius:5px;font-size:75%;padding: 0px 0px 0px 0px;margin:-2px 0px 0px 2px; \
             text-align:center;vertical-align:middle;} \
.cwsFloatingContent_zindexUp {z-index:2;opacity:1.0;border-radius:5px;font-size:75%;padding: 0px 0px 0px 0px;margin:-2px 0px 0px 2px; \
             text-align:center;vertical-align:middle;} \
.cwsFloatingContent_expandThisButton {z-index:2;opacity:1.0;border-radius:5px;font-size:75%;padding: 0px 0px 0px 0px;margin:-2px 0px 0px 2px; \
             text-align:center;vertical-align:middle;cursor:zoom-in} \
.cwsFloatingContent_callFunc {z-index:2;opacity:1.0;border-radius:5px;font-size:75%;padding: 0px 0px 0px 0px;margin:-2px 0px 0px 2px; \
              text-align:center;vertical-align:middle;color:blue;cursor:pointer} \
.cwsFloatingContent_buttonsUpperRight {position:absolute;font-size;300%;right:2px;top:2px;color:blue;padding:2px; background-color:#fafbfc;} \
.cwsFloatingContent_controlButtonsNE {z-index:3; background-color:#dbdbab;position:absolute; top:-4px;right:-2px;padding:0px 5px 0px 5px; }\
.cwsFloatingContent_topBar {z-index:1;opacity:0.5;height:9px;font-size:5px;overflow:hidden; background-color:#dbdbab;xbackground-color:red; \
                   border:1px dotted gray;position:absolute;cursor:move !important; \
                   top:-8px;left:1%;width:98% } \
.cwsFloatingContent_topBarFat {z-index:1;opacity:0.5;height:18px;font-size:5px;overflow:hidden;background-color:#dcdcac; \
                   border:1px dotted gray;position:absolute;cursor:move  !important; \
                   top:-8px;left:1%;width:98% } \
.cwsFloatingContent_expandMe{z-index:2;height:92% !important;width:94% !important;left:2% !important;top:2% !important}  \
.cwsFloatingContent_desc {max-height:40%;overflow:auto;background-color:#afadb2;margin:5px 3em 5px 3em;border:1px solid cyan;border-radius:2px;padding:4px} \
.cwsFloatingContent_tipsUl {list-style-type:none} \
.cwsFloatingContent_tipsUl li {color:darkblue; text-indent: -1em;margin-left: 2em;} \
.cwsFloatingContent_tipsButton {cursor:help;color:blue;background-color:#aabbaa;border-radius:4px;padding;2px;font-size:60%;border:1px groove lightblue;}\
.cwsFloatingContent_restoreSizeButton {cursor:row-resize;color:blue;background-color:#aabbaa;border-radius:4px;padding;2px; \
            font-size:60%;border:1px groove lightblue;}\
")
 .appendTo("head");

  console.log('Creating wsurveyFloatingContent_defaults (css style sheet)');

// some classes that are used JUST to find elements (no styling assigned)
//  wsFloatingContent  -- in the outermost element of a floatingContent container. Used to find closest, or all, floatingContent containsers
//  wsFloatingContent_control  -- class assigned to each of the  the various control buttons.  This can be removed (by .remove) to reduce clutter
//  wsFloatingContent_moveButton the move buttons (including topbar)
//  wsFloatingContent_resizeButton the resize buttons
//     Note taht   cwsFloatingContent_controlButtonsNE is used toggle display of some of these buttons (with a _flag_canHide class)

return 1;
}



//==========================
// convert a generic container (i.e.; a div with minimal formatting) into a floatingCOntent container
// this does the floatingContent container setup. It is called by wsurvey.flContents.create
wsurvey.flContents.container.create=function(aid,opts,status) {

   if (arguments.length<3) status={};

   var d1,fact1,tmp,thisClass='wsFloatingContent',doOverwrite=0 ;     // derault is disable overwerite
   if (arguments.length<3) {
       status={'overwrite':0,'status':'error','message':'Other problem'};
   } else {      // status arg exists... check for 'overwrite'
     doOverwrite=wsurvey.findObjectDefault(status,'overwrite',0,2) ;
   }

   var myid= (typeof(aid)=='string') ? aid : 'n.a. ' ;

    // make sure doctype exists!
   let docT=document.doctype ;
   if (docT===null) {
      status['message']='Your document does NOT have a doctype declaration; such as &t;<!DOCTYPE HTML&gt;.\n wsFloatingContent  would NOT be dependable';
      wsurvey.flContents.container.error("WARNING: your document does NOT have a doctype declaration; such as <!DOCTYPE HTML>.\n wsFloatingContent would NOT be dependable",0);
      return false;
   }
   if (arguments.length>1 && !jQuery.isPlainObject(opts)) {
      status['message']='Id='+myid+' :If options are specified, it must be as an associative array.';
       wsurvey.flContents.container.error('Id='+myid+' : If options are specified, it must be as an associative array. ',0);
      return false;
   }

   if (typeof(aid)=='string') {
     let aid0=(aid.substr(0,1)!='#') ? '#'+aid : aid ;
     d1=jQuery(aid0);
     if (d1.length==0)  {  // no such id. Create it
         let qq=jQuery(document.body).append('<div id="'+aid+'"></div>');
         d1=jQuery(aid0);
         if (d1.length==0) {
            status['message']='Id='+myid+' : floatingContent container could not be created; using id of:<tt> '+aid+'</tt>';
            wsurvey.flContents.container.error('Id='+myid+' : floatingContent container  could not be created;: '+aid,0 );
            return false;
         }
         woof=d1.attr("id");
         status['status']='create';
         status['message']='floatingContent container created;  with id of:<tt> '+aid+'</tt>';
     }   else {   // already exists
          status['status']='convert';
          status['message']='Converting element to floatingContent container; using id=<tt>'+aid+'</tt> ';
     }
     myid=aid;
   } else {
      d1=jQuery(aid);
      if (!(d1 instanceof jQuery)) {
          status['message']='Id='+myid+': Provided element is not a jQuery (or DOM) object';
          wsurvey.flContents.container.error('Id='+myid+' : Provided element is not a jQuery (or DOM) object');
          return false ;
      } else {
         status['status']='convert';
         status['message']='existing element converted to a floatingContent container. id attribute: <tt> '+myid+'</tt>';
      }
      myid=d1.attr('id');
   }    // d1 is jquery object pointing to the box.

   if (d1.hasClass(thisClass)) {
      if (doOverwrite!='1') {
        status['status']='failOverwrite';
        status['message']='Id='+myid+' : element is a floatingContent container, but overwrite not enabled ' ;
        wsurvey.flContents.container.error('Id='+myid+' : element is a floatingContent container, but overwrite not enabled ');
        return false ;
      }  else {    // overwrite -- remove existing floatingContent attributes
         wsurvey.flContents.container.remove(d1);
         let myid=d1.wsurvey_attrCi('id','no id available');
         status['status']='overwrite';
         status['message']='existing element is a floatingContent container. It was overWritten. Id attribute: <tt> '+myid+'</tt>';
      }
   }  // deal with an existing floatingContent container

//   if (d1.css('background-color')=='transparent')  d1.css('background-color','#fbfbfb');   // if   specifically transparent, add a backgrond color  -- but one could change this after the call to .create
//   tmp=jQuery('.wsFloatingContent');  // find all the floating content contianers

// figure out default psoition and size
   var scwidth,scheight,bodyFontSize,aposition;
   scwidth=jQuery(window).width();  // not document :()
   scheight=jQuery(window).height();
   bodyFontSize=jQuery("body").css('font-size');
   aposition='fixed';   // could allow this to be changed via options, but for not its alaway fixed
   var escHandlerFunction=wsurvey.flContents.container.doEsc ;

// defaults size and position
   var atop=0,aleft=0,aright=0,aheight=0,awidth=0;
   atop=parseInt(scheight/4);
   aleft=parseInt(scwidth/4);
   awidth=atop*2;
   aheight=aleft*2;

   if (arguments.length<2 || (typeof(opts)=='string' && opts=='*') ) {  // the default options is simple, plus the default "other options" defined below
       opts={'width':awidth,'height':aheight,'top':atop,'left':aleft,'position':aposition};
   }

// read size and position from opts (possibly from  defaults created if no opts argument)
   if (typeof(opts['width'])!='undefined') awidth=wsurvey.toPx(opts['width'],scwidth,bodyFontSize);
   if (typeof(opts['height'])!='undefined') aheight=wsurvey.toPx( opts['height'],scheight,bodyFontSize);
   if (typeof(opts['top'])!='undefined') atop=wsurvey.toPx( opts['top'],scheight,bodyFontSize);
   if (typeof(opts['left'])!='undefined') aleft=wsurvey.toPx( opts['left'],scwidth,bodyFontSize);

// defaults for other options
//    var enableOnTop='*' ;
    var expandBox=1;
    var callFuncOther='',callFunc='',callFuncMess='...',iconFunc='&neArr;' ;
    var noTips=0,noCloser=0,noRestoreSize=0,noHideControls=0,noZindexButton=0 ;
    var movers='*',iconMove='&#9769;',moveTopBarClass='cwsFloatingContent_topBar';
    var resizers='*';
    var addOverflow=0,removeClass='';  classMain='-1' ;

    var adate=new Date().getTime();

    var escapeOrder=adate;  // default is most recently created is first to close when esc is clicked

//get other options -- case insensitive match, and abbreviaiton match. exact match done first!
// after this seciton, opts is not used -- the variables are.
      addOverflow=wsurvey.findObjectDefault(opts,'addOverflow',addOverflow,2);
      callFunc=wsurvey.findObjectDefault(opts,'callFunc,callf,funcC',callFunc,2);
//      enableOnTop=wsurvey.findObjectDefault(opts,'enableOnTop,enableOn',enableOnTop,2);
      escapeOrder=wsurvey.findObjectDefault(opts,'escapeOrder,escape,escorr',escapeOrder,2);
      expandBox=wsurvey.findObjectDefault(opts,'expandBox,expand,expandBoxButton',expandBox,2);
      iconMove=wsurvey.findObjectDefault(opts,'iconMove,moveIcon,iconM',iconMove,2);
      iconFunc=wsurvey.findObjectDefault(opts,'iconFunc,iconF',iconFunc,2);
      moveTopBarClass=wsurvey.findObjectDefault(opts,'moveTopBarClass,moveTop',moveTopBarClass,2);
      movers=wsurvey.findObjectDefault(opts,'movers',movers,2);
      noCloser=wsurvey.findObjectDefault(opts,'noCloser,noCl',noCloser,2);
      noTips=wsurvey.findObjectDefault(opts,'noTips,noTi',noTips,2);
      noRestoreSize=wsurvey.findObjectDefault(opts,'noRestoreSize,noRe',noRestoreSize,2);
      noHideControls=wsurvey.findObjectDefault(opts,'noHideControls,noHi',noHideControls,2);
      noZindexButton=wsurvey.findObjectDefault(opts,'noZindexButton,noZi,noOnTopB',noZindexButton,2);
      resizers=wsurvey.findObjectDefault(opts,'resizers,resize',resizers,2);
      removeClass=wsurvey.findObjectDefault(opts,'removeClass,remove',removeClass,2);
      classMain=wsurvey.findObjectDefault(opts,'classMain,mainClass,classMa','1',2);  // default is simple whitish background


// parse some of the options

// fix the size and position
   if (atop+aheight >scheight) {  //hack to prevent corners being off screen
      atop=0.8*atop;
      aheight=scheight-(atop+15);
   }
   if (aleft+awidth >scwidth) {
      aleft=0.8*aleft;
      awidth=scwidth-(awidth+15);
   }
   let startPosition={'left':aleft,'top':atop,'height':aheight,'width':awidth,'position':aposition};  // set d1's size and position
   d1.css(startPosition);     // add them to the jQUery object css
   let origPositionA=[] ;
   for (var axx in startPosition) origPositionA.push(axx+'='+startPosition[axx]);
   let  origPositionS=origPositionA.join(',');    // join to make sure noextra commas
   d1.attr('data-wsfloatingcontent_positionoriginal',origPositionS) ;

// mover buttons  (used below)
    let iBarClass=jQuery.trim(moveTopBarClass.toUpperCase());
    if (iBarClass=='.FAT' ) {
         moveTopBarClass='cwsFloatingContent_topBarFat';  // special case of custom topbar -- built in "fat"
    } else if (iBarClass==1) {
        moveTopBarClass='cwsFloatingContent_topBar';  // special case of custom topbar -- built in "fat"
    }

     movers=movers.replace(/\,/g,' ').toUpperCase();
    let moverList={'NE':0,'SE':0,'NW':0,'SW':0,'TOPBAR':0};              // start with none  -- but keep in mind that the default movers='*'
    if (movers.indexOf('NE')>-1 || movers.indexOf('*')>-1) moverList['NE']=1;
    if (movers.indexOf('SE')>-1 || movers.indexOf('*')>-1) moverList['SE']=1;
    if (movers.indexOf('SW')>-1 || movers.indexOf('*')>-1) moverList['SW']=1;
    if (movers.indexOf('NW')>-1  || movers.indexOf('*')>-1 ) moverList['NW']=1;
    if (movers.indexOf('TOPBAR')>-1 || movers.indexOf('*')>-1) moverList['TOPBAR']=moveTopBarClass;
 

// resizer buttons (used below)
     resizers=resizers.replace(/\,/g,' ').toUpperCase();
    let resizerList={'NE':0,'SE':0,'NW':0,'SW':0};        // start with none  -- but keep in mind that the default resizers='*'
    if (resizers.indexOf('NE')>-1 || resizers.indexOf('*')>-1) resizerList['NE']=1;
    if (resizers.indexOf('SE')>-1 || resizers.indexOf('*')>-1) resizerList['SE']=1;
    if (resizers.indexOf('NW')>-1 || resizers.indexOf('*')>-1) resizerList['NW']=1;
    if (resizers.indexOf('SW')>-1 || resizers.indexOf('*')>-1) resizerList['SW']=1;

    var d1_oldClass='';
// remove classes from existing object -- do it now (but saved remvoed classe for possibe resotration
    if (removeClass!='') {           // classes to remove -- can be restored later. note that inline styles are not touched. They probably should NOT be used  in floatingContent container
        let d1_oldClass=d1[0].className ;
        d1.attr('data-oldclass',d1_oldClass);   // for later restoration
        if (removeClass=='*') {   // remove all of them
           d1.removeClass();
       } else {      // remove some of the current classes
          let dlist=d1_oldClass.split(/\s+/);
          let rclasses=removeClass.split(/\s+/);   // classes to REMOVE
          for (var idd=0;idd<dlist.length;idd++) {     // look at each currently active class
              let add=dlist[idd];
              if (jQuery.inArray(add,rclasses)>=0) d1.removeClass(add);   //  in remove class list? then remove
          }
       }
     }
 
   var classMainSay='';
   classMain=jQuery.trim(classMain);
   if (classMain.substr(0,1)=='-') {
      classMain=jQuery.trim(classMain.substr(1));
      if  (d1_oldClass=='' ) {  // removeClass supersedes "-"
          let d1_oldClass=d1[0].className ;
          d1.attr('data-oldclass',d1_oldClass);   // for later restoration
          d1.removeClass();
     }  // removeClass wasn't used
   }    // start with -
   if (classMain!='') {
      let vindex=classMain.split(/[\s\,]+/g) ;
      for (var iv=0;iv<vindex.length;iv++) {
          aclass=jQuery.trim(vindex[iv]) ;
          if (aclass=='1') aclass='cwsFloatingContent_mainC'  ;
          if (aclass.toUpperCase()=='.SHADOW') aclass='cwsFloatingContent_mainShadow';
          vindex[iv]=aclass;
      }
      classMainSay=vindex.join(' ');
   }
// wsFloatingContent is used as a top level identifier --  it does NOT do any styling (unless explicitly created)
   d1.addClass(thisClass);       // the "flag" used to find the root of a floatingContent container   (i.e.; when an button in the container is clicked)
   if (classMainSay!='') d1.addClass(classMainSay);  // classes used to format and display the entire container.

// call func specs (used below)
    callFunc=jQuery.trim(callFunc);
    if (callFunc=='0' ) callFunc='';  // no callfunc (so no calklFuncIcon displayed)
    if (callFunc!='' ) {      //  ''  or 0means "don't have a calFuncIcon dispalyed"
         let aa=callFunc.split(',');
         let callFunc0=jQuery.trim(aa[0]);
         let aa2=wsurvey.parseAt(callFunc0,':') ;
         callFunc=jQuery.trim(aa2[0]);
         if (aa2.length>0) callFuncOther=aa2[1];                        // other information to send (can NOT include commas)
         if (aa.length>1) callFuncMess=aa.slice(1).join(',')  ;
         iconFunc = jQuery("<div/>").html(iconFunc).text();  // strip out html tags
         if (iconFunc=='' || iconFunc=='0') iconFunc='&neArr;';
    }

// what is order of esc to close
   escapeOrder=jQuery.trim(escapeOrder).toLowerCase() ;  // deal with 'n'  or 't' or 'z'  or 't' (just use the first character)
   if (escapeOrder.substr(0,1)=='t') escapeOrder=adate ;  // the default

   d1.attr('data-wsfloatingcontent_escapeorder',escapeOrder);

   tmp=d1.css('borderTopWidth');
    if (tmp=='' || tmp=='0px') { d1.css('border','1px solid black') };        // if not specified, create a border

   if (d1.css('padding-bottom')=='0px')    d1.css('padding-bottom','14px');         // if not specified, create some padding
   if (d1.css('padding-top')=='0px')    d1.css('padding-top','14px');

   if (addOverflow==1) {
       if (d1.css('overflow')=='visible') {         // if hidden, do not override
           d1.css('overflow','auto');          // if not specified, set overflow to auto. Made optional  6 june 2020
       }
   }

// make the control buttons
    stuffControl='';
     let gooMove=wsurvey.htmlspecialchars(iconMove);  // for the desc screen
     let gooResize=wsurvey.htmlspecialchars('&nearr;');

// note:  wsFloatingContent does not to any styling -- it  is  used to find control buttons
    if (moverList['TOPBAR']!=0){
          let bbar=moverList['TOPBAR'];
          let stuffT='<span class="'+bbar+' wsFloatingContent_control wsFloatingContent_flag_canHide " arf="'+gooMove+'"   name="wsFloatingContent_moveButton"  ';
          stuffT+=' title="Click, and hold, to move ...."  > &nbsp;</span>';
          stuffControl+=stuffT ;
    }

// hideControls, tips, restoresize, moverNE, zindex change (forectround or backgorund), expandbox,callfunc,closer
    stuffControl+=' <span  title="Control buttons for this floatingContent container"  class="wsFloatingContent_control cwsFloatingContent_controlButtonsNE "   > ';

     if (noHideControls!='1'){
        stuffControl+='<input type="button" value="&#65377;"  class="wsFloatingContent_buttonViewIcon wsFloatingContent_control  cwsFloatingContent_showControls"  ';
         stuffControl+='   name="hideControls"  title="toggle view of these control buttons"  onClick="wsurvey.flContents.container.controlButtons(this)"  /> ';
     }
     if (noTips!='1') {
        stuffControl+='<input type="button" value="&#8505;"   name="desc"  title="Display tips on how to use these controls"  ';
        stuffControl+='  class="wsFloatingContent_flag_canHide cwsFloatingContent_tipsButton" onClick="wsurvey.flContents.container.desc(this)"  /> ';
     }
     if (noRestoreSize!='1') {
          stuffControl+='<input type="button" value="&#10561;"  title="Restore to original size" onClick="wsurvey.flContents.container.restoreOriginalSize(this)"   ';
          stuffControl+='  class="wsFloatingContent_flag_canHide wsFloatingContent_control cwsFloatingContent_restoreSizeButton"  /> ';
     }

     if (noZindexButton==0) {
          stuffControl+='<input type="button" value="&#9195;" name="zindexUp"  title="Click to move to foreground&#013;RMB to move to background "  ';
          stuffControl+='  class="cwsFloatingContent_zindexUp  wsFloatingContent_control wsFloatingContent_flag_canHide "  /> ';
     }

     if (expandBox==1) {
        stuffControl+='<input type="button"  value="&#128307;" expanded="0"    title="toggle to a full view"  ';
        stuffControl+='    name="wsFloatingContent_expander"  class="cwsFloatingContent_expandThisButton wsFloatingContent_control wsFloatingContent_flag_canHide"  ';
        stuffControl+='    onClick="wsurvey.flContents.container.doExpand(this)"  data-expanded="0" /> ';
     }

     if (callFunc!=='') {
         let addOther=' ';
         if (callFuncOther!=='') addOther=' data-other="'+callFuncOther+'" ';
         stuffT='<input '+addOther+' data-func="'+callFunc+'" type="button"  value="'+iconFunc+'"   name="callFunc"  title="'+callFuncMess+'"  ';
         stuffT+='    class="cwsFloatingContent_callFunc wsFloatingContent_flag_canHide" onClick="wsurvey.flContents.container.callFunc(this)" /> ';
         stuffControl+=stuffT;
     }

     if (noCloser!=='1') {
         stuffControl+='  <input type="button" value="&Chi;" name="closeMe" ';
         stuffControl+='        class="wsFloatingContent_flag_closerIcon  wsFloatingContent_control wsFloatingContent_flag_canHide cwsFloatingContent_smallButton " ';
         stuffControl+='        title="close &#013;(rmb: close and maintain expanded state)"  ';
         stuffControl+='       onClick="wsurvey.flContents.container.close(this)" /> ';
     }

     if (moverList['NE']==1) {
        stuffControl+='<input type="button"  name="wsFloatingContent_moveButton" value="'+iconMove+'"  arf="'+gooMove+'" style="cursor:move"';
        stuffControl+=' class="cwsFloatingContent_moveButton_icon wsFloatingContent_control wsFloatingContent_flag_canHide cwsFloatingContent_smallButton"  ';
        stuffControl+='  title="Click, and hold, to move"    /> ';
     }

     if (resizerList['NE']==1 ) {
        stuffControl+='  <input type="button" name="wsFloatingContent_resizeButton" value="&nearr;" arf="'+gooResize+'"  data-dir="NE"  ';
        stuffControl+='   style="cursor:ne-resize"  title="Click, and hold, to reize"  class="cwsFloatingContent_moveButtonNEi wsFloatingContent_control wsFloatingContent_flag_canHide"    /> ';
     }

// note that this absolute position to the NE, so order in stuffContro doesn' matter

    stuffControl+='</span> ';

// movers and resziers
   let tstuff='';

   if (resizerList['NW']==1  ||  moverList['NW']==1) {
         tstuff+='  <span  class="cwsFloatingContent_moveButtonNW"> ';
         if (resizerList['NW']==1 ) tstuff+='<input type="button" value="&nwarr;" arf="'+gooResize+'" name="wsFloatingContent_resizeButton"  data-dir="NW"   style="cursor:nw-resize" name="resizeNW"   title="Click, and hold, to reize" class="wsFloatingContent_control   cwsFloatingContent_moveButtonNWi   "  /> ';
         if (moverList['NW']==1 )  tstuff+= '<input type="button" value="'+iconMove+'"   arf="'+gooMove+'"  name="wsFloatingContent_moveButton"   style="cursor:move" title="Click, and hold, to move"  class="wsFloatingContent_control  cwsFloatingContent_moveButtonNWi  " /> ';
         tstuff+='</span>';
   }
   if (resizerList['SW']==1 ||  moverList['SW']==1)   {
        tstuff+='  <span  class="cwsFloatingContent_moveButtonSW"> ';
        if (resizerList['SW']==1) tstuff+='<input type="button" value="&swarr;"  arf="'+gooResize+'" name="wsFloatingContent_resizeButton"   data-dir="SW" style="cursor:sw-resize" title="Click, and hold, to reize" class="wsFloatingContent_control  cwsFloatingContent_moveButtonSWi   "  />  ';
        if (moverList['SW']==1 ) tstuff+= '<input type="button" value="'+iconMove+'"   arf="'+gooMove+'"  name="wsFloatingContent_moveButton"   style="cursor:move"  title="Click, and hold, to move"  class="wsFloatingContent_control  cwsFloatingContent_moveButtonSWi  "   /> ';
       tstuff+='</span>';
   }
   if (resizerList['SE']==1 || moverList['SE']==1) {
       tstuff+=' <span  class="cwsFloatingContent_moveButtonSE"> ';
       if (moverList['SE']==1 ) tstuff+= '<input type="button" value="'+iconMove+'"  arf="'+gooMove+'" name="wsFloatingContent_moveButton"   style="cursor:move"  title="Click, and hold, to move"  class="wsFloatingContent_control  cwsFloatingContent_moveButtonSEi  "   /> ';
       if (resizerList['SE']==1 ) tstuff+='<input type="button" value="&searr;"    arf="'+gooResize+'"  name="wsFloatingContent_resizeButton"    data-dir="SE" style="cursor:se-resize"    title="Click, and hold, to reize" class="wsFloatingContent_control  cwsFloatingContent_moveButtonSEi   "  />  ';
       tstuff+='</span>';
   }


   if (tstuff!='') stuffControl+=tstuff;

   d1.append(stuffControl);  // the control buttons, main bar in NE, others other corners


  let ddata={_firstMouseX:0,_firstMouseY:0,_nowMouseX:0,_nowMouseY:0,_startingAtX:0,_startingAtY:0,
          _startingAtW:0,_startingAtH:0,_resizeWhere:'NE',
          _firstRMouseX:0,_firstRMouseY:0,_nowRMouseX:0,_nowRMouseY:0,_startingRAtX:0,_startingRAtY:0}   ;
  ddata.comment='floatingContent container' ;
  d1.data('wsFloatingContent_vars',ddata);

// mousedown event handler for move
  let z2x=d1.find('[name="wsFloatingContent_moveButton"]');
  z2x.on('mousedown',wsurvey.flContents.container.startMove);

  let z3x=d1.find('[name="wsFloatingContent_resizeButton"]');
  z3x.on('mousedown',{'stuff':d1},wsurvey.flContents.container.startResize);


  let z5up=d1.find('.cwsFloatingContent_zindexUp');
    z5up.on('click',{'dire':1},wsurvey.flContents.container.setZindex) ;
     z5up.on('contextmenu',{'dire':-1},wsurvey.flContents.container.setZindex) ;
  z5up.css({'cursor':'pointer'});

// moved to wsurvey.flContents.create
//  enableOnTop=jQuery.trim(enableOnTop);
//  if (enableOnTop!='0') {
//       if (enableOnTop=='1') enableOnTop='.cwsFloatingContent_contentC';
//       if (enableOnTop=='2') enableOnTop='.cwsFloatingContent_headersC';
//       let e3=d1.find(enableOnTop);
//       if (e3.length>0)  d1.on('mouseup',{'enabled':enableOnTop},wsurvey.flContents.container.moveToForeground);
//  }

  if (escapeOrder.substr(0,1)!='n') {            // at least one container subject to esc
     let dtype=typeof(jQuery(document).data('wsfloatingcontent_escHandler'));
     if (dtype=='undefined')  {                                         // just do this once per session
            jQuery(document).data('wsfloatingcontent_escHandler',) ;  // could make this be an option
     }
     jQuery(document).keyup(escHandlerFunction) ; //  consider using  other escape handlers (i.e. ws_escapeHandler)function in more complex environments
   }


  wsurvey.flContents.container.createStyles(1)  ; // create default styles, if not already created (or custom one specified)

// done!
   return d1 ;  // the jquery object of this floatingContainer

 } ;  // end of create




//==========================
//  create (or convert) a floatingContent container! And set it up with content and header areas.
// This is the main function.
// It is placed here to allow access to 'container.create' -- the function that does the container setup stuff

wsurvey.flContents.create=function(aid,opts,status) {
   if (arguments.length<3) status={};

   var isNewDiv=0,isOverwrite=0 ;
   var stuff='';
   var thisClass='wsFloatingContent' ;

   d1=wsurvey.flContents.container.create(aid,opts,status) ;   // !!!!!! setup the floatingPoint container : check status for error

   if (d1===false) return false ;      // status message will pass through

   var wStatus=status['status'] ;
   if (wStatus=='create') isNewDiv=1;  // there are prior contents to deal with
   if (wStatus=='overwrite') isOverwrite=1;  // there are prior contents to deal with


// this checking/creation is also done in container.create. But do it here to skip calling container.create if the
// element has alrady been converted (say, with prior call to container.create)

// If here -- the floatingContent container is ready for further processing
  var d1All,priorRetain=0;
  if (isNewDiv==0) {              // an existing element was converted (or already was).. do something with the content
     if (isOverwrite!=1) d1All=d1.contents();  // don't bother if an overwrite
   }  else {
      priorRetain=-1 ; //  signals a new div, so no existing content to consider
   }
// read and fixup options (do not consider floatingContainer options dealt with a container.create()

   var classContent=wsurvey.findObjectDefault(opts,'classContent,contentClass,classCo','1',2);  // default is simple whitish background
   classContent=jQuery.trim(classContent);
   var classContentSay='';
   if (classContent!='') {
      let vindex=classContent.split(/[\s\,]+/g) ;
      for (var iv=0;iv<vindex.length;iv++) {
          aclass=jQuery.trim(vindex[iv]) ;
          if (aclass=='0') continue;
          if (aclass=='1') aclass='cwsFloatingContent_contentC'  ;
          if (aclass.toUpperCase()=='.THIN') aclass='cwsFloatingContent_contentThin';
          vindex[iv]=aclass;
      }
      if (vindex.length>0) classContentSay=vindex.join(' ');
   }
   var classHeader=wsurvey.findObjectDefault(opts,'classHeader,headerClass,classHe','1',2);  // default is simple whitish background
   classHeader=jQuery.trim(classHeader);
   var classHeaderSay='';
   if (classHeader!='') {
      let vindex=classHeader.split(/[\s\,]+/g) ;
      for (var iv=0;iv<vindex.length;iv++) {
          aclass=jQuery.trim(vindex[iv]) ;
          if (aclass=='0') continue;
          if (aclass=='1') aclass='cwsFloatingContent_headersC'  ;
          vindex[iv]=aclass;
      }
      if (vindex.length>0) classHeaderSay=vindex.join(' ');
   }


   var zIndex=wsurvey.findObjectDefault(opts,'zIndex,z-index',50,2) ;   //
   if (jQuery.trim(zIndex)!=='')  zIndex=parseInt(zIndex);

   var headerPerm=wsurvey.findObjectDefault(opts,'headerPerm,headersP,headerP,permH',' ',2);      //
   headerPerm=jQuery.trim(headerPerm);
   var headerCloser=wsurvey.findObjectDefault(opts,'headerCloser,headerCl,extraC',1,2);   //
   headerCloser=jQuery.trim(headerCloser);  if (headerCloser=='') headerCloser='0';
   var headerCloserSay='',xbutton,xtitle,xclass;
   if (headerCloser=='1') {     // default
        xbutton='x'; xtitle="Close this"; xclass='cwsFloatingContent_headerCloser';
   } else if (headerCloser!='0') {  // parse value,class, title (title can contain commas)
       let vv=headerCloser.split(',');
        xbutton=jQuery.trim(vv[0]);
       let xclass= (vv.length>1 && jQuery.trim(vv[1])!='') ?   jQuery.trim(vv[1]) :  'cwsFloatingContent_headerCloser';
       xtitle='Close this';
       if (vv.length>2) {
          let vv2=vv.slice(2);
          xtitle=jQuery.trim(vv2.join(','));
          if (xtitle=='') xtitle='Close this';
          xtitle = jQuery("<div/>").html(xtitle).text();  // strip out html tags
       }
   }
   if (headerCloser!='') headerCloserSay='<input type="button" value="'+xbutton+'" title="'+xtitle+'" onClick="wsurvey.flContents.container.close(this)" >';

   var showHistoryT=wsurvey.findObjectDefault(opts,'contentHistory_enable,showHis,contentHistory_en',0,2);
   showHistoryT=jQuery.trim(showHistoryT);
   showHistory=0;
   if (showHistoryT=='1' ) showHistory=1;
   var showHistorySay='';
   if (showHistory==1) {
     showHistorySay='<span name="wsFloatingContent_historyShow" class="cwsFloatingContent_historyShow"> ';
     showHistorySay+=' <input type="button"  xname="wsFloatingContent" value="&#9111;"  title="view prior message"  style="margin:3px 2px 3px 2px"  ';
     showHistorySay+='    onClick="wsurvey.flContents.showHistory(this,-1)"  > ';
     showHistorySay+=' <input type="button"  xname="wsFloatingContent" value="&#9112;"  title="view next message"  style="margin:3px 2px 3px 2px"   ';
     showHistorySay+='         onClick="wsurvey.flContents.showHistory(this,1)" > ';
     showHistorySay+='</span> ';
   }
   var historyFunc=wsurvey.findObjectDefault(opts,'contentHistory_func,contentHistory_fu',0,2);   //
   var historyFunc=jQuery.trim(historyFunc);
   if (historyFunc=='0') historyFunc='';  // add this to .data() of the flCOntent div
   if (historyFunc=='1') historyFunc='wsurvey.flContents.historyFuncDefault';

   var historyMethod=wsurvey.findObjectDefault(opts,'contentHistory_method,contentHistory_me','html',2);
   var historyMethod=jQuery.trim(historyMethod).toLowerCase() ;
   if (historyMethod!='dom') historyMethod='html';

   var showScroll=wsurvey.findObjectDefault(opts,'showScroll,showS',0,2);

   if (priorRetain!=-1) {       // -1 means "new element created". It won't have contents!
      priorRetain=wsurvey.findObjectDefault(opts,'priorRetain,priorR,priorC',0,2);      //
      priorRetain=jQuery.trim(priorRetain).toUpperCase();
      if (priorRetain.substr(0,1)=='C') priorRetain=1;
      if (priorRetain.substr(0,1)=='H') priorRetain=2;  // if iSoverwrite, this is NOT used
   }

/// options read ... start setting header and main areas

// first tweak the floatingContent container
   d1.addClass('wsFloatingContent_main');   // useful for identifcation .. doesn't do any formatting
   if (zIndex!='')   d1.css('z-index',zIndex);       // and the zindex

// now ready to add the header and content areas

//   stuff+=' <!-- a floatingContent container: used for various dynamic content --> ';
   if (classHeaderSay=='') {
      stuff+='  <div name="wsFloatingContent_headers" > ';
   } else {
      stuff+='  <div name="wsFloatingContent_headers" class="'+classHeaderSay+'"> ';
   }
   stuff+='    <span name="wsFloatingContent_headers_perm"  > ';
   stuff+=      headerCloserSay+' '+showHistorySay+' '+headerPerm ;
   if (showScroll!='0') {
      stuff+=' <span  style="float:right;margin:5px 1em 5px 5px" name="wsFloatingContent_navButtons" > ';
       stuff+='  <input  class="cwsFloatingContent_navbutton" type="button"  value="&#11161;"  title="scroll up &#013;rmb: top of view box&#013; Double click: several rows up"  data-todo="top"     oncontextmenu="return false;" > ';
       stuff+='  <input  class="cwsFloatingContent_navbutton"  type="button" value="&#11162;"  title="scroll right &#013;rmb: right border of view box,&#013; Double click: several spaces right"  data-todo="right"  oncontextmenu="return false;"  > ';
       stuff+='   <input  class="cwsFloatingContent_navbutton" type="button"  value="&#11163;"  title="scroll down &#013;rmb:  bottom of view box&#013; Double click: several rows down"   data-todo="bottom" oncontextmenu="return false;"  > ';
       stuff+='   <input class="cwsFloatingContent_navbutton"  type="button"  value="&#11160;"  title="scroll left &#013;rmb: left border of view box&#013; Double click: several spaces left"  data-todo="left"  style="margin-right:3em"  oncontextmenu="return false;"  > ';
      stuff+=' </span>  ' ;
   }
   stuff+='    </span>'
   stuff+='   <span   name="wsFloatingContent_headers_transient"> ';
   stuff+='        &nbsp; ';
   stuff+='   </span>  ';

   stuff+='<br clear="all" />';
   stuff+='  </div> ';

   if (isOverwrite==1) {     // this means that any "read from oritingal element"  stuff , used as header, is lost.
       let d1hh=d1.find('[name="wsFloatingContent_headers"]');
       if (d1hh.length>0) d1hh.remove();  // remove prior header area
   }

   d1.prepend(stuff)  ; // header row is the first!

// now the content section
  var cdiv='';

  cdiv+=' </div>  ';

  if (isOverwrite==1) {
        let d1hh=d1.find('[name="wsFloatingContent_content"]');
        d1hh.removeClass();
        if (classContentSay!='') d1hh.addClass(classContentSay);
  } else {
     if  (classContentSay!='') {
         cdiv+='<div name="wsFloatingContent_content" class="'+classContentSay+'"> ';
     } else {
         cdiv+='<div name="wsFloatingContent_content"  > ';
     }
     d1.append(cdiv)  ; // header row is the first, content comes after
  }


// what to do with prior stuff (if any).. note leave be if an ovewrite
  if (isOverwrite!=1)  {
    if (priorRetain==1  ) {
      let ed1=d1.find('[name="wsFloatingContent_content"]');
      ed1.append(d1All);
    }
    if (priorRetain==2) {
       let ed1=d1.find('[name="wsFloatingContent_headers"]');
       ed1.append(d1All);
    }
    if (priorRetain==0) {
       d1All.remove();
       let ed1=d1.find('[name="wsFloatingContent_content"]');
       ed1.append('<span style="opacity:0.3">Content can be written here! </span> '); // a "welcome" note
    }
  }  // isoverarite

// navigation buttons?
  if (showScroll!='0') {
      let navs=d1.find('[name="wsFloatingContent_navButtons"]');

      wsurvey.addEventIfNew(navs,'mousedown',wsurvey.flContents.container.navButtons,0);
  }   // isovewrite

// ontop buttons
 var enableOnTop=wsurvey.findObjectDefault(opts,'enableOnTop,enableOn',enableOnTop,2);
  enableOnTop=jQuery.trim(enableOnTop);
  if (enableOnTop!='0') {
       if (enableOnTop=='1') enableOnTop='.cwsFloatingContent_contentC';
       if (enableOnTop=='2') enableOnTop='.cwsFloatingContent_headersC';
       let e3=d1.find(enableOnTop);
       if (e3.length>0)  d1.on('mouseup',{'enabled':enableOnTop},wsurvey.flContents.container.moveToForeground);
  }

// content history enabled?   NOte saved to parent flCOntent, not to content area
// eMain.data('contentHistory') has indices
//  list: array containing list of dom objects with "prior" content
//  k1 : first index in list with an item. Starts at 0. Increases as history is trimmed (To save space)
//  k2:  index to place next item in. Same as list.length -- but only if k1=0. Note that most recent item saved is at k2-1
//  now : the most currewntly displayed history item. -2 : history disabled, -1 : history item NOT being displayed. Otherwise between k1 and k2-1

  let tchh;
  if (showHistory==1) {
      tchh={'list':{},'enable':1,'now':-1,'k1':0,'k2':0,'maxLength':1000,'func':historyFunc,'method':historyMethod};            // -1 means "not viewing a history item". Otherwise k1 ... k2-1
  } else {  // no history for this flContent
      tchh={'list':{},'enable':0,'now':-1,'k1':0,'k2':0,'maxLength':1000,'func':historyFunc,'method':historyMethod};  // -2 signals "not enabled"
  }
  d1.data('contentHistory',tchh);

  return d1 ;
}



//======================== return
// resize (or move) a wsFloatingContent container
// specs fields: 'top' : top of box (% or px, or em).
//              'left' : left of box (% or px, or em)
//              'width':  width of box (% of px, or em)
//              'height':  height of box (% of px, or em)
//              'latest' : 0 1 2 :  0- relative to original, 1 relative to latest, 2 reset to original
// specs =0 : return  current position {'left':currentLeft,'top':currentTop,'height':currentHeight,'width':currentWidth}
// specs ='L' : return  latest position {'left':currentLeft,'top':currentTop,'height':currentHeight,'width':currentWidth}
//  specs ={}  : return original
//   = 'R'   : restore to original size
// itest=1 : return where the positon would be after a more.

wsurvey.flContents.container.doResize=function(e1,specs,itest) {

    var cc,specsLatest,latestCurPos ;
    if (arguments.length<3) itest=0;


// find the floatingCOntent container -- if no such luck, return 0
   if (arguments.length<2)  {          // not specified, use the first container with a .wsFloatingContent class
      e1=jQuery('.wsFloatingContent');
      if (e1.length==0) return 0       ; // no such box, giveu p
      if (e1.length>0) e1=jQuery(e1[0]);  //  first element in this class
   }

// what container  to play with --- arg specified, or default found
   if (typeof(e1)=='string') {       // if string, try to find id that matches
        if (e1.substr(0,1)!='#') e1='#'+e1;
        let e2=jQuery(e1);
        if (e2.length ==0) {
            wsurvey.flContents.container.error('doResize error: no such id: '+e1);
            return 0;       // no such id
        }
        e1=jQuery(e2[0]) ;     // first element that matches
   } else {
       e1=wsurvey.argJquery(e1);
   }

   if (!(e1 instanceof jQuery))  return 0 ; // probabliy overkill
   if (!e1.hasClass('wsFloatingContent')) return 0 ;  // not a floatingContent container. give up

//  found the move box. get some attributes
   let origPos= e1.wsurvey_attrCi('data-wsfloatingcontent_positionoriginal',null);
   if (typeof(origPos)===null) {
      wsurvey.flContents.container.error('no data-wsFloatingContent_positionOriginal. '+e1.attr('id'));
      return 0;
   }

// get latest pos, which is set to original if this is first call  to doresize
   let latestPos= (typeof(e1.attr('data-wsfloatingcontent_positionlatest'))!='undefined') ?   e1.attr('data-wsfloatingcontent_positionlatest')  :   origPos ;

  var latestReset=0;
// special cases (return a position)
   if (!jQuery.isPlainObject(specs)  || jQuery.isEmptyObject(specs)  ) {
      if (jQuery.isPlainObject(specs) &&  jQuery.isEmptyObject(specs) ) specs='O';  // and empty object
      let s0=jQuery.trim(specs).toUpperCase();
      let s1=s0.substr(0,1);
      if (s1=='0' || s1=='C')  {       // get current position
          let awide=e1.width();
         let aheight=e1.height();
         let gooD1=e1.offset();                       // upper left of the alert box
         let atop=gooD1.top;
         let aleft=gooD1.left;
         let azindex=parseInt(e1.css('z-index'));
         let isvis =(e1.is(':visible')) ? 1  : 0 ;
         let info1={'top':atop,'left':aleft,'height':aheight,'width':awide, 'zIndex':azindex,0:awide,1:aheight,'visible':isvis};    // add zindex to list 28 Jan 2022
         return info1;
      }
      if (s1=='L' || s1=='O')  {       // get latest or origional position call
         let info1={'top':0,'left':0,'height':0,'width':0};
         let usePos= (s1=='L') ? latestPos : origPos ;
         let ccs=usePos.split(',');           // starting position is "originaL"
         jQuery.each(ccs,function(ii,vv) {                         // since we assubme  wsFloatingContent_positionOriginal  (or data-wsFloatingContent_positionLatest) is available and properly formatted
            let cc2=vv.split('=');
            let aspec=jQuery.trim(cc2[0]).toLowerCase();
            if (aspec=='pct' || aspec=='position') return  ;  // dealt with above
            if (typeof(info1[aspec])=='undefined' ) {             // should NEVER happen
               wsurvey.flContents.container.error('doResize: improper wsFloatingContent_positionOriginal attribute: '+aspec);
               qerr=true;
               return 0;
            }
            info1[aspec]=cc2[1];
         });
         return info1 ;
      }

      if (s1=='R' || s1=='B') {
         if (s1=='B') latestReset=1;
          specs={'left':'+0'} ;  // used below
      } else {
          return  0   ; // unsupported special call
      }

   }            // special calls


// found a move box. Get current "original" position (not necessarily the user changed one)

   specsLatest= (specs.hasOwnProperty('latest')) ? parseInt(specs['latest']) : 0 ; ; // 0=percent of origina, 1=percent of latest size.

   if (specsLatest==1) {
       cc=latestPos.split(',');      // starting position is "latest" (which might be the original, if this is first 'latest' call)
   } else {
       if (specsLatest==2) {
          e1.attr('data-wsfloatingcontent_positionlatest',origPos);  // reset "latest" position (back to original)
       }
       cc=origPos.split(',');           // starting position is "originaL"
   }



   var info1={'top':0,'left':0,'height':0,'width':0};
   jQuery.each(cc,function(ii,vv) {  // parse out "base position" (original or latest)
       let cc2=vv.split('=');
       let aspec=jQuery.trim(cc2[0]).toLowerCase();
       if (aspec=='position') return  ; // ignore this one
       if (typeof(info1[aspec])=='undefined' ) {             // should NEVER happen
             wsurvey.flContents.container.error('doResize: improper resize attribute: '+aspec);
             return 0;
       }
       let acc2=parseInt(cc2[1]);
       info1[aspec]=[acc2,acc2] ;    // [startPos,postMovePos] , using origional or latest
   });

   for (let aspec in specs) {                // what are the change?
       let aspecC=jQuery.trim(aspec).toLowerCase();
       if (typeof(info1[aspecC])=='undefined') continue ;  // ignore if unknown speci
       let newval=jQuery.trim(specs[aspecC]);
       newvalUse= wsurvey.flContents.container.toPx_resize(newval,aspecC,info1) ;
       info1[aspecC][1]=newvalUse   ;
  }

  let stuff={'position':'fixed'};
  for (aspec0 in info1) {
        stuff[aspec0]=info1[aspec0][1]+'px';  // the new value
   }
   if (itest==1) return info1 ;   // NOT a just compute

   e1.css(stuff);
   if (latestReset==1 || specsLatest!=0) {

         let thelatest=[];
         for (let arf in stuff) thelatest.push(arf+'='+stuff[arf]);
         let thelatestSay=thelatest.join(',');
         e1.attr('data-wsfloatingcontent_positionlatest',thelatestSay);
   }
   return info1 ;

 }   ;  // end of doresize


//----------------
// function to compute new px size given old size and a change
// called by  wsurvey.flContents.container.doResize
wsurvey.flContents.container.toPx_resize=function(newval,aspec,info1) {
  let ischange=0,  dasize;
   let bodyFontSize=jQuery("body").css('font-size');
   let awidth=jQuery(window).width(),aheight=jQuery(window).height();

   let newvalUse;

 let aspecC=jQuery.trim(aspec).toLowerCase();

  if (newval.substr(0,1)=='-') {       // no + or - means use window height, not contaier height
     ischange=-1 ;
     newval=newval.substr(1);
  } else if (newval.substr(0,1)=='+') {
     ischange=1;
     newval=newval.substr(1);
  }
  if (aspecC=='height' || aspecC=='top') {
     dasize= (ischange==0) ? aheight : info1[aspecC][0] ;  // use the old height?
  } else  {
     dasize= (ischange==0) ? awidth : info1[aspecC][0] ;  // use the old width?
  }

 let newval2=wsurvey.toPx(newval,dasize,bodyFontSize) ;
  if (isNaN(newval2)) return  info1[aspecC][0];

  if (ischange!=0) {       // if not a number retaincurren value (as initialize above)
       newval3=info1[aspecC][1]+ (ischange*newval2);
 } else {
       newval3= newval2;
 }
 return newval3;
 }   ;  // end of toPxResize






//=======
// initialize move button(s)
wsurvey.flContents.container.startMove=function(athis) {

   var boxid, firstMouseX,firstMouseY, nowMouseX, nowMouseY, startingAtX, startingAtY ;
   var jqobj,ovars, tmpx, tmpy,apos,foo,goo,stuff;
   var innerWidthW, innerHeightW ;

   var ethis=wsurvey.argJquery(athis);
   var eparent=ethis.closest('.wsFloatingContent');

   ovars=eparent.data('wsFloatingContent_vars');

    tmpx=athis.pageX  ;  tmpy=athis.pageY ;

    firstMouseX= tmpx;  firstMouseY= tmpy ;
    nowMouseX= tmpx;  nowMouseY= tmpy ;

    startingAtX=eparent.css('left');
    startingAtY=eparent.css('top');

   innerWidthW=jQuery(window).innerWidth();
   innerHeightW=jQuery(window).innerHeight();

    if ( startingAtX.indexOf('%')>-1) {                    // % (not px)
           startingAtX=parseInt(parseInt( startingAtX)*innerWidthW/100) ;
    }   else {
        if ( startingAtX=='')  startingAtX= firstMouseX ;
        startingAtX=parseInt( startingAtX);
    }
    if ( startingAtY.indexOf('%')>-1) {
           startingAtY=parseInt(parseInt( startingAtY)*innerHeightW/100) ;
    }   else {
        if ( startingAtY=='')  startingAtY= firstMouseY ;
         startingAtY=parseInt( startingAtY);
    }

   ovars._firstMouseX=firstMouseX;ovars._firstMouseY=firstMouseY;
   ovars._nowMouseX=nowMouseX,ovars._nowMouseY=nowMouseY
   ovars._startingAtX=startingAtX,ovars._startingAtY=startingAtY;
   eparent.data('wsFloatingContent_vars',ovars);

  jQuery(':root').on('mouseup',{'stuff':eparent},wsurvey.flContents.container.XYatEnd);   // mouseup or mousemove AFTER clicking this will invoke these handlers (anywere in docuhemt0
  jQuery(':root').on('mousemove',{'stuff':eparent},wsurvey.flContents.container.XYMove);
  return 0;
}         ;     // end of startmove

//=================================
//  moves container after a mouse move (_boxid is global). Note use of event passed by jquery 'mouse move" handler (that contains x and y position)
wsurvey.flContents.container.XYMove=function(e) {
 var t1,t2,dx,dy,tmpx,tmpy;
 var nowMouseX,nowMouseY,firstMouseX,firstMouseY,startingAtX,startingAtY;
 var ovars,jqobj;

 jqobj=e.data.stuff ; ovars=jqobj.data('wsFloatingContent_vars');                          // retrieve pointer to jquery object of the floatingContent container, and extract location data

 jqobj.addClass('cwsFloatingContent_noSelect ');

 nowMouseX=ovars._nowMouseX ; nowMouseY=ovars._nowMouseY ;
 tmpx=e.pageX  ; tmpy=e.pageY ;

 if (Math.abs(tmpx-nowMouseX)<3 && Math.abs(tmpy-nowMouseY)<3) return 0 ; // small move, ignore

 firstMouseX=ovars._firstMouseX ; firstMouseY=ovars._firstMouseY ;            // get location of "first mouse click"  (which might be anywhere)
 startingAtX=ovars._startingAtX ; startingAtY=ovars._startingAtY ;             // get location of original left corner of floatingContent container

  dx=tmpx-firstMouseX ;                                                       // the displacement of current location to first moust click
  dy=tmpy-firstMouseY ;

  t1=(startingAtX +dx);                                                           // position set using original corner, and the displacement
     jqobj.css('left',t1);
  t2=(startingAtY+dy);
     jqobj.css('top',t2);

  ovars._nowMouseX =tmpx ;   ovars._nowMouseY =tmpy ;        // save location of "last time location queried"
  jqobj.data('wsFloatingContent_vars',ovars);

  return 0;
}          ;     // end of xymove


//=================================
// on mouse up, at the end of a move or a resize, release the mouseup and mousemove events handlers from the document
// if I was clever, I would reestablish a prior mouseup and mousemove (that may have beem overwritten by startMove...
wsurvey.flContents.container.XYatEnd=function(e) {
   var jqobj=e.data.stuff ;
    var oof=jqobj.data('wsFloatingContent_vars');
   jqobj.removeClass('cwsFloatingContent_noSelect ');
  jQuery(':root').off('mouseup mousemove');
  return 0;
}      ;     // end of XYatEnd

//==============================
// resize button
wsurvey.flContents.container.startResize=function(e) {

  var apos,foo,tmpx,tmpy,jqobj,ovars;
  var innerWidthW,innerHeightW;
  var firstRMouseX,firstRMoustY,nowRMouseX,nowRMouseY,startingRAtX,startingRAtY,startingAtW,startingAtH,rwhere;
  var jqobj=wsurvey.argJquery(e);

  tmpx=e.pageX  ; tmpy=e.pageY ;
  ethis=wsurvey.argJquery(e);


  jqobj=e.data.stuff ;     // the jquery object
  ovars=jqobj.data('wsFloatingContent_vars');
  rwhere=ethis.attr('data-dir');

  innerWidthW=jQuery(window).innerWidth();
  innerHeightW=jQuery(window).innerHeight();

  firstRMouseX=tmpx;  firstRMouseY=tmpy ;
  nowRMouseX=tmpx;  nowRMouseY=tmpy ;

  startingRAtX=jqobj.css('left');
  startingRAtY=jqobj.css('top');

  if (startingRAtX.indexOf('%')>-1) {                    // % (not px)
        startingRAtX=parseInt(parseInt(startingRAtX)*innerWidthW/100) ;
    }   else {
        if (startingRAtX=='') startingRAtX=firstRMouseX ;
       startingRAtX=parseInt(startingRAtX);
    }
    if (startingRAtY.indexOf('%')>-1) {
          startingRAtY=parseInt(parseInt(startingRAtY)*innerHeightW/100) ;
    }   else {
        if (startingRAtY=='') startingRAtY=firstRMouseY ;
        startingRAtY=parseInt(startingRAtY);
    }

   startingAtH=jqobj.css('height');
         if (startingAtH=='') startingAtH='15%' ; // an arbitrary value
   startingAtW=jqobj.css('width');
         if (startingAtW=='') startingAtW='55%' ; // an arbitrary value
    if (startingAtH.indexOf('%')>-1) {                    // % (not px)
          startingAtH=parseInt(parseInt(startingAtH)*innerHeightW/100) ;
    }   else {
       startingAtH=parseInt(startingAtH);
    }
    if (startingAtW.indexOf('%')>-1) {
          startingAtW=parseInt(parseInt(startingAtW)*innerWidthW/100) ;
    }   else {
        startingAtW=parseInt(startingAtW);
    }

   ovars._firstRMouseX=firstRMouseX;ovars._firstRMouseY=firstRMouseY;
   ovars._nowRMouseX=nowRMouseX,ovars._nowRMouseY=nowRMouseY
   ovars._startingRAtX=startingRAtX,ovars._startingRAtY=startingRAtY;
   ovars._startingAtW=startingAtW,ovars._startingAtH=startingAtH;
   ovars._resizeWhere=rwhere ;
   jqobj.data('wsFloatingContent_vars',ovars);

  jQuery(':root').on('mouseup',{'stuff':jqobj},wsurvey.flContents.container.XYatEnd);   // mouseup or mousemove AFTER clicking this will invoke these handlers (anywere in docuhemt0
  jQuery(':root').on('mousemove',{'stuff':jqobj},wsurvey.flContents.container.XYResize);


  return 0;
}       ;     // end of startResize



//=================================
// resizes or moves container after a mouse move (_boxid is global)
// resizeWhere=SE -- resize moves se corner of contiaer to  (or away) from se corner of screen
// otherwise, towards ne corner
wsurvey.flContents.container.XYResize=function(e) {

  var t1,t2,dx,dy,tmpx,tmpy,endHeight,endWidth;
  var firstRMouseX,firstRMoustY,nowRMouseX,nowRMouseY,startingRAtX,startingRAtY,startingAtW,startingAtH;
  var jqobj,ovars,resizeWhere2;
  jqobj=e.data.stuff ;
  ovars=jqobj.data('wsFloatingContent_vars');
  resizeWhere2=ovars._resizeWhere;

  nowRMouseX=ovars._nowRMouseX ;  nowRMouseY=ovars._nowRMouseY ;


  tmpx=e.pageX  ; tmpy=e.pageY ;
  if (Math.abs(tmpx-nowRMouseX)<3 && Math.abs(tmpy-nowRMouseY)<3) return 0 ; // small move, ignore

  nowRMouseX=tmpx; nowRMouseY=tmpy  ;

 firstRMouseX=ovars._firstRMouseX ; firstRMouseY=ovars._firstRMouseY ;            // get location of "first mouse click"  (which might be anywhere)
 startingRAtX=ovars._startingRAtX ; startingRAtY=ovars._startingRAtY ;             // get location of original left corner of floatingContent container
 startingAtH=ovars._startingAtH ; startingAtW=ovars._startingAtW ;             // get location of original left corner of floatingContent container

  dx=parseInt(nowRMouseX)-parseInt(firstRMouseX) ;
  dy=parseInt(nowRMouseY)-parseInt(firstRMouseY) ;        // else, move it by dx and dy where it was a click

  if (resizeWhere2=='SE') {
       endHeight=parseInt(startingAtH)+dy;
       endWidth=parseInt(startingAtW)+dx;

  } else if (resizeWhere2=='NW') {
    endHeight=parseInt(startingAtH)-dy;
    endWidth=parseInt(startingAtW)-dx;
    t2=parseInt(startingRAtY)+dy;    // move up (-dy moves up).But don't move x location of upper left corrner (ULC)
    jqobj.css('top',t2);
    t2=parseInt(startingRAtX)+dx;    // move up (-dy moves up).But don't move x location of upper left corrner (ULC)
    jqobj.css('left',t2);

  } else if (resizeWhere2=='SW') {
    endHeight=parseInt(startingAtH)+dy;
    endWidth=parseInt(startingAtW)-dx;
//    t2=parseInt(startingRAtY)-dy;    // move up (-dy moves up).But don't move x location of upper left corrner (ULC)
//    jqobj.css('top',t2);
    t2=parseInt(startingRAtX)+dx;    // move up (-dy moves up).But don't move x location of upper left corrner (ULC)
    jqobj.css('left',t2);


  } else {                                             // default is NE (move upper right corner toward NE
    t2=parseInt(startingRAtY)+dy;    // move up (-dy moves up).But don't move x location of upper left corrner (ULC)
    jqobj.css('top',t2);
    endHeight=parseInt(startingAtH)-dy;
    endWidth=parseInt(startingAtW)+dx;
  }

//    endHeight=parseInt(startingAtH)-dy;

    jqobj.css('height',endHeight);
    jqobj.css('width',endWidth);

  ovars._nowMouseX =tmpx ;   ovars._nowMouseY =tmpy ;        // save location of "last time location queried"
  jqobj.data('wsFloatingContent_vars',ovars);


return 0;
}          ;     // end of XYResize

//============
// change z index
// one arg mode: called as event manager (the setZindex button
// 2 args: e=is jquery object, or string pointing to,
//  idire: 1: move to foreground (of wsFloatingContent containers), -1: move tobackground
// Caution:  wsFloatingContent containers that are inside of different containers don't get moved relative to each other.
//    THus: wsFloatingContent containers should always be direct children of the document
wsurvey.flContents.container.setZindex=function(e,idire) {
   var atmp,tmp,ii,avals=[],minZind=11111111111; maxZind=-11111111111111  ;
   var e1,e2,newZind,idire;

   if (arguments.length<2) {
     if (typeof(e)=='string') {
         idire=1;
     } else  {
         idire=e.data['dire'];
     }
   }

   if (arguments.length>1) {
       if (typeof(e)=='string')  {
           if (e.substr(0,1)!='#' ) e='#'+e;
           e2=jQuery(e);
           if (!e2.hasClass('wsFloatingContent')) {
               wsurvey.flContents.container.error('setZindex error: container ('+e+') is not a move box');
               return 0;
           }
       } else {
           e2=wsurvey.argJquery(e);
       }

   } else {     // event handler of the BUTTON (not the floatingContent container) call (i.e. onclick="wsurvey.flContents.container.setZindex(this)"
       e1=wsurvey.argJquery(e);
       e2=e1.closest('.wsFloatingContent');
   }

   tmp=jQuery('.wsFloatingContent');

   for (ii=0;ii<tmp.length;ii++) {
        atmp=jQuery(tmp[ii]);
        zind =atmp.css('z-index');    // css also looks at stylesheets
        if (isNaN(zind) || zind=='' ) {
            zind=0;
            atmp.css({'zindex':1});
        }
        zind=parseInt(zind);
        avals.push(zind)  ;
        maxZind=Math.max(maxZind,zind);
        minZind=Math.min(minZind,zind);
   }
   if (idire==1) {
       newZind=maxZind+1;
       if (newZind<2) newZind=2;
       e2.css({'z-index':newZind});
   } else {
       newZind=Math.max(0,minZind-1) ;
       e2.css({'z-index':newZind});
   }


  return false ;

}         ;     // end of setZindex

//============ a synonym
wsurvey.flContents.onTop=wsurvey.flContents.container.setZindex ;

//============
// move to forwecround  -- used as an event handler for buttons INSIDE of a flContent.
// See    wsurvey.flContents.container.setZindex onr wsurvey.flContents.container.onTop if flContent container element is available

wsurvey.flContents.container.moveToForeground=function(evt) {
   var e1=wsurvey.argJquery(evt,'delegateTarget');
   var e1b=wsurvey.argJquery(evt,'target');

   if (e1b.hasClass('wsFloatingContent_control')) return 0;  // contorl buttons are ignored
   var enabledCheck=evt.data.enabled ;
   let qq=e1b.filter(enabledCheck);
   if (qq.length==0) {             // but maybe a parent?
       let qq2=e1b.closest(enabledCheck);
       if (qq2.length==0) return 0;
   }

   if (!e1.hasClass('wsFloatingContent')) {
      e2=e1.closest('.wsFloatingContent');
   } else {
      e2=e1;
   }

   wsurvey.flContents.container.setZindex(e2,1)    ;
}

// ------------------------
// toggle to fullish scrren
//       aobject1['height']='94%' ;       aobject1['width']='94%' ;
//       aobject1['xoff']='2%' ;       aobject1['yoff']='2%' ;
// 20 march 2020:
//   ido to force expand or unexpand. (1=expand,0=unexpand). e should be a wsFloatingContent     object (with a wsFloatingContent   class
//   if  ido specified, e should  be the jquery object of the wsFloatingContent container to be "expanded"

wsurvey.flContents.container.doExpand=function(e,ido) {
  var e2,edata,iexpand,eparent,arf,doExpand=1,jqobj ;

  if (arguments.length>1) {
     if (typeof(e)=='string')  {
          let e2a=e.substr(0,1);
          if (e2a!='#') e='#'+e;
            jqobj=jQuery(e);
          if (jqobj.length!=1) {
              wsurvey.flContents.container.error('doExpand error: unable to find: '+e2);
              return 0;
          }
     }   else {
         jqobj=wsurvey.argJquery(e);
     }
     ido=jQuery.trim(ido);
     let ido1=ido.substr(0,1);
     if (ido1=='1' || ido1=='e') doExpand=1;  // not necessary, since 1 is the default. but wth
     if (ido1=='0' || ido1=='s') doExpand=0;
     if (ido1=='2' || ido1=='t')  doExpand= (jqobj.hasClass('cwsFloatingContent_expandMe')) ? 0  : 1 ;
     e2=jqobj.find('[name="wsFloatingContent_expander"]');  // the button
     eparent=wsurvey.flContents.closest(jqobj);    ;

  }   else {       // 1 argument

     e2=wsurvey.argJquery(e);
     eparent=e2.closest('.wsFloatingContent');
     iexpand=e2.attr('data-expanded');
     if (iexpand==1) doExpand=0;         // toggle!
  }

    if (doExpand==1 ) {         // expand it!
        eparent.addClass('cwsFloatingContent_expandMe');
        e2.attr('data-expanded','1');
        if (arguments.length<2) e2.attr('title','Toggle:   to most recent (non-full) size ');
        e2.val('\u25a3');   // shrink button
    } else {
        eparent.removeClass('cwsFloatingContent_expandMe ');
        e2.attr('data-expanded','0');
        if (arguments.length<2) e2.attr('title','Toggle: to full view ');
        e2.val('\ud83d\udd33');  // expand button
    }
    return 1;
}          ;     // end of doExpand

//===========
// call a show in new window functin (actually, it can do anything with content

wsurvey.flContents.container.callFunc=function(e) {
   var e1,acontent,afunc,e2;
   e1=wsurvey.argJquery(e);
   afunc=e1.attr('data-func');
   if (typeof(window[afunc])!='function') {
      let zz2=zz.join(', ');
      wsurvey.flContents.container.error('callFunc error: no such function: '+afunc+'.\n Called from: '+zz2);
      return 0;
   }
   e2=e1.closest('.wsFloatingContent');
   if (e2.length==0) {           // should never happen
      let zz2=zz.join(', ');
      wsurvey.flContents.container.error('callFunc error: no parent element that is a wsFloatingContent container. Attempting to use '+afunc+'. Called from:  '+zz2c);
   }
   let aother=e1.wsurvey_attrCi('data-other'  );
   if (aother==null)  {
        window[afunc](e2);
    } else {
        window[afunc](e2,aother);
    }
}          ;     // end of callFunc

//====================
// toggle view of the floatingConteont container's control buttons (resize, maximize, close, etc). This is the small circle button hander
wsurvey.flContents.container.controlButtons=function(athis,whatdo) {
  var ethis,e2,e3;
  if (arguments.length>1)  {                 // explicit task, athis is jquery object of the container   (a container with a class of wsFloatingContent
      whatdo=jQuery.trim(whatdo.toUpperCase());
      e2=athis.find('.cwsFloatingContent_controlButtonsNE');
  } else {
      whatdo='';
      ethis=wsurvey.argJquery(athis) ;
      e2=ethis.closest('.cwsFloatingContent_controlButtonsNE');
  }
  e3=e2.find('.wsFloatingContent_flag_canHide');     // which of these buttons (in the NE corner control button span, can be toggled?

  if (whatdo=='') {
       whatdo='SHOW';
       if (e3.is(':visible')) whatdo='HIDE';
  }

   if (whatdo=='HIDE') {
       e3.hide()
   } else {
      e3.show();
   }
   return 1;
}               ;     // end of buttons

///============
// return html string describingh wsFloatingContent containers controls
// optional first argument: string used for the 'move box"  "iconMove" icon. For example:  '&#9995;' (a yellow palm). Default is '&#9769;'
// OR: a "this"  or evt  (used to find what floatingContenr container the  "show tips" button was clicked -- hence where to display the tips
wsurvey.flContents.container.desc=function(athis) {
  var eh,e1,mess='',e0,eh2;
   if (arguments.length<1) athis='&#9995;';

  if (typeof(athis)=='string') {           // get all tips (with custom iconMove)  -- return as string (perhaps for custom display)
    mess+='<em>floatingContent containers</em> are used to display a variety of content. ';
    mess+='  These <tt>display containers</tt> can be manipulated by you, the end user,';
    mess+='    in a number of ways -- by clicking (or clicking and dragging) on buttons displayed in the corners! The possible actions include:';
    mess+='';
    mess+='<ul class="cwsFloatingContent_tipsUl" >';
    mess+='  <li><span style="cursor:move;border:1px solid black">'+athis+' </span> &nbsp; move the floatingContent... click, hold the mouse button down, move, and release.';
    mess+=' For some floatingContent, you can also click-hold-move on the <span  style="cursor: move;background-color:#dbdbab;border:1px dotted gray">top border</span> ';
    mess+='  <li><span style="cursor: pointer;" >&#9195; </span> move the floatingContent to the foreground. Or right-mouse-click to move to the background. ';
    mess+=' ';
    mess+='  <li><span style="cursor: pointer;" >&#128307; </span>  expand the floatingContent to cover most of the window. Click again to restore to prior size.  ';
    mess+=' ';
    mess+='  <li><span style="cursor: pointer;border:1px solid black"> &neArr; (or other)  </span>&nbsp;  display the contents of the floatingContent in a new window';
    mess+='  <li><span style="cursor: pointer;border:1px solid black"> &Chi;  </span>&nbsp;  hide the floatingContent';
    mess+='  <li><span style="cursor: ne-resize;border:1px solid black"> &nearr; </span>&nbsp;  expand the floatingContent .. click, hold the mouse button down, move (to resize in that direction), and release';
    mess+='<br> the &searr;, &swarr;, and &nwarr; buttons can be used in similar fashion.    ';

    mess+='<li><span style="cursor: pointer;border:1px solid black" >&#65377;</span> toggle view of the floatingContent control buttons. Click it again to re-display the buttons. ';

    mess+='<li><span  style="font-size:100%" class="cwsFloatingContent_restoreSizeButton" >&#10561;</span>Restore the floatingContent to its origional size and position.';
    mess+='<li><span  style="font-size:100%" class="cwsFloatingContent_tipsButton" >&#8505;</span> Display these tips.';

    mess+='  <li>If you hit the <tt>Esc</tt> key, these boxes will be hidden one-at-a-time.';
    mess+='</ul> ';
    return mess;
  }

// otherwise, write customized tip at top of the current floatingContent container

  e0=wsurvey.argJquery(athis) ;
  if (e0.length==0 ) {
         wsurvey.flContents.container.error('desc: not a qQueryable element (??!!) ');
         return 1;
  }
  e1=e0.closest('.wsFloatingContent')     ; // the parent of this button
  if (e1.length==0) {
         wsurvey.flContents.container.error('desc: not a FloatingContent container! ');
         return 1;
  }

  mess='';
  eh=e1.find('[name="wsFloatingContent_desc_area"]');   // from a prior desc click:
  if (eh.length==0) {        // no such area -- add it to top of floatingCOntent container
     mess+='<div name="wsFloatingContent_desc_area" class="cwsFloatingContent_desc"> ' ;
     mess+='<input type="button" style="font-size:80%;border-radius:3px" value="x" title="Close these floatingContent tips" onClick="wsurvey.flContents.container.desc(this)"> ';
  } else {                   // box exists .. no need to create (just show or hide)
     if (eh.is(':visible')) {
         eh.hide();
         return 0;
     } else {
        eh.show()
         return 2;
     }
  }

  let aid=e1.attr('id');

// arent being displayed. Created customized tips
  mess+='<span title="Such as this floatingContent container: '+aid+'" style="border-bottom:1px dotted blue;font-style:oblique">floatingContent containers</span> are used to display a variety of content. ';
  mess+='  These <tt>display containers</tt> can be manipulated by you, the end user,';
  mess+='    in a number of ways -- by clicking (or clicking and dragging) on buttons displayed in the corners!';
  mess+='';

  mess+='<div name="wsFloatingContent_headers_ulOuter" style="border:1px dotted brown;margin:5px 2% 5px 3%">'  ;
  mess+='<ul class="cwsFloatingContent_tipsUl" >';

  let eResize=e1.find('[name="wsFloatingContent_resizeButton"]')
   let iconM=$(eResize[0]).attr('arf');
   if (eResize.length>0)  mess+='  <li><span style="cursor:move;border:1px solid black">'+iconM+' </span> &nbsp; resize the container (from any corner)... click, hold the mouse button down, resize, and release.';

  let emove=e1.find('[name="wsFloatingContent_moveButton"]')
   let icon1=$(emove[0]).attr('arf');
   if (emove.length>0)  mess+='  <li><span style="cursor:move;border:1px solid black">'+icon1+' </span> &nbsp; move the container... click, hold the mouse button down, move, and release.';

  let emoveBar=e1.find('.cwsFloatingContent_topBar') ;
  if (emoveBar.length>0)           mess+=' You can also click-hold-move on the <span  style="cursor: move;background-color:#dbdbab;border:1px dotted gray">top border</span> ';

  let emoveZ=e1.find('.cwsFloatingContent_zindexUp') ;
  if (emoveZ.length>0)    mess+='  <li><span style="cursor: pointer;" >&#9195; </span> move the floatingContent to the foreground. Or right-mouse-click to move to the background. ';

  let emoveX=e1.find('.cwsFloatingContent_expandThisButton') ;
  if (emoveX.length>0)     mess+='  <li><span style="cursor: pointer;" >&#128307; </span>  expand the floatingContent to cover most of the window. Click again to restore to prior size.  ';

  let emoveF=e1.find('.cwsFloatingContent_callFunc') ;
  if (emoveF.length>0)   {
        let say1=emoveF.attr('title');
        let aicon=emoveF.val();
        mess+='  <li><span style="cursor: pointer;border:1px solid black"> '+aicon+' </span>&nbsp; '+say1 ;
  }

  mess+=' ';

  let emoveCl=e1.find('.wsFloatingContent_flag_closerIcon') ;
  if (emoveCl.length>0)  mess+='  <li><span class="cwsFloatingContent_smallButton " style="cursor: pointer;border:1px solid black"> X </span>&nbsp;  hide this container';


  let emoveBv=e1.find('.wsFloatingContent_buttonViewIcon') ;
  if (emoveCl.length>0)   mess+='<li><span style="cursor: pointer;border:1px solid black" >&#65377;</span> Toggle view of the floatingContent control buttons. Click it again to re-display the buttons. ';

  let emoveRestore=e1.find('.wsFloatingContent_restoreSizeButton') ;
  if (emoveRestore.length>0)     mess+='  <li><span  style="font-size:100%" class="wsFloatingContent_restoreSizeButton" >&#10561;</span>Restore the floatingContentox to its origional size and position.';

  let emoveTip=e1.find('.cwsFloatingContent_tipsButton') ;
  if (emoveTip.length>0)     mess+='<li><span  style="font-size:100%" class="cwsFloatingContent_tipsButton" >&#8505;</span> Display these tips.';

  let emoveEsc=e1.attr('escIndex') ;
  if (typeof(emoveEsc)!=='undefined')   mess+='  <li>If you hit the <tt>Esc</tt> key, these floatingContent `boxes` will be hidden one-at-a-time.';

  mess+='</ul></div> ';  // the ul  and wsFloatingContent_headers_ulOuter

  mess+='</div>';        // wsFloatingContent_desc_area

  e1.prepend(mess);

  eh.show();

  return 1;

}           ;     // end of desc

//=======================
// hide the floatingCOntent container that is the parent of the clicked button
// 2 arg mode is semi-deprecatedL explicit call to "hide this container"   -- use flContents.hide()

wsurvey.flContents.container.close=function(athis,anaction) {
  var eaa,ethis;
  if (arguments.length==1) {        // event handler
     ethis=wsurvey.argJquery(athis);
     var eea=ethis.closest('.wsFloatingContent');     // close its parent floatingConteint container
     if (eea.length>0) eea.hide();    // but only if one exists
     return 1;
  }

// else, this is a function call
  if (typeof(athis)=='string') {
      if (athis.substr(0,1)!='#') athis='#'+athis;
      eaa=jQuery(athis);
  } else {
     eaa=wsurvey.argJquery(athis);      // direct pointer to the container to be closed
  }
   if (!eaa.hasClass('wsFloatingContent')) {
       wsurvey.flContents.container.error("The element being closed is NOT a floatingContent container",0);
      return 0;
   }
   anaction=jQuery.trim(anaction).toLowerCase();
   let s1=anaction.substr(0,1);

   if (s1=='o' || s1=='s' || s1=='1') {
       eaa.show();
       return 1;
   }
   if (s1=='h' || s1=='0') {
       eaa.hide();
       return 1;
   }
   if (s1=='t') {
       eaa.toggle();
       let qq=eaa.is(':visible');
       if (qq) return 1;
       return 0;
   }
   if (s1=='c') {       // close will reset things to normal before hiddint
       wsurvey.flContents.container.doExpand(eaa,0);   // unexpand
        wsurvey.flContents.container.controlButtons(eaa,'SHOW') ;  // unhide the several actions button (in ne corner)
       eaa.hide();
       return 1;
   }
   if (s1=='v') {
       let qq=eaa.is(':visible');
       if (qq) return 1;
       return 0;
   }
   return false ; //
}

wsurvey.flContents.container.restoreOriginalSize=function(athis) {
     var ethis=wsurvey.argJquery(athis);
     var eea=ethis.closest('.wsFloatingContent');
     var origStuff=eea.attr('data-wsfloatingcontent_positionoriginal') ;

     let aa2=origStuff.split(',');
     let ccdo={};
     for (var jj=0;jj<aa2.length;jj++) {
         let a1=aa2[jj];
         let v2=a1.split('=');
         let aarg=v2[0],aval=v2[1] ;
         ccdo[aarg] =parseInt(aval)+'px' ;
     }
     eea.css(ccdo);
}

//=========
// navbutton scrolling of conttent area

wsurvey.flContents.container.navButtons=function(e) {
   var e1,eparent,e2;
   var snow,snow2,jheight,jwidth,awhat,ikey,jtime,mmult=1,tepx,Ltime,nowtime;
   var pxMove=10 ;             // size of up/donwn/left/rignt shift (in px)


   e1=wsurvey.argJquery(e);
   if (!e1.hasClass('cwsFloatingContent_navbutton')) return 1 ; //  might of bubbled up to this?

   nowtime= new Date().getTime() ;  // use to detect double click
   awhat=e1.attr('data-todo'); // direction
   ikey=e.which;          // lmb or rmb?

   LTime=0;          // is this a double click (javascript built in javascript is too flakey
   var dattr=e1.attr('lastclicktime');
   if (typeof dattr !== typeof undefined && dattr !== false) LTime=dattr;
   teps=Math.max(0,nowtime-LTime);
   if (teps<250) mmult=15  ;   // double click: 5x move (500 millisctones
   e1.attr('lastclicktime',nowtime);
  
   eparent=e1.closest('.wsFloatingContent');

   e2=eparent.find('[name="wsFloatingContent_content"]');

   if (awhat=='top')   {
      if (ikey==3) {
         e2.scrollTop(0);
         return 1;
      }
      snow=e2.scrollTop();
      snow2=Math.max(0,snow-(mmult*pxMove) );
      e2.scrollTop(snow2);
      return 1 ;

  } else if (awhat=='bottom') {
      jheight=e2[0].scrollHeight;
      if (ikey==3) {
         e2.scrollTop(Math.max(30,jheight-50));
         return 1;
      }
      snow=e2.scrollTop();
      snow2=Math.min(jheight,snow+(mmult*pxMove) );
      e2.scrollTop(snow2);
      return 1 ;

  } else if (awhat=='left') {
      if (ikey==3) {
         e2.scrollLeft(0);
         return 1;
      }
     jwidth=e2[0].scrollWidth;
      snow=e2.scrollLeft();
      snow2=Math.max(0,snow-(mmult*pxMove) );
      e2.scrollLeft(snow2);
      return 1 ;


  } else if (awhat=='right') {
      jwidth=e2[0].scrollWidth;
      if (ikey==3) {
         e2.scrollLeft(Math.max(30,jwidth-50));
         return 1;
      }
      snow=e2.scrollLeft();
      snow2=Math.min(jwidth,snow+(mmult*pxMove) );
      e2.scrollLeft(snow2);
      return 1 ;

  } else {
      wsurvey.flContents.container.error('wsurvey.flContents.container.navButtons: '+awhat,1);  // fatal coding error
  }
  return 1;

}

//=====================
// return list of current floatingContent containers
// if  complete=0, all. complete=1, only complete, 2 : simple only
wsurvey.flContents.container.list=function(complete) {
   if (arguments.length<1) complete=0;
   let ee=jQuery('.wsFloatingContent');
   if (ee.length==0) return  ee;   // none found  , so complete doesn't matter
   complete=jQuery.trim(complete).toLowerCase();
   let comp1=complete.substr(0,1);

   if (complete=='0' || comp1=='a') return ee ;
   if (complete=='1' || comp1=='c')  {
       let ee2=ee.filter('.wsFloatingContent_main');
       return ee2;
   }
   if (complete=='2' || comp1=='s')  {
     ee2=ee.not('.wsFloatingContent_main');
     return ee2;
   }
   return ee  ;                            // all others are same as 'a'

}

//==========
// error reporter
wsurvey.flContents.container.error=function(anerr,isfatal,extraMess) {
   if (arguments.length<2) isfatal=1;
   if (arguments.length<3) extraMess=' (container creation/manipulation)  ';
//   let fstack2=wsurvey.quickStackTrace('s');  // 30 jan 2022 : not very dependable. Use console.trace instead
   let amess=anerr ;      //+'\n'+' | Call path='+fstack2  ;
   console.trace(amess);
//   console.log(amess);
   if (isfatal==1) {
      alert(amess);
      throw new Error("Error in wsFloatingContent "+extraMess+": "+anerr);
    }
   return 1;
}      ;     // end of error

wsurvey.flContents.error=function(anerr,isfatal) {  // subtle variant
    if (arguments.length<2) isfatal=1;
    wsurvey.flContents.container.error(anerr,isfatal,' ');
}
// FIX THIS maybe? : add d fitToContent.

// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++ //
// header and content area functions

//================
// return main, header, transient header, and content jQUey objects for a floating conteint ontainer
// as ['main':jq,'header':jq,'transientHeader':jq,'content':jq]
// Or, false if this is not a floatingCOntent container
// It is is, but has no header and content area, jq is not null only for 'main'
// ebox can be string or dom object. IF string, an id (# prepended if needed
wsurvey.flContents.dom=function(ebox0,which) {
  var d1,ebox;
  if (arguments.length<2) which='*' ;
  let awhich=jQuery.trim(which).toLowerCase();
  let a1=awhich.substr(0,1);

  if (typeof(ebox0)=='string') {
     ebox=(ebox0.substr(0,1)!='#') ? '#'+ebox0 : ebox0 ;
     d1=jQuery(ebox);
     if (d1.length==0) {
          wsurvey.flContents.error('.dom : '+ebox+' is not found',0);
          return false ;
     }
      if (!d1.hasClass('wsFloatingContent')) {
          wsurvey.flContents.error('.dom : '+ebox+' is not a wsFloatingContent container',0);
          return false ;
      }

  } else {
      ebox=ebox0;
      d1=jQuery(ebox);
      if (d1.length==0) {
          wsurvey.flContents.error('.dom : ebox (object) is not a dom or jQuery object',0);
          return false ;
     }
      if (!d1.hasClass('wsFloatingContent')) {
          wsurvey.flContents.error('.dom : ebox (object) is not a wsFloatingContent container',0);
          return false ;
      }
  }
// if here good to go!
  let resp={'main':d1,'header':null,'transientHeader':null,'content':null,'headers':null,'contents':null,'transientHeaders':null};
  if (!d1.hasClass('wsFloatingContent_main')) {         // floatingcontent, but not complete (no header or content
       if (a1=='c' || a1=='h' || a1=='t')   return null ;
       if (a1=='m') return d1;
       return resp  ;
  }

  let eheader=d1.find('[name="wsFloatingContent_headers"]');
  if (eheader.length>0) {
      resp['header']=eheader;
      resp['headers']=eheader;
      let etrans=eheader.find('[name="wsFloatingContent_headers_transient"]');
       if (etrans.length>0) {
           resp['transientHeader']=etrans;
           resp['transientHeaders']=etrans;
       }
  }
  let econtent=d1.find('[name="wsFloatingContent_content"]');
  if (econtent.length>0) {
     resp['content']=econtent;
     resp['contents']=econtent;
  }

  if (a1=='m') return resp['main'];
  if (a1=='c') return resp['content'];
  if (a1=='h') return resp['header'];
  if (a1=='t') return resp['transientHeader'];
  return resp ;  // the dfeault is all

}

//====================
// find elements in content area
wsurvey.flContents.find=function(ebox0,asel,doSib) {
   if (arguments.length<3) doSib=0;
   doSib=jQuery.trim(doSib);
   var adom ;

   if (doSib=='1' )  {  // look for siblings (ebox0 is not the main container -- it is IN a container
      let adom1=wsurvey.flContents.closest(ebox0) ;
      if (adom1===false) return false;
      adom=wsurvey.flContents.dom(adom1);
   } else {                    // not sib:  ebox0 is the main container
       adom=wsurvey.flContents.dom(ebox0);
   }
  if (adom===false) return false;
  let adomM=adom['content'];
  if (adomM===null) return adomM ;

  let ee=adomM.find(asel);
  return ee;
}

//=================
// read, or set, contents of the transient header area
// if read, can return as string (.html()) or as a collection of all immediate children (including text nodes) (.content())
wsurvey.flContents.header=function(ebox,newStuff,doappend) {
   if (arguments.length<3) doappend=0;
   let adom=wsurvey.flContents.dom(ebox);
   if (adom===false) return adom;

   let eTrans=adom['transientHeader'];
   if (eTrans===null) return null ;

   if (arguments.length<2) { // return as text?
       let cc=eTrans.html();
       return cc;
   }

   if (jQuery.isPlainObject(newStuff) &&  jQuery.isEmptyObject(newStuff)) {   // return as collection?
     let eecc=eTrans.content();
     return eecc ;
   }

 
// if here, set
   if (typeof(newStuff)=='string') {
       if (doappend==0) {
           eTrans.html(newStuff);
       } else {
          eTrans.append(newStuff);
       }
       return 1;
   }

   let ec=jQuery(newStuff);
   if (ec.length==0 || typeof(ec.html())=='undefined') {  ;
      wsurvey.flContents.error('headerArea : content argument is not a jQuery (or dom) object' );
      return false;
   }
   if (doappend==0)  eTrans.empty();
   eTrans.append(ec);

   return 1;
}
wsurvey.flContents.headers=wsurvey.flContents.header ;

//=================
// read, or set, contents of the content area
// save to history if a set, and history enabled for this container

wsurvey.flContents.contents=function(ebox,newStuff,extras) {
   if (arguments.length<3) doappend=0 ;

   let adom=wsurvey.flContents.dom(ebox);
   if (adom===false) return adom;

   var doappend=0,doShow=1,onTop=1,noHistory=0,addHeader='',addEvents=[];
   let eContent=adom['content'];
   if (eContent===null) return null ;

   if (arguments.length<2) {    // return as text
       let cc=eContent.html();
       return cc;
   }
   if (arguments.length>2) {  // extras specified, if not an object, its doappend
      if (!jQuery.isPlainObject(extras)) {  // not just an append
        if (jQuery.isArray(extras)) {
            console.log('wsurvey.flContents.contents: extras argument is an array. Should be object or string ');
            return false;
        }
        let t1=jQuery.trim(extras).toLowerCase().substr(0,1);
        if (t1=='1' || t1=='a') doappend=1;
      }   else {           //   an object
         let t1=wsurvey.findObjectDefault(extras,'append,ap',0,'a');
             t1=jQuery.trim(t1).toLowerCase().substr(0,1);      // default=0
             doappend= (t1=='1') ? 1 : 0 ;
         let t2=wsurvey.findObjectDefault(extras,'show,sh',1,'a');
             t2=jQuery.trim(t2).toLowerCase().substr(0,1);        // default=-1 (leave as is)
             doShow=-1;                                         // default is now doNothing
             if (t2=='1' || t2=='s') doShow=1;
             if (t2=='0' || t2=='h') doShow=0;
         let t3=wsurvey.findObjectDefault(extras,'onTop,onT,foreGr',1,'a');
             t3=jQuery.trim(t3).toLowerCase().substr(0,1);
             onTop= (t3=='0') ? 0 : 1 ;                           // default=1
         let t4=wsurvey.findObjectDefault(extras,'addEvents,addEv',1,'a');
            addEvents= (jQuery.isArray(t4)) ? t4 : [] ;                // default=none
         let t5=wsurvey.findObjectDefault(extras,'noHistory,noH',1,'a');
             t5=jQuery.trim(t5).toLowerCase().substr(0,1);
             noHistory=(t3=='1') ? 1 : 0 ;                           // default=0
           addHeader=wsurvey.findObjectDefault(extras,'header,addH','','a');
            addHeader=jQuery.trim(addHeader);
      }
    }


// example of addEvnets:
//   [0]:  string(9): "mousedown"
//   [1]:  string(17): ".snapShotImgOuter"
//   [2]:  function
//
//   [0]:  string(7): "mouseup"
//   [1]:  string(17): ".snapShotImgOuter"
//   [2]:  function
//
//    append=1 or a , def 0 ;  show: def 1 s, or 0 h ; onTop 0 , def 1, noHistory def 0 , 1;  header: def '', addEvents def []

// if here, set the contents (replace or add to existing)

// save existing to history
// eMain.data('contentHistory') (saved in parent element of flContent, not in the content area)
//  list: array containing list of dom objects with "prior" content
//  k1 : first index in list with an item. Starts at 0. Increases as history is trimmed (To save space)
//  k2:  index to place next item in. SImilar to list.length -- but only if k1=0. Note that last item saved is at k2-1
//  now : the most currewntly displayed history item. -2 : history disabled, -1 : history item NOT being displayed. Otherwise between k1 and k2-1

   var qHistory=0,tchh,historyMethod='html';

   let eMain=adom['main']

   if (typeof(eMain.data('contentHistory'))!=='undefined' ) {
      tchh=eMain.data('contentHistory');
      qHistory=tchh['enable'];
      historyMethod=tchh['method'];
   }

   if (doappend==0) {       // not append... remove current stuff
      if (qHistory==1) {           // if history, perhaps detach (do NOT remove)
          if (historyMethod=='dom') {
            let einners=eContent.contents();
            einners.detach();               // detach  (remove could mess up currently visible dom element that are pointed to  in history list)
          } else {
            eContent.empty();  // html method --- just write new string content
          }
      } else {
          eContent.empty();      // no history, so just clear
      }
   }       // doappend =1 ... retain current stuff

// saved to history (if enabled), prior content cleared if doappend=0

   if (typeof(newStuff)=='string')  {  // strings are straightforward
       eContent.append(newStuff);  // will have been cleared above if doappend=0
   } else {
      let eNewStuff=jQuery(newStuff);        // make sure this has something
      if (!(eNewStuff instanceof jQuery)) {
         wsurvey.flContents.error('contentArea : content argument  is not a jQuery (or dom) object  ' );
         return false;
      }
     if (eNewStuff.length==0 || typeof(eNewStuff.html)!=='function') {  ;
         wsurvey.flContents.error('contentArea : content argument  is not a jQuery  object with .html() available) ' );
         return false;
     }
     eContent.append(eNewStuff);
  }

// extra stuff! (other than append)

  if (doShow==1) {     // -1 = do nothing (default if show is specified and unknown code given. 1 is default if not specified
       eMain.show();
  } else if (doShow==0) {
      eMain.hide();
  }
  if (onTop==1) wsurvey.flContents.container.setZindex(eMain,1);

  if (addHeader!='') wsurvey.flContents.header(eMain,addHeader);

  if (addEvents.length>0) {
    for (var ih=0;ih<addEvents.length;ih++) {
         let aevent=addEvents[ih][0]; let alookfor=addEvents[ih][1]; let afunc=addEvents[ih][2];
         if (typeof(afunc)!=='function') {
            console.log('Error in wsurvey.flContents.contents: an event handler function is not a function (for '+aevent+','+alookfor+','+afunc) ;
            return false ;
         }
         let etry=eMain.find(alookfor);
         if (etry.length>0) wsurvey.addEventIfNew(etry,aevent,afunc,false,0);   // anywhere in container, not just in contentArea
    }
  }


// If history enabled?

   if (qHistory==0  ) return 1;

   let ehb=jQuery('[name="wsFloatingContent_historyShow"]'); // new content written, so unhighlight "in history" buttons
   ehb.removeClass('cwsFloatingContent_historyShowActive') ;
   
   if (noHistory==1) return 1 ;         // supress this call's content?

   let ecElements ;
   if (historyMethod=='dom') {
       ecElements=eContent.contents()   ;  // dom collection of the currently dispalyed stuff (in content area of this flContent)
   } else {
       ecElements=eContent.html();
   }
   let k2=parseInt(tchh['k2']);  // k2 is "next available index"
   let k1=parseInt(tchh['k1']);  // k1 is "oldest available index"
   tchh['list'][k2]=ecElements;
   let kNow=k2;
   tchh['now']=kNow;
   tchh['k2']=k2+1  ;     // augment next avaialble

   let maxLength=parseInt(tchh['maxLength']);

   if ((k2-k1)>maxLength) {
        delete(tchh['list'][k1]);   // remove this item from the list ... might lead to orphan dom elements being garbage collected
        tchh['k1']++;
   }

   eMain.data('contentHistory',tchh);

   let ehbS=jQuery('[name="wsFloatingContent_historyShow"]');
   ehbS.removeClass('cwsFloatingContent_historyShowActive') ;


   return 1;
}
wsurvey.flContents.content=wsurvey.flContents.contents ;  // a synonym

// ==========================
// show, hide, and toggle (entire container)
wsurvey.flContents.show=function(ebox,speed,onTop) {
   if (arguments.length<2) speed=0 ; // no fade
   if (arguments.length<3) onTop=0 ; // no fade

   if (typeof(ebox)=='number' || (typeof(ebox)=='string' && !isNaN(ebox) ) ) { // reverse order
     let foo=ebox;
     ebox=speed;
     speed=foo;
   }

   let adom=wsurvey.flContents.dom(ebox);
   if (adom===false) return adom;

   let eMain=adom['main'];
   if (eMain===null) return null ;  // should never happen
   speed=Math.max(0,parseInt(speed));
   if (speed==0) {
       eMain.show();
   } else {
       eMain.fadeIn({'duration':speed,'easing':'linear'} ) ;
       eMain.show();
   }
   if (onTop==1) wsurvey.flContents.container.setZindex(eMain,1);
}

wsurvey.flContents.hide=function(ebox,speed) {
   if (arguments.length<2) speed=0 ; // no fade

   if (typeof(ebox)=='number' || (typeof(ebox)=='string' && !isNaN(ebox)) ) { // reverse order
     let foo=ebox;
     ebox=speed;
     speed=foo;
   }

   let adom=wsurvey.flContents.dom(ebox);
   if (adom===false) return adom;

   let eMain=adom['main'];
   if (eMain===null) return null ;  // should never happen
   speed=Math.max(0,parseInt(speed));
   if (speed==0) {
       eMain.hide();
   } else {
         let hopts={'duration':speed,'easing':'swing','always':checkClose} ;
         eMain.fadeOut(hopts);
   }
  function checkClose(athis) {   // sometimes this seems to help.
      let ethis=wsurvey.argJquery(athis);
      arf=ethis instanceof jQuery ;
      if (arf ) eMain.hide();  //     just in case of failure
   }  // interinal function
}

wsurvey.flContents.toggle=function(ebox) {
   let adom=wsurvey.flContents.dom(ebox);
   if (adom===false) return adom;

   let eMain=adom['main'];
   if (eMain===null) return null ;  // should never happen
   eMain.toggle();
}

// ==========================
// show, hide, and toggle (entire container)
wsurvey.flContents.visible=function(ebox) {
   let adom=wsurvey.flContents.dom(ebox);
   if (adom===false) return adom;

   let eMain=adom['main'];
   if (eMain===null) return null ;  // should never happen

   if (eMain.is(':visible')) return 1;
   return 0;
}

// ==========================
// show, hide, and toggle (entire container)
wsurvey.flContents.current=function(ebox) {
   let adom=wsurvey.flContents.dom(ebox);
   if (adom===false) return adom;

   let stuff=wsurvey.flContents.container.doResize(ebox,'C');
   
// foreground
   let eall=wsurvey.flContents.container.list('a');
   return stuff;
}


// ==============toggle view of header area
wsurvey.flContents.headerView=function(ebox,which) {
   var eboxUse,whichUse='hide' ;

    if (typeof(ebox)=='string') {
        let abox= (ebox.substr(0,1)=='#') ? ebox : '#'+ebox;
        eboxUse=jQuery(abox);
        if (eboxUse.length==0) return false ;
    } else {
       eboxUse=wsurvey.argJquery(ebox);
       if (eboxUse===false) return false;
    }

   if (arguments.length==1) {  // could be an event handler?
      if (typeof(ebox.data)!='undefined' && typeof(ebox.data['headerView'])!='undefined') { // use original argument
         whichUse= ebox.data['headerView'];
      } else {
         whichUse=eboxUse.wsurvey_attrCi('data-which','hide');
      }
   } else {
      whichUse=which;
   }
   if (!eboxUse.hasClass('wsFloatingContent')) {  // does not point to the actual container   -- try parent
     let eparent=eboxUse.closest('.wsFloatingContent')  ;
     if (eparent.length==0) return false ;
     eboxUse=eparent;
   }

// if here, got a the flaotingContent base element
      let edom=wsurvey.flContents.dom(eboxUse);
      let eHeader=edom['header'];
      if (eHeader==null) return false ;

      whichUse=jQuery.trim(whichUse).toLowerCase();

      if (whichUse=='show') {
            eHeader.show();
      } else if (whichUse=='toggle') {
           eHeader.toggle();
      } else {
          eHeader.hide();
          whichUse='hide';
      }
      return whichUse;
 }

//======================
// return true if the contents of an element are "overflowing"
// True if overflow detected. False otherwise
//  anid: string id   or jquery object   (of a floatingContent container)
// tol:  toleranace. used to deal with round up or other errors -- it is the # of pixels
//       of overlap that are tolerable. Using less than 1 is NOT recommended
// full: if specified and 1, then return ['status':false or true,'scrollWidth':scrollWidth,'scrollHeight':scrollHeight,'innerWidth':innerWidth,innerHeight':innerHeight])
//       false occurs if scrollWidth > innerWidth + tol  or scrolHeight>innerHeight+tol
//       If an error (such as anid doesn't point to jquery object, returns ['status':'error','content':erroMessage]
// Note that if full not specified, errors cause a return of false (no error message)

wsurvey.flContents.checkOverflow=function(anid,tol,afull)  {

 if (arguments.length<2 || isNaN(tol) ) tol=1;
  tol=parseFloat(tol) ;

  if (arguments.length<3) afull=0;
  if (afull!==true) {
    if (jQuery.trim(afull)!='1') afull=0;
  } else {
    afull=1;
  }

  var anid2,anid3,aret;
    anid2=wsurvey.flContents.dom(anid);
  if (anid2===false) return anid2  ;
  anid3=anid2['contents'];
  if (anid3===null) return anid3;

  let fooid=anid3.attr('id');
   var scWidth=anid3[0].scrollWidth,   inWidth=anid3.innerWidth();
   var scHeight=anid3[0].scrollHeight,  inHeight=anid3.innerHeight();

   if (afull==1) {            // set derfault return . assume overflow occurs
      aret={'status':true,'scrollWidth':scWidth,'scrollHeight':scHeight,'innerWidth':inWidth,'innerHeight':inHeight};
   } else {
       aret=true ;
   }

  if (scWidth >  (inWidth+tol)) return aret ;  // true by default
  if (scHeight > (inHeight+tol) ) return aret ;

  if (afull==1) {
     aret['status']=false;
  } else {
     aret=false;
  }
  return aret;

}


//==================
// eMain.data('contentHistory') has indices
//  list: array containing list of dom objects with "prior" content
//  k1 : first index in list with an item. Starts at 0. Increases as history is trimmed (To save space)
//  k2:  index to place next item in. Same as list.length -- but only if k1=0. Note that most recent item saved is at k2-1
//  now : the most currewntly displayed history item. -2 : history disabled, -1 : history item NOT being displayed. Otherwise between k1 and k2-1
//
//       let tchh={'list':{},'enable':1,'now':-1,'k1':0,'k2':0,'maxLength':5,'func':historyFunc,'method':historyMethod};            // -1 means "not viewing a history item". Otherwise k1 ... k2-1

wsurvey.flContents.showHistory=function(athis,idire) {
   if (arguments.length<2) idire=1;

   idire=parseInt(idire);

   let eparent=wsurvey.flContents.closest(athis) ;

   if (eparent===false) return eparent;

//   if (eparent===false) return false ;
   if (typeof(eparent.data('contentHistory'))=='undefined') return false ; // should never happen

   let tchh=eparent.data('contentHistory');
   let isenable=tchh['enable'];
   if (isenable==0) return 0 ;  // not eanbled

// enabled!

   let adom=wsurvey.flContents.dom(eparent)   ;

   if (adom['contents']===null) return false ;

   let alist=tchh['list'];

   let imethod=tchh['method'];
   let afunc=tchh['func'];

   let kNow=parseInt(tchh['now']);
   let k1=parseInt(tchh['k1']);
   let k2=parseInt(tchh['k2']);

   let newNow=kNow+idire ;
   if (newNow<k1) return 1 ;  // can't go back before first
   if (newNow>=k2) return 1 ;  // can't go past last
   let estuff=alist[newNow];

   if (imethod=='dom') {    // dom collection (retains event handlers
      adom['contents'].contents().detach(); // detach the current stuff (note that a collection of its elements are at the top of the history)
      adom['contents'].append(estuff);      // and attach the history collection to the contentArea (to be displaye)
   } else {               // html string  (does not change
       adom['contents'].html(estuff);       // overwrite existing stuff with stuff stored in history
    }
   let ehb=jQuery('[name="wsFloatingContent_historyShow"]');
   if (!ehb.hasClass('cwsFloatingContent_historyShowActive')) ehb.addClass('cwsFloatingContent_historyShowActive') ;

   let newtitle='Displaying history entry #'+newNow+' (entries available: '+k1+' to '+ (k2-1)+').\n History mode: '+imethod;
   ehb.attr('title',newtitle);

    tchh['now']=newNow;
    eparent.data('contentHistory',tchh);

    if (afunc!='') {  // the history post-display function
    let usefunc=wsurvey.getFuncFromString(afunc);
    if (typeof(useFunc)!='function') return false ; /// could return error messages
    usefunc(eparent,idire);

//        window['wsurvey.flContents.historyFuncDefault'](eparent,idire);
    }

}

// history func if '1' specified -- summary of historyContents
wsurvey.flContents.historyFuncDefault=function(jqobj,idire) {
  var oofDir=['prior','next'];
  let aid=jqobj.wsurvey_attrCi('id','n.a.');
  let tchh=jqobj.data('contentHistory');
  let isenable=tchh['enable'];
  if (isenable==0) return 0 ;
  if (idire<0) idire=0;
  let imethod=tchh['method'];
  let afunc=tchh['func'];
  let alist=tchh['list'];
  let maxLength=tchh['maxLength'];
  let kNow=parseInt(tchh['now']);
  let k1=parseInt(tchh['k1']);
  let k2=parseInt(tchh['k2']);
  let whichDir=oofDir[idire];
  let astring='History displayed for entry '+kNow+' (after '+whichDir+'). ';
  astring+='  History entries range from '+k1+' to ' +k2+'. Method used: '+imethod+'.';
  astring+='\nPost display function: '+afunc+'. maxEntries: '+maxLength;
  let ilen=0;
  if (imethod=='html') {
      for (var jj=k1;jj<k2;jj++) {
           ilen+=alist[jj].length;
      }
      astring+='. '+ilen+' bytes stored ';
  } else {
      for (var jj=k1;jj<k2;jj++) {
           ilen+=alist[jj].length;
      }
      astring+='. '+ilen+' dom elements stored ';
  }
  console.log(astring);
}

// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++= ///
// jQuery extenders (for floatingContent container elements)

// note use off wsurvey_flContents_extendPrefix -- allows some customization of function names

jQuery.fn[wsurvey_flContents_extendPrefix+'Content']=function(newContent,append) {
    var aelem=this,astuff;
    if (arguments.length<2) append=0;

    if (arguments.length<1) {
         astuff=wsurvey.flContents.content(aelem);
    } else {
         astuff=wsurvey.flContents.content(aelem,newContent,append);
    }

    return astuff;
}
jQuery.fn[wsurvey_flContents_extendPrefix+'Contents']=jQuery.fn[wsurvey_flContents_extendPrefix+'Content'];

jQuery.fn[wsurvey_flContents_extendPrefix+'Closest']=function(ihow) {
    var aelem=this,astuff;
    if (arguments.length<2) ihow=0;
     astuff=wsurvey.flContents.closest(aelem,ihow);
    return astuff;
}


jQuery.fn[wsurvey_flContents_extendPrefix+'Header']=function(newContent,append) {
    var aelem=this,astuff;
    if (arguments.length<2) append=0;
    if (arguments.length<1) {
       astuff=wsurvey.flContents.header(aelem);
    } else {
       astuff=wsurvey.flContents.header(aelem,newContent,append);
    }
    return astuff;
}
jQuery.fn[wsurvey_flContents_extendPrefix+'Headers']=jQuery.fn[wsurvey_flContents_extendPrefix+'Header'];

jQuery.fn[wsurvey_flContents_extendPrefix+'Find']=function(asel,isib) {
    var aelem=this,astuff;
    if (arguments.length<1) return null  ; // no search selector
    if (arguments.length<2) isib=0  ; // no sibling searc
    astuff=wsurvey.flContents.find(aelem,asel,isib);
    return astuff;
}


jQuery.fn[wsurvey_flContents_extendPrefix+'Hide']=function(speed) {
    var aelem=this;
    if (arguments.length<1) speed=0;
    let astuff=wsurvey.flContents.hide(aelem,speed);
    return astuff;
}

jQuery.fn[wsurvey_flContents_extendPrefix+'Show']=function(speed) {
    var aelem=this;
    if (arguments.length<1) speed=0;
    let astuff=wsurvey.flContents.show(aelem,speed);
    return astuff;
}

jQuery.fn[wsurvey_flContents_extendPrefix+'Toggle']=function(xx) {
    var aelem=this;
    let astuff=wsurvey.flContents.toggle(aelem);
    return astuff;
}
jQuery.fn[wsurvey_flContents_extendPrefix+'Visible']=function(xx) {
    var aelem=this;
    let astuff=wsurvey.flContents.visible(aelem);
    return astuff;
}

jQuery.fn[wsurvey_flContents_extendPrefix+'OnTop']=function(idire) {
    var aelem=this;
    if (arguments.length<1) idire=1;
    let astuff=wsurvey.flContents.onTop(aelem,idire);
    return astuff;
}



// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++= ///
// utility functions
// if wsurvey.utils1.js, ir wsurvey.utils1_basic, were not loaded ... this minimyfied version is used

if (typeof (wsurvey.argJquery)=='undefined') {   // if this exists, all the other ones also exist
  wsurvey.argJquery=function(r,e){if(r instanceof jQuery)return r;if(arguments.length<2&&(e="target"),"target"!=e&&"currentTarget"!==e&&"delegateTarget"!==e&&"relatedTarget"!==e&&(e="target"),"string"!=typeof r)return"object"==typeof r&&(void 0!==r.originalEvent&&void 0!==r.target||void 0!==r.currentTarget&&void 0!==r.target?jQuery(r[e]):(oof=jQuery(r),0!=oof.length&&oof));{let e=jQuery.trim(r);return e="#"!=r.substr(0,1)?"#"+e:e,oof=jQuery(e),0!=oof.length&&oof}},wsurvey.quickStackTrace=function(e){var r,t=[];arguments.length<1&&(r=0),"string"==typeof e&&"s"==jQuery.trim(e).substr(0,1).toLowerCase()&&(r=1);let n=arguments.callee.caller;if("undefined"==n)return"No callers ";if("string"!=typeof n.name)return"No callers with name ";t.push(n.name);for(var u=0;u<10;u++){if("function"!=typeof n.caller)break;if(foo2=n.caller,"string"!=typeof foo2.name)break;t.push(foo2.name),n=foo2}return 1==r?t.join(", "):t},wsurvey.parseAt=function(e,r){var t;return arguments.length<2||(t=e.indexOf(r))<0?[e,""]:0==t?["",e.substr(r.length)]:[e.substr(0,t),e.substr(t+r.length)]},wsurvey.findObjectDefault=function(r,e,t,n,u){arguments.length<4&&(n=1),arguments.length<5&&(u=0);let i=0;if("1"==jQuery.trim(u)&&(i=1),"object"!=typeof r)return 1==i&&console.log("wsurvey.findObjectDefault error: aobj is not an object "),!1;for(var o=[],a=e.split(/[\s\,]+/g),f=0;f<a.length;f++){var s=jQuery.trim(a[f]);if(void 0!==r[s]){if(0==i)return r[s];var l=[s,r[s]];o.push(l)}var y,v=jQuery.trim(s).toUpperCase(),g=v.length;for(y in r){let e=jQuery.trim(y).toUpperCase();if(1==n&&e==v){if(0==i)return r[y];var p=[s,r[y]];o.push(p)}if(2==n&&e.substr(0,g)==v){if(0==i)return r[y];var h=[s,r[y]];o.push(h)}if(3==n&&-1<e.indexOf(v)){if(0==i)return r[y];h=[s,r[y]];o.push(h)}}}return 0==i?t:o},wsurvey.addEventIfNew=function(e,r,t,n,u){var i,o=arguments.length;if(o<4&&(n=!1),o<5&&(u=1),"function"!=typeof t)return!1;for(var a=jQuery(e),f=0,s=0;s<a.length;s++){i=a[s];var l=jQuery._data(i,"events");let e=0;if(l&&l[r]){if(1==u)continue;for(var y=0;y<l[r].length;y++)if(l[r][y].handler==t){e=1;break}if(1==e)continue}f++,ezz=jQuery(i),!1===n?ezz.on(r,t):ezz.on(r,n,t)}return f},wsurvey.addEventsIfNew=wsurvey.addEventIfNew,wsurvey.getFuncFromString=function(e){if("function"==typeof e)return e;if("string"==typeof e){if(!e.length)return null;for(var r=window,e=e.split(".");e.length;){var t=e.shift();if(void 0===r[t])return null;r=r[t]}if("function"==typeof r)return r}return null},jQuery.fn.wsurvey_attrCi=function(e,r){if(theAttr_2=jQuery.trim(e).toUpperCase(),arguments.length<2&&(r=null),elem=wsurvey.argJquery(this),!elem)return r;if(0==elem.length)return r;for(var t=elem.get(0).attributes,u=0;u<t.length;u++)if(aelem=t[u],n=aelem.nodeName||aelem.name,v=elem.attr(n),tattr=typeof v,"undefined"!=tattr&&"null"!=tattr&&!1!==tattr&&theAttr_2==jQuery.trim(n).toUpperCase())return v;return r},jQuery.fn.wsurvey_attrCI=jQuery.fn.wsurvey_attrCi,wsurvey.toPx=function(e,r,t){1<arguments.length?u=r:(u=(jQuery(window).width()+jQuery(window).height())/2,r="no 2nd arg"),arguments.length<3&&(t=jQuery("body").css("font-size"));let n=jQuery.trim(u).toLowerCase();"h"==n.substr(0,1)?u=jQuery(window).height():"w"==n.substr(0,1)&&(u=jQuery(window).width()),isNaN(u)&&wsurvey.flContents.container.error("Can not convert to pixel size: bad value for size ("+r+")");var u=parseFloat(u);if(-1<(e=jQuery.trim(e).toUpperCase()).indexOf("PX"))return parseInt(e);if(-1<e.indexOf("%")){var i=parseFloat(e),o=parseFloat(u);return parseInt(i*o/100)}if(-1<e.indexOf("EM")){i=parseFloat(e),o=parseInt(t);return parseInt(i*o)}return parseInt(e)};
}


// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++= ///

// :::::::::: for convenience, define   synonms for     namespaces
wsurvey.flContent=wsurvey.flContents;

if (typeof(wSurvey)=='undefined') window['wSurvey']=window['wsurvey'] ;  // a synonym


