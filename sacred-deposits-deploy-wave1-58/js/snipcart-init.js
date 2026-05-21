/**
 * Cart badge updater — keeps the cart count in the header current.
 * The Snipcart loader itself lives in snipcart-config.js.
 */
(function() {
  function updateBadge() {
    if (!window.Snipcart || !window.Snipcart.store) return;
    try {
      var state = window.Snipcart.store.getState();
      var count = state && state.cart ? state.cart.items.count : 0;
      var badges = document.querySelectorAll('.cart-icon__count');
      badges.forEach(function(badge) {
        badge.textContent = count;
        badge.style.display = count > 0 ? 'inline-flex' : 'none';
      });
    } catch (e) { /* silent */ }
  }
  document.addEventListener('snipcart.ready', function() {
    updateBadge();
    if (window.Snipcart && window.Snipcart.events) {
      window.Snipcart.events.on('cart.confirmed', updateBadge);
      window.Snipcart.events.on('item.added', updateBadge);
      window.Snipcart.events.on('item.removed', updateBadge);
      window.Snipcart.events.on('item.updated', updateBadge);
    }
  });
})();
