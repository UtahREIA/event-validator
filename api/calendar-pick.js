// Neutral calendar picker page - shows Google, Outlook, and Apple buttons
// Drop into event-validator/api/calendar-pick.js and push to GitHub
// Usage: /api/calendar-pick?mtg=1

const GHL_LOCATION_ID = 'DNirEjy0ejVwbHsaBYrn';
const GHL_API_KEY = process.env.GHL_API_KEY;

const CUSTOM_VALUE_IDS = {
  '1': { title: 'cI4UzRRiZW8O0eC19nEC', date2: '7FdI0ZQDfKk3eQ0SfwCc', times: 'ae02UdifT21VgzTkzEZB', locationName: 'AQSPO3urGhqZFMGHMfvh', locationAddress: 'J0jA6jNER6S5fS632JTm', desc: 'jgzjjv7KAiHoPSB0CoOk' },
  '2': { title: 'sMhH7nYt4UKLDKDJ0Ybs', date2: '5vBLsxKapZ1gydmxi7qT', times: 'kF7LYW07kCsJlZsjZT5B', locationName: 'NZRrs61KWEYZ1Abp4NPC', locationAddress: 'CPGD7vVUkjStYOLlY1cf', desc: 'cI9aO5OSLigUeUffBIho' },
  '3': { title: 'fqVHfWCsqUZ9ag8YW3jr', date2: 'MbdTPatncZMrihqPODOq', times: 'F1hLkYJFyT5ar7vuUoyq', locationName: 'Y0819RPRFPrqInyZh3kh', locationAddress: 'cnZx6bAX6CtfaV95uV6J', desc: 'x87ZwyMHrNMMiDrkiBkR' },
  '4': { title: '2RvYrjkx9Qdqya0KQANj', date2: 'IdTEkdkLOqUTchjUGDc3', times: 'bp4KTKu6rULnhKr29xd0', locationName: '3hevt5IK1JnIw4zdt4ea', locationAddress: 'OuQZmHh0OEgFh13AKMTH', desc: 'Md4f5ZgGPmhtLNoyhy4S' },
  '5': { title: 'gRtKhfVHF4lWDHuYwwhu', date2: 'VZBcCZnRymTqGyLNr3Ix', times: 'Ke2QcYeDWGMMtLcb43q8', locationName: '5RrZtOqaax99qPLBucZy', locationAddress: 'kIHZ3B1Cxjj26CfVs2VO', desc: 'YJFup8VrRZR2TpI1vPoQ' },
  '6': { title: 'eULuv9eKxVRSGPBhQjOA', date2: '10RfxIUrXRBaN2j8RU2z', times: 'fthLorrIJEhmYUJ75Kbg', locationName: 'rSZXwR3QBhIl2uhW2spa', locationAddress: 'CPfmuFBt4N6vMRmaKnSB', desc: 'ereXahYy4ygxN5tPO1I7' },
  '7': { title: 'IA9HQGTXAlNGlZaj8npf', date2: '6Xa5xoB0u7Vb4A7LFdpC', times: 'kH6wah41heMaAI2QdMKi', locationName: 'yYNILPsku0SsOqP3K4OH', locationAddress: 'G7lZfugJzXaknDmtLoZ5', desc: '6EIxkA9b8kdq0qQRfujd' },
  '8': { title: 'Peozxao0NLgqIjgsQ7A6', date2: 'PfdZjQRVhefkINBmydDK', times: 'NHy2PVTXBxj2xStjcJhi', locationName: 'dZhKfKQSVJtRUUrS73Y2', locationAddress: 'nUR5GTHEyeuRNsqT5sUx', desc: 'ZH6UrPzHaaABoW5ZwANy' },
  '9': { title: 'L3DvbkbJzRUB1bJm1U9n', date2: 'kcOLZD0lu9lBKAfiPCs0', times: 'c53gAXxMSeyMMulizC4t', locationName: 'PkdV11uSfbF5SoscsAs1', locationAddress: 'TRpXsVbGms2MEvwnzviW', desc: 'NhPbQpTyScUQSyyHvNej' }
};

async function getCustomValues() {
  const res = await fetch(
    `https://services.leadconnectorhq.com/locations/${GHL_LOCATION_ID}/customValues`,
    { headers: { Authorization: `Bearer ${GHL_API_KEY}`, 'Content-Type': 'application/json', 'Version': '2021-07-28' } }
  );
  const data = await res.json();
  const map = {};
  (data.customValues || []).forEach(cv => { map[cv.id] = cv.value || ''; });
  return map;
}

