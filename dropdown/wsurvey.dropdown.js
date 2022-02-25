// Create dropdown menus (requires jQuery) --
//
// wsurvey.dropdown.txt for the details; and ws.htm for a examples
//
//  Setup
//     In your document, specify jQuery and wsurvey.dropdown
//         <script type="text/javascript" src="../publicLib/jquery-1.10.2.js"></script>
//         <script type="text/javascript" src="../phpLib/wsurvey.dropdown.js"></script>
//
//  Usage
//      Call, say in an onLoad function or document.ready():
//          astat= wsurvey.dropdown(openerId,dropdownId,options)
//   where:
//       openerId:   the id of an element to be used as the "opener".
//       dropdownId:   the of the element that contains the menu to display
//                Note: typically the menu is a <ul> containing links.. but it neeed not be  : you can put purely descriptive content in this "menu" container
//
//      options  : an object containing options, structured as {'opt1':val1,'opt2':val2,...} --  optional, defaults are used if options is not specified
//
//      astat = 1 if success, otherwise a descriptive error message (in a string)
//
// Note: wsurvey.functionName() is a synonym for wsurvey.functionName()
//       To avoid conflicts with other frameworks: jQuery() is used instead of $()
// ---------------------------------------

 
if (typeof(wsurvey)=='undefined') var wsurvey={};       // make the wsurvey namespace

//  create a drop down menu

