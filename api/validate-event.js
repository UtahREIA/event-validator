// /api/validate-event.js
//
// GHL Webhook → POST /api/validate-event
//
// Receives event data from a GHL workflow and uses Claude AI to run automated
// sanity checks before the event goes live. Catches issues like wrong addresses,
// dates in the past, mismatched event types, or missing critical fields.
//
// GHL Workflow Setup:
//   Trigger:  "Event Created" or "Event Updated" (or manual via custom webhook action)
//   Body:     { eventName, address, startDate, endDate, description, contactEmail }
//
// Required env vars (set in Vercel):
//   ANTHROPIC_API_KEY              — Anthropic API key
//
// Optional env vars:
//   GHL_WEBHOOK_SECRET             — Shared secret GHL sends in x-webhook-secret header
//   ADMIN_NOTIFY_WEBHOOK_URL       — GHL inbound webhook URL to fire when issues are found

import Anthropic from "@anthropic-ai/sdk";

// ─── Stable system prompt (cached by Anthropic) ───────────────────────────────
const SYSTEM_PROMPT = `You are an event data quality checker for Utah REIA (a real estate investors association in Utah).

Your job is to review event details submitted from GoHighLevel (a CRM) and identify any issues BEFORE the event is promoted to members.

Known context:
- Events are held in Utah (Salt Lake City area, Utah County, Wasatch Front)
- Event types include: hikes, workshops, meetups, networking events, property tours, webinars
- Events should have a real, specific address (not a placeholder)
- Outdoor events (hikes, trail walks) should reference a trailhead or park name, not a building
- Indoor events (workshops, meetups) should reference a building/venue name and street address
- Event dates should be in the future and on a day that makes sense for the event type
- Contact email should look like a real email address

When you find issues, be specific and actionable — tell us exactly what looks wrong and what to fix.
If everything looks good, say so clearly.`;

// ─── Main handler ─────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-webhook-secret");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // ── Optional webhook secret auth ──────────────────────────────────────────
  const expectedSecret = process.env.GHL_WEBHOOK_SECRET;
  if (expectedSecret) {
    const incoming = req.headers["x-webhook-secret"] || req.headers["x-ghl-secret"];
    if (incoming !== expectedSecret) {
      console.warn("[VALIDATE-EVENT] Unauthorized — bad secret");
      return res.status(401).json({ error: "Unauthorized" });
    }
  }

  // ── Parse body ────────────────────────────────────────────────────────────
  const body = typeof req.body === "string"
    ? JSON.parse(req.body || "{}")
    : (req.body || {});

  const {
    eventName,
    address,
    location,         // GHL sometimes uses 'location' instead of 'address'
    startDate,
    endDate,
    description,
    contactEmail,
    eventType,        // optional — e.g. "Hike", "Workshop", "Webinar"
    notes,
  } = body;

  // Accept either 'address' or 'location'
  const eventAddress = address || location || "";

  if (!eventName) {
    return res.status(400).json({ error: "eventName is required" });
  }

  // ── Anthropic client ──────────────────────────────────────────────────────
  const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_KEY) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY not set" });
  }

  const anthropic = new Anthropic({ apiKey: ANTHROPIC_KEY });

  // ── Build event summary for Claude ───────────────────────────────────────
  const today = new Date().toISOString().split("T")[0];

  const eventSummary = [
    `Today's date: ${today}`,
    "",
    "EVENT DETAILS TO VALIDATE:",
    `  Event Name:    ${eventName}`,
    eventType    ? `  Event Type:    ${eventType}`    : null,
    eventAddress ? `  Address:       ${eventAddress}` : "  Address:       (NOT PROVIDED)",
    startDate    ? `  Start Date:    ${startDate}`    : "  Start Date:    (NOT PROVIDED)",
    endDate      ? `  End Date:      ${endDate}`      : null,
    contactEmail ? `  Contact Email: ${contactEmail}` : null,
    description  ? `  Description:   ${description}` : null,
    notes        ? `  Notes:         ${notes}`        : null,
  ]
    .filter((line) => line !== null)
    .join("\n");

  const userPrompt = `${eventSummary}

Please check this event for any issues. Look for:
1. Address problems — does the address match the event type? (e.g. a hike should point to a trailhead, not an office building)
2. Date problems — is the event date in the past? Does the date make sense?
3. Missing critical fields — anything important that's blank or looks like a placeholder?
4. Mismatches — does the event name match the address/description?
5. Any other red flags that would embarrass us if sent to members

Respond with:
- A one-line verdict: "PASS — no issues found" OR "ISSUES FOUND — review required"
- A bullet list of specific issues (if any), each with a suggested fix
- Keep your response under 300 words`;

  // ── Call Claude ───────────────────────────────────────────────────────────
  let claudeText;
  let issuesFound = false;

  try {
    const message = await anthropic.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 1024,
      thinking: { type: "adaptive" },
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [{ role: "user", content: userPrompt }],
    });

    // Extract text blocks only (skip thinking blocks)
    claudeText = message.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n")
      .trim();

    issuesFound = claudeText.toUpperCase().includes("ISSUES FOUND");

    console.log(`[VALIDATE-EVENT] "${eventName}" → ${issuesFound ? "ISSUES FOUND" : "PASS"}`);
  } catch (claudeErr) {
    console.error("[VALIDATE-EVENT] Claude API error:", claudeErr.message);
    return res.status(502).json({ error: "Claude validation failed", details: claudeErr.message });
  }

  // ── Notify admin via GHL webhook if issues found ─────────────────────────
  const notifyUrl = process.env.ADMIN_NOTIFY_WEBHOOK_URL;

  if (issuesFound && notifyUrl) {
    try {
      await fetch(notifyUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alert:         "Event validation issues found",
          eventName,
          eventAddress,
          startDate:     startDate || "",
          issuesSummary: claudeText,
          submittedAt:   new Date().toISOString(),
        }),
      });
      console.log("[VALIDATE-EVENT] Admin notified via GHL webhook");
    } catch (notifyErr) {
      console.warn("[VALIDATE-EVENT] Admin notification failed:", notifyErr.message);
    }
  }

  // ── Return result ─────────────────────────────────────────────────────────
  return res.status(200).json({
    ok:          true,
    eventName,
    issuesFound,
    verdict:     issuesFound ? "ISSUES FOUND — review required" : "PASS — no issues found",
    details:     claudeText,
    checkedAt:   new Date().toISOString(),
  });
}