function parseDateTime(date2, times) {
  try {
    const parts = date2.trim().split(' ');
    const baseDate = parts[0];
    const startTimeStr = parts.slice(1).join(' ').trim();

    const timesNorm = times.replace(/\s+/g, ' ').trim();
    const endTimeStr = timesNorm.split(' - ')[1]?.trim() || startTimeStr;

    const pad = n => String(n).padStart(2, '0');

    const parseTime = (timeStr) => {
      const m = timeStr.trim().toUpperCase().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
      if (!m) throw new Error(`Bad time: ${timeStr}`);
      let h = parseInt(m[1], 10);
      const min = parseInt(m[2], 10);
      if (m[3] === 'PM' && h !== 12) h += 12;
      if (m[3] === 'AM' && h === 12) h = 0;
      return `${pad(h)}:${pad(min)}:00`;
    };

    return {
      start: `${baseDate}T${parseTime(startTimeStr)}`,
      end: `${baseDate}T${parseTime(endTimeStr)}`
    };
  } catch (e) {
    console.error('parseDateTime error:', e.message, { date2, times });
    return { start: date2, end: date2 };
  }
}

function toGoogleDate(isoStr) {
  return isoStr.replace(/[-:]/g, '').slice(0, 15);
}

function toICSDate(isoStr) {
  return isoStr.replace(/[-:]/g, '').slice(0, 15);
}

function buildLocation(locationName, locationAddress) {
  if (!locationAddress) return locationName;
  if (!locationName) return locationAddress;
  return `${locationName} - ${locationAddress}`;
}

function buildDescription(desc, locationAddress) {
  let full = desc || '';
  if (locationAddress && (locationAddress.startsWith('http://') || locationAddress.startsWith('https://'))) {
    full = full ? `${full}\n\nJoin link: ${locationAddress}` : `Join link: ${locationAddress}`;
  }
  return full ? `${full}\n\nutahreia.org` : 'utahreia.org';
}

function generateICS(event, mtg) {
  const esc = s => String(s || '').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Utah REIA//Event//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `DTSTART:${toICSDate(event.start)}`,
    `DTEND:${toICSDate(event.end)}`,
    `SUMMARY:${esc(event.title)}`,
    `LOCATION:${esc(event.location)}`,
    `DESCRIPTION:${esc(event.description)}`,
    `UID:utah-reia-mtg-${mtg}-${Date.now()}@utahreia.org`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
}

function formatDisplayDate(isoStr) {
  // isoStr: "2026-07-14T11:30:00"
  try {
    const [datePart, timePart] = isoStr.split('T');
    const [year, month, day] = datePart.split('-').map(Number);
    const [hour, min] = timePart.split(':').map(Number);
    const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const d = new Date(year, month - 1, day);
    const dayName = days[d.getDay()];
    const monthName = months[month - 1];
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const h12 = hour % 12 || 12;
    const minStr = String(min).padStart(2, '0');
    return `${dayName}, ${monthName} ${day}, ${year} at ${h12}:${minStr} ${ampm}`;
  } catch {
    return isoStr;
  }
}

