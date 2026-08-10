// Custom calendar link generator - fetches live data from GHL custom values
// Drop into event-validator/api/calendar.js and push to GitHub

const GHL_LOCATION_ID = 'DNirEjy0ejVwbHsaBYrn';
const GHL_API_KEY = process.env.GHL_API_KEY;

const CUSTOM_VALUE_IDS = {
  '1': {
    title: 'cI4UzRRiZW8O0eC19nEC',
    date2: '7FdI0ZQDfKk3eQ0SfwCc',
    times: 'ae02UdifT21VgzTkzEZB',
    locationName: 'AQSPO3urGhqZFMGHMfvh',
    locationAddress: 'J0jA6jNER6S5fS632JTm',
    desc: 'jgzjjv7KAiHoPSB0CoOk'
  },
  '2': {
    title: 'sMhH7nYt4UKLDKDJ0Ybs',
    date2: '5vBLsxKapZ1gydmxi7qT',
    times: 'kF7LYW07kCsJlZsjZT5B',
    locationName: 'NZRrs61KWEYZ1Abp4NPC',
    locationAddress: 'CPGD7vVUkjStYOLlY1cf',
    desc: 'cI9aO5OSLigUeUffBIho'
  },
  '3': {
    title: 'fqVHfWCsqUZ9ag8YW3jr',
    date2: 'MbdTPatncZMrihqPODOq',
    times: 'F1hLkYJFyT5ar7vuUoyq',
    locationName: 'Y0819RPRFPrqInyZh3kh',
    locationAddress: 'cnZx6bAX6CtfaV95uV6J',
    desc: 'x87ZwyMHrNMMiDrkiBkR'
  },
  '4': {
    title: '2RvYrjkx9Qdqya0KQANj',
    date2: 'IdTEkdkLOqUTchjUGDc3',
    times: 'bp4KTKu6rULnhKr29xd0',
    locationName: '3hevt5IK1JnIw4zdt4ea',
    locationAddress: 'OuQZmHh0OEgFh13AKMTH',
    desc: 'Md4f5ZgGPmhtLNoyhy4S'
  },
  '5': {
    title: 'gRtKhfVHF4lWDHuYwwhu',
    date2: 'VZBcCZnRymTqGyLNr3Ix',
    times: 'Ke2QcYeDWGMMtLcb43q8',
    locationName: '5RrZtOqaax99qPLBucZy',
    locationAddress: 'kIHZ3B1Cxjj26CfVs2VO',
    desc: 'YJFup8VrRZR2TpI1vPoQ'
  },
  '6': {
    title: 'eULuv9eKxVRSGPBhQjOA',
    date2: '10RfxIUrXRBaN2j8RU2z',
    times: 'fthLorrIJEhmYUJ75Kbg',
    locationName: 'rSZXwR3QBhIl2uhW2spa',
    locationAddress: 'CPfmuFBt4N6vMRmaKnSB',
    desc: 'ereXahYy4ygxN5tPO1I7'
  },
  '7': {
    title: 'IA9HQGTXAlNGlZaj8npf',
    date2: '6Xa5xoB0u7Vb4A7LFdpC',
    times: 'kH6wah41heMaAI2QdMKi',
    locationName: 'yYNILPsku0SsOqP3K4OH',
    locationAddress: 'G7lZfugJzXaknDmtLoZ5',
    desc: '6EIxkA9b8kdq0qQRfujd'
  },
  '8': {
    title: 'Peozxao0NLgqIjgsQ7A6',
    date2: 'PfdZjQRVhefkINBmydDK',
    times: 'NHy2PVTXBxj2xStjcJhi',
    locationName: 'dZhKfKQSVJtRUUrS73Y2',
    locationAddress: 'nUR5GTHEyeuRNsqT5sUx',
    desc: 'ZH6UrPzHaaABoW5ZwANy'
  },
  '9': {
    title: 'L3DvbkbJzRUB1bJm1U9n',
    date2: 'kcOLZD0lu9lBKAfiPCs0',
    times: 'c53gAXxMSeyMMulizC4t',
    locationName: 'PkdV11uSfbF5SoscsAs1',
    locationAddress: 'TRpXsVbGms2MEvwnzviW',
    desc: 'NhPbQpTyScUQSyyHvNej'
  }
};

async function getCustomValues() {
  const res = await fetch(
    `https://services.leadconnectorhq.com/locations/${GHL_LOCATION_ID}/customValues`,
    {
      headers: {
        Authorization: `Bearer ${GHL_API_KEY}`,
        'Content-Type': 'application/json',
        'Version': '2021-07-28'
      }
    }
  );
  const data = await res.json();
  const map = {};
  (data.customValues || []).forEach(cv => {
    map[cv.id] = cv.value || '';
  });
  return map;
}

