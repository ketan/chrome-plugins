// ==UserScript==
// @name          Rails Stacktrace TextMate Linker
// @namespace     https://github.com/ketan/chrome-plugins
// @description   make your stack trace lines open in TextMate
// @match         http://localhost/*
// @match         https://localhost/*
// ==/UserScript==

if (nodes = document.getElementById("traces") && document.querySelectorAll("#traces pre>code")) {
  var railsRoot = document.getElementsByTagName('code')[2].innerHTML.replace('Rails.root: ', '');

    for (var i=0, node; node = nodes[i++];) {
      var newHtml = [],
          lines = node.innerHTML.split(/\n/);

      for (var i=0, line; line = lines[i]; i++){
        var parts       = line.split(":in ");
        var pathAndLine = parts[0].split(":");
        newHtml.push("<a href='txmt://open?url=file://", railsRoot , '/', pathAndLine[0], "&amp;line=", pathAndLine[1], "&amp;column=1'>", line, "</a>\n");
      }
      node.innerHTML = newHtml.join("");
    }
}
