/**
 * Registration page: five steps in one document.
 *   1 Personal · 2 Address · 3 Credentials · 4 Photos · 5 Oath + policies + submit
 *
 * Progress (everything except the password and the raw audio) is kept in
 * sessionStorage so a refresh resumes where the applicant left off. The
 * password only ever lives in the input element.
 */
(function () {
  'use strict';

  var MIS = window.MIS, $ = MIS.$, $$ = MIS.$$, cfg = MIS.cfg, store = MIS.store;

  if (!MIS.session.get()) {
    MIS.go('invitation.html', 'error', 'Please verify your invitation first.');
    return;
  }

  var TOTAL = 5;
  var SAVED_FIELDS = ['firstName', 'lastName', 'email', 'phone', 'dateOfBirth', 'occupation',
    'address', 'city', 'state', 'postalCode', 'country', 'bio', 'username'];
  var POLICY_KEYS = ['terms', 'privacy', 'conduct', 'ethics'];
  var MAX_OATH_SECONDS = 180;

  var form = $('#reg-form');
  var nextBtn = $('#next');
  var backBtn = $('#back');

  var data = store.get('form', {});
  var photos = store.get('photos', []);       // [{ id, url, thumb, name }]
  var oath = store.get('oath', null);         // { id, duration }
  var policies = store.get('policies', {});
  var step = Math.min(Math.max(parseInt(store.get('step', 1), 10) || 1, 1), TOTAL);
  var available = { email: null, username: null }; // last value the API confirmed as free
  var busy = false;
  var uploading = false;

  // ---- Field persistence ---------------------------------------------------

  SAVED_FIELDS.forEach(function (name) {
    var el = form[name];
    if (data[name]) el.value = data[name];
    el.addEventListener('input', function () {
      if (name === 'username') el.value = el.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
      data[name] = el.value;
      store.set('form', data);
      MIS.setFieldError(form, name, '');
      if (name === 'bio') updateBioCount();
    });
  });
  ['password', 'confirmPassword'].forEach(function (name) {
    form[name].addEventListener('input', function () {
      MIS.setFieldError(form, name, '');
      if (name === 'password') updateMeter();
    });
  });
  form.dateOfBirth.max = new Date().toISOString().slice(0, 10);

  function updateBioCount() { $('[data-bio-count]').textContent = form.bio.value.length; }
  updateBioCount();

  function val(name) { return (form[name].value || '').trim(); }

  // ---- Password strength ---------------------------------------------------

  function updateMeter() {
    var pw = form.password.value;
    var score = 0;
    if (pw.length >= 8) {
      score = 1;
      var variety = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter(function (re) { return re.test(pw); }).length;
      if (variety >= 2) score++;
      if (variety >= 3 && pw.length >= 10) score++;
      if (variety >= 3 && pw.length >= 14) score++;
    }
    $('[data-meter]').dataset.score = score;
    $('[data-meter-label]').textContent = !pw
      ? 'Minimum 8 characters. Longer, with mixed characters, is stronger.'
      : pw.length < 8 ? 'Too short — ' + (8 - pw.length) + ' more character' + (8 - pw.length === 1 ? '' : 's') + ' needed'
      : ['', 'Weak', 'Fair', 'Good', 'Strong'][score] + ' password';
  }

  // ---- Validation ----------------------------------------------------------

  function validators(n) {
    if (n === 1) {
      var name = function (v) { return !v ? 'This field is required' : v.length < 2 ? 'Must be at least 2 characters' : ''; };
      var dob = val('dateOfBirth');
      return {
        firstName: name(val('firstName')),
        lastName: name(val('lastName')),
        email: !val('email') ? 'Email is required' : MIS.EMAIL_RE.test(val('email')) ? '' : 'Enter a valid email address',
        phone: val('phone') && !/^\+?[\d\s\-()]{10,}$/.test(val('phone')) ? 'Enter a valid phone number (at least 10 digits)' : '',
        dateOfBirth: dob && dob > form.dateOfBirth.max ? 'Date of birth cannot be in the future' : '',
      };
    }
    if (n === 3) {
      var u = val('username'), p = form.password.value;
      return {
        username: !u ? 'Username is required' : u.length < 3 ? 'Username must be at least 3 characters' : '',
        password: !p ? 'Password is required' : p.length < 8 ? 'Password must be at least 8 characters' : '',
        confirmPassword: p && form.confirmPassword.value !== p ? 'Passwords do not match' : '',
      };
    }
    if (n === 4) {
      return { photos: uploading ? 'Please wait for the upload to finish' : photos.length ? '' : 'Please upload at least one photo' };
    }
    return {};
  }

  /** Show errors for step n; returns true when the step is valid. */
  function validateStep(n) {
    var errors = validators(n);
    var first = null;
    Object.keys(errors).forEach(function (k) {
      MIS.setFieldError(form, k, errors[k]);
      if (errors[k] && !first) first = k;
    });
    if (first) {
      var target = first === 'photos' ? $('#photo-input') : form[first];
      if (step === n && target) target.focus();
    }
    return !first;
  }

  function checkAvailability(kind, value, call, takenMessage) {
    if (available[kind] === value) return Promise.resolve(true);
    return call(value).then(function (res) {
      // Only an explicit "not available" blocks; the server re-checks on submit.
      if (res.ok && res.data && res.data.available === false) {
        MIS.setFieldError(form, kind, (res.data.message) || takenMessage);
        form[kind].focus();
        return false;
      }
      if (res.ok) available[kind] = value;
      return true;
    });
  }

  // ---- Step navigation -----------------------------------------------------

  function showStep(n, opts) {
    if (recorder.active) stopRecording(true);
    step = n;
    store.set('step', n);
    $$('[data-step]', form).forEach(function (sec) { sec.hidden = Number(sec.dataset.step) !== n; });
    $$('#stepper li').forEach(function (li, i) {
      var state = i + 1 < n ? 'done' : i + 1 === n ? 'current' : 'todo';
      li.dataset.state = state;
      var btn = li.querySelector('button');
      btn.disabled = state === 'todo';
      if (state === 'current') btn.setAttribute('aria-current', 'step'); else btn.removeAttribute('aria-current');
    });
    backBtn.hidden = n === 1;
    nextBtn.textContent = n < 4 ? 'Continue' : n === 4 ? 'Continue to oath' : 'Submit application';
    if (n === 5) renderReview();
    updateSubmitState();
    if (!opts || !opts.initial) {
      window.scrollTo(0, 0);
      var heading = $('[data-step="' + n + '"] h1', form);
      if (heading) heading.focus({ preventScroll: true });
    }
  }

  function updateSubmitState() {
    var policiesDone = POLICY_KEYS.every(function (k) { return policies[k]; });
    $('[data-todo="oath"]').dataset.done = String(!!oath);
    $('[data-todo="policies"]').dataset.done = String(policiesDone);
    $('#todo-box').hidden = !!oath && policiesDone;
    if (!busy) nextBtn.disabled = step === 5 && !(oath && policiesDone);
  }

  function setBusy(on, label) {
    busy = on;
    MIS.setLoading(nextBtn, on, label);
    backBtn.disabled = on;
    if (!on) updateSubmitState();
  }

  function next() {
    if (busy) return;
    if (!validateStep(step)) {
      if (step !== 4) MIS.toast('error', 'Please fix the highlighted fields.');
      return;
    }
    if (step === 1) {
      setBusy(true, 'Checking…');
      checkAvailability('email', val('email').toLowerCase(), MIS.api.checkEmail, 'This email is already registered').then(function (free) {
        setBusy(false);
        if (free) showStep(2);
      });
    } else if (step === 3) {
      setBusy(true, 'Checking…');
      checkAvailability('username', val('username'), MIS.api.checkUsername, 'This username is already taken').then(function (free) {
        setBusy(false);
        if (free) showStep(4);
      });
    } else if (step === 5) {
      submit();
    } else {
      showStep(step + 1);
    }
  }

  form.addEventListener('submit', function (e) { e.preventDefault(); next(); });
  backBtn.addEventListener('click', function () { if (!busy && step > 1) showStep(step - 1); });
  $$('#stepper [data-goto]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var n = Number(btn.dataset.goto);
      if (!busy && n < step) showStep(n);
    });
  });

  // ---- Photos --------------------------------------------------------------

  var drop = $('#drop');
  var photoInput = $('#photo-input');
  var photoList = $('#photo-list');
  var photoProgress = $('#photo-progress');

  function savePhotos() {
    if (!store.set('photos', photos)) {
      // Storage full: keep the upload ids, drop the previews.
      store.set('photos', photos.map(function (p) { return { id: p.id, url: p.url, name: p.name, thumb: null }; }));
    }
  }

  function renderPhotos() {
    var full = photos.length >= cfg.maxPhotos;
    photoInput.disabled = full || uploading;
    drop.classList.toggle('is-disabled', full || uploading);
    $('[data-drop-title]').textContent = uploading ? 'Uploading…' : full ? 'Maximum number of photos reached' : 'Click to choose photos, or drag them here';
    $('[data-drop-hint]').textContent = 'PNG or JPG, up to ' + cfg.maxPhotoMB + 'MB each (' + photos.length + '/' + cfg.maxPhotos + ')';
    photoList.textContent = '';
    photos.forEach(function (p, i) {
      var li = document.createElement('li');
      var src = p.thumb || (p.url ? cfg.apiBaseUrl + p.url : '');
      if (src) {
        var img = document.createElement('img');
        img.src = src;
        img.alt = 'Photo ' + (i + 1);
        li.appendChild(img);
      } else {
        var name = document.createElement('span');
        name.className = 'photos__name';
        name.textContent = p.name || 'Photo ' + (i + 1);
        li.appendChild(name);
      }
      var rm = document.createElement('button');
      rm.type = 'button';
      rm.textContent = '×';
      rm.setAttribute('aria-label', 'Remove photo ' + (i + 1));
      rm.addEventListener('click', function () {
        photos.splice(i, 1);
        savePhotos();
        renderPhotos();
      });
      li.appendChild(rm);
      photoList.appendChild(li);
    });
  }

  /** Small JPEG data-URL preview so thumbnails survive a refresh. */
  function makeThumb(file) {
    return new Promise(function (resolve) {
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        try {
          var scale = Math.min(1, 240 / Math.max(img.width, img.height));
          var canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(img.width * scale));
          canvas.height = Math.max(1, Math.round(img.height * scale));
          canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        } catch (e) { resolve(null); }
        URL.revokeObjectURL(url);
      };
      img.onerror = function () { URL.revokeObjectURL(url); resolve(null); };
      img.src = url;
    });
  }

  function setPhotoProgress(fraction) {
    var pct = Math.round(fraction * 100);
    photoProgress.firstElementChild.style.width = pct + '%';
    photoProgress.setAttribute('aria-valuenow', pct);
  }

  function addFiles(fileList) {
    if (uploading) return;
    var files = Array.prototype.slice.call(fileList).filter(function (f) {
      if (f.type.indexOf('image/') !== 0) { MIS.toast('error', f.name + ' is not an image'); return false; }
      if (f.size > cfg.maxPhotoMB * 1024 * 1024) { MIS.toast('error', f.name + ' is too large (max ' + cfg.maxPhotoMB + 'MB)'); return false; }
      return true;
    });
    var slots = cfg.maxPhotos - photos.length;
    if (files.length > slots) {
      MIS.toast('warning', 'Only ' + cfg.maxPhotos + ' photos are allowed — ' + (files.length - slots) + ' skipped.');
      files = files.slice(0, slots);
    }
    if (!files.length) return;

    uploading = true;
    MIS.setFieldError(form, 'photos', '');
    photoProgress.hidden = false;
    setPhotoProgress(0);
    renderPhotos();

    var i = 0;
    (function uploadNext() {
      if (i >= files.length) {
        uploading = false;
        photoProgress.hidden = true;
        renderPhotos();
        return;
      }
      var file = files[i];
      Promise.all([
        makeThumb(file),
        MIS.api.uploadPhoto(file, function (p) { setPhotoProgress((i + p) / files.length); }),
      ]).then(function (out) {
        var res = out[1];
        if (res.ok && res.data && res.data.file_id) {
          photos.push({ id: res.data.file_id, url: res.data.url || '', thumb: out[0], name: file.name });
          savePhotos();
          renderPhotos();
        } else {
          MIS.toast('error', 'Could not upload ' + file.name + ': ' + (res.error || 'unknown error'));
        }
        i++;
        setPhotoProgress(i / files.length);
        uploadNext();
      });
    })();
  }

  photoInput.addEventListener('change', function () { addFiles(photoInput.files); photoInput.value = ''; });
  ['dragenter', 'dragover'].forEach(function (ev) {
    drop.addEventListener(ev, function (e) { e.preventDefault(); if (!photoInput.disabled) drop.classList.add('is-over'); });
  });
  ['dragleave', 'drop'].forEach(function (ev) {
    drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove('is-over'); });
  });
  drop.addEventListener('drop', function (e) {
    if (!photoInput.disabled && e.dataTransfer && e.dataTransfer.files) addFiles(e.dataTransfer.files);
  });

  // ---- Oath recording ------------------------------------------------------

  var recorder = { active: false, media: null, stream: null, chunks: [], blob: null, url: null, startedAt: 0, seconds: 0, tick: null, audioCtx: null, raf: null, discard: false };
  var recBtn = $('#rec-btn');
  var canRecord = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);

  function fmt(seconds) { return Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2, '0'); }

  function showRecorder(view) { // capture | review | saved
    $('#rec-capture').hidden = view !== 'capture' || !canRecord;
    $('#rec-unsupported').hidden = view !== 'capture' || canRecord;
    $('#rec-review').hidden = view !== 'review';
    $('#rec-saved').hidden = view !== 'saved';
    if (view === 'saved' && oath) $('#rec-saved-duration').textContent = fmt(oath.duration || 0);
  }

  function setRecordingUi(on) {
    recBtn.setAttribute('aria-pressed', String(on));
    recBtn.setAttribute('aria-label', on ? 'Stop recording' : 'Start recording');
    $('[data-icon="mic"]', recBtn).toggleAttribute('hidden', on);
    $('[data-icon="stop"]', recBtn).toggleAttribute('hidden', !on);
    $('#rec-hint').textContent = on ? 'Recording… click to stop' : 'Click to start recording';
    $('#rec-live').hidden = !on;
  }

  function startMeter(stream) {
    var Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    try {
      recorder.audioCtx = new Ctx();
      var analyser = recorder.audioCtx.createAnalyser();
      analyser.fftSize = 64;
      recorder.audioCtx.createMediaStreamSource(stream).connect(analyser);
      var bins = new Uint8Array(analyser.frequencyBinCount);
      var bars = $$('#rec-levels span');
      (function draw() {
        analyser.getByteFrequencyData(bins);
        bars.forEach(function (bar, i) { bar.style.height = 4 + Math.round((bins[i + 1] / 255) * 32) + 'px'; });
        recorder.raf = requestAnimationFrame(draw);
      })();
    } catch (e) { /* the meter is decorative */ }
  }

  function stopMeter() {
    if (recorder.raf) cancelAnimationFrame(recorder.raf);
    if (recorder.audioCtx) recorder.audioCtx.close().catch(function () {});
    recorder.raf = recorder.audioCtx = null;
  }

  function startRecording() {
    navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
      recorder.stream = stream;
      recorder.chunks = [];
      recorder.discard = false;
      recorder.media = new MediaRecorder(stream);
      recorder.media.ondataavailable = function (e) { if (e.data.size) recorder.chunks.push(e.data); };
      recorder.media.onstop = onRecordingStopped;
      recorder.media.start();
      recorder.active = true;
      recorder.startedAt = Date.now();
      $('#rec-time').textContent = '0:00';
      setRecordingUi(true);
      startMeter(stream);
      recorder.tick = setInterval(function () {
        var s = Math.floor((Date.now() - recorder.startedAt) / 1000);
        $('#rec-time').textContent = fmt(s);
        if (s >= MAX_OATH_SECONDS) stopRecording(false);
      }, 250);
    }).catch(function () {
      MIS.toast('error', 'Could not access the microphone. Please allow microphone access and try again.');
    });
  }

  function stopRecording(discard) {
    if (!recorder.active) return;
    recorder.active = false;
    recorder.discard = !!discard;
    recorder.seconds = Math.floor((Date.now() - recorder.startedAt) / 1000);
    clearInterval(recorder.tick);
    stopMeter();
    setRecordingUi(false);
    try { recorder.media.stop(); } catch (e) { /* already stopped */ }
  }

  function onRecordingStopped() {
    recorder.stream.getTracks().forEach(function (t) { t.stop(); });
    if (recorder.discard) return;
    if (recorder.seconds < cfg.minOathSeconds) {
      MIS.toast('warning', 'That recording was too short. Please read the full oath.');
      return;
    }
    recorder.blob = new Blob(recorder.chunks, { type: recorder.media.mimeType || 'audio/webm' });
    recorder.url = URL.createObjectURL(recorder.blob);
    $('#rec-audio').src = recorder.url;
    $('#rec-duration').textContent = fmt(recorder.seconds);
    showRecorder('review');
  }

  function resetRecording() {
    if (recorder.url) URL.revokeObjectURL(recorder.url);
    recorder.blob = recorder.url = null;
    $('#rec-audio').removeAttribute('src');
    oath = null;
    store.remove('oath');
    showRecorder('capture');
    updateSubmitState();
  }

  recBtn.addEventListener('click', function () { if (recorder.active) stopRecording(false); else startRecording(); });
  $$('[data-rec-reset]').forEach(function (b) { b.addEventListener('click', resetRecording); });

  $('#rec-save').addEventListener('click', function () {
    var btn = this;
    if (!recorder.blob) return;
    MIS.setLoading(btn, true, 'Saving…');
    MIS.api.uploadAudio(recorder.blob).then(function (res) {
      MIS.setLoading(btn, false);
      if (!res.ok || !res.data || !res.data.file_id) {
        MIS.toast('error', res.error || 'Could not save the recording. Please try again.');
        return;
      }
      oath = { id: res.data.file_id, duration: recorder.seconds };
      store.set('oath', oath);
      showRecorder('saved');
      updateSubmitState();
      MIS.toast('success', 'Oath recording saved.');
    });
  });

  // ---- Policies ------------------------------------------------------------

  function renderPolicies() {
    var count = POLICY_KEYS.filter(function (k) { return policies[k]; }).length;
    $('#policy-count').textContent = count;
    $('#policy-progress span').style.width = (count / POLICY_KEYS.length) * 100 + '%';
    updateSubmitState();
  }
  $$('#policies input').forEach(function (box) {
    box.checked = !!policies[box.value];
    box.addEventListener('change', function () {
      policies[box.value] = box.checked;
      store.set('policies', policies);
      renderPolicies();
    });
  });

  // ---- Review & submit -----------------------------------------------------

  function renderReview() {
    var rows = [
      ['Name', (val('firstName') + ' ' + val('lastName')).trim()],
      ['Email', val('email')],
      ['Phone', val('phone')],
      ['Date of birth', val('dateOfBirth')],
      ['Occupation', val('occupation')],
      ['Address', [val('address'), val('city'), val('state'), val('postalCode'), val('country')].filter(Boolean).join(', ')],
      ['Username', val('username')],
      ['Photos', photos.length + ' uploaded'],
    ];
    var dl = $('#review');
    dl.textContent = '';
    rows.forEach(function (r) {
      var row = document.createElement('div');
      var dt = document.createElement('dt');
      var dd = document.createElement('dd');
      dt.textContent = r[0];
      dd.textContent = r[1] || '—';
      row.appendChild(dt);
      row.appendChild(dd);
      dl.appendChild(row);
    });
  }

  function submit() {
    // Earlier steps can have been invalidated (e.g. password lost on refresh).
    for (var n = 1; n <= 4; n++) {
      if (Object.values(validators(n)).some(Boolean)) {
        showStep(n);
        validateStep(n);
        MIS.toast('error', 'Please complete this step before submitting.');
        return;
      }
    }
    var session = MIS.session.get();
    if (!session) { MIS.go('invitation.html', 'warning', 'Your registration session expired. Please verify your invitation again.'); return; }

    var fullName = (val('firstName') + ' ' + val('lastName')).trim();
    var email = val('email').toLowerCase();
    var orNull = function (name) { return val(name) || null; };
    // Field names follow the backend UserRegister schema.
    var payload = {
      email: email,
      username: val('username'),
      password: form.password.value,
      full_name: fullName,
      phone: orNull('phone'),
      date_of_birth: orNull('dateOfBirth'),
      occupation: orNull('occupation'),
      address: orNull('address'),
      city: orNull('city'),
      state: orNull('state'),
      country: orNull('country'),
      postal_code: orNull('postalCode'),
      biography: orNull('bio'),
      invitation_id: session.invitationId,
      photo_ids: photos.map(function (p) { return p.id; }).join(','),
      audio_oath_id: oath.id,
    };

    setBusy(true, 'Submitting application…');
    MIS.api.submitRegistration(payload).then(function (res) {
      if (!res.ok) {
        setBusy(false);
        if (res.status === 503) MIS.checkStatus();
        MIS.toast('error', res.error || 'Submission failed. Please try again.');
        return;
      }
      var id = res.data && res.data.id;
      store.set('complete', {
        reference: id != null ? 'MIS-' + String(id).padStart(6, '0') : null,
        fullName: fullName,
        email: email,
        submittedAt: new Date().toISOString(),
      });
      store.clearFlow();
      location.replace('complete.html');
    });
  }

  // ---- Boot ----------------------------------------------------------------

  MIS.guardFlow();
  MIS.startStatus();
  MIS.session.mountTimer(function () {
    MIS.go('invitation.html', 'warning', 'Your registration session expired. Please verify your invitation again.');
  });

  renderPhotos();
  showRecorder(oath ? 'saved' : 'capture');
  renderPolicies();
  if (step > 3) {
    // The password is never stored, so after a reload it has to be re-entered.
    step = 3;
    MIS.toast('info', 'For your security your password is not saved — please re-enter it to continue.');
  }
  showStep(step, { initial: true });
})();
