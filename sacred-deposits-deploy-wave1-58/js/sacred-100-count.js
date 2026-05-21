/**
 * Sacred 100 live counter — fetches reservation count from Netlify Forms API
 *
 * Setup required (one-time, in Netlify dashboard):
 *   1. Site settings → Build & deploy → Environment → Add variables:
 *      - NETLIFY_AUTH_TOKEN: Personal access token (create at https://app.netlify.com/user/applications)
 *      - NETLIFY_SITE_ID: Site ID (Site settings → Site details)
 *      - SACRED_100_FORM_NAME: Form name (default: "sacred-100-reserve")
 *
 *   2. Enable Functions: Site settings → Functions → enable
 *
 *   3. Once a form named "sacred-100-reserve" exists and gets submissions,
 *      this function returns the live count.
 *
 * Endpoint: /.netlify/functions/sacred-100-count
 * Response: { "claimed": N, "total": 100, "source": "netlify-forms" | "fallback" }
 */

exports.handler = async (event) => {
  const TOTAL = 100;
  const FORM_NAME = process.env.SACRED_100_FORM_NAME || "sacred-100-reserve";
  const TOKEN = process.env.NETLIFY_AUTH_TOKEN;
  const SITE_ID = process.env.NETLIFY_SITE_ID;

  // Fallback: read the static JSON file count if API isn't configured
  const fallback = async () => {
    try {
      const fs = require('fs').promises;
      const path = require('path');
      const filepath = path.join(__dirname, '../../data/sacred-100.json');
      const data = JSON.parse(await fs.readFile(filepath, 'utf-8'));
      return { claimed: data.claimed, total: data.total, source: "fallback" };
    } catch (e) {
      return { claimed: 0, total: TOTAL, source: "fallback-default" };
    }
  };

  if (!TOKEN || !SITE_ID) {
    const f = await fallback();
    return {
      statusCode: 200,
      headers: { "Cache-Control": "public, max-age=300", "Content-Type": "application/json" },
      body: JSON.stringify(f)
    };
  }

  try {
    // List forms to find the target form ID
    const formsRes = await fetch(`https://api.netlify.com/api/v1/sites/${SITE_ID}/forms`, {
      headers: { Authorization: `Bearer ${TOKEN}` }
    });
    if (!formsRes.ok) throw new Error(`Forms API ${formsRes.status}`);
    const forms = await formsRes.json();
    const target = forms.find(f => f.name === FORM_NAME);
    if (!target) {
      const f = await fallback();
      return {
        statusCode: 200,
        headers: { "Cache-Control": "public, max-age=300", "Content-Type": "application/json" },
        body: JSON.stringify({ ...f, source: "fallback-no-form" })
      };
    }

    return {
      statusCode: 200,
      headers: { "Cache-Control": "public, max-age=300", "Content-Type": "application/json" },
      body: JSON.stringify({
        claimed: Math.min(target.submission_count || 0, TOTAL),
        total: TOTAL,
        source: "netlify-forms"
      })
    };
  } catch (err) {
    const f = await fallback();
    return {
      statusCode: 200,
      headers: { "Cache-Control": "public, max-age=60", "Content-Type": "application/json" },
      body: JSON.stringify({ ...f, error: err.message })
    };
  }
};
