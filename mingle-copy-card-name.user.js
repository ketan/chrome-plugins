// ==UserScript==
// @name          Copy mingle card # and card name into clipboard
// @namespace     https://github.com/ketan/chrome-plugins
// @description   Copy mingle card # and card name into clipboard
// ==/UserScript==

function addClippy(){

  function $(id) { return document.getElementById(id); }

  if ($('card-short-description')){

    var description = $('card-short-description').innerText.trim();
    var cardNumber = $('card-index').innerText.trim();

    var clippyDiv = "<span id='copy-to-clipboard'><span style='display:none' id='url_box_clippy'>" + cardNumber + ' - ' + description  + "</span><span id='clippy_tooltip_url_box_clippy' class='clippy-tooltip tooltipped' original-title='copy to clipboard'><object classid='clsid:d27cdb6e-ae6d-11cf-96b8-444553540000' width='14' height='14' class='clippy' id='clippy'><param name='movie' value='https://d3nwyuy0nl342s.cloudfront.net/flash/clippy.swf?v5'><param name='allowScriptAccess' value='always'><param name='quality' value='high'><param name='scale' value='noscale'><param name='FlashVars' value='id=url_box_clippy&amp;copied=&amp;copyto='><param name='bgcolor' value='#FFFFFF'><param name='wmode' value='opaque'><embed src='https://d3nwyuy0nl342s.cloudfront.net/flash/clippy.swf?v5' width='14' height='14' name='clippy' quality='high' allowscriptaccess='always' type='application/x-shockwave-flash' pluginspage='http://www.macromedia.com/go/getflashplayer' flashvars='id=url_box_clippy&amp;copied=&amp;copyto=' bgcolor='#FFFFFF' wmode='opaque'></object></span></span>";

    $('card-short-description').innerHTML += clippyDiv;
  }  
}

if (document.readyState == "complete") {
  addClippy();
} else {
  window.addEventListener("load", addClippy, false);
}
