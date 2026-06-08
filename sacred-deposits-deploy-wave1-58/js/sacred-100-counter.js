/**
 * Sacred 100 live counter — client-side updater.
 * Reads /data/sacred-100.json (a public static file) and updates the displayed
 * number + progress bar. Edit data/sacred-100.json to change the count.
 *
 * The page's HTML already shows the static "claimed" number; this script keeps
 * it in sync with the JSON. If the JSON can't be fetched, the page falls back
 * to whatever number is hard-coded in the HTML.
 */
(function () {
  var counters = document.querySelectorAll('.sacred-100-counter');
  if (!counters.length) return;

  var bust = '?t=' + Math.floor(Date.now() / 60000); // refresh every minute max

  fetch('/data/sacred-100.json' + bust, { cache: 'no-store' })
    .then(function (r) { if (!r.ok) throw new Error('json ' + r.status); return r.json(); })
    .then(function (data) {
      if (!data || typeof data.claimed !== 'number') return;
      counters.forEach(function (c) {
        var total = parseInt(c.dataset.total, 10) || 100;
        var claimed = Math.min(Math.max(data.claimed, 0), total);

        // Update the visible number
        var numberEls = c.querySelectorAll('[data-claimed-display], .claimed-number');
        numberEls.forEach(function (el) { el.textContent = claimed; });

        // Update the progress bar
        var bar = c.querySelector('[data-claimed-bar], .claimed-bar');
        if (bar) {
          var pct = Math.round((claimed / total) * 100);
          bar.style.width = pct + '%';
        }

        // Keep data attribute in sync for any other listeners
        c.dataset.claimed = String(claimed);
      });
    })
    .catch(function () {
      /* Silent fail: HTML's initial number stays. */
    });
})();
