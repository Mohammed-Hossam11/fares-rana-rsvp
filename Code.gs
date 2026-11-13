/**
 * Fares & Rana RSVP — Google Apps Script backend.
 * Create this script via Extensions > Apps Script from the client's Google Sheet.
 * Deploy as a Web App: Execute as Me; Who has access: Anyone.
 */
const SHEET_NAME = 'Wedding List';
const HEADERS = ['Received at', 'Submission ID', 'Guest name', 'Attending', 'Plus-one', 'Number of guests'];

function doPost(e) {
  const params = (e && e.parameter) || {};
  const id = String(params.submission_id || '').trim();
  try {
    const name = String(params.name || '').trim().replace(/\s+/g, ' ');
    const attendance = String(params.attendance || '');
    const plusOne = String(params.plus_one || '');
    const numberOfGuests = String(params.guest_count || '');
    if (!id || id.length > 120 || name.length < 2 || name.length > 80 ||
        !['yes', 'no'].includes(attendance) || !['yes', 'no'].includes(plusOne) ||
        (attendance === 'yes' && !['1', '2'].includes(numberOfGuests)) ||
        (attendance === 'no' && (plusOne !== 'no' || numberOfGuests !== '0')) ||
        (attendance === 'yes' && ((plusOne === 'yes') !== (numberOfGuests === '2')))) {
      return reply_({ type:'FARES_RANA_RSVP_RESULT', submission_id:id, ok:false, message:'Invalid response. Please refresh and try again.' });
    }

    const lock = LockService.getScriptLock();
    if (!lock.tryLock(25000)) {
      return reply_({ type:'FARES_RANA_RSVP_RESULT', submission_id:id, ok:false, message:'The RSVP service is busy. Please try again shortly.' });
    }
    try {
      const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
      if (!spreadsheet) throw new Error('Script must be bound to a Google Sheet');
      let sheet = spreadsheet.getSheetByName(SHEET_NAME);
      if (!sheet) sheet = spreadsheet.insertSheet(SHEET_NAME);
      if (sheet.getLastRow() === 0) {
        sheet.appendRow(HEADERS);
        sheet.setFrozenRows(1);
      }
      const lastRow = sheet.getLastRow();
      if (lastRow > 1) {
        const priorIds = sheet.getRange(2, 2, lastRow - 1, 1).getValues();
        if (priorIds.some(row => String(row[0]) === id)) {
          return reply_({ type:'FARES_RANA_RSVP_RESULT', submission_id:id, ok:true });
        }
      }
      sheet.appendRow([
        new Date(),
        safeCell_(id),
        safeCell_(name),
        attendance === 'yes' ? 'Yes' : 'No',
        attendance === 'yes' && plusOne === 'yes' ? 'Yes' : 'No',
        Number(numberOfGuests)
      ]);
      return reply_({ type:'FARES_RANA_RSVP_RESULT', submission_id:id, ok:true });
    } finally {
      lock.releaseLock();
    }
  } catch (error) {
    console.error(error);
    return reply_({ type:'FARES_RANA_RSVP_RESULT', submission_id:id, ok:false, message:'Your RSVP could not be saved. Please contact the organiser.' });
  }
}

function safeCell_(value) {
  const str = String(value);
  // Avoid interpreting user-submitted spreadsheet values as formulas.
  return /^[\s\t\r\n]*[=+\-@]/.test(str) ? "'" + str : str;
}

function reply_(data) {
  // Do not directly interpolate guest input into executable HTML.
  const json = JSON.stringify(data).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
  const html = '<!doctype html><html><head><meta charset="utf-8"></head><body>' +
    '<script>window.top.postMessage(' + json + ', "*");<\/script>' +
    '<p>Response processed. You may close this window.</p></body></html>';
  return HtmlService.createHtmlOutput(html)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
