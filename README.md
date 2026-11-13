# Fares & Rana — Wedding RSVP

An original, responsive wedding RSVP website inspired by the client's cream-and-brown invitation. Uses vanilla HTML, CSS, JavaScript and optional Google Apps Script + Sheets as the RSVP backend.

**Couple:** Fares & Rana  
**Date:** Thursday, 10 December 2026  
**Venue:** The Nile Ritz-Carlton, Cairo, Egypt  
**Guest form:** Name → Attending? → Plus-one? (only if attending) → Review → Submit

## Preview on your computer

Open `index.html` in a browser, or use VS Code's Live Server extension. The RSVP wizard works immediately **in preview mode**; no submission is saved until you complete the backend setup.

## Connect the Google Sheet (client owns the guest list)

1. From **the client's Google account**, create a Google Sheet named `Fares & Rana RSVPs`.
2. In the sheet choose **Extensions → Apps Script**.
3. Replace `Code.gs` in that editor with the content of `Code.gs` included here. Save.
4. Choose **Deploy → New deployment → Web app**. Select **Execute as: Me** (the client/Sheet owner) and **Who has access: Anyone**. Authorize requested Google Sheets permissions. Deploy.
5. Copy the Web App URL ending with `/exec`. In this project's `script.js`, replace the empty string in `const APPS_SCRIPT_URL = '';` with that URL.
6. Upload the updated static files to GitHub. Test a **real submission** and confirm a new row is present on the client's sheet. Also test a declined response, plus-one, mobile and your final live URL.
7. The client can filter the `RSVPs` tab. Example Sheets formulas (in a separate summary tab): `=COUNTIF(RSVPs!D2:D,"Yes")` for accepting responses, `=COUNTIF(RSVPs!D2:D,"No")` for declines, and `=SUM(RSVPs!F2:F)` for total attendees including plus-ones.

**Important:** Test the Google Apps Script iframe acknowledgement after actual deployment. Apps Script uses cross-domain HTML service URLs and its runtime/browser policy can change. If the response does not show success but the sheet row is added, do **not** repeatedly resubmit. Check the sheet first. Never assume a preview submission is saved.

Google's free Apps Script service has quotas and no absolute uptime guarantee. A public RSVP form may receive spam; the form is not password-protected. Sharing a personalized per-guest token and validating it server-side is a good upgrade when you need stricter guest management.

## Publish with GitHub Pages

1. On GitHub create a new **public** repository, e.g. `fares-rana-rsvp`.
2. Upload `index.html`, `styles.css`, `script.js` to the **repository root**. (`Code.gs` is only for Google Apps Script, not used by the browser.)
3. Under **Settings → Pages**, select **Deploy from a branch**, branch `main`, folder `/(root)`. Save.
4. The website link will be `https://YOUR-USERNAME.github.io/fares-rana-rsvp/`.
5. Share this **Pages URL** with guests; the code URL `https://github.com/YOUR-USERNAME/fares-rana-rsvp` is for developers.

## Edit details

- Change names, venue, date copy, and colour palette text in `index.html`.
- Update the countdown timestamp in `script.js` if the event date changes. It counts down to **7:00 PM Cairo time** on 10 December 2026 (the ceremony start). The save-the-date event lives in `fares-rana-wedding.ics` (iPhone/desktop, and Android fallback) and in `CALENDAR_EVENT` in `script.js` (Android intent); update both if the time changes.
- Change design colours via CSS variables at the top of `styles.css`.
- The colour palette is presented as *visual inspiration*, not a compulsory guest dress code. You can change this if the couple confirms a dress code.

## How submissions work

GitHub Pages hosts the public HTML website. The front-end posts its RSVP to the Apps Script Web App through an invisible iframe. The Apps Script validates the data and writes the response into the private Google Sheet. Its acknowledgement is sent back to the RSVP website via `postMessage`. Each send attempt has a submission ID so retrying the same uncertain attempt won't add a second row.

You may see duplicate guest names when different people share a name or guests submit from different devices; this intentionally does not auto-merge by name. Consider adding unique invitation codes for duplicate prevention if needed.

The Apps Script endpoint URL is *public*, not a secret. Never put private Google credentials or guest data in the GitHub repo.
