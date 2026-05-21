/* ═══════════════════════════════════════════════════════════
   SACRED DEPOSITS™ — SHARED SCRIPT
   Mobile menu controller + animation observer
═══════════════════════════════════════════════════════════ */

(function () {

  // ─── Netlify Forms helper ───────────────────────────────
  // Submits any [data-netlify-form] form to Netlify Forms via AJAX,
  // preserving the page's existing inline success UI.
  window.sdNetlifySubmit = function(form, onSuccess) {
    var data = new URLSearchParams(new FormData(form));
    fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: data.toString()
    })
      .then(function (r) { if (!r.ok) throw r; if (typeof onSuccess === 'function') onSuccess(form); })
      .catch(function () {
        var btn = form.querySelector('button, [type=submit]');
        if (btn) { btn.textContent = 'Issue — please email us.'; btn.disabled = true; }
      });
    return false;
  };

  'use strict';

  /* ──────────────────────────────────────────────────────
     MOBILE MENU CONTROLLER
  ────────────────────────────────────────────────────── */
  function initMobileMenu() {
    var toggle = document.getElementById('nav-toggle');
    var menu = document.getElementById('mobile-menu');
    if (!toggle || !menu) return;

    var label = toggle.querySelector('.nav-toggle__label');
    var isOpen = false;

    function openMenu() {
      isOpen = true;
      menu.classList.add('is-open');
      menu.setAttribute('aria-hidden', 'false');
      toggle.classList.add('is-open');
      toggle.setAttribute('aria-expanded', 'true');
      if (label) label.textContent = 'CLOSE';
      document.body.classList.add('no-scroll');
    }

    function closeMenu() {
      isOpen = false;
      menu.classList.remove('is-open');
      menu.setAttribute('aria-hidden', 'true');
      toggle.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      if (label) label.textContent = 'MENU';
      document.body.classList.remove('no-scroll');
    }

    toggle.addEventListener('click', function () {
      if (isOpen) closeMenu();
      else openMenu();
    });

    // Close when any menu link is clicked
    menu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        // Tiny delay so the click registers visually
        setTimeout(closeMenu, 120);
      });
    });

    // Close on Escape key
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isOpen) closeMenu();
    });

    // Close when viewport grows past mobile breakpoint
    var mq = window.matchMedia('(min-width: 821px)');
    function handleMQ(e) { if (e.matches && isOpen) closeMenu(); }
    if (mq.addEventListener) mq.addEventListener('change', handleMQ);
    else if (mq.addListener) mq.addListener(handleMQ);
  }

  /* ──────────────────────────────────────────────────────
     SCROLL ANIMATION OBSERVER
  ────────────────────────────────────────────────────── */
  function initAnimations() {
    // Auto-decorate common patterns
    document.querySelectorAll('.section-title').forEach(function (el) {
      if (!el.classList.contains('reveal')) {
        el.classList.add('reveal', 'reveal--slow');
      }
    });
    document.querySelectorAll('.section-eyebrow, .section-sub').forEach(function (el) {
      if (!el.classList.contains('reveal')) {
        el.classList.add('reveal');
      }
    });

    // Data-attribute hooks
    document.querySelectorAll('[data-reveal]').forEach(function (el) {
      el.classList.add('reveal');
    });
    document.querySelectorAll('[data-reveal-slow]').forEach(function (el) {
      el.classList.add('reveal', 'reveal--slow');
    });
    document.querySelectorAll('[data-reveal-scale]').forEach(function (el) {
      el.classList.add('reveal--scale');
    });
    document.querySelectorAll('[data-stagger]').forEach(function (el) {
      el.classList.add('stagger');
    });

    
    // EXTENDED auto-tagging — adds reveal animations to common content elements site-wide
    // without modifying any HTML. Only affects elements not already inside a [data-no-anim] region.
    document.querySelectorAll('section h2, section h3, article h2, article h3').forEach(function (el) {
      if (!el.classList.contains('reveal') && !el.closest('[data-no-anim]')) {
        el.classList.add('reveal');
      }
    });
    document.querySelectorAll('section > p:not(.section-sub), article > p').forEach(function (el) {
      if (!el.classList.contains('reveal') && !el.closest('[data-no-anim]')) {
        el.classList.add('reveal');
      }
    });
    document.querySelectorAll('section [class*="-grid"]:not(.stagger), section [class*="__grid"]:not(.stagger)').forEach(function (el) {
      if (!el.closest('[data-no-anim]') && el.children.length >= 2 && el.children.length <= 12) {
        el.classList.add('stagger');
      }
    });

    // Fallback for browsers without IntersectionObserver
    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll('.reveal, .reveal--scale, .stagger')
        .forEach(function (el) { el.classList.add('in-view'); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });

    document.querySelectorAll('.reveal, .reveal--scale, .stagger')
      .forEach(function (el) { io.observe(el); });
  }

  /* ──────────────────────────────────────────────────────
     INIT
  ────────────────────────────────────────────────────── */
  /* ──────────────────────────────────────────────────────
     MOBILE MENU — PANEL SWITCHING (Wave 1)
  ────────────────────────────────────────────────────── */
  function initMobilePanels() {
    var menu = document.getElementById('mobile-menu');
    if (!menu) return;

    function showPanel(name) {
      var panels = menu.querySelectorAll('.mobile-menu__panel');
      panels.forEach(function (p) {
        if (p.getAttribute('data-panel') === name) {
          p.classList.add('is-active');
          p.setAttribute('aria-hidden', 'false');
        } else {
          p.classList.remove('is-active');
          p.setAttribute('aria-hidden', 'true');
        }
      });
    }

    // Branch buttons — slide to sub-panel
    menu.querySelectorAll('[data-target]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        var target = btn.getAttribute('data-target');
        if (target) showPanel(target);
      });
    });

    // Back buttons — return to root
    menu.querySelectorAll('[data-back]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        var target = btn.getAttribute('data-back') || 'root';
        showPanel(target);
      });
    });

    // Close button in topbar — defer to existing nav-toggle controller
    var closeBtn = menu.querySelector('.mobile-menu__close');
    if (closeBtn) {
      closeBtn.addEventListener('click', function (e) {
        e.preventDefault();
        var toggle = document.getElementById('nav-toggle');
        if (toggle) toggle.click();
      });
    }

    // When menu closes, reset to root panel so it's fresh on next open
    var observer = new MutationObserver(function () {
      if (!menu.classList.contains('is-open')) {
        setTimeout(function () { showPanel('root'); }, 350);
      }
    });
    observer.observe(menu, { attributes: true, attributeFilter: ['class'] });
  }

  function init() {
    initMobileMenu();
    initMobilePanels();
    initAnimations();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();


/* ════════════════════════════════════════════════════════════════════
   PRODUCT CAROUSEL — swipe-enabled image gallery
   Used on sacred-union-set.html and any [data-carousel] container
   ════════════════════════════════════════════════════════════════════ */
(function initProductCarousels() {
  const carousels = document.querySelectorAll('[data-carousel]');
  carousels.forEach(carousel => {
    const track = carousel.querySelector('[data-carousel-track]');
    const slides = carousel.querySelectorAll('.prod-carousel__slide');
    const counter = carousel.querySelector('[data-carousel-counter]');
    const prevBtn = carousel.querySelector('[data-carousel-prev]');
    const nextBtn = carousel.querySelector('[data-carousel-next]');
    const dots = carousel.querySelectorAll('[data-carousel-dot]');
    if (!track || slides.length < 2) return;

    const total = slides.length;
    let current = 0;

    function update(index) {
      current = Math.max(0, Math.min(index, total - 1));
      // Use native scroll for swipe-feel
      const slideWidth = slides[0].offsetWidth;
      track.scrollTo({ left: current * slideWidth, behavior: 'smooth' });
      // Update counter
      if (counter) counter.textContent = `${current + 1} / ${total}`;
      // Update dots
      dots.forEach((dot, i) => {
        const active = i === current;
        dot.classList.toggle('is-active', active);
        dot.setAttribute('aria-selected', active ? 'true' : 'false');
      });
    }

    if (prevBtn) prevBtn.addEventListener('click', () => update(current - 1));
    if (nextBtn) nextBtn.addEventListener('click', () => update(current + 1));
    dots.forEach(dot => {
      dot.addEventListener('click', () => {
        const i = parseInt(dot.getAttribute('data-carousel-dot'), 10);
        if (!isNaN(i)) update(i);
      });
    });

    // Sync state when user swipes natively
    let scrollTimeout = null;
    track.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        const slideWidth = slides[0].offsetWidth;
        const newIndex = Math.round(track.scrollLeft / slideWidth);
        if (newIndex !== current) {
          current = Math.max(0, Math.min(newIndex, total - 1));
          if (counter) counter.textContent = `${current + 1} / ${total}`;
          dots.forEach((dot, i) => {
            const active = i === current;
            dot.classList.toggle('is-active', active);
            dot.setAttribute('aria-selected', active ? 'true' : 'false');
          });
        }
      }, 80);
    });
  });
})();