function parseDateTime(date2, times) {
  // date2 format: "2026-07-14 11:30 AM"
  // times format: "11:30 AM - 01:00 PM" (may have extra spaces)
  try {
    const parts = date2.trim().split(' ');
    const baseDate = parts[0]; // "2026-07-14"
    const startTimeParts = parts.slice(1).join(' ').trim(); // "11:30 AM"

    const timesNorm = times.replace(/\s+/g, ' ').trim();
    const timeParts = timesNorm.split(' - ');
    const endTimeStr = timeParts[1]?.trim();

    const pad = n => String(n).padStart(2, '0');

    const toLocalISO = (date, timeStr) => {
      // Parse time manually to avoid timezone conversion
      const normalized = timeStr.trim().toUpperCase();
      const match = normalized.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
      if (!match) throw new Error(`Cannot parse time: ${timeStr}`);
      let hours = parseInt(match[1], 10);
      const minutes = parseInt(match[2], 10);
      const meridiem = match[3];
      if (meridiem === 'PM' && hours !== 12) hours += 12;
      if (meridiem === 'AM' && hours === 12) hours = 0;
      return `${date}T${pad(hours)}:${pad(minutes)}:00`;
    };

    return {
      start: toLocalISO(baseDate, startTimeParts),
      end: endTimeStr ? toLocalISO(baseDate, endTimeStr) : toLocalISO(baseDate, startTimeParts)
    };
  } catch (e) {
    console.error('parseDateTime error:', e.message);
    return { start: date2, end: date2 };
  }
}

// Format local ISO string to Google Calendar format (no timezone = local time)
function toGoogleDate(isoStr) {
  return isoStr.replace(/[-:]/g, '').replace('T', 'T').slice(0, 15);
}

// Format local ISO string to ICS format (no Z suffix = local/floating time)
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
  // Append join link at bottom if address is a URL (virtual event)
  if (locationAddress && (locationAddress.startsWith('http://') || locationAddress.startsWith('https://'))) {
    full = full ? `${full}\n\nJoin link: ${locationAddress}` : `Join link: ${locationAddress}`;
  }
  full = full ? `${full}\n\nutahreia.org` : 'utahreia.org';
  return full;
}

function generateICS(event, mtg) {
  const escapeICS = str => String(str || '').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Utah REIA//Event//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `DTSTART:${toICSDate(event.start)}`,
    `DTEND:${toICSDate(event.end)}`,
    `SUMMARY:${escapeICS(event.title)}`,
    `LOCATION:${escapeICS(event.location)}`,
    `DESCRIPTION:${escapeICS(event.description)}`,
    `UID:utah-reia-mtg-${mtg}-${Date.now()}@utahreia.org`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { mtg, type } = req.query;

  if (!mtg || !CUSTOM_VALUE_IDS[mtg]) {
    return res.status(400).json({ error: 'Invalid meeting number. Use mtg=1 through mtg=9' });
  }

  if (!type || !['google', 'outlook', 'ics'].includes(type)) {
    return res.status(400).json({ error: 'Invalid type. Use type=google, type=outlook, or type=ics' });
  }

  try {
    const ids = CUSTOM_VALUE_IDS[mtg];
    const cvMap = await getCustomValues();

    const title = cvMap[ids.title] || `Utah REIA Meeting ${mtg}`;
    const date2 = cvMap[ids.date2] || '';
    const times = cvMap[ids.times] || '';
    const locationName = cvMap[ids.locationName] || '';
    const locationAddress = cvMap[ids.locationAddress] || '';
    const desc = cvMap[ids.desc] || '';

    const location = buildLocation(locationName, locationAddress);
    const description = buildDescription(desc, locationAddress);

    const { start, end } = parseDateTime(date2, times);
    const event = { title, start, end, location, description };

    if (type === 'google') {
      const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${toGoogleDate(start)}/${toGoogleDate(end)}&details=${encodeURIComponent(description)}&location=${encodeURIComponent(location)}`;
      return res.redirect(302, url);
    }

    if (type === 'outlook') {
      const url = `https://outlook.live.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(title)}&startdt=${start}&enddt=${end}&body=${encodeURIComponent(description)}&location=${encodeURIComponent(location)}`;
      return res.redirect(302, url);
    }

    if (type === 'ics') {
      const ics = generateICS(event, mtg);
      res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="utah-reia-event-${mtg}.ics"`);
      return res.send(ics);
    }

  } catch (err) {
    console.error('Calendar error:', err);
    return res.status(500).json({ error: 'Failed to fetch event data' });
  }
}