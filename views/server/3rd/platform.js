console.log('hello from server');

(function(global) {
  var serverHost = '<%= serverHost %>';
  var elements = document.querySelectorAll('.foo-widget');
  for (var i = 0; i < elements.length; ++i) {
    el = elements[i];
    processElement(el);
  }

  function processElement(el) {
    var id = el.getAttribute('data-foo-id');
    var processed = el.getAttribute('data-foo-processed');
    if (!id || processed === 'done') {
      console.log('skipping element:', el);
      return;
    }
    var xhr = new XMLHttpRequest();
    xhr.onload = function() {
      el.innerHTML = 'foo-widget: '+this.responseText;
      el.setAttribute('data-foo-processed', 'done');
    };
    xhr.open("GET", serverHost+'/api/3rd/foo-widget/init/'+id);
    xhr.send();
  }
})();
