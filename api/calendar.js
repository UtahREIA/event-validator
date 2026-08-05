// Custom calendar link generator - replaces third-party evt.to tool
// Drop this file into your event-validator/api/ folder and push to GitHub

const meetings = {
  '1': {
    title: 'Seller Financing > Buy Without the Bank',
    start: '2026-07-14T11:30:00',
    end: '2026-07-14T13:00:00',
    location: 'Zion Technology Center, 7860 S Bingham Junction Blvd Midvale, UT 84047',
    description: 'Utah REIA Mid-Day Meeting. utahreia.org'
  },
  '2': {
    title: 'How to Analyze a Real Estate Deal the Right Way',
    start: '2026-08-25T18:30:00',
    end: '2026-08-25T20:30:00',
    location: 'Crescent Hall, 11020 State St, Sandy, UT 84070',
    description: 'Utah REIA Monthly Meeting. utahreia.org'
  },
  '3': {
    title: 'Funding Deals with Your IRA: Wholesale, Seller Finance, Buy and Hold',
    start: '2026-08-11T11:30:00',
    end: '2026-08-11T13:00:00',
    location: 'Virtual Online Event',
    description: 'Utah REIA Mid-Day Meeting. utahreia.org'
  },
  '4': {
    title: 'Real Estate Conversations That Actually Matter',
    start: '2026-08-06T18:00:00',
    end: '2026-08-06T20:00:00',
    location: 'Club 90, 9065 Monroe St, Sandy, UT 84070',
    description: 'Utah REIA Monthly Meeting. utahreia.org'
  },
  '5': {
    title: 'WREIA Wine & Paint Night',
    start: '2026-07-28T18:00:00',
    end: '2026-07-28T20:00:00',
    location: 'Bar à Vin, 917 S State Street, Salt Lake City, UT 84111',
    description: 'Utah REIA WREIA Event. utahreia.org'
  },
  '6': {
    title: 'Caminata y Conexion para Inversionistas Latinos',
    start: '2026-06-17T18:30:00',
    end: '2026-06-17T20:30:00',
    location: 'Draper Suspension Bridge Loop, 12625 Highland Dr, Draper, UT 84020',
    description: 'Utah REIA Latino Community Event. utahreia.org'
  },
  '7': {
    title: 'Know Your Rehab Number Before You Make an Offer',
    start: '2026-06-11T18:00:00',
    end: '2026-06-11T20:00:00',
    location: 'Virtual Event',
    description: 'Utah REIA Monthly Meeting. utahreia.org'
  },
  '8': {
    title: 'The Real Formula for Spotting a Good Deal',
    start: '2026-06-25T18:00:00',
    end: '2026-06-25T20:00:00',
    location: 'Virtual Online Event',
    description: 'Utah REIA Monthly Meeting. utahreia.org'
  },
  '9': {
    title: 'Attract Investors and Fund Your Deals',
    start: '2026-07-01T11:00:00',
    end: '2026-07-01T13:00:00',
    location: 'Virtual Online Event',
    description: 'Utah REIA Monthly Meeting. utahreia.org'
  }
};

function toGoogleDate(dateStr) {
  return new Date(dateStr).toISOString().replace(/-|:|\.\d+/g, '').slice(0, 15) + 'Z';
}

function toICSDate(dateStr) {
  return new Date(dateStr).toISOString().replace(/-|:|\.\d+/g, '').slice(0, 15) + 'Z';
}

function generateUID(mtg) {
  return `utah-reia-mtg-${mtg}-${Date.now()}@utahreia.org`;
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
    `DESCRIPTION:${event.description}`,
    `UID:${generateUID(mtg)}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
}

export default function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { mtg, type } = req.query;

  if (!mtg || !meetings[mtg]) {
    return res.status(400).json({ error: 'Invalid meeting number. Use mtg=1 through mtg=9' });
  }

  const event = meetings[mtg];
  const startFormatted = toGoogleDate(event.start);
  const endFormatted = toGoogleDate(event.end);

  if (type === 'google') {
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${startFormatted}/${endFormatted}&details=${encodeURIComponent(event.description)}&location=${encodeURIComponent(event.location)}`;
    return res.redirect(302, url);
  }

  if (type === 'outlook') {
    const url = `https://outlook.live.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(event.title)}&startdt=${event.start}&enddt=${event.end}&body=${encodeURIComponent(event.description)}&location=${encodeURIComponent(event.location)}`;
    return res.redirect(302, url);
  }

  if (type === 'ics') {
    const ics = generateICS(event, mtg);
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="utah-reia-event-${mtg}.ics"`);
    return res.send(ics);
  }

  return res.status(400).json({ error: 'Invalid type. Use type=google, type=outlook, or type=ics' });
}
