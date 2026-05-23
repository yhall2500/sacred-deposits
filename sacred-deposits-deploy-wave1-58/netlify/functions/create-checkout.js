/**
 * create-checkout.js — Netlify serverless function
 * ---------------------------------------------------------------------------
 * Receives { items: [{ id, quantity }] } from the cart, maps each id to a
 * Stripe Price ID (authoritative, server-side — the client never sets price),
 * creates a Stripe Checkout Session, and returns { url } for redirect.
 *
 * Apple Pay, Google Pay, Link, and cards appear automatically on the hosted
 * Checkout page based on your Stripe Dashboard payment-method settings and the
 * customer's device. With Stripe Checkout, Stripe registers your domain for
 * Apple Pay automatically — no manual domain-verification file is required.
 *
 * Requires env var:  STRIPE_SECRET_KEY  (set in Netlify → Site settings → Env)
 * ---------------------------------------------------------------------------
 */
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

/* ===========================================================================
 * STEP 1 — In your Stripe Dashboard, create a Product + Price for each item
 *          below, then paste its Price ID (looks like price_1NXXXX...) here.
 *          The keys MUST match the data-item-id on your "Add to Cart" buttons.
 * =========================================================================== */
const PRICES = {
  'sacred-deposits-hardcover': 'price_REPLACE_HARDCOVER',   // $36.99
  'sacred-deposits-paperback': 'price_REPLACE_PAPERBACK',   // $24.99
  'sacred-deposits-ebook':     'price_REPLACE_EBOOK',       // $9.99  (digital)
  'couples-workbook':          'price_REPLACE_WORKBOOK',    // $16.99
  'her-covenant-journal':      'price_REPLACE_HER_JOURNAL', // $29.99
  'his-covenant-journal':      'price_REPLACE_HIS_JOURNAL', // $29.99
  'sacred-union-set':          'price_REPLACE_UNION_SET',   // $150
  'sacred-100-founders':       'price_REPLACE_FOUNDERS'     // $249
};

/* Physical items that need a shipping address (ebook excluded). */
const PHYSICAL = {
  'sacred-deposits-hardcover': true, 'sacred-deposits-paperback': true,
  'couples-workbook': true, 'her-covenant-journal': true,
  'his-covenant-journal': true, 'sacred-union-set': true, 'sacred-100-founders': true
};

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed' });
  }
  if (!process.env.STRIPE_SECRET_KEY) {
    return json(500, { error: 'Stripe is not configured (missing STRIPE_SECRET_KEY).' });
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const items = Array.isArray(body.items) ? body.items : [];
    if (!items.length) return json(400, { error: 'Your cart is empty.' });

    const line_items = [];
    let needsShipping = false;

    for (const it of items) {
      const priceId = PRICES[it.id];
      if (!priceId || /REPLACE/.test(priceId)) {
        return json(400, { error: 'Product not configured for checkout: ' + it.id });
      }
      const qty = Math.max(1, Math.min(99, parseInt(it.quantity, 10) || 1));
      line_items.push({ price: priceId, quantity: qty });
      if (PHYSICAL[it.id]) needsShipping = true;
    }

    // Base URL: Netlify provides process.env.URL; fall back to the request host.
    const host = (event.headers && (event.headers['x-forwarded-host'] || event.headers.host)) || '';
    const baseUrl = process.env.URL || (host ? 'https://' + host : '');

    const params = {
      mode: 'payment',
      line_items,
      // Omitting payment_method_types lets Stripe show every method enabled in
      // your Dashboard (Apple Pay, Google Pay, Link, cards) automatically.
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      success_url: baseUrl + '/thank-you?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: baseUrl + '/cart'
    };
    if (needsShipping) {
      params.shipping_address_collection = { allowed_countries: ['US'] };
    }

    const session = await stripe.checkout.sessions.create(params);
    return json(200, { url: session.url });
  } catch (err) {
    return json(500, { error: err.message || 'Server error creating checkout session.' });
  }
};

function json(statusCode, obj) {
  return {
    statusCode: statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(obj)
  };
}