wsurvey.dropDown =  wsurvey.dropdown =  function(openerId,dropdownId,options) {

var options0,qopener,qmenu,j,addit,ipos,qt,acss,qc ;
var openerClick,tWait,adata,aj1,loff,toff,delayOnEnter;

options0={'timeWait':3000,'useFixed':0,'zindex':'5','checkPosition':1,
         'leftOffset':0,'topOffset':'o+0.2em','openerActive':0,'openerInactive':0,
         'openerClickOn':1,'delayOnEnter':500,
         'dropdownClass':'wsurvey_dropdownClass','hoverClass':'wsurvey_dropdown_hover','closers':'','hovers':'li'};

if (arguments.length<2) {
   let fstack2=quickStackTrace('s');
   return 'wsurvey.dropdown should be called with arguments(openerId,dropdownId,options ) : for details please see wsurveydropdown.txt. Called from:' +fstack2;
}
if (arguments.length<3) options=options0;
 if (typeof(openerId)=='string') {
     if (openerId.substr(0,1)!=='#') openerId='#'+openerId ;
 }
 if (typeof(dropdownId)=='string') {
    if (dropdownId.substr(0,1)!=='#') dropdownId='#'+dropdownId ;
 }


  qopener=jQuery(openerId);

  if (qopener.length!==1) {
      let fstack2=quickStackTrace('s');
     return 'No matching ID for opener ('+qopener.length+'): '+openerId+'. Called from: '+fstack2 ;
  }
  qmenu=jQuery(dropdownId);
  if (qmenu.length!==1) {
      let fstack2=quickStackTrace('s');
      return 'No matching ID for menu  ('+qmenu.length+'): '+dropdownId+'. Called from: '+fstack2 ;
  }

  for (j in options0) {
      if (typeof(options[j])=='undefined') options[j]=options0[j];
      options[j]=jQuery.trim(options[j]);
  }

// set the class of the menu. Also, set position to absolute. Setting a class supresses this position setting
  addit=0;
  let ddclass=jQuery.trim(options.dropdownClass);
  if (ddclass=='0') ddclass='';
  if (ddclass=='1') ddclass='wsurvey_dropdownClass';
  if (ddclass=='wsurvey_dropdownClass') {            // the default formatting.
      qmenu.css('position','absolute');
      qmenu.addClass('wsurvey_dropdownClass');      // this will be added if it doesn't exist
      addit=1;                                 // used below to flag "check for wsurvey.dropdownClass"
  }  else {                          // custom class
      if (ddclass!='') qmenu.addClass(ddclass);    // note: up to programmer to make sure that ddclass contains position:absolute or fixed.
  }    // if noclass is added, it is up to the coder to assign a class in the dropdown menu's html.

//  position the menu relative to the opener element. Suppress if leftOffset and topOffset==''
  let lOffset=jQuery.trim(options.leftOffset), tOffset=jQuery.trim(options.topOffset) ;
  loff=0,toff=0;
   if (lOffset!=='' || tOffset!=='')  {   // got something to work with. if both not specified ... dropdown is drawn on top of opener
      lOffsetUse= wsurvey.dropdown_figOffset(qopener,'w',lOffset);
      tOffsetUse= wsurvey.dropdown_figOffset(qopener,'h',tOffset);

     ipos=qopener.offset() ;      // this assures a proper "fixed" location (offset relative to document, not to parent container)
     loff=parseInt(lOffsetUse);
     toff=parseInt(tOffsetUse);
     qmenu.css({'top':(ipos.top+toff),'left':ipos.left+loff});   // note addition document  position of openerId
   }           // note loffset and toffset ='', no attempt to move! (unless usedFixe


   if (options.useFixed=='1') {
        qmenu.css({'position':'fixed'});   // decpreacted.. can be autoset
        if (lOffset!=='' || tOffset!=='')  {
            qmenu.css({'top':(toff),'left':loff});
        }
   }

   let azi=jQuery.trim(options.zindex);
   if (azi!=='') {
      let nzi=parseInt(azi);
      qmenu.css({'z-index':nzi});
   }

   twait=options.timeWait ;
   if (isNaN(twait))tWait=3000;

   openerClick=options.openerClickOn ;
   if (openerClick!=='0' && openerClick!=='2') openerClick='1';

   delayOnEnter=options.delayOnEnter ;

   qmenu.data("wsurvey.dropdownStatus",{'click':0,'oEnter':0,'dEnter':0});   // initilaize all categories to "not shown"
   qmenu.data("wsurvey.dropdownStatus_opener",qopener);       // used by wsurvey.dropdown_findButton function

// event handlers   for opener and menu
  let checkPosition=jQuery.trim(options.checkPosition);
  if (checkPosition!=='1') checkPosition=0;

  if (options.useFixed==1 && checkPosition==1) console.log('wsurveydropdown warning. '+qmenu.attr('id')+' has fixed position AND checkposition. This usually does not work well ');

  let closerList=jQuery.trim(options.closers);
  if (closerList=='0' || closerList=='1') closerList='';  // default is no closers

  let oactive=jQuery.trim(options.openerActive);
  if (oactive=='0' || oactive=='1') oactive='';
  let oinactive=jQuery.trim(options.openerInactive);
  if (oinactive=='0' || oinactive=='1') oinactive='';

   adata={'openerId':openerId,'dropdownId':dropdownId,'openerClick':openerClick,'tWait':twait,'delayOnEnter':delayOnEnter,
      'closerList':closerList,'checkPosition':checkPosition,'lOffsetOrig':loff,'tOffsetOrig':toff,
      'openerActive':oactive,'openerInactive':oinactive};

  qopener.data('lastEnter',0)  ;     // used for delaying awakening  mousenter of opener

// openerclie: 0=mouseenter opener only, 1= mouseneter or click, 2=click only

   if (openerClick!=='0') {                            //  for modes 1 (the default) and 2, clicking the 'opener' displays the dropdown menu
       qopener.on('click',adata,wsurvey.dropdown_0);      // what to do when clicking  button
   }

   if (openerClick!=='2') {                            // 2 means "only pay attention to button clicks, not mouseenter
         qopener.on('mouseenter',adata,wsurvey.dropdown_1);  //  display menu on mouseenter, hide on mouseleave
         qopener.on('mouseleave',adata,wsurvey.dropdown_2);  // these pay attention to the delays specified in the options

         qmenu.on('mouseenter',adata,wsurvey.dropdown_3);        // mouseenter menu always supported
         qmenu.on('mouseleave',adata,wsurvey.dropdown_4);
   }


   if (closerList!='') qmenu.on('mouseup',adata,wsurvey.dropdown_closeCheck);  // note use of mouseup instead of click

// add  hover (mouseenter highlighting) to  hovers (default='li').
  var ahoverClass=jQuery.trim(options.hoverClass);      // var to ensure this is seen  by mousenter function
    if (ahoverClass=='0') ahoverClass='' ;
    if (ahoverClass=='1') ahoverClass='wsurvey_dropdown_hover';
 var   ahovers=jQuery.trim(options.hovers) ;
    if (ahovers=='0') ahovers='';
    if (ahovers=='1') ahovers='li';

  if (ahoverClass!='' && ahovers!='') {  // if no hoverclass, or if no hovers selector, don't bother
    qt=qmenu.find(ahovers);        // could use class definitions, but this has some flexiblitiesi

    if (qt.length>0) {
      jQuery(qt).on('mouseenter',  function(){
          jQuery(this).addClass(ahoverClass);
       });
       jQuery(qt).on('mouseleave',  function(){
          jQuery(this).removeClass(ahoverClass);
       });
    }
  }

// add style sheets if default dropdownClass .. just do it once!

 if (addit!==1) return 1 ;     //not default dropdown class, so don't bother checking if wsurvey.dropdownClass exists

 if (!wsurvey.dropdown_cssClassExists('wsurvey_dropdownClass'))  {
    wsurvey.dropdown_basicStyles(1) ;  // create the basic styles
 }

 var foo=355;


  return 1 ;

}

