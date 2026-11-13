/**
 * Core helpers shared by every page: config, storage, toasts, the registration
 * session + countdown, the live system-status beacon and the offline guard.
 * Exposes a single global: window.MIS
 */
(function () {
  'use strict';

  var cfg = Object.assign(
    {
      apiBaseUrl: 'http://localhost:8000',
      sessionTimeoutHours: 3,
      statusPollSeconds: 30,
      maxPhotos: 5,
      maxPhotoMB: 5,
      minOathSeconds: 3,
      supportEmail: 'support@example.com',
      policyLinks: {},
      demo: false,
    },
    window.MIS_CONFIG || {}
  );
  cfg.apiBaseUrl = String(cfg.apiBaseUrl || '').replace(/\/+$/, '');

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  // ---- Storage (sessionStorage, JSON, namespaced) -------------------------

  var PREFIX = 'mis.';
  var FLOW_KEYS = ['session', 'form', 'photos', 'oath', 'policies', 'step'];

  var store = {
    get: function (key, fallback) {
      try {
        var raw = sessionStorage.getItem(PREFIX + key);
        return raw === null ? fallback : JSON.parse(raw);
      } catch (e) {
        return fallback;
      }
    },
    set: function (key, value) {
      try { sessionStorage.setItem(PREFIX + key, JSON.stringify(value)); return true; } catch (e) { return false; }
    },
    remove: function (key) {
      try { sessionStorage.removeItem(PREFIX + key); } catch (e) { /* ignore */ }
    },
    /** Remove everything belonging to an in-progress registration. */
    clearFlow: function () { FLOW_KEYS.forEach(store.remove); },
  };

  // ---- Demo mode -----------------------------------------------------------

  var demoParam = new URLSearchParams(location.search).get('demo');
  if (demoParam === '1') store.set('demo', true);
  if (demoParam === '0') store.set('demo', false);
  var demo = store.get('demo', !!cfg.demo);

  // ---- Toasts --------------------------------------------------------------

  var toastHost;
  function toast(type, message, ms) {
    if (!toastHost) {
      toastHost = document.createElement('div');
      toastHost.className = 'toasts';
      toastHost.setAttribute('aria-live', 'polite');
      document.body.appendChild(toastHost);
    }
    var el = document.createElement('div');
    el.className = 'toast toast--' + type;
    el.setAttribute('role', type === 'error' ? 'alert' : 'status');
    var p = document.createElement('p');
    p.textContent = message;
    var close = document.createElement('button');
    close.type = 'button';
    close.setAttribute('aria-label', 'Dismiss');
    close.textContent = '×';
    var remove = function () { if (el.parentNode) el.parentNode.removeChild(el); };
    close.addEventListener('click', remove);
    el.appendChild(p);
    el.appendChild(close);
    toastHost.appendChild(el);
    setTimeout(remove, ms || 6000);
  }

  /** Queue a toast to be shown after the next page navigation. */
  function flash(type, message) { store.set('flash', { type: type, message: message }); }

  function go(url, flashType, flashMessage) {
    if (flashType) flash(flashType, flashMessage);
    location.assign(url);
  }

  // ---- Small UI helpers ----------------------------------------------------

  function setLoading(btn, loading, busyLabel) {
    if (loading) {
      btn.dataset.label = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner" aria-hidden="true"></span>' + (busyLabel || 'Please wait…');
    } else if (btn.dataset.label !== undefined) {
      btn.innerHTML = btn.dataset.label;
      delete btn.dataset.label;
      btn.disabled = false;
    }
  }

  /** Show or clear an inline validation message for the input named `name`. */
  function setFieldError(root, name, message) {
    var input = $('[name="' + name + '"]', root);
    var out = $('[data-error-for="' + name + '"]', root);
    if (input) {
      if (message) input.setAttribute('aria-invalid', 'true');
      else input.removeAttribute('aria-invalid');
    }
    if (out) {
      out.textContent = message || '';
      out.hidden = !message;
    }
  }

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // ---- Registration session ------------------------------------------------

  var SESSION_SECONDS = cfg.sessionTimeoutHours * 3600;

  var session = {
    get: function () {
      var s = store.get('session', null);
      if (!s || !s.startTime) return null;
      if (session.remainingFor(s) <= 0) { store.clearFlow(); return null; }
      return s;
    },
    start: function (invitationCode, invitationId) {
      var s = { startTime: Date.now(), invitationCode: invitationCode, invitationId: invitationId == null ? null : invitationId };
      store.set('session', s);
      return s;
    },
    remainingFor: function (s) { return SESSION_SECONDS - Math.floor((Date.now() - s.startTime) / 1000); },
    remaining: function () { var s = session.get(); return s ? session.remainingFor(s) : 0; },
    format: function (seconds) {
      var h = Math.floor(seconds / 3600), m = Math.floor((seconds % 3600) / 60), s = seconds % 60;
      return h + ':' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
    },
    /**
     * Drive every [data-timer] element. Warns at 15 and 5 minutes and calls
     * onExpire once when the session runs out.
     */
    mountTimer: function (onExpire) {
      var els = $$('[data-timer]');
      var warned = {};
      function tick() {
        var s = store.get('session', null);
        if (!s) { els.forEach(function (el) { el.hidden = true; }); return; }
        var left = session.remainingFor(s);
        if (left <= 0) {
          clearInterval(handle);
          store.clearFlow();
          if (onExpire) onExpire();
          return;
        }
        var level = left < 300 ? 'danger' : left < 900 ? 'warn' : 'ok';
        els.forEach(function (el) {
          el.hidden = false;
          el.dataset.level = level;
          var out = $('[data-timer-value]', el);
          if (out) out.textContent = session.format(left);
        });
        [900, 300].forEach(function (mark) {
          if (left <= mark && left > mark - 5 && !warned[mark]) {
            warned[mark] = true;
            toast('warning', 'Your registration session expires in ' + mark / 60 + ' minutes.');
          }
        });
      }
      var handle = setInterval(tick, 1000);
      tick();
    },
  };

  // ---- System status -------------------------------------------------------
  // state: checking | open | warning | closed | unknown

  var status = { state: 'checking', data: null, message: 'Checking system status…' };
  var listeners = [];

  function statusLabel() {
    switch (status.state) {
      case 'open': return 'MIS Online';
      case 'warning': return 'Closing soon' + (status.data && status.data.minutes_until_close != null ? ' (' + status.data.minutes_until_close + ' min)' : '');
      case 'closed': return 'MIS Offline';
      case 'unknown': return 'Status unknown';
      default: return 'Checking…';
    }
  }

  function applyStatus(data, fallbackMessage) {
    var prev = status.state;
    if (!data || !data.status) {
      status.state = 'unknown';
      status.data = null;
      status.message = fallbackMessage || 'Unable to determine system status';
    } else {
      status.data = data;
      status.message = data.message || '';
      status.state = data.status === 'closed' ? 'closed' : data.warning ? 'warning' : 'open';
    }
    document.body.dataset.status = status.state;
    $$('[data-beacon]').forEach(function (el) {
      el.dataset.state = status.state;
      el.title = status.message;
      var label = $('[data-beacon-label]', el);
      if (label) label.textContent = statusLabel();
    });
    $$('[data-closing]').forEach(function (el) {
      el.hidden = status.state !== 'warning';
      var out = $('[data-closing-text]', el);
      if (out) {
        var mins = status.data && status.data.minutes_until_close;
        out.textContent = 'Registration closes in ' + (mins != null ? mins + ' minutes' : 'a few minutes') + ' — please finish soon.';
      }
    });
    listeners.forEach(function (fn) { fn(status, prev); });
  }

  function checkStatus() {
    return window.MIS.api.getSystemStatus().then(function (res) {
      applyStatus(res.ok ? res.data : null, res.ok ? null : 'Connection error');
      return status;
    });
  }

  function connectStatusSocket() {
    if (demo || !('WebSocket' in window) || !/^https?:/.test(cfg.apiBaseUrl)) return;
    var attempts = 0;
    (function connect() {
      var ws;
      try { ws = new WebSocket(cfg.apiBaseUrl.replace(/^http/, 'ws') + '/api/system/ws'); } catch (e) { return; }
      ws.onopen = function () { attempts = 0; };
      ws.onmessage = function (ev) {
        try { applyStatus(JSON.parse(ev.data)); } catch (e) { /* ignore malformed frames */ }
      };
      // Polling keeps working without the socket, so give up after a few tries.
      ws.onclose = function () { if (++attempts <= 3) setTimeout(connect, 3000 * attempts); };
    })();
  }

  function startStatus(onChange) {
    if (onChange) listeners.push(onChange);
    checkStatus();
    setInterval(checkStatus, cfg.statusPollSeconds * 1000);
    connectStatusSocket();
  }

  /**
   * For pages that need registration to be open: when the system reports
   * closed, cover the page and send the visitor back to the interest form.
   * Saved progress stays in sessionStorage so they can resume later.
   */
  function guardFlow() {
    var redirecting = false;
    listeners.push(function (s) {
      if (s.state !== 'closed' || redirecting) return;
      redirecting = true;
      var overlay = document.createElement('div');
      overlay.className = 'overlay';
      overlay.setAttribute('role', 'alertdialog');
      overlay.setAttribute('aria-label', 'Registration offline');
      overlay.innerHTML =
        '<div class="card"><div class="spinner" aria-hidden="true"></div>' +
        '<h1 class="display card__title">Registration offline</h1>' +
        '<p class="muted" style="margin-top:.75rem" data-msg></p>' +
        '<p class="small muted" style="margin-top:.5rem">Your progress is saved in this tab. Taking you to the interest page…</p></div>';
      $('[data-msg]', overlay).textContent = s.message;
      document.body.appendChild(overlay);
      setTimeout(function () { location.replace('interest.html'); }, 2500);
    });
  }

  // ---- Demo bar ------------------------------------------------------------

  function mountDemoBar() {
    var bar = document.createElement('div');
    bar.className = 'demo-bar';
    bar.innerHTML =
      '<strong>Demo mode</strong><span>No backend — data stays in this tab.</span>' +
      '<span>Invitation <code>SPC-DEMO01</code> · PIN <code>1234</code></span>' +
      '<label>System <select data-demo-status><option value="open">Open</option><option value="warning">Closing soon</option><option value="closed">Closed</option></select></label>' +
      '<a href="?demo=0">Exit demo</a>';
    document.body.appendChild(bar);
    document.body.classList.add('has-demo-bar');
    var select = $('[data-demo-status]', bar);
    select.value = store.get('demoStatus', 'open');
    select.addEventListener('change', function () {
      store.set('demoStatus', select.value);
      checkStatus();
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (demo) mountDemoBar();
    var f = store.get('flash', null);
    if (f) { store.remove('flash'); toast(f.type, f.message); }
    $$('[data-support-email]').forEach(function (a) {
      a.textContent = cfg.supportEmail;
      a.href = 'mailto:' + cfg.supportEmail;
    });
    // Policy names become links only when a real document URL is configured.
    $$('[data-policy]').forEach(function (span) {
      var url = (cfg.policyLinks || {})[span.dataset.policy];
      if (!url) { span.style.fontWeight = '600'; return; }
      var link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener';
      link.textContent = span.textContent;
      span.replaceWith(link);
    });
    // Show / hide buttons for password-style inputs.
    $$('[data-toggle]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var input = $('[name="' + btn.dataset.toggle + '"]', btn.closest('form') || document);
        var show = input.type === 'password';
        input.type = show ? 'text' : 'password';
        btn.textContent = show ? 'Hide' : 'Show';
        btn.setAttribute('aria-pressed', String(show));
      });
    });
  });

  window.MIS = {
    cfg: cfg,
    demo: demo,
    $: $,
    $$: $$,
    store: store,
    toast: toast,
    flash: flash,
    go: go,
    setLoading: setLoading,
    setFieldError: setFieldError,
    EMAIL_RE: EMAIL_RE,
    session: session,
    status: status,
    startStatus: startStatus,
    checkStatus: checkStatus,
    guardFlow: guardFlow,
  };
})();
