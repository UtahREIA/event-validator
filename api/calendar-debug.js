// Temporary debug file - delete after debugging
// Drop into event-validator/api/calendar-debug.js and push to GitHub

const GHL_LOCATION_ID = 'DNirEjy0ejVwbHsaBYrn';
const GHL_API_KEY = process.env.GHL_API_KEY;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Step 1 -- check if key exists
  if (!GHL_API_KEY) {
    return res.status(200).json({ 
      step: 1,
      error: 'GHL_API_KEY is missing from environment variables' 
    });
  }

  // Step 2 -- try the GHL API call
  try {
    const response = await fetch(
      `https://services.leadconnectorhq.com/locations/${GHL_LOCATION_ID}/customValues`,
      {
        headers: {
          Authorization: `Bearer ${GHL_API_KEY}`,
          'Content-Type': 'application/json',
          'Version': '2021-07-28'
        }
      }
    );

    const status = response.status;
    const text = await response.text();

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = { raw: text.slice(0, 500) };
    }

    return res.status(200).json({
      step: 2,
      ghlStatus: status,
      keyPrefix: GHL_API_KEY.slice(0, 10) + '...',
      keyLength: GHL_API_KEY.length,
      responsePreview: parsed
    });

  } catch (err) {
    return res.status(200).json({
      step: 2,
      error: err.message,
      keyPrefix: GHL_API_KEY.slice(0, 10) + '...',
      keyLength: GHL_API_KEY.length
    });
  }
}