//===================================
// compute offset given a syntax of - k o +/- nn xx

wsurvey.dropdown_figOffset= function(eopener,atype,aOffset) {
   var adire ;
   let oof=aOffset ;
   aOffset = aOffset.replace(/\s/g, '');   // remove all spaces
   if (aOffset==='') return 0;  // the default. Note that prior to this call both top and left are checked for ''
   if (atype=='h') {
      oSize=eopener.outerHeight();
   } else {
      oSize=eopener.outerWidth();
   }

// adire*( (kfactor*oAdd) + jpx)

   var aDire=1,kfactor=1,oAdd=0,jpx=0 ;

   if (aOffset.substr(0,1)=='-') {
     aDire=-1;
     aOffset=aOffset.substr(1);
   }
   if (aOffset.substr(0,1)=='+') aOffset=aOffset.substr(1);   // just in case it was used (kill also deal with -+ (convert to -)

   if (aOffset.indexOf('o')<0) {  // no 'o'
       oAdd=0;
       jpx=wsurvey.dropdown_toPx(aOffset,atype);
   } else {  // 'o' exists
     oAdd=oSize;
     let oof=aOffset.split('o');
     kfactor=jQuery.trim(oof[0]);  // ignore multiple instance of 'o'
     if (kfactor=='') {
        kfactor=1;
     } else {
         if (!isNaN(kfactor)) kfactor=parseFloat(kfactor);
     }
     let jpx0=jQuery.trim(oof[1]);
     if (jpx0!='') {
        if (jpx0.substr(0,1)=='+') jpx0=jpx0.substr(1);  // clear leading '+'
        jpx=wsurvey.dropdown_toPx(jpx0,atype); // handles nnPx ,nnEm, and nn% ; and handles leading - sign
     }
   }
   let daval=aDire* ( (kfactor*oAdd) + jpx );

   return daval ;
}


//================== kfactor
// craete basic css styles
// the -2em in   wsurvey.dropdownClass li removes the <li> indent

wsurvey.dropdown_basicStyles=function(a) {

acss="  \n \
.wsurvey_dropdownClass {  \n \
   display:none ;    \n \
   position:absolute;  \n \
   background-color:#dadbdc;   \n \
   font-size:1em;  \n \
   border:1px solid white;  \n \
   border-radius:4px;  \n \
   padding:1px;  \n \
   margin:1px;  \n \
   z-index:100 ;        \n \
   opacity:0.96;  \n \
   filter:alpha(opacity=96);  \n \
}  \n \
  \n \
.wsurvey_dropdownClass li { \n \
     color:#414288 ;           \n \
      background-color:#eaebec;      \n \
     xbackground-color:red ;      \n \
     border:2px solid lightblue;      \n \
     border-radius:3px;    \n \
     padding:2px; \n \
     margin:1px 6px 3px -2em; \n \
     list-style: none ; \n \
}  \n \
  \n \
.wsurvey_dropdown_hover {  \n \
   border:1px dotted  blue !important; \n \
   border-bottom:5px groove  blue !important;      \n \
   border-right:3px groove  blue !important;      \n \
}  \n \
";

  jQuery('<style>').prop("type","text/css").html(acss).appendTo("head");
  return acss ;
}  // create  basis styles ..


