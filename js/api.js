/**
 * API client for the Central Auth API.
 * Every method resolves (never rejects) with { ok, status, data, error }.
 * In demo mode the same interface is served by an in-browser mock.
 */
(function () {
  'use strict';

  var MIS = window.MIS;
  var cfg = MIS.cfg;
  var TIMEOUT_MS = 30000;

  /** FastAPI errors carry `detail` as a string, or a list of {msg} for 422s. */
  function errorMessage(body, fallback) {
    var d = body && (body.detail || body.message);
    if (typeof d === 'string') return d;
    if (Array.isArray(d)) {
      return d.map(function (e) { return (e && e.msg) || ''; }).filter(Boolean).join('; ') || fallback;
    }
    return fallback;
  }

  function fail(status, error) { return { ok: false, status: status, data: null, error: error }; }

  function request(method, path, opts) {
    opts = opts || {};
    var url = cfg.apiBaseUrl + path;
    if (opts.query) url += '?' + new URLSearchParams(opts.query).toString();
    var ctrl = new AbortController();
    var timer = setTimeout(function () { ctrl.abort(); }, TIMEOUT_MS);
    var init = { method: method, signal: ctrl.signal, headers: { Accept: 'application/json' } };
    if (opts.json !== undefined) {
      init.headers['Content-Type'] = 'application/json';
      init.body = JSON.stringify(opts.json);
    }
    return fetch(url, init)
      .then(function (res) {
        return res.json().catch(function () { return null; }).then(function (body) {
          if (res.ok) return { ok: true, status: res.status, data: body, error: null };
          return fail(res.status, errorMessage(body, 'Server error (' + res.status + ')'));
        });
      })
      .catch(function (err) {
        return fail(0, err && err.name === 'AbortError' ? 'The request timed out. Please try again.' : 'Network error. Please check your connection.');
      })
      .then(function (result) { clearTimeout(timer); return result; });
  }

  /** multipart upload with progress (fetch has no upload progress events). */
  function upload(path, blob, filename, onProgress) {
    return new Promise(function (resolve) {
      var form = new FormData();
      form.append('file', blob, filename);
      var xhr = new XMLHttpRequest();
      xhr.open('POST', cfg.apiBaseUrl + path);
      xhr.timeout = TIMEOUT_MS * 4;
      xhr.responseType = 'json';
      if (onProgress) {
        xhr.upload.onprogress = function (e) { if (e.lengthComputable) onProgress(e.loaded / e.total); };
      }
      xhr.onload = function () {
        if (xhr.status >= 200 && xhr.status < 300) resolve({ ok: true, status: xhr.status, data: xhr.response, error: null });
        else resolve(fail(xhr.status, errorMessage(xhr.response, 'Upload failed (' + xhr.status + ')')));
      };
      xhr.onerror = function () { resolve(fail(0, 'Network error. Please check your connection.')); };
      xhr.ontimeout = function () { resolve(fail(0, 'The upload timed out. Please try again.')); };
      xhr.send(form);
    });
  }

  /** Availability endpoints: a 404 means "endpoint not deployed" → don't block. */
  function availability(path, query) {
    return request('GET', path, { query: query }).then(function (res) {
      if (res.status === 404) return { ok: true, status: 404, data: { available: true, message: '' }, error: null };
      return res;
    });
  }

  function audioExtension(blob) {
    var t = (blob.type || '').toLowerCase();
    if (t.indexOf('mp4') !== -1 || t.indexOf('aac') !== -1) return '.m4a';
    if (t.indexOf('ogg') !== -1) return '.ogg';
    if (t.indexOf('wav') !== -1) return '.wav';
    return '.webm';
  }

  var live = {
    getSystemStatus: function () { return request('GET', '/api/system/status'); },

    submitInterest: function (d) {
      return request('POST', '/api/waitlist/submit', {
        json: {
          full_name: d.fullName.trim(),
          email: d.email.trim().toLowerCase(),
          phone: null,
          company: (d.company || '').trim() || null,
          role: (d.role || '').trim() || null,
        },
      });
    },

    verifyInvitation: function (code, pin) {
      return request('POST', '/api/invitation/verify', { json: { invitation_code: code, pin: pin } });
    },

    checkEmail: function (email) { return availability('/api/register/check-email', { email: email }); },
    checkUsername: function (username) { return availability('/api/register/check-username', { username: username }); },

    uploadPhoto: function (file, onProgress) { return upload('/api/upload/photo', file, file.name || 'photo.jpg', onProgress); },
    uploadAudio: function (blob) { return upload('/api/upload/audio', blob, 'oath_recording' + audioExtension(blob)); },

    /** `payload` must already match the backend UserRegister schema. */
    submitRegistration: function (payload) { return request('POST', '/api/register/', { json: payload }); },
  };

  // ---- Demo mock -----------------------------------------------------------

  function later(result, ms) {
    return new Promise(function (resolve) { setTimeout(function () { resolve(result); }, ms || 450); });
  }
  function ok(data) { return { ok: true, status: 200, data: data, error: null }; }
  function demoClosed() { return MIS.store.get('demoStatus', 'open') === 'closed'; }
  var CLOSED_MSG = 'Registration is currently closed. Please try during operating hours.';

  var mock = {
    getSystemStatus: function () {
      var s = MIS.store.get('demoStatus', 'open');
      if (s === 'closed') return later(ok({ status: 'closed', warning: false, message: 'System is closed. Hours: 09:00 - 17:00 UTC' }), 250);
      if (s === 'warning') return later(ok({ status: 'open', warning: true, minutes_until_close: 12, message: 'System closing in 12 minutes. Please save your work.' }), 250);
      return later(ok({ status: 'open', warning: false, message: 'System is operating normally' }), 250);
    },
    submitInterest: function () {
      return later(ok({ success: true, request_id: 1, message: 'Thank you for your interest! We will review your request and send you an invitation code via email if approved.' }), 700);
    },
    verifyInvitation: function (code, pin) {
      if (demoClosed()) return later(fail(503, CLOSED_MSG));
      if (code === 'SPC-DEMO01' && pin === '1234') return later(ok({ valid: true, invitation_id: 1, message: 'Invitation verified successfully' }), 700);
      return later(fail(400, 'Invalid invitation code or PIN'), 700);
    },
    checkEmail: function (email) { return later(ok({ available: email.toLowerCase() !== 'taken@example.com' })); },
    checkUsername: function (username) { return later(ok({ available: username.toLowerCase() !== 'taken' })); },
    uploadPhoto: function (file, onProgress) {
      return new Promise(function (resolve) {
        var p = 0;
        var t = setInterval(function () {
          p += 0.25;
          if (onProgress) onProgress(Math.min(p, 1));
          if (p >= 1) {
            clearInterval(t);
            resolve(ok({ success: true, file_id: 'demo-' + Math.random().toString(36).slice(2, 10) + '.jpg', url: '' }));
          }
        }, 120);
      });
    },
    uploadAudio: function () { return later(ok({ success: true, file_id: 'demo-oath.webm', url: '' }), 800); },
    submitRegistration: function (payload) {
      if (demoClosed()) return later(fail(503, CLOSED_MSG));
      return later(ok({ id: 1000 + Math.floor(Math.random() * 9000), email: payload.email, username: payload.username, full_name: payload.full_name, is_reviewed: false, created_at: new Date().toISOString() }), 1000);
    },
  };

  MIS.api = MIS.demo ? mock : live;
})();
