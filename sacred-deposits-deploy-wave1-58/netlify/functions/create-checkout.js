/**
 * create-checkout.js — Netlify serverless function
 * ---------------------------------------------------------------------------
 * Receives { items: [{ price, quantity }] } from the cart (price = Stripe
 * Price ID), validates each, creates a Stripe Checkout Session, and returns
 * { url } for redirect. Apple Pay, Google Pay, Link, and cards appear
 * automatically on hosted Checkout based on your Stripe Dashboard settings.
 *
 * Requires env var:  STRIPE_SECRET_KEY  (Netlify → Site settings → Env vars)
 * ---------------------------------------------------------------------------
 */
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed' });
  }
  if (!process.env.STRIPE_SECRET_KEY) {
    return json(500, { error: 'Stripe is not configured: STRIPE_SECRET_KEY is missing in Netlify environment variables.' });
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const items = Array.isArray(body.items) ? body.items : [];

    // Requirement #3 — log the cart items before checkout (view in Netlify → Functions → logs)
    console.log('Checkout cart items:', JSON.stringify(items));

    if (!items.length) return json(400, { error: 'Your cart is empty.' });

    // Validate every price ID server-side too (clear, specific errors).
    for (const item of items) {
      const price = item && item.price;
      if (!price || typeof price !== 'string' || price.indexOf('price_') !== 0) {
        return json(400, { error: 'Invalid Stripe price ID received: "' + price + '". Each item must use a price_… ID (not prod_, a name, a URL, or a dollar amount).' });
      }
    }

    // Requirement #6 — map straight to Stripe line_items.
    const line_items = items.map(function (item) {
      const qty = Math.max(1, Math.min(99, parseInt(item.quantity, 10) || 1));
      return { price: item.price, quantity: qty };
    });

    const host = (event.headers && (event.headers['x-forwarded-host'] || event.headers.host)) || '';
    const baseUrl = process.env.URL || (host ? 'https://' + host : '');

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: line_items,
      // Omitting payment_method_types lets Stripe show every enabled method
      // (Apple Pay, Google Pay, Link, cards) automatically.
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      shipping_address_collection: { allowed_countries: ['US'] },
      success_url: baseUrl + '/thank-you?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: baseUrl + '/cart'
    });

    // Requirement #7 — return the Checkout URL.
    return json(200, { url: session.url });
  } catch (err) {
    console.error('create-checkout error:', err && err.message);
    return json(500, { error: (err && err.message) || 'Server error creating checkout session.' });
  }
};

function json(statusCode, obj) {
  return { statusCode: statusCode, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(obj) };
}
