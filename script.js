'use strict';

/**
 * Paste the public /exec URL from your deployed Google Apps Script web app.
 * Until configured, the form runs in clearly labelled preview mode.
 */
const APPS_SCRIPT_URL = '';

// Ceremony: Thursday 10 December 2026, 7:00 PM Cairo time (UTC+2 in December).
const WEDDING_DATE = new Date('2026-12-10T19:00:00+02:00');
// Save-the-date: iPhone, Mac and desktop open the hosted .ics; Android goes to Google Calendar,
// because most Android phones cannot open .ics files directly.
const CALENDAR_ICS = 'fares-rana-wedding.ics';
const GOOGLE_CALENDAR_URL = 'https://calendar.google.com/calendar/render?action=TEMPLATE'
  + '&text=' + encodeURIComponent('Fares & Rana Wedding')
  + '&dates=20261210T190000/20261210T230000&ctz=Africa/Cairo'
  + '&location=' + encodeURIComponent('The Nile Ritz-Carlton, Cairo')
  + '&details=' + encodeURIComponent('Wedding celebration of Fares & Rana');
const isAndroid = /Android/i.test(navigator.userAgent);
// Universal Maps URL: opens the Google Maps app when installed, otherwise the browser.
const MAPS_URL = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent('The Nile Ritz-Carlton, Cairo, Egypt');
const form = document.getElementById('rsvp-form');
const formBody = document.getElementById('form-body');
const actions = document.getElementById('form-actions');
const formError = document.getElementById('form-error');
const nextButton = document.getElementById('next-button');
const backButton = document.getElementById('back-button');
const progressBar = document.getElementById('progress-bar');
const formCounter = document.getElementById('form-counter');
const frame = document.getElementById('response-frame');
const demoHint = document.getElementById('demo-hint');

let state = { name: '', attending: null, plusOne: null };
let currentStep = 'name';
let pendingId = null;
let responseTimeout = null;
let isSending = false;

const configured = /^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec(?:\?.*)?$/.test(APPS_SCRIPT_URL.trim());
demoHint.hidden = configured;

function updateCountdown() {
  const distance = Math.max(0, WEDDING_DATE.getTime() - Date.now());
  const values = {
    days: Math.floor(distance / 86400000),
    hours: Math.floor(distance % 86400000 / 3600000),
    minutes: Math.floor(distance % 3600000 / 60000),
    seconds: Math.floor(distance % 60000 / 1000)
  };
  for (const [key, value] of Object.entries(values)) {
    document.getElementById(key).textContent = String(value).padStart(2, '0');
  }
  if (distance === 0) document.getElementById('countdown-title').textContent = 'Our day is here.';
}
updateCountdown();
setInterval(updateCountdown, 1000);

function flow() {
  return state.attending === 'no' ? ['name', 'attendance', 'review'] : ['name', 'attendance', 'plusOne', 'review'];
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
}

function showError(message) {
  formError.textContent = message;
  formError.hidden = false;
}
function clearError() {
  formError.textContent = '';
  formError.hidden = true;
}

