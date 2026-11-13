/** Interest page: waitlist form (always on) + gated entry to registration. */
(function () {
  'use strict';
  var MIS = window.MIS, $ = MIS.$;

  var form = $('#interest-form');
  var done = $('#interest-done');
  var enter = $('#to-registration');

  function validate() {
    var name = form.fullName.value.trim();
    var email = form.email.value.trim();
    var errors = {
      fullName: name ? (name.length < 2 ? 'Please enter your full name' : '') : 'Full name is required',
      email: email ? (MIS.EMAIL_RE.test(email) ? '' : 'Enter a valid email address') : 'Email is required',
    };
    Object.keys(errors).forEach(function (k) { MIS.setFieldError(form, k, errors[k]); });
    var first = Object.keys(errors).filter(function (k) { return errors[k]; })[0];
    if (first) form[first].focus();
    return !first;
  }

  ['fullName', 'email'].forEach(function (name) {
    form[name].addEventListener('input', function () { MIS.setFieldError(form, name, ''); });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!validate()) return;
    var btn = form.querySelector('[type="submit"]');
    MIS.setLoading(btn, true, 'Submitting…');
    MIS.api.submitInterest({
      fullName: form.fullName.value,
      email: form.email.value,
      company: form.company.value,
      role: form.role.value,
    }).then(function (res) {
      MIS.setLoading(btn, false);
      if (!res.ok) { MIS.toast('error', res.error || 'Something went wrong. Please try again.'); return; }
      $('[data-done-message]', done).textContent =
        (res.data && res.data.message) || 'Thank you for your interest! We will contact you soon with an invitation.';
      form.reset();
      form.hidden = true;
      done.hidden = false;
      done.focus();
    });
  });

  $('[data-again]', done).addEventListener('click', function () {
    done.hidden = true;
    form.hidden = false;
    form.fullName.focus();
  });

  enter.addEventListener('click', function () { location.assign('invitation.html'); });

  MIS.startStatus(function (s) {
    var closed = s.state === 'closed';
    var usable = s.state === 'open' || s.state === 'warning';
    $('[data-offline-tip]').hidden = !closed;
    $('[data-offline]').hidden = !closed;
    $('[data-offline-message]').textContent = s.message;
    enter.disabled = !usable;
    enter.textContent = closed ? 'Registration unavailable'
      : usable ? 'Complete registration →'
      : s.state === 'unknown' ? 'Unable to verify system status' : 'Checking availability…';
  });
})();
