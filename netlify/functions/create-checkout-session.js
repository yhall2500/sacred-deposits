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


    // Build line items. Accept price_ ids directly; for prod_ ids, resolve the
    // product's default (or first active) price via the Stripe API.
    const line_items = [];
    for (const item of items) {
      const id = item && item.price;
      const qty = Math.max(1, Math.min(99, parseInt(item.quantity, 10) || 1));
      if (!id || typeof id !== 'string') {
        return json(400, { error: 'Invalid Stripe id received: "' + id + '".' });
      }
      if (id.indexOf('price_') === 0) {
        line_items.push({ price: id, quantity: qty });
      } else if (id.indexOf('prod_') === 0) {
        let priceId = null;
        try {
          const product = await stripe.products.retrieve(id);
          priceId = (product && product.default_price) || null;
          if (!priceId) {
            const prices = await stripe.prices.list({ product: id, active: true, limit: 1 });
            priceId = prices.data[0] && prices.data[0].id;
          }
        } catch (e) {
          return json(400, { error: 'Could not look up a price for product ' + id + ': ' + (e && e.message) });
        }
        if (!priceId) {
          return json(400, { error: 'No active price found for product ' + id + '. Add a price to this product in Stripe.' });
        }
        line_items.push({ price: priceId, quantity: qty });
      } else {
        return json(400, { error: 'Invalid Stripe id: "' + id + '". Must be a price_… or prod_… id.' });
      }
    }

    const host = (event.headers && (event.headers['x-forwarded-host'] || event.headers.host)) || '';
    const baseUrl = process.env.URL || (host ? 'https://' + host : '');

    // Digital-only products get no shipping. The eBook is the only digital item.
    // (Listed by both its price_ and prod_ id so it matches whatever the cart sends.)
    const DIGITAL_IDS = ['price_1TYicoAaJAJhQwzSlKad6RNp', 'prod_UXoFwZ6lFFDRA8'];
    const hasPhysical = items.some(function (item) {
      return DIGITAL_IDS.indexOf(item && item.price) === -1;
    });

    const sessionParams = {
      mode: 'payment',
      line_items: line_items,
      // Omitting payment_method_types lets Stripe show every enabled method
      // (Apple Pay, Google Pay, Link, cards) automatically.
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      success_url: baseUrl + '/thank-you?session_id={CHECKOUT_SESSION_ID}&purchase=1',
      cancel_url: baseUrl + '/cart'
    };

    // Only collect a shipping address + show shipping rates when something
    // physical is in the cart. An eBook-only order skips shipping entirely.
    if (hasPhysical) {
      sessionParams.shipping_address_collection = { allowed_countries: ['US'] };
      sessionParams.shipping_options = [
        { shipping_rate: 'shr_1TYiFwAaJAJhQwzSXjU7aFPc' }, // Standard Shipping
        { shipping_rate: 'shr_1TYiGqAaJAJhQwzSsZmBqUpt' }  // Premium Shipping
      ];
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

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