function render() {
  clearError();
  const steps = flow();
  const index = Math.max(0, steps.indexOf(currentStep));
  formCounter.textContent = `${String(index + 1).padStart(2, '0')} / ${String(steps.length).padStart(2, '0')}`;
  progressBar.style.width = `${(index + 1) / steps.length * 100}%`;
  backButton.hidden = index === 0;
  nextButton.disabled = false;
  nextButton.textContent = currentStep === 'review' ? 'SEND RESPONSE' : 'CONTINUE';
  actions.hidden = false;

  if (currentStep === 'name') {
    formBody.innerHTML = `
      <h3 class="step-title" id="question-title">What is your name?</h3>
      <label for="guest-name" class="sr-only">Your full name</label>
      <input class="name-input" type="text" id="guest-name" placeholder="Your full name..." maxlength="80" autocomplete="name" required value="${escapeHTML(state.name)}" />`;
    document.getElementById('guest-name').addEventListener('input', (event) => { state.name = event.target.value; });
  } else if (currentStep === 'attendance') {
    formBody.innerHTML = `
      <h3 class="step-title" id="question-title">Will you join us?</h3>
      <div class="choice-grid" role="group" aria-label="Attendance">
        <button type="button" class="choice ${state.attending === 'yes' ? 'is-selected' : ''}" aria-pressed="${state.attending === 'yes'}" data-choice="yes"><span class="choice-title">Joyfully, yes!</span><span class="choice-sub">I'll be there</span></button>
        <button type="button" class="choice ${state.attending === 'no' ? 'is-selected' : ''}" aria-pressed="${state.attending === 'no'}" data-choice="no"><span class="choice-title">Sadly, I can't make it</span><span class="choice-sub">Sending love from afar</span></button>
      </div>`;
    bindChoices('attending');
  } else if (currentStep === 'plusOne') {
    formBody.innerHTML = `
      <h3 class="step-title" id="question-title">Bringing a plus-one?</h3>
      <div class="choice-grid" role="group" aria-label="Plus-one">
        <button type="button" class="choice ${state.plusOne === 'no' ? 'is-selected' : ''}" aria-pressed="${state.plusOne === 'no'}" data-choice="no"><span class="choice-title">Just me</span><span class="choice-sub">One lovely guest</span></button>
        <button type="button" class="choice ${state.plusOne === 'yes' ? 'is-selected' : ''}" aria-pressed="${state.plusOne === 'yes'}" data-choice="yes"><span class="choice-title">Me + one</span><span class="choice-sub">Two lovely guests</span></button>
      </div>`;
    bindChoices('plusOne');
  } else if (currentStep === 'review') {
    const attendance = state.attending === 'yes' ? 'Happily attending' : 'Unable to attend';
    const guestCount = state.attending === 'no' ? '0' : state.plusOne === 'yes' ? '2' : '1';
    formBody.innerHTML = `
      <h3 class="step-title" id="question-title">Ready to send?</h3>
      <dl class="summary">
        <div class="summary-line"><dt>NAME</dt><dd>${escapeHTML(state.name.trim())}</dd></div>
        <div class="summary-line"><dt>RESPONSE</dt><dd>${attendance}</dd></div>
        <div class="summary-line"><dt>SEATS RESERVED</dt><dd>${guestCount}</dd></div>
      </dl>`;
  }
  formBody.setAttribute('aria-labelledby', 'question-title');
}

function bindChoices(field) {
  formBody.querySelectorAll('[data-choice]').forEach(button => {
    button.addEventListener('click', () => {
      state[field] = button.dataset.choice;
      if (field === 'attending' && state.attending === 'no') state.plusOne = 'no';
      if (field === 'attending' && state.attending === 'yes' && state.plusOne === 'no') {
        // Keep an existing answer if the user went backwards.
      }
      render();
    });
  });
}

function validateStep() {
  if (currentStep === 'name') {
    state.name = state.name.trim().replace(/\s+/g, ' ');
    if (state.name.length < 2 || state.name.length > 80) {
      showError('Please enter your full name (2–80 characters).');
      document.getElementById('guest-name')?.focus();
      return false;
    }
  } else if (currentStep === 'attendance' && !state.attending) {
    showError('Please choose whether you can attend.'); return false;
  } else if (currentStep === 'plusOne' && !state.plusOne) {
    showError('Please select one of the options.'); return false;
  }
  return true;
}

function showComplete(mode) {
  actions.hidden = true;
  demoHint.hidden = true;
  progressBar.style.width = '100%';
  formCounter.textContent = 'THANK YOU';
  const attending = state.attending === 'yes';
  let heading = attending ? 'See you there!' : 'Thank you, lovely.';
  let message = attending
    ? `Your RSVP has been received, ${escapeHTML(state.name)}. We can't wait to celebrate together.`
    : `Thank you for letting us know, ${escapeHTML(state.name)}. We'll miss you and send you all our love.`;
  if (mode === 'demo') {
    heading = 'Preview complete!';
    message = 'This is a design preview. No RSVP was saved. Connect the Google Apps Script URL to accept real guest responses.';
  }
  const calendar = attending
    ? `<div class="calendar-actions">
        <a class="calendar-button" href="${isAndroid ? escapeHTML(GOOGLE_CALENDAR_URL) : CALENDAR_ICS}"${isAndroid ? ' target="_blank" rel="noopener"' : ''}>ADD TO CALENDAR</a>
        <a class="calendar-button" href="${escapeHTML(MAPS_URL)}" target="_blank" rel="noopener">VIEW LOCATION</a>
      </div>`
    : '';
  formBody.innerHTML = `<div class="completed" role="status"><svg class="completed-symbol" viewBox="0 0 24 24" aria-hidden="true" fill="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78Z" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg><h3>${heading}</h3><p>${message}</p>${calendar}<button class="restart-button" type="button" id="restart-button">${mode === 'demo' ? 'TRY AGAIN' : 'SUBMIT ANOTHER RESPONSE'}</button></div>`;
  document.getElementById('restart-button').addEventListener('click', () => {
    state = { name:'', attending:null, plusOne:null };
    currentStep = 'name'; pendingId = null; demoHint.hidden = configured; render();
  });
}

