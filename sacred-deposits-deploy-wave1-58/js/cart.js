/**
 * cart.js — Sacred Deposits custom cart + Stripe Checkout
 * ---------------------------------------------------------------------------
 * - localStorage cart (id, name, price, image, qty)
 * - Binds .sd-add-to-cart buttons (reads their data-id/name/price/image attrs)
 * - Slide-in drawer (injected once; matches site navy/gold styling)
 * - Checkout POSTs {items:[{id,quantity}]} to the Netlify function, which maps
 *   each id to a Stripe Price ID server-side and returns the Checkout URL.
 * - No price is trusted from the client; Stripe charges the Price ID amount.
 * ---------------------------------------------------------------------------
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'sd_cart_v1';
  var ENDPOINT = '/.netlify/functions/create-checkout';

  /* ───────────────────────────────────────────────────────────────
   * STRIPE PRICE IDs — paste your real price_… IDs from the Stripe
   * Dashboard (Products → each product → its Price → copy the ID).
   * Keys MUST match the data-id on your "Add to Cart" buttons.
   * A value that is not a real price_… ID will block checkout with a
   * clear error naming the product.
   * ─────────────────────────────────────────────────────────────── */
  var PRICE_IDS = {
    'sacred-deposits-hardcover': 'price_REPLACE_HARDCOVER',   // $36.99
    'sacred-deposits-paperback': 'price_REPLACE_PAPERBACK',   // $24.99
    'sacred-deposits-ebook':     'price_REPLACE_EBOOK',       // $9.99
    'couples-workbook':          'price_REPLACE_WORKBOOK',    // $16.99
    'her-covenant-journal':      'price_REPLACE_HER_JOURNAL', // $29.99
    'his-covenant-journal':      'price_REPLACE_HIS_JOURNAL', // $29.99
    'sacred-union-set':          'price_REPLACE_UNION_SET',   // $150
    'sacred-100-founders':       'price_REPLACE_FOUNDERS'     // $249
  };
  function priceIdFor(id) { return PRICE_IDS[id] || ''; }
  var C = { navy: '#071432', navy2: '#0b1e40', gold: '#B89045', goldS: '#D1AD66', ivory: '#FBF4E6' };

  /* ---------------- storage ---------------- */
  function read() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch (e) { return []; } }
  function write(items) { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); updateBadges(); renderAll(); }
  function count() { return read().reduce(function (n, i) { return n + i.qty; }, 0); }
  function subtotal() { return read().reduce(function (s, i) { return s + (i.price * i.qty); }, 0); }
  function money(n) { return '$' + (Math.round(n * 100) / 100).toFixed(2); }

  /* ---------------- mutations ---------------- */
  function add(item) {
    var items = read();
    var found = items.filter(function (i) { return i.id === item.id; })[0];
    if (found) { found.qty += (item.qty || 1); if (!found.priceId) found.priceId = priceIdFor(found.id); }
    else { items.push({ id: item.id, name: item.name, price: item.price, image: item.image, qty: item.qty || 1, priceId: priceIdFor(item.id) }); }
    write(items); openDrawer();
  }
  function setQty(id, qty) {
    var items = read().map(function (i) { if (i.id === id) i.qty = qty; return i; })
      .filter(function (i) { return i.qty > 0; });
    write(items);
  }
  function remove(id) { write(read().filter(function (i) { return i.id !== id; })); }

  /* ---------------- styles (injected once) ---------------- */
  function injectStyles() {
    if (document.getElementById('sd-cart-styles')) return;
    var s = document.createElement('style');
    s.id = 'sd-cart-styles';
    s.textContent =
      '#sd-cart-root{position:fixed;inset:0;z-index:99999;pointer-events:none;font-family:"Manrope",system-ui,sans-serif;}' +
      '#sd-cart-root.is-open{pointer-events:auto;}' +
      '.sd-cart__overlay{position:absolute;inset:0;background:rgba(2,6,15,.55);opacity:0;transition:opacity .35s ease;}' +
      '#sd-cart-root.is-open .sd-cart__overlay{opacity:1;}' +
      '.sd-cart__drawer{position:absolute;top:0;right:0;height:100%;width:400px;max-width:92vw;background:' + C.navy + ';' +
        'box-shadow:-20px 0 60px rgba(0,0,0,.4);transform:translateX(100%);transition:transform .38s cubic-bezier(.22,1,.36,1);' +
        'display:flex;flex-direction:column;border-left:1px solid rgba(209,173,102,.25);}' +
      '#sd-cart-root.is-open .sd-cart__drawer{transform:translateX(0);}' +
      '.sd-cart__head{display:flex;align-items:center;justify-content:space-between;padding:26px 26px 18px;' +
        'border-bottom:1px solid rgba(209,173,102,.2);}' +
      '.sd-cart__title{font-family:"Cinzel",serif;font-size:.82rem;font-weight:600;letter-spacing:.26em;' +
        'text-transform:uppercase;color:' + C.goldS + ';}' +
      '.sd-cart__close{background:none;border:none;color:' + C.ivory + ';font-size:1.7rem;line-height:1;cursor:pointer;' +
        'opacity:.7;transition:opacity .2s;padding:0 4px;}' +
      '.sd-cart__close:hover{opacity:1;}' +
      '.sd-cart__items{flex:1;overflow-y:auto;padding:18px 26px;}' +
      '.sd-cart__empty{font-family:"Cormorant Garamond",serif;font-style:italic;font-size:1.15rem;' +
        'color:rgba(251,244,230,.55);text-align:center;margin-top:40px;}' +
      '.sd-cart__item{display:flex;gap:14px;padding:16px 0;border-bottom:1px solid rgba(209,173,102,.14);}' +
      '.sd-cart__thumb{width:58px;height:78px;object-fit:cover;border-radius:2px;background:' + C.navy2 + ';flex:none;}' +
      '.sd-cart__meta{flex:1;min-width:0;}' +
      '.sd-cart__name{display:block;font-family:"Cormorant Garamond",serif;font-size:1.08rem;color:' + C.ivory + ';' +
        'line-height:1.25;margin-bottom:3px;}' +
      '.sd-cart__price{display:block;font-size:.78rem;letter-spacing:.04em;color:' + C.goldS + ';margin-bottom:10px;}' +
      '.sd-cart__qty{display:flex;align-items:center;gap:10px;}' +
      '.sd-cart__qty button{width:26px;height:26px;border:1px solid rgba(209,173,102,.4);background:transparent;' +
        'color:' + C.ivory + ';border-radius:2px;cursor:pointer;font-size:.95rem;line-height:1;display:flex;' +
        'align-items:center;justify-content:center;transition:border-color .2s,background .2s;}' +
      '.sd-cart__qty button:hover{border-color:' + C.goldS + ';background:rgba(209,173,102,.1);}' +
      '.sd-cart__qty > span{font-size:.85rem;color:' + C.ivory + ';min-width:18px;text-align:center;}' +
      '.sd-cart__rm{width:auto !important;border:none !important;font-size:.62rem !important;letter-spacing:.14em;' +
        'text-transform:uppercase;color:rgba(251,244,230,.45) !important;margin-left:6px;padding:0 4px !important;}' +
      '.sd-cart__rm:hover{color:' + C.goldS + ' !important;background:none !important;}' +
      '.sd-cart__foot{padding:20px 26px 26px;border-top:1px solid rgba(209,173,102,.2);}' +
      '.sd-cart__subtotal{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:16px;' +
        'font-family:"Cormorant Garamond",serif;}' +
      '.sd-cart__subtotal > span:first-child{font-size:.66rem;letter-spacing:.22em;text-transform:uppercase;' +
        'font-family:"Manrope",sans-serif;font-weight:700;color:rgba(251,244,230,.6);}' +
      '.sd-cart__subtotal > span:last-child{font-size:1.5rem;color:' + C.ivory + ';}' +
      '.sd-cart__checkout{width:100%;font-family:"Manrope",sans-serif;font-size:.7rem;font-weight:700;' +
        'letter-spacing:.2em;text-transform:uppercase;color:' + C.navy + ';background:' + C.gold + ';border:1px solid ' + C.gold + ';' +
        'border-radius:2px;padding:16px;cursor:pointer;transition:background .3s,border-color .3s;}' +
      '.sd-cart__checkout:hover{background:' + C.goldS + ';border-color:' + C.goldS + ';}' +
      '.sd-cart__checkout:disabled{opacity:.6;cursor:default;}' +
      '.sd-cart__note{font-size:.62rem;color:rgba(251,244,230,.45);text-align:center;margin:12px 0 0;letter-spacing:.02em;}' +
      /* standalone /cart page mount */
      '.sd-cart-page{max-width:620px;margin:0 auto;}' +
      '.sd-cart-page .sd-cart__items{padding:0;}' +
      '.sd-cart-page .sd-cart__foot{border-top:1px solid rgba(209,173,102,.25);margin-top:18px;padding:22px 0 0;}';
    document.head.appendChild(s);
  }

  /* ---------------- item rendering (shared by drawer + page) ---------------- */
  function itemsHTML() {
    var items = read();
    if (!items.length) return '<p class="sd-cart__empty">Your cart is empty.</p>';
    return items.map(function (i) {
      var thumb = i.image ? '<img class="sd-cart__thumb" src="' + i.image + '" alt="">' : '<div class="sd-cart__thumb"></div>';
      return '<div class="sd-cart__item">' + thumb +
        '<div class="sd-cart__meta">' +
          '<span class="sd-cart__name">' + i.name + '</span>' +
          '<span class="sd-cart__price">' + money(i.price) + '</span>' +
          '<div class="sd-cart__qty">' +
            '<button data-dec="' + i.id + '" aria-label="Decrease quantity">&minus;</button>' +
            '<span>' + i.qty + '</span>' +
            '<button data-inc="' + i.id + '" aria-label="Increase quantity">+</button>' +
            '<button class="sd-cart__rm" data-rm="' + i.id + '">Remove</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    }).join('');
  }

  function bindItemControls(scope) {
    scope.querySelectorAll('[data-inc]').forEach(function (b) {
      b.onclick = function () { var id = b.getAttribute('data-inc'); var it = read().filter(function (x) { return x.id === id; })[0]; setQty(id, (it ? it.qty : 0) + 1); };
    });
    scope.querySelectorAll('[data-dec]').forEach(function (b) {
      b.onclick = function () { var id = b.getAttribute('data-dec'); var it = read().filter(function (x) { return x.id === id; })[0]; setQty(id, (it ? it.qty : 1) - 1); };
    });
    scope.querySelectorAll('[data-rm]').forEach(function (b) {
      b.onclick = function () { remove(b.getAttribute('data-rm')); };
    });
  }

  /* ---------------- drawer ---------------- */
  function buildDrawer() {
    if (document.getElementById('sd-cart-root')) return;
    injectStyles();
    var root = document.createElement('div');
    root.id = 'sd-cart-root';
    root.innerHTML =
      '<div class="sd-cart__overlay" data-cart-close></div>' +
      '<aside class="sd-cart__drawer" role="dialog" aria-label="Shopping cart" aria-modal="true">' +
        '<div class="sd-cart__head"><span class="sd-cart__title">Your Cart</span>' +
          '<button class="sd-cart__close" data-cart-close aria-label="Close cart">&times;</button></div>' +
        '<div class="sd-cart__items" id="sd-cart-items"></div>' +
        '<div class="sd-cart__foot">' +
          '<div class="sd-cart__subtotal"><span>Subtotal</span><span id="sd-cart-subtotal">$0.00</span></div>' +
          '<button class="sd-cart__checkout" id="sd-cart-checkout">Checkout</button>' +
          '<p class="sd-cart__note">Secure checkout via Stripe &mdash; Apple Pay, Google Pay, Link &amp; cards.</p>' +
        '</div>' +
      '</aside>';
    document.body.appendChild(root);
    root.addEventListener('click', function (e) { if (e.target.hasAttribute('data-cart-close')) closeDrawer(); });
    document.getElementById('sd-cart-checkout').addEventListener('click', checkout);
  }

  function renderDrawer() {
    var box = document.getElementById('sd-cart-items'); if (!box) return;
    box.innerHTML = itemsHTML();
    var st = document.getElementById('sd-cart-subtotal'); if (st) st.textContent = money(subtotal());
    bindItemControls(box);
    var co = document.getElementById('sd-cart-checkout'); if (co) co.disabled = read().length === 0;
  }

  function renderAll() { renderDrawer(); renderPage(); }

  function openDrawer() { buildDrawer(); document.getElementById('sd-cart-root').classList.add('is-open'); renderDrawer(); document.body.style.overflow = 'hidden'; }
  function closeDrawer() { var r = document.getElementById('sd-cart-root'); if (r) r.classList.remove('is-open'); document.body.style.overflow = ''; }

  /* ---------------- standalone /cart page ---------------- */
  var pageEl = null;
  function mountPage(el) { pageEl = el; injectStyles(); renderPage(); }
  function renderPage() {
    if (!pageEl) return;
    pageEl.innerHTML =
      '<div class="sd-cart-page">' +
        '<div class="sd-cart__items">' + itemsHTML() + '</div>' +
        (read().length ?
          '<div class="sd-cart__foot">' +
            '<div class="sd-cart__subtotal"><span>Subtotal</span><span>' + money(subtotal()) + '</span></div>' +
            '<button class="sd-cart__checkout" id="sd-page-checkout">Checkout</button>' +
            '<p class="sd-cart__note">Secure checkout via Stripe &mdash; Apple Pay, Google Pay, Link &amp; cards.</p>' +
          '</div>' : '') +
      '</div>';
    bindItemControls(pageEl);
    var co = pageEl.querySelector('#sd-page-checkout'); if (co) co.addEventListener('click', checkout);
  }

  /* ---------------- badges ---------------- */
  function updateBadges() {
    var c = count();
    document.querySelectorAll('.cart-icon__count, .mobile-menu__cart-count').forEach(function (b) {
      b.textContent = c; b.style.display = c > 0 ? 'inline-flex' : 'none';
    });
  }

  /* ---------------- checkout ---------------- */
  function checkout() {
    var items = read();
    if (!items.length) return;
    var btn = document.getElementById('sd-cart-checkout') || (pageEl && pageEl.querySelector('#sd-page-checkout'));
    var label = btn ? btn.textContent : '';

    // Backfill price IDs for items saved before they existed, then log.
    var cartItems = items.map(function (i) {
      if (!i.priceId) i.priceId = priceIdFor(i.id);
      return i;
    });
    console.log('Checkout cart items:', cartItems);

    // Validate every product has a real Stripe price_… ID — name the culprit.
    for (var k = 0; k < cartItems.length; k++) {
      var it = cartItems[k];
      if (!it.priceId || String(it.priceId).indexOf('price_') !== 0) {
        alert('Sorry \u2014 checkout could not start.\n\nInvalid Stripe price ID for "' + (it.name || it.id) + '".\n' +
              'Open js/cart.js and set its real price_\u2026 ID in PRICE_IDS (currently "' + (it.priceId || 'empty') + '").');
        return;
      }
    }

    if (btn) { btn.disabled = true; btn.textContent = 'Redirecting\u2026'; }
    fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: cartItems.map(function (i) { return { price: i.priceId, quantity: i.qty }; }) })
    })
      .then(function (r) {
        return r.text().then(function (t) {
          var d = null;
          try { d = JSON.parse(t); } catch (e) { /* not JSON */ }
          return { ok: r.ok, status: r.status, d: d, raw: t };
        });
      })
      .then(function (res) {
        if (res.ok && res.d && res.d.url) { window.location.href = res.d.url; return; }
        var msg;
        if (res.d && res.d.error) {
          msg = res.d.error;                       // real error JSON from the function
        } else if (res.status === 404) {
          msg = 'The checkout function was not found (404). It only runs on the live Netlify site \u2014 not a local file or static preview \u2014 and must be deployed with its dependencies.';
        } else if (!res.d) {
          msg = 'The checkout function did not return valid data (status ' + res.status + '). Usually means it crashed \u2014 check that STRIPE_SECRET_KEY is set in Netlify and the function deployed with the Stripe package.';
        } else {
          msg = 'Checkout could not start (status ' + res.status + ').';
        }
        throw new Error(msg);
      })
      .catch(function (err) {
        if (btn) { btn.disabled = false; btn.textContent = label; }
        alert('Sorry \u2014 checkout could not start.\n\n' + (err.message || err));
      });
  }

  /* ---------------- wiring ---------------- */
  function bind() {
    buildDrawer(); updateBadges(); renderAll();

    document.querySelectorAll('.sd-add-to-cart').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault(); e.stopPropagation();
        var price = parseFloat(btn.getAttribute('data-price'));
        add({
          id: btn.getAttribute('data-id'),
          name: btn.getAttribute('data-name') || 'Item',
          price: isNaN(price) ? 0 : price,
          image: btn.getAttribute('data-image') || '',
          qty: 1
        });
      }, true); /* capture phase keeps the click ours */
    });

    document.querySelectorAll('.cart-icon, .mobile-menu__cart').forEach(function (el) {
      el.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); openDrawer(); }, true);
    });

    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeDrawer(); });

    var mount = document.getElementById('sd-cart-mount');
    if (mount) mountPage(mount);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind); else bind();

  window.SDCart = { open: openDrawer, close: closeDrawer, read: read, add: add, checkout: checkout, mountPage: mountPage };
})();