function renderHTML(event, mtg, baseUrl) {
  const googleUrl = `${baseUrl}/api/calendar?mtg=${mtg}&type=google`;
  const outlookUrl = `${baseUrl}/api/calendar?mtg=${mtg}&type=outlook`;
  const icsUrl = `${baseUrl}/api/calendar?mtg=${mtg}&type=ics`;

  const displayDate = formatDisplayDate(event.start);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Add to Calendar – Utah REIA</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background: #f5f5f0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px 16px;
    }

    .card {
      background: #fff;
      border-radius: 16px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.10);
      max-width: 440px;
      width: 100%;
      overflow: hidden;
    }

    .card-header {
      background: #1a1a2e;
      padding: 28px 32px 24px;
      text-align: center;
    }

    .logo {
      color: #e8b84b;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 2px;
      text-transform: uppercase;
      margin-bottom: 10px;
    }

    .card-header h1 {
      color: #fff;
      font-size: 20px;
      font-weight: 700;
      line-height: 1.3;
      margin-bottom: 8px;
    }

    .event-date {
      color: #e8b84b;
      font-size: 13px;
      font-weight: 500;
    }

    .card-body {
      padding: 28px 32px;
    }

    .prompt {
      color: #555;
      font-size: 14px;
      text-align: center;
      margin-bottom: 20px;
    }

    .cal-btn {
      display: flex;
      align-items: center;
      gap: 14px;
      width: 100%;
      padding: 14px 18px;
      border-radius: 10px;
      border: 1.5px solid #e0e0e0;
      background: #fff;
      color: #1a1a2e;
      font-size: 15px;
      font-weight: 600;
      text-decoration: none;
      cursor: pointer;
      transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
      margin-bottom: 12px;
    }

    .cal-btn:last-child { margin-bottom: 0; }

    .cal-btn:hover {
      border-color: #1a1a2e;
      background: #f8f8fc;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }

    .cal-btn .icon {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .icon-google { background: #fff; border: 1px solid #e0e0e0; }
    .icon-outlook { background: #0072C6; }
    .icon-apple { background: #1a1a2e; }

    .cal-btn .label { flex: 1; text-align: left; }
    .cal-btn .arrow { color: #bbb; font-size: 18px; }

    .card-footer {
      border-top: 1px solid #f0f0f0;
      padding: 16px 32px;
      text-align: center;
    }

    .card-footer a {
      color: #e8b84b;
      font-size: 13px;
      font-weight: 600;
      text-decoration: none;
    }

    .card-footer a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="card">
    <div class="card-header">
      <div class="logo">Utah REIA</div>
      <h1>${escapeHtml(event.title)}</h1>
      <div class="event-date">${escapeHtml(displayDate)}</div>
    </div>

    <div class="card-body">
      <p class="prompt">Choose your calendar app:</p>

      <a href="${googleUrl}" class="cal-btn">
        <span class="icon icon-google">
          <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
        </span>
        <span class="label">Google Calendar</span>
        <span class="arrow">›</span>
      </a>

      <a href="${outlookUrl}" class="cal-btn">
        <span class="icon icon-outlook">
          <svg width="20" height="20" viewBox="0 0 48 48" fill="none"><rect width="48" height="48" rx="4" fill="#0072C6"/><path d="M26 10h14v28H26V10z" fill="#fff" opacity=".9"/><path d="M8 14h18v20H8V14z" fill="#fff"/><ellipse cx="17" cy="24" rx="6" ry="7" fill="#0072C6"/></svg>
        </span>
        <span class="label">Outlook Calendar</span>
        <span class="arrow">›</span>
      </a>

      <a href="${icsUrl}" class="cal-btn">
        <span class="icon icon-apple">
          <svg width="20" height="20" viewBox="0 0 48 48" fill="white"><path d="M35.88 25.82c-.06-5.16 4.21-7.65 4.4-7.77-2.4-3.51-6.14-3.99-7.47-4.04-3.16-.32-6.2 1.87-7.81 1.87-1.63 0-4.11-1.83-6.77-1.78-3.46.05-6.67 2.02-8.45 5.1-3.63 6.28-.93 15.58 2.6 20.68 1.74 2.5 3.79 5.29 6.48 5.19 2.61-.1 3.59-1.67 6.74-1.67 3.13 0 4.04 1.67 6.77 1.62 2.81-.05 4.58-2.52 6.3-5.03 2-2.87 2.82-5.65 2.86-5.8-.06-.02-5.59-2.14-5.65-8.37zM30.96 10.9c1.43-1.74 2.4-4.14 2.13-6.55-2.06.08-4.58 1.37-6.06 3.08-1.32 1.53-2.49 4-2.18 6.35 2.3.18 4.65-1.16 6.11-2.88z"/></svg>
        </span>
        <span class="label">Apple Calendar</span>
        <span class="arrow">›</span>
      </a>
    </div>

    <div class="card-footer">
      <a href="https://utahreia.org" target="_blank">utahreia.org</a>
    </div>
  </div>
</body>
</html>`;
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { mtg } = req.query;

  if (!mtg || !CUSTOM_VALUE_IDS[mtg])
    return res.status(400).send('<h2>Invalid meeting number. Use ?mtg=1 through ?mtg=9</h2>');

  try {
    const ids = CUSTOM_VALUE_IDS[mtg];
    const cv = await getCustomValues();

    const title = cv[ids.title] || `Utah REIA Meeting ${mtg}`;
    const date2 = cv[ids.date2] || '';
    const times = cv[ids.times] || '';
    const locationName = cv[ids.locationName] || '';
    const locationAddress = cv[ids.locationAddress] || '';
    const desc = cv[ids.desc] || '';

    const location = buildLocation(locationName, locationAddress);
    const description = buildDescription(desc, locationAddress);
    const { start, end } = parseDateTime(date2, times);

    const proto = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'event-validator.vercel.app';
    const baseUrl = `${proto}://${host}`;

    const html = renderHTML({ title, start, end, location, description }, mtg, baseUrl);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(html);

  } catch (err) {
    console.error('Calendar pick handler error:', err);
    return res.status(500).send(`<h2>Error loading event data: ${escapeHtml(err.message)}</h2>`);
  }
}
