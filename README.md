# SPACE Registration Portal — static HTML / CSS / JS build

A dependency-free rebuild of the React portal (`MIS_REGISTRATION-SYSTEM_[RS]/` on the `main` branch).
This branch contains only the static build, with `index.html` at the repository root.
No build step, no framework, no npm: open the files or serve the folder.

## Run it

```bash
python3 -m http.server 4173
```

Then open <http://localhost:4173/>.

- **With the backend:** set `apiBaseUrl` in `js/config.js` (default `http://localhost:8000`) and make sure the
  portal's origin is in the API's `ALLOWED_ORIGINS`.
- **Without the backend (demo mode):** add `?demo=1` to any URL, e.g. <http://localhost:4173/?demo=1>.
  The API is replaced by an in-browser mock for that tab. Invitation `SPC-DEMO01`, PIN `1234`.
  The yellow bar lets you switch the system between open / closing soon / closed. `?demo=0` turns it off.

Deploy by uploading this folder to any static host. `js/config.js` is the only per-environment file.

## Structure

```
index.html        Landing: hero, features, how it works
interest.html     Waitlist form (always on) + gated entry to registration
invitation.html   Invitation code + PIN verification, starts the 3-hour session
register.html     5 steps: personal, address, credentials, photos, oath & policies
complete.html     Confirmation with the reference number
css/styles.css    All styles (design tokens at the top)
js/config.js      Environment configuration
js/core.js        Storage, toasts, session timer, live status beacon, offline guard
js/api.js         API client (fetch/XHR) and the demo mock
js/<page>.js      One script per page
assets/           SPACE emblem, Whytehoux logo, favicon
```

## Backend endpoints used

| Method | Endpoint | Used for |
| --- | --- | --- |
| GET | `/api/system/status` (+ WS `/api/system/ws`) | Online / closing soon / offline beacon and guard |
| POST | `/api/waitlist/submit` | Interest form |
| POST | `/api/invitation/verify` | Invitation code + PIN |
| GET | `/api/register/check-email`, `/check-username` | Availability checks |
| POST | `/api/upload/photo`, `/api/upload/audio` | Photos and oath recording |
| POST | `/api/register/` | Final submission |

## What changed from the React build

Behaviour that was broken and is fixed here:

- **Step 1 could not be passed.** It validated username and password, which are only entered on step 3,
  and those errors were never displayed. Each step now validates its own fields.
- **Submission payload did not match the API schema.** It sent `bio`, `oath_recording_id` and
  `photo_ids: []`; the backend expects `biography`, `audio_oath_id`, `photo_ids` as a comma-separated
  string and `invitation_id`. Uploaded photo ids were never sent at all. All are now sent correctly.
- **Password was written to `sessionStorage`** in plain text (twice). It is now never stored; after a
  reload the applicant re-enters it.
- **Session expiry was computed but never acted on.** The timer now warns at 15 and 5 minutes and, on
  expiry, clears the data and returns to the invitation page.
- **Progress bars never rendered** (runtime-built Tailwind classes such as `w-[${n}%]` are not generated).
- **Reference number was invented client-side** and submission time changed on every refresh. The
  reference now derives from the pending-user id returned by the API and the timestamp is stored once.
- **Audio type was hard-coded to WebM**, which mislabels Safari recordings. The recorder's real type is used.
- 422 validation errors from FastAPI (a list, not a string) are now shown as readable text.

UX and design changes:

- New SPACE emblem throughout; Whytehoux logo kept. One monochrome system (ink, paper, white, square
  corners) with colour reserved for status and validation. The emerald/blue/purple glass section and the
  hot-linked stock image are gone.
- Landing page has real calls to action instead of a single corner arrow, a "how it works" section, and a
  compact footer instead of an empty full-height one.
- Oath and policies are step 5 of the same stepper instead of a surprise extra page.
- Inline field errors, confirm-password, show/hide toggles, a strength meter based on more than length.
- Photos: drag and drop, thumbnails that survive a refresh, remove buttons that work on touch.
- Oath: live input level meter, minimum length, listen back before saving, clear "saved" state.
- Review-your-details panel before submitting; the submit button explains what is still missing.
- Interest form shows an inline confirmation and exposes the optional `role` field the API already accepts.
- One shared status module (polling plus the WebSocket push) instead of three copies.
- Works on phones: form rows collapse, stepper condenses, no horizontal scrolling.

Deliberately left out:

- **"Check application status" button.** The old one called a stub that always answered "pending"; there
  is no backend endpoint for it yet.
- **Policy links.** They pointed at dead `#anchors`. Set real URLs in `policyLinks` in `js/config.js` and
  they become links.

Fonts: headings use Graduate (Google Fonts, OFL). The Varcity font in the React build is licensed for
personal use only.
