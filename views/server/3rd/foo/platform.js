console.log('hello from server');

(function(global) {
  var serverHost = '<%= serverHost %>';
  var partyId = '<%= partyId %>';

  //Code to add innerHTML to widget manipulatable elements of the client
  var elements = document.querySelectorAll('.foo-widget');
  for (var i = 0; i < elements.length; ++i) {
    var fooWidget = elements[i];
    processFooWidget(fooWidget);
  }

  function processFooWidget(fooWidget) {
    var id = fooWidget.getAttribute('data-foo-id');
    var processed = fooWidget.getAttribute('data-foo-processed');
    if (!id || processed === 'done') {
      console.log('skipping element:', fooWidget);
      return;
    }
    var xhr = new XMLHttpRequest();
    xhr.onload = function() {
      fooWidget.innerHTML = 'foo-widget: '+this.responseText;
      fooWidget.setAttribute('data-foo-processed', 'done');
      var fooWidgetButton = fooWidget.querySelector('.bar-button');
      if (!fooWidgetButton) {
        return;
      }
      var fooWidgetButtonFunction = function () {
        var barXhr = new XMLHttpRequest();
        barXhr.onload = function() {
          var result = JSON.parse(this.responseText);
          console.log(result);
          var barPara = fooWidget.querySelector('.bar');
          if (barPara) {
            barPara.innerHTML = JSON.stringify(result);
          }
        };
        barXhr.open('POST', serverHost+'/api/3rd/foo/widget'+id+'/bar?partyId='+partyId);
        var content = {
          fooId: id
        };
        content = JSON.stringify(content);
        barXhr.setRequestHeader('Content-type', 'application/json');
        barXhr.send(content);
      };

      if (fooWidgetButton.addEventListener) {
        fooWidgetButton.addEventListener('click', fooWidgetButtonFunction);
      }
      else if (fooWidgetButton.attachEvent) {
        fooWidgetButton.attachEvent('onclick', fooWidgetButtonFunction);
      }
      else {
        fooWidgetButton.onclick = fooWidgetButtonFunction;
      }
    };
    xhr.open("GET", serverHost+'/api/3rd/foo/widget/'+id+'/init?partyId='+partyId);
    xhr.send();
  }

  //adding inline css styles to widgets
  function injectStyles() {
    var css = '<%= inlineCss %>';
    var style = document.createElement('style');
    style.type = 'text/css';
    if (style.styleSheet) {
      style.styleSheet.cssText = css;
    }
    else {
      style.appendChild(document.createTextNode(css));
    }
    var head = document.head || document.querySelector('head');
    head.appendChild(style);
  }
})();
