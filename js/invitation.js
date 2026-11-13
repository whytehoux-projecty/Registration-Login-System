/** Invitation page: verify code + PIN, then open the registration session. */
(function () {
  'use strict';
  var MIS = window.MIS, $ = MIS.$;

  var form = $('#invite-form');
  var submit = form.querySelector('[type="submit"]');
  var CODE_RE = /^[A-Z0-9]{3,}-[A-Z0-9]{3,}$/;
  var busy = false;

  MIS.guardFlow();
  MIS.startStatus(function (s) {
    if (!busy) submit.disabled = s.state === 'checking' || s.state === 'closed';
  });
  submit.disabled = true;

  if (MIS.session.get()) $('#resume').hidden = false;
  MIS.session.mountTimer(function () {
    $('#resume').hidden = true;
    MIS.toast('warning', 'Your previous registration session expired. Please verify your invitation again.');
  });

  form.code.addEventListener('input', function () {
    var pos = form.code.selectionStart;
    form.code.value = form.code.value.toUpperCase().replace(/\s+/g, '');
    try { form.code.setSelectionRange(pos, pos); } catch (e) { /* not focusable yet */ }
    MIS.setFieldError(form, 'code', '');
  });
  form.pin.addEventListener('input', function () {
    form.pin.value = form.pin.value.replace(/\D/g, '').slice(0, 4);
    MIS.setFieldError(form, 'pin', '');
  });
  form.terms.addEventListener('change', function () { MIS.setFieldError(form, 'terms', ''); });

  function validate() {
    var code = form.code.value.trim();
    var errors = {
      code: !code ? 'Enter your invitation code' : CODE_RE.test(code) ? '' : 'That doesn’t look like an invitation code (expected e.g. INV-ABC123)',
      pin: /^\d{4}$/.test(form.pin.value) ? '' : 'The PIN is 4 digits',
      terms: form.terms.checked ? '' : 'Please accept the terms to continue',
    };
    Object.keys(errors).forEach(function (k) { MIS.setFieldError(form, k, errors[k]); });
    var first = Object.keys(errors).filter(function (k) { return errors[k]; })[0];
    if (first) form[first].focus();
    return !first;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (busy || !validate()) return;
    if (MIS.status.state === 'closed') {
      MIS.go('interest.html', 'warning', 'Registration is currently closed. Please try again during operating hours.');
      return;
    }
    var code = form.code.value.trim();
    busy = true;
    MIS.setLoading(submit, true, 'Verifying…');
    MIS.api.verifyInvitation(code, form.pin.value).then(function (res) {
      busy = false;
      MIS.setLoading(submit, false);
      if (res.ok && res.data && res.data.valid) {
        // A different invitation starts a fresh application; the same one resumes.
        var current = MIS.session.get();
        if (!current || current.invitationCode !== code) {
          MIS.store.clearFlow();
          MIS.session.start(code, res.data.invitation_id);
        }
        MIS.go('register.html', 'success', 'Invitation verified. You have ' + MIS.cfg.sessionTimeoutHours + ' hours to complete registration.');
        return;
      }
      if (res.status === 503) { MIS.checkStatus(); }
      MIS.toast('error', res.error || 'Invalid invitation code or PIN');
      form.pin.value = '';
      form.pin.focus();
    });
  });
})();
