// Custom calendar link generator - fetches live data from GHL custom values
// Drop into event-validator/api/calendar.js and push to GitHub

const GHL_LOCATION_ID = 'DNirEjy0ejVwbHsaBYrn';
const GHL_API_KEY = process.env.GHL_API_KEY;

// GHL custom value IDs for each meeting slot
const CUSTOM_VALUE_IDS = {
  '1': {
    title: 'cI4UzRRiZW8O0eC19nEC',
    date2: '7FdI0ZQDfKk3eQ0SfwCc',
    times: 'ae02UdifT21VgzTkzEZB',
    locationName: 'AQSPO3urGhqZFMGHMfvh',
    locationAddress: 'J0jA6jNER6S5fS632JTm'
  },
  '2': {
    title: 'sMhH7nYt4UKLDKDJ0Ybs',
    date2: '5vBLsxKapZ1gydmxi7qT',
    times: 'kF7LYW07kCsJlZsjZT5B',
    locationName: 'NZRrs61KWEYZ1Abp4NPC',
    locationAddress: 'CPGD7vVUkjStYOLlY1cf'
  },
  '3': {
    title: 'fqVHfWCsqUZ9ag8YW3jr',
    date2: 'MbdTPatncZMrihqPODOq',
    times: 'F1hLkYJFyT5ar7vuUoyq',
    locationName: 'Y0819RPRFPrqInyZh3kh',
    locationAddress: 'cnZx6bAX6CtfaV95uV6J'
  },
  '4': {
    title: '2RvYrjkx9Qdqya0KQANj',
    date2: 'IdTEkdkLOqUTchjUGDc3',
    times: 'bp4KTKu6rULnhKr29xd0',
    locationName: '3hevt5IK1JnIw4zdt4ea',
    locationAddress: 'OuQZmHh0OEgFh13AKMTH'
  },
  '5': {
    title: 'gRtKhfVHF4lWDHuYwwhu',
    date2: 'VZBcCZnRymTqGyLNr3Ix',
    times: 'Ke2QcYeDWGMMtLcb43q8',
    locationName: '5RrZtOqaax99qPLBucZy',
    locationAddress: 'kIHZ3B1Cxjj26CfVs2VO'
  },
  '6': {
    title: 'eULuv9eKxVRSGPBhQjOA',
    date2: '10RfxIUrXRBaN2j8RU2z',
    times: 'fthLorrIJEhmYUJ75Kbg',
    locationName: 'rSZXwR3QBhIl2uhW2spa',
    locationAddress: 'CPfmuFBt4N6vMRmaKnSB'
  },
  '7': {
    title: 'IA9HQGTXAlNGlZaj8npf',
    date2: '6Xa5xoB0u7Vb4A7LFdpC',
    times: 'kH6wah41heMaAI2QdMKi',
    locationName: 'yYNILPsku0SsOqP3K4OH',
    locationAddress: 'G7lZfugJzXaknDmtLoZ5'
  },
  '8': {
    title: 'Peozxao0NLgqIjgsQ7A6',
    date2: 'PfdZjQRVhefkINBmydDK',
    times: 'NHy2PVTXBxj2xStjcJhi',
    locationName: 'dZhKfKQSVJtRUUrS73Y2',
    locationAddress: 'nUR5GTHEyeuRNsqT5sUx'
  },
  '9': {
    title: 'L3DvbkbJzRUB1bJm1U9n',
    date2: 'kcOLZD0lu9lBKAfiPCs0',
    times: 'c53gAXxMSeyMMulizC4t',
    locationName: 'PkdV11uSfbF5SoscsAs1',
    locationAddress: 'TRpXsVbGms2MEvwnzviW'
  }
};

async function getCustomValues() {
  const res = await fetch(
    `https://rest.gohighlevel.com/v1/custom-values/?locationId=${GHL_LOCATION_ID}`,
    {
      headers: {
        Authorization: `Bearer ${GHL_API_KEY}`,
        'Content-Type': 'application/json'
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
  // times format: "11:30 AM - 01:00 PM"
  try {
    const parts = date2.trim().split(' ');
    const baseDate = parts[0]; // "2026-07-14"
    const startTime = parts.slice(1).join(' '); // "11:30 AM"
    const endTime = times.split(' - ')[1]?.trim();

    const toISO = (date, timeStr) => {
      const dt = new Date(`${date} ${timeStr}`);
      return dt.toISOString().slice(0, 19);
    };

    return {
      start: toISO(baseDate, startTime),
      end: endTime ? toISO(baseDate, endTime) : toISO(baseDate, startTime)
    };
  } catch {
    return { start: date2, end: date2 };
  }
}

function toGoogleDate(isoStr) {
  return new Date(isoStr).toISOString().replace(/-|:|\.\d+/g, '').slice(0, 15) + 'Z';
}

function toICSDate(isoStr) {
  return new Date(isoStr).toISOString().replace(/-|:|\.\d+/g, '').slice(0, 15) + 'Z';
}

function generateICS(event, mtg) {
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Utah REIA//Event//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `DTSTART:${toICSDate(event.start)}`,
    `DTEND:${toICSDate(event.end)}`,
    `SUMMARY:${event.title}`,
    `LOCATION:${event.location}`,
    `DESCRIPTION:Utah REIA Event. utahreia.org`,
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
    const location = locationAddress && !locationAddress.startsWith('http')
      ? `${locationName}, ${locationAddress}`.trim()
      : locationName;

    const { start, end } = parseDateTime(date2, times);
    const event = { title, start, end, location };

    if (type === 'google') {
      const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${toGoogleDate(start)}/${toGoogleDate(end)}&details=${encodeURIComponent('Utah REIA Event. utahreia.org')}&location=${encodeURIComponent(location)}`;
      return res.redirect(302, url);
    }

    if (type === 'outlook') {
      const url = `https://outlook.live.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(title)}&startdt=${start}&enddt=${end}&body=${encodeURIComponent('Utah REIA Event. utahreia.org')}&location=${encodeURIComponent(location)}`;
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