//=============

// find the "button" that created a dropdown menu from the <ul> in this container.
wsurvey.dropdown_findButton=function(athis) {
   var ethis=wsurvey.dropdown_argJquery(athis);

// keep going back if the <ul> is not the dropdownId
   var  ep2=ethis;
   for (;;) {
      let ep3=jQuery(ep2.parent());
      if (typeof(ep3[0])=='undefined') return false;
      if (typeof(ep3[0].tagName)=='undefined') return false ; // a hack to discover if at top of dom tree
      if (typeof(ep3)=='undefined' || ep3===null) return false;  // should never happen
      if (typeof(ep3.data('wsurvey.dropdownStatus_opener'))=='undefined') {
        ep2=ep3;
        continue ;
      }
      return ep3.data('wsurvey.dropdownStatus_opener'); // return to extneral caller (i.e.; the event handler for a button inside of dropdown
   }   // infinite loop exits via a return
}


//======
// event handlers for openers
// the  dropdownObject.data('wsurvey.dropdownStatus') array  is used as a set of flag to control actions. 
// each index in the array can be 0 (not open due to this aciton) or  1 (open due to this action
//  'click' : a click opened the dropdown is "frozen" mode. Only another click on the opener, or click on a closer
//           will close the dropdown. But such a click immediately closes, regardless of the state of oEnter or dEnter
//  'oEnter' : entering the opener opened the dropdown. This typically requires a delay, to make sure this is not a transent mousemove
//  'dEnter' : entering the  dropdown cause it to open. Or, to stay open (say, after it was opened by the opener and is slowly fading)
// assumptoins:
//    a dropdown is never entered transiently
//    an opener might be entered transiently (while the mouse is being moved across the screen)
//    a click on an opener means "open until further notice" or "close immediately". which it means depends on current status
//    (is the dropdown open? what were recent mouse movements?

wsurvey.dropdown_0=function(evt) {          //  ::::::::::::::: click handler for opener

  var adata=evt.data;
  var dropdownId=adata['dropdownId'];
  var q1a= jQuery(dropdownId);           // the  dropdown

  q1a.stop(true,true);         // just to be careful, if a click happens always stop animation (even if none is going on)
  var q1aStat=q1a.data('wsurvey.dropdownStatus');
  closeMe=0;

  if (q1aStat['click']==1 ) {    // strong case. Click opened dropdown, so click closes it
       q1a.hide();
       wsurvey.dropdown_openers(0,adata)   ;   // adjust what  is displayed in opener
       q1a.data('wsurvey.dropdownStatus',{'click':0,'dEnter':0,'oEnter':0});         // flag the dropdown is hidden
       return 0;
  }

// one could get clever and use the current mouse position (if entered-and-didnt-leave the opener and/or dropdown)
// to control what happens. But it is simpler just to open, and let the user click again to close.
// And set the other "open due to enter" to 0.
   q1a.data('wsurvey.dropdownStatus',{'click':1,'dEnter':0,'oEnter':0});         // flag the dropdown is displayed due to click
   if (adata.checkPosition==1)  {        //  move dropdown to same  relative positino (relative to opeaner)
         let aOpener=adata.openerId;
         let eOpener=jQuery(aOpener);
         let ipos2=eOpener.offset();
         let loff=adata.lOffsetOrig, toff=adata.tOffsetOrig ;
         q1a.css({'top':(ipos2.top+toff),'left':ipos2.left+loff});
    }
    q1a.fadeIn(1).show();                              // show it (first might need to deal with aftereffects of  fadeOut
    wsurvey.dropdown_openers(1,adata)   ;   // adjust what  is displayed in opener
}

