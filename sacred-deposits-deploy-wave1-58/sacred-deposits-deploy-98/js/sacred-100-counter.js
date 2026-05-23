/**
 * Sacred 100 live counter — client-side updater.
 * Looks for <div class="sacred-100-counter" data-claimed="N" data-total="100">
 * Fetches the live count and updates the displayed number + progress bar.
 *
 * Tries Netlify Function first (if configured), falls back to JSON file.
 */
(function() {
  var counters = document.querySelectorAll('.sacred-100-counter');
  if (!counters.length) return;

  // Cache-bust the URL so updates show immediately
  var bust = '?t=' + Math.floor(Date.now() / 60000); // refresh every minute max

  // Try Netlify Function first (will fall back to static JSON if not configured)
  fetch('/.netlify/functions/sacred-100-count' + bust)
    .then(function(r) {
      if (r.ok) return r.json();
      throw new Error('function unavailable');
    })
    .catch(function() {
      return fetch('/data/sacred-100.json' + bust).then(function(r) { return r.json(); });
    })
    .then(function(data) {
      if (!data || typeof data.claimed !== 'number') return;
      counters.forEach(function(c) {
        var total = parseInt(c.dataset.total, 10) || 100;
        var claimed = Math.min(Math.max(data.claimed, 0), total);
        // Update the number display (first occurrence of the claimed number)
        var numberEls = c.querySelectorAll('[data-claimed-display], .claimed-number');
        if (numberEls.length) {
          numberEls.forEach(function(el) { el.textContent = claimed; });
        } else {
          // Fallback: find italic gold-colored numbers in the display
          var spans = c.querySelectorAll('span');
          spans.forEach(function(s) {
            if (s.textContent.trim() === c.dataset.claimed) {
              s.textContent = claimed;
            }
          });
        }
        // Update the progress bar width
        var bar = c.querySelector('[data-claimed-bar], .claimed-bar');
        if (!bar) {
          // Fallback: find any element with width:N% inline style
          var allDivs = c.querySelectorAll('div');
          for (var i = 0; i < allDivs.length; i++) {
            var s = allDivs[i].getAttribute('style') || '';
            if (s.indexOf('width:') !== -1 && s.indexOf('%') !== -1 && s.indexOf('background') !== -1) {
              bar = allDivs[i];
              break;
            }
          }
        }
        if (bar) {
          var pct = (claimed / total) * 100;
          bar.style.width = pct + '%';
        }
        // Update the data attribute so JS knows the current state
        c.dataset.claimed = claimed;
      });
    })
    .catch(function(err) {
      // Silent — fall back to whatever was already in the HTML
      console.warn('[Sacred 100 counter] live update unavailable:', err.message);
    });
})();
