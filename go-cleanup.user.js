// ==UserScript==
// @name          Cleanup go console output
// @namespace     https://github.com/ketan/chrome-plugins
// @description   make your stack trace lines open in TextMate
// @match         http://*/*/cruise-output/console.log
// @match         https://*/*/cruise-output/console.log
// @match         http://*/go/tab/build/detail/*
// @match         https://*/go/tab/build/detail/*
// ==/UserScript==

// Copied from https://github.com/mmalecki/ansiparse/blob/master/lib/ansiparse.js
var ansiparse = function (str) {
  //
  // I'm terrible at writing parsers.
  //
  var matchingControl = null,
      matchingData = null,
      matchingText = '',
      ansiState = [],
      result = [],
      state = {},
      eraseChar;

  //
  // General workflow for this thing is:
  // \033\[33mText
  // |     |  |
  // |     |  matchingText
  // |     matchingData
  // matchingControl
  //
  // In further steps we hope it's all going to be fine. It usually is.
  //

  //
  // Erases a char from the output
  //
  eraseChar = function () {
    var index, text;
    if (matchingText.length) {
      matchingText = matchingText.substr(0, matchingText.length - 1);
    }
    else if (result.length) {
      index = result.length - 1;
      text = result[index].text;
      if (text.length === 1) {
        //
        // A result bit was fully deleted, pop it out to simplify the final output
        //
        result.pop();
      }
      else {
        result[index].text = text.substr(0, text.length - 1);
      }
    }
  };

  for (var i = 0; i < str.length; i++) {
    if (matchingControl != null) {
      if (matchingControl == '\033' && str[i] == '\[') {
        //
        // We've matched full control code. Lets start matching formating data.
        //

        //
        // "emit" matched text with correct state
        //
        if (matchingText) {
          state.text = matchingText;
          result.push(state);
          state = {};
          matchingText = "";
        }

        matchingControl = null;
        matchingData = '';
      }
      else {
        //
        // We failed to match anything - most likely a bad control code. We
        // go back to matching regular strings.
        //
        matchingText += matchingControl + str[i];
        matchingControl = null;
      }
      continue;
    }
    else if (matchingData != null) {
      if (str[i] == ';') {
        //
        // `;` separates many formatting codes, for example: `\033[33;43m`
        // means that both `33` and `43` should be applied.
        //
        // TODO: this can be simplified by modifying state here.
        //
        ansiState.push(matchingData);
        matchingData = '';
      }
      else if (str[i] == 'm') {
        //
        // `m` finished whole formatting code. We can proceed to matching
        // formatted text.
        //
        ansiState.push(matchingData);
        matchingData = null;
        matchingText = '';

        //
        // Convert matched formatting data into user-friendly state object.
        //
        // TODO: DRY.
        //
        ansiState.forEach(function (ansiCode) {
          if (ansiparse.foregroundColors[ansiCode]) {
            state.foreground = ansiparse.foregroundColors[ansiCode];
          }
          else if (ansiparse.backgroundColors[ansiCode]) {
            state.background = ansiparse.backgroundColors[ansiCode];
          }
          else if (ansiCode == 39) {
            delete state.foreground;
          }
          else if (ansiCode == 49) {
            delete state.background;
          }
          else if (ansiparse.styles[ansiCode]) {
            state[ansiparse.styles[ansiCode]] = true;
          }
          else if (ansiCode == 22) {
            state.bold = false;
          }
          else if (ansiCode == 23) {
            state.italic = false;
          }
          else if (ansiCode == 24) {
            state.underline = false;
          }
        });
        ansiState = [];
      }
      else {
        matchingData += str[i];
      }
      continue;
    }

    if (str[i] == '\033') {
      matchingControl = str[i];
    }
    else if (str[i] == '\u0008') {
      eraseChar();
    }
    else {
      matchingText += str[i];
    }
  }

  if (matchingText) {
    state.text = matchingText + (matchingControl ? matchingControl : '');
    result.push(state);
  }
  return result;
};

ansiparse.foregroundColors = {
  '30': 'black',
  '31': 'red',
  '32': 'green',
  '33': 'yellow',
  '34': 'blue',
  '35': 'magenta',
  '36': 'cyan',
  '37': 'white',
  '90': 'grey'
};

ansiparse.backgroundColors = {
  '40': 'black',
  '41': 'red',
  '42': 'green',
  '43': 'yellow',
  '44': 'blue',
  '45': 'magenta',
  '46': 'cyan',
  '47': 'white'
};

ansiparse.styles = {
  '1': 'bold',
  '3': 'italic',
  '4': 'underline'
};


function cleanupGoServerLogs(element){
  var original_content = element.innerText;

  content = original_content;
  content = content.replace(/<\/exec>\./g, '');

  content = content.replace(/<arg>(.*)<\/arg>\n/g, ' "$1"');
  content = content.replace(/\[go\].*<exec command="(.*)" workingdir="(.*)".*\n/g, "[$2] $ $1");
  content = content.replace(/\[go\].*<exec command="(.*)".*\n/g, "$ $1");

  content = content.replace(/\[go\] setting environment variable 'CRUISE_.*\n/g, '');
  content = content.replace(/\[go\] setting environment variable '(.*)' to value '(.*)'/g, '$ export $1="$2"');
  
  content = content.replace(/\[go\] Start updating (.*) at revision (.*) from (.*)\nCloning into (.*)\nHEAD is now at (.*)/gm, '$ git clone "$3"\nCloning into $4\n$ cd $1\n[$1] $ git reset --hard $2\nHEAD is now at $5');
  
  content = content.replace(/\[go\] Start to build (.*) at (.*)/g, "===> Starting to build at $2");
  content = content.replace(/\[go\] Start to prepare (.*) at (.*)/g, "===> Preparing to build at $2");
  content = content.replace(/\[go\] Cleaning working directory "(.*)" (.*)/g, "===> Cleaning working directory $1");
  content = content.replace(/\[go\] Current job status: (.*)/g, "===> Current job status $1");
  content = content.replace(/\[go\] Start to create properties.*\n/g, '');
  content = content.replace(/\[go\] Start to upload.*\n/g, '');
  content = content.replace(/\[go\] Uploading artifacts from (.*) to \[(.*)\]/g, '===> Uploading artifacts from $1');
  content = content.replace(/\[go\] Uploading artifacts from (.*) to (.*)/g, '===> Uploading artifacts from $1');
  content = content.replace(/\[go\] Job completed (.*) at (.*)/g, '===> Completed build at $2');

  var newElement = document.createElement('code');
  newElement.setAttribute('style', "word-wrap: break-word; white-space: pre-wrap;");
  // word-wrap: break-word; white-space: pre-wrap;
  coloredElements = ansiparse(content);
  for (i = 0; i < coloredElements.length; i++){
    var colorDesc = coloredElements[i];

    var colorElement = document.createElement('span');
    var style = "";
    if (colorDesc.foreground){
      style += "color: " + colorDesc.foreground + ";";
    }
    if (colorDesc.background){
      style += "background: " + colorDesc.background + ";";
    }
    if (style.length > 0){
      colorElement.setAttribute('style', style);
    }
    colorElement.innerText = colorDesc.text;

    newElement.appendChild(colorElement);
  }
  
  element.parentNode.insertBefore(newElement, element);
  element.parentNode.removeChild(element);
}

var element;

if(window.location.href.toString().match("\/cruise-output\/console.log$")){
  element = document.getElementsByTagName('pre')[0];
} else {
  element = document.getElementById('buildoutput_pre');
}

cleanupGoServerLogs(element);