// ----
// iagain specified if this is a "recall after delay". Otherwise, this is an event handler
wsurvey.dropdown_1=function(evt,iagain) {                // ::::::::::::::: mouseenter  button for opener
  var adata,aevt,dropdownId,q1a;

  if (arguments.length<2) iagain=0;   // not a recall from a delay

  if (iagain==1) {           // a self recall (after a delay)
     adata=evt;
     dropdownId=adata.dropdownId ;      // the id of the element with the dropdown menu
     q1a= jQuery(dropdownId);           // the  dropdown
     let foo=adata.openerId ;        // https://stackoverflow.com/questions/1273566/how-do-i-check-if-the-mouse-is-over-an-element-in-jquery
     tmp1=jQuery(foo+':hover') ;    // check if this was a passing mouseenter (that's why there is a delay)
     if (tmp1.length<1) {                // the hover is no longer active ...
        lastEnter=q1a.data('lastEnter',0)  ;  // so ignore. Note the dropdown may be open for other reasons, so don't do anything
        return 1;   //     so  don't bother
     }
  } else {        // first call (event handler)
     adata=evt.data ;
     dropdownId=adata.dropdownId ;      // the id of the element with the dropdown menu
     q1a= jQuery(dropdownId);           // the  dropdown
     let ddate = new Date();  let atime = ddate.getTime();  // used as a timestampe
     delayEnter=parseInt(adata.delayOnEnter) ;       // before doing anything, maybe do a delay (to deal with transient mouuseovers)
     let lastEnter=q1a.data('lastEnter');
     if (lastEnter+delayEnter>atime) return 0   ;   // a prior delay/recall is still waiting to happen. So exit and let the prior one  do the work
     if (delayEnter>0) {            //   a delay is desired
        q1a.data('lastEnter',atime)  ;  // to prevent odd stuff from rapid back and forth over the opener
        aevt=evt;                    // jsut to be careful, use a non-argument version of the jquery ojbect a
        setTimeout(function () {dd6(adata);},delayEnter); // that dd6 can access
        return 1;
    }                               // otherwise, this is the recall after  a delay. So no need to delay again
 }

// if here, recall ok; or delay not desired
  let sNow= q1a.data('wsurvey.dropdownStatus');

// if dropdown is open via prior click, leave it be.  perhaps a  click that happened in the motion that fired this delayed recall?
  if (sNow['click']==1) return 1 ;     // open via a click. any mousemovement through opener is irrelevant

// might want to delay to be sure the mouse really is over the opener (rather than passing by )
// This  means that if a dropdown is in the middle of a fadedout, mouseenter the opener does NOT stop the fadeout
  let ddate = new Date();  let atime = ddate.getTime();  // used as a timestamp
  if (iagain==0) {                      // if here, maybe need to delay (if this is not a recall after a delay)
    delayEnter=parseInt(adata.delayOnEnter) ;       // before doing anything, maybe do a delay (to deal with transient mouuseovers)
    let lastEnter=q1a.data('lastEnter');
    if (lastEnter+delayEnter>atime) return 0   ;   // a prior delay/recall is still waiting to happen. So exit and let the prior one  do the work
    if (delayEnter>0) {            //   a delay is desired
        q1a.data('lastEnter',atime)  ;  // to prevent odd stuff from rapid back and forth over the opener
        aevt=evt;                    // jsut to be careful, use a non-argument version of the jquery ojbect a
        setTimeout(function () {dd6(adata);},delayEnter); // that dd6 can access
        return 1;
    }                               // otherwise, this is the recall after  a delay. So no need to delay again
  }

// if here .. the opener mouseenter is real (not transient event).

  lastEnter=q1a.data('lastEnter',0)  ;    // reset to 0
  sNow['oEnter']=1;
  q1a.data('wsurvey.dropdownStatus',sNow);  // flag that the dropdown is open  via a mouseenter on opener
  if (sNow['dEnter']==0) {       // don't bother showing if is already open  (due to a mouseneter dropdown)
    q1a.stop(true,true);        // to be safe, stop any active animation
    q1a.fadeIn(1).show();                                // show the dropdown!
    if (adata.checkPosition==1)  {   //     //  move dropdown to same  relative positino (relative to opener)
         aopener=adata.openerId;
        let eOpener=jQuery(aopener);
        let ipos2=eOpener.offset();
        let loff=adata.lOffsetOrig, toff=adata.tOffsetOrig ;
        q1a.css({'top':(ipos2.top+toff),'left':ipos2.left+loff});
    }
     wsurvey.dropdown_openers(1,adata)   ;   // adjust what  is displayed in opener
  }
  function dd6(bdata) {
        wsurvey.dropdown_1(bdata,1)    ; // 2nd arg to signal that this is a recall
  }
}

