const GHL_LOCATION_ID = 'DNirEjy0ejVwbHsaBYrn';
const GHL_API_KEY = process.env.GHL_API_KEY;

export default async function handler(req, res) {
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
  const data = await response.json();
  return res.status(200).json(data);
}