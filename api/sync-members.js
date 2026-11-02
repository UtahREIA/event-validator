// api/sync-members.js
// Pulls all Active members from GHL and upserts them into the
// event_routing_members Supabase table.
// Runs on a Vercel cron schedule (see vercel.json) and can also
// be triggered manually with GET /api/sync-members?secret=CRON_SECRET

const GHL_API_KEY     = process.env.GHL_API_KEY;
const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID;
const SUPABASE_URL    = process.env.SUPABASE_URL;
const SUPABASE_KEY    = process.env.SUPABASE_SERVICE_KEY;
const CRON_SECRET     = process.env.CRON_SECRET; // set this in Vercel env vars

// GHL custom field IDs
const FIELD_STATUS    = 'pVjzZbTLHlgbSX5IVbhc'; // Membership status ("Active")
const FIELD_COMMUNITY = 'taUFA9QHYe5EoxFBfTX1'; // REIA Community checkbox
const FIELD_GUESTPASS = 'eGNqo5xI1M3AIOZuq1Qu'; // Guest pass used checkbox

// ── Helpers ──────────────────────────────────────────────────────────────────

function normalizePhone(raw) {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, '');
  return digits.length >= 10 ? digits.slice(-10) : null;
}

function isChecked(val) {
  if (!val) return false;
  if (Array.isArray(val)) return val.some(v => typeof v === 'string' && v.toLowerCase() === 'yes');
  if (typeof val === 'string') return val.toLowerCase() === 'yes';
  return false;
}

function buildRow(contact, syncedAt) {
  const fields = {};
  (contact.customFields || []).forEach(f => { fields[f.id] = f.value; });

  return {
    ghl_contact_id:    contact.id,
    phone:             normalizePhone(contact.phone),
    full_name:         [contact.firstName, contact.lastName].filter(Boolean).join(' ') || null,
    status:            fields[FIELD_STATUS] || 'Active',
    is_community_member: isChecked(fields[FIELD_COMMUNITY]),
    guest_pass_used:   isChecked(fields[FIELD_GUESTPASS]),
    synced_at:         syncedAt,
  };
}

// ── GHL pagination ────────────────────────────────────────────────────────────
// GHL contacts list accepts ?startAfterId= for cursor paging.
// Returns up to 100 contacts per page.

async function fetchPage(page = 1) {
  const res = await fetch(
    `https://services.leadconnectorhq.com/contacts/search`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${GHL_API_KEY}`,
        Version: '2021-07-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        locationId: GHL_LOCATION_ID,
        filters: [
          {
            field: `customFields.${FIELD_STATUS}`,
            operator: 'eq',
            value: 'Active',
          },
        ],
        page,
        pageLimit: 100,
      }),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GHL ${res.status}: ${text}`);
  }
  return res.json();
}

// ── Handler ───────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Auth check — Vercel cron sends Authorization: Bearer <CRON_SECRET>
  // Manual calls can pass ?secret=CRON_SECRET
  const authHeader = (req.headers.authorization || '').replace('Bearer ', '');
  const querySecret = req.query.secret || '';
  if (CRON_SECRET && authHeader !== CRON_SECRET && querySecret !== CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const syncedAt = new Date().toISOString();

  let totalSynced = 0;
  const errors    = [];
  let page    = 1;
  let hasMore = true;

  while (hasMore) {
    let contacts;
    try {
      const data = await fetchPage(page);
      contacts = data.contacts || [];
    } catch (err) {
      errors.push(err.message);
      break;
    }

    if (!contacts.length) break;

    const rows = contacts.map(c => buildRow(c, syncedAt));

    // Upsert via Supabase REST API directly (no SDK needed)
    const upsertRes = await fetch(
      `${SUPABASE_URL}/rest/v1/event_routing_members`,
      {
        method: 'POST',
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'resolution=merge-duplicates,return=minimal',
        },
        body: JSON.stringify(rows),
      }
    );

    if (!upsertRes.ok) {
      const text = await upsertRes.text();
      errors.push(`Supabase upsert error ${upsertRes.status}: ${text}`);
    } else {
      totalSynced += rows.length;
    }

    // If we got fewer than 100, we're on the last page
    if (contacts.length < 100) {
      hasMore = false;
    } else {
      page++;
    }
  }

  const result = {
    success: errors.length === 0,
    synced:  totalSynced,
    errors,
    timestamp: syncedAt,
  };

  console.log('[sync-members]', JSON.stringify(result));
  return res.status(errors.length && !totalSynced ? 500 : 200).json(result);
}
