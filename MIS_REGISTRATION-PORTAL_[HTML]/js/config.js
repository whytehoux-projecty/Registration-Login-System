/**
 * Deployment configuration — edit this file per environment.
 * It is the only file that should differ between local, staging and production.
 */
window.MIS_CONFIG = {
  // Central Auth API base URL (no trailing slash).
  apiBaseUrl: 'http://localhost:8000',

  // Registration session length once an invitation is verified.
  sessionTimeoutHours: 3,

  // How often the portal re-checks whether registration is open.
  statusPollSeconds: 30,

  // Photo step limits.
  maxPhotos: 5,
  maxPhotoMB: 5,

  // Shortest oath recording that will be accepted.
  minOathSeconds: 3,

  supportEmail: 'support@example.com',

  // Optional URLs for the policy documents. A policy with a URL is rendered as a
  // link (opens in a new tab); without one it is rendered as plain text.
  policyLinks: {
    terms: '',
    privacy: '',
    conduct: '',
    ethics: '',
  },

  // Demo mode replaces the backend with an in-browser mock so the whole flow can
  // be clicked through without the API. It can also be toggled per browser tab
  // with ?demo=1 / ?demo=0 on any page. Keep this false in production.
  demo: false,
};
