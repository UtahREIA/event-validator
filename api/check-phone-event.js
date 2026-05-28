// Event phone gate - Supabase member routing endpoint

const SUPABASE_URL = 'https://kttzxjddtkgsitzehiid.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0dHp4amRkdGtnc2l0emVoaWlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0MzkwNzcsImV4cCI6MjA5MjAxNTA3N30.g7rb4l524oWdvpi6xJKtGvn0OfCDaj9b4oxSOIrZysA';

function normalizePhone(raw) {
  return String(raw || '').replace(/[^\d]/g, '').slice(-10);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { phone } = req.body || {};
  if (!phone) return res.status(400).json({ error: 'Phone required' });

  const normalized = normalizePhone(phone);
  if (normalized.length < 10) return res.status(400).json({ error: 'Invalid phone' });

  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/event_routing_members?phone=eq.${encodeURIComponent(normalized)}&select=status,guest_pass_used,expiration_date&limit=1`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const rows = await response.json();

    if (!rows || rows.length === 0) {
      return res.status(200).json({ found: false, route: 'non-member' });
    }

    const contact = rows[0];
    const status = (contact.status || '').toLowerCase();
    const guestPassUsed = contact.guest_pass_used === true;
    const expiration = contact.expiration_date ? new Date(contact.expiration_date) : null;
    const isExpired = expiration ? expiration < new Date() : false;
    const isActive = status === 'active' && !isExpired;

    if (isActive) {
      return res.status(200).json({ found: true, route: 'member' });
    }

    if (!guestPassUsed) {
      return res.status(200).json({ found: true, route: 'guest' });
    }

    return res.status(200).json({ found: true, route: 'non-member' });

  } catch (err) {
    console.error('Supabase lookup error:', err);
    return res.status(500).json({ error: 'Lookup failed' });
  }
}