function submitRSVP() {
  if (isSending) return;
  if (!configured) {
    showComplete('demo');
    return;
  }
  // The request ID is reused if the user retries after an uncertain network result.
  pendingId ||= (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `rsvp-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  isSending = true;
  nextButton.disabled = true;
  nextButton.textContent = 'SENDING…';
  clearError();

  const data = {
    submission_id: pendingId,
    name: state.name.trim(),
    attendance: state.attending,
    plus_one: state.attending === 'yes' ? state.plusOne : 'no',
    guest_count: state.attending === 'no' ? '0' : state.plusOne === 'yes' ? '2' : '1'
  };
  // A hidden-iframe POST avoids the unreliable CORS behavior of fetch() against
  // Apps Script. The Apps Script HTML response acknowledges success via postMessage.
  const requestForm = document.createElement('form');
  requestForm.method = 'POST';
  requestForm.action = APPS_SCRIPT_URL.trim();
  requestForm.target = frame.name;
  requestForm.style.display = 'none';
  for (const [key, value] of Object.entries(data)) {
    const input = document.createElement('input');
    input.type = 'hidden'; input.name = key; input.value = value;
    requestForm.append(input);
  }
  document.body.append(requestForm);
  requestForm.submit();
  requestForm.remove();

  responseTimeout = setTimeout(() => {
    isSending = false;
    nextButton.disabled = false;
    nextButton.textContent = 'TRY AGAIN';
    showError('We could not confirm the response. Please check with the organiser before trying again to avoid duplicates.');
  }, 30000);
}

window.addEventListener('message', (event) => {
  if (!configured || !isSending) return;
  // Apps Script can send acknowledgements from a nested sandboxed frame,
  // so source may not equal the outer form's iframe. Verify Google origin
  // and match the unpredictable submission ID instead.
  let responseHost;
  try { responseHost = new URL(event.origin).hostname; } catch { return; }
  if (responseHost !== 'script.google.com' && responseHost !== 'script.googleusercontent.com' && !responseHost.endsWith('.googleusercontent.com')) return;
  const data = event.data;
  if (!data || data.type !== 'FARES_RANA_RSVP_RESULT' || data.submission_id !== pendingId) return;
  clearTimeout(responseTimeout);
  isSending = false;
  nextButton.disabled = false;
  if (data.ok) showComplete('saved');
  else {
    nextButton.textContent = 'TRY AGAIN';
    showError(data.message || 'Something went wrong. Please try again.');
  }
});

// Keep the question and the field being typed in visible above the on-screen keyboard.
// While typing, scroll snapping is paused (it could pull the page back to the section top)
// and extra space is added below the form so the field can always scroll clear of the keyboard.
const root = document.documentElement;
const visual = window.visualViewport;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
function revealActiveField() {
  const field = document.activeElement;
  if (!field || field.tagName !== 'INPUT' || !form.contains(field)) return;
  const visibleTop = visual ? visual.offsetTop : 0;
  const visibleHeight = visual ? visual.height : window.innerHeight;
  const anchor = document.getElementById('question-title') || field;
  const anchorTop = anchor.getBoundingClientRect().top - visibleTop;
  const fieldBottom = field.getBoundingClientRect().bottom - visibleTop;
  if (anchorTop >= 12 && fieldBottom <= visibleHeight - 16) return;
  const offset = fieldBottom - anchorTop <= visibleHeight - 28 ? anchorTop - 12 : fieldBottom - (visibleHeight - 16);
  window.scrollBy({ top: offset, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
}
form.addEventListener('focusin', (event) => {
  if (event.target.tagName !== 'INPUT') return;
  root.classList.add('is-typing');
  setTimeout(revealActiveField, 350);
});
form.addEventListener('focusout', () => root.classList.remove('is-typing'));
if (visual) visual.addEventListener('resize', () => { if (root.classList.contains('is-typing')) revealActiveField(); });

form.addEventListener('submit', (event) => {
  event.preventDefault();
  if (isSending || !validateStep()) return;
  if (currentStep === 'review') { submitRSVP(); return; }
  const steps = flow();
  currentStep = steps[steps.indexOf(currentStep) + 1];
  render();
});
backButton.addEventListener('click', () => {
  if (isSending) return;
  const steps = flow();
  const index = steps.indexOf(currentStep);
  if (index > 0) { currentStep = steps[index - 1]; render(); }
});
render();