wsurvey.dropdown_2=function(evt) {                               //  ::::::::::::::: mouseleave (opener) button

  var adata=evt.data;
  var dropdownId=adata.dropdownId ;
  var q1a= jQuery(dropdownId);
  var sNow=q1a.data('wsurvey.dropdownStatus');
  if (sNow['click']==1) return 0;                   //  open via click means mousemoovements are irrelvant
  sNow['oEnter']=0 ;
  q1a.data('wsurvey.dropdownStatus',sNow);  // flag that the dropdown is NOT open  via a mouseenter on opener

// a delay on mouseleave the opener gives time for the mouse to get to an dropdown.
  var tWait=parseInt(adata.tWait);  // length of time to hide the dropdown. If mouse comes back over it, or the opener, the fade will be stopped
  if (sNow['dEnter']==0) {             // if open due to a dropdoen enter, don't close
      q1a.fadeOut({duration:tWait,easing:'swing'});         // give time to move mouse over the opener
      wsurvey.dropdown_openers(0,adata)   ;   // adjust what  is displayed in opener
   }
}

// handlers for dropDown menu containers ................
// note: delay is NOT done for mouseenter a dropdown. It is much less likely this is due to transient mouse movements
// (compared to mousenter any number of opener buttons)

wsurvey.dropdown_3=function(evt) {                               // :::::::::::::::  mouseenter  the dropdown
  var adata=evt.data;
  var dropdownId=adata.dropdownId ;

  var q1a= jQuery(dropdownId);                      // could use evt.target instead...
  var sNow=q1a.data('wsurvey.dropdownStatus');
  if (sNow['click']==1) return 0;                   //  open via click means mousemoovements are irrelvant
  sNow['dEnter']=1;
  q1a.data('wsurvey.dropdownStatus',sNow);  // flag that the dropdown is open  via a mouseenter on opener
  if (sNow['oEnter']==0) {   // dropdown not open due to recent opener mouseenter
    q1a.stop(true,true);         // stops a slow closing due to mouse leaving the opener
    q1a.fadeIn(1).show() ;      //  and to be sure, open it again
    wsurvey.dropdown_openers(1,adata)   ;   // adjust what  is displayed in opener
  }
}

wsurvey.dropdown_4=function(evt) {                               //  :::::::::::::::  mouseleave the dropdown
 var adata=evt.data;
 var dropdownId=adata.dropdownId ;
  var  q1a= jQuery(dropdownId);         // coult use evt.target
  var  sNow=q1a.data('wsurvey.dropdownStatus');
  if (sNow['click']==1) return 0;                   //  open via click means mousemoovements are irrelvant
  sNow['dEnter']=0;
  q1a.data('wsurvey.dropdownStatus',sNow);
  if (sNow['oEnter']==0)  {   // dropddown open due to mouseenter opener (and appropriate delay)? Then don't hide the dropdown
     q1a.fadeOut({duration:500,easing:'swing'}) ;                           //   fadeout quickly
     wsurvey.dropdown_openers(0,adata)   ;   // adjust what  is displayed in opener
   }
}

//===================
// show elements in the opener according to state of dropwodn
// astate : 0 (dropdown is not visible, 1 (dropdown is vislible)
// adataUse is the evt.data provided by functions that call this
wsurvey.dropdown_openers=function(astate,adataUse) {                               //  :::::::::::::::  mouseleave the dropdown
  let openerid=adataUse['openerId'];
  let doActive=adataUse['openerActive'];
  let doInactive=adataUse['openerInactive'];

  if (doActive=='' && doInactive=='') return 0 ;  // no selctive dispay of elements in the opener

  eopener=jQuery(openerid);
  eopenerA=[]; eopenerIa=[];
  if (doActive!='') eopenerA=eopener.find(doActive);   // show these if dropdown is open  (astate=1)
  if (doInactive!='') eopenerIa=eopener.find(doInactive);   // show these if dropdown is closed (astate=0)
  
  if (eopenerA.length>0) {             // stuff to show if dropdown is visible
      if (astate=='1') {             // is open, show show this
          eopenerA.show();
      } else {               // not open, so hide this
        eopenerA.hide();
      }
  }
  if (eopenerIa.length>0) {             // stuff to hide if dropdown is visible
      if (astate=='1') {           // dropdown is visible - so hide these
          eopenerIa.hide();
      } else {
        eopenerIa.show();
      }
  }
  return 1;
}

