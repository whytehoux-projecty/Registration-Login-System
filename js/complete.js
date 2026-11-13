/** Confirmation page: shows the summary saved by the registration page. */
(function () {
  'use strict';
  var MIS = window.MIS, $ = MIS.$;

  var done = MIS.store.get('complete', null);
  if (!done) { location.replace('index.html'); return; }

  $('#c-name').textContent = done.fullName || '—';
  $('#c-email').textContent = done.email || '—';
  $('#c-date').textContent = done.submittedAt ? new Date(done.submittedAt).toLocaleString() : '—';

  if (done.reference) {
    $('#reference').textContent = done.reference;
  } else {
    $('#reference-box').hidden = true;
    $('#keep-note').hidden = true;
  }
  $('#complete').hidden = false;

  var copy = $('#copy');
  copy.addEventListener('click', function () {
    var ok = function () {
      copy.textContent = 'Copied';
      setTimeout(function () { copy.textContent = 'Copy'; }, 2000);
    };
    var fallback = function () {
      var range = document.createRange();
      range.selectNodeContents($('#reference'));
      var sel = getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      MIS.toast('info', 'Reference selected — press Ctrl/Cmd+C to copy.');
    };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(done.reference).then(ok, fallback);
    else fallback();
  });

  $('#home').addEventListener('click', function () {
    MIS.store.remove('complete');
    location.assign('index.html');
  });
})();