//===============
// click handker, if click in menu. Was an identifed "close if this clicked" element the target?
//  identification uses a css/jquery style selector string (data.closerList); that can specify several different tests (using a csv)

wsurvey.dropdown_closeCheck=function(evt) {
   let adata=evt.data;
   let ebutton=wsurvey.dropdown_argJquery(evt,'target');
   let acheck=jQuery.trim(adata['closerList']);
   if ( acheck =='') return 0 ; // should never happen
   if (acheck=='*') {    // special case -- any click in the menu will close it
     wsurvey.dropdown_close(adata) ;
     return 1;
    }

   let ematch=ebutton.filter(acheck); // filters own element using selector string (acheck)
   if (ematch.length<1)     return 0;  // no match

     wsurvey.dropdown_close(adata) ;
}

wsurvey.dropdown_close=function(adata) {                               //  :::::::::::::::  closer button
 let adropdown=adata['dropdownId'];
 let qmenu=jQuery(adropdown);
  qmenu.stop(true,true);
  qmenu.data("wsurvey.dropdownStatus",0);                     // status=0 means "not toggled on"
  qmenu.fadeOut({duration:10,easing:'swing'}) ;                           //   fadeout quickly
  wsurvey.dropdown_openers(0,adata) ;
  qmenu.data('wsurvey.dropdownStatus',{'click':0,'dEnter':0,'oEnter':0});         // flag the dropdown is hidden

}

wsurvey.dropdown_argJquery=function(ado,which) {
   if (ado instanceof jQuery)  return ado ;  // already jquery object
   if (arguments.length<2) which='target';

   if (which!='target' && which!=='currentTarget' && which!=='delegateTarget' && which!=='relatedTarget') which='target';

   if (typeof(ado)=='string') {       // kind of odd to use this function for this, but just in case
       oof=jQuery(ado);
       if (oof.length==0) return false ;
       return oof ;
   }
   if (typeof(ado)!=='object') return false ;   // should rarely happen

   if (typeof(ado.originalEvent)!=='undefined' && typeof(ado.target)!=='undefined') return jQuery(ado[which]);  // from an .on
   if (typeof(ado.currentTarget)!=='undefined' && typeof(ado.target)!=='undefined') return jQuery(ado[which]);  // from an .addEventListener


   oof=jQuery(ado);                  // a this
   if (oof.length==0) return false;
   return oof;

}

///===== might be useful elsewhere!
//return an integer representing the number of pixels given this size (or location) measure
// xx% and xxEm are converted to pixels.

wsurvey.dropdown_toPx=function(aa,atype ) {
     var asize0;

      if (arguments.length<3) bodyFontSize=jQuery("body").css('font-size');

      let ss=jQuery.trim(atype).toLowerCase();
      asize0 = (ss.substr(0,1)=='h') ? jQuery(window).height() : jQuery(window).width();
      var asize=parseFloat(asize0);

      aa=jQuery.trim(aa).toUpperCase();

      if (aa.indexOf('PX')>-1) return parseInt(aa);

      if (aa.indexOf('%')>-1) {
         let a1=parseFloat(aa);
         let a3=(a1*asize)/100;
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
 }

wsurvey.dropdown_cssClassExists=function(aclass0) {
      var zoo,sx,cs,sheetclasses;

        var hasstyle = false;
        var fullstylesheets = document.styleSheets;
        var aclass='.'+aclass0;

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
                if (try1 == aclass) {
                    hasstyle = true; ;
                    break ;
                }
            }
        }
        return hasstyle;
    };

if (typeof(wSurvey)=='undefined') var wSurvey=wsurvey ;  // a synonym

