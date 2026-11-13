/**
 * snipcart-config.js — Snipcart v3 loader (THE file that boots the cart)
 * ---------------------------------------------------------------------------
 * This is the loader referenced by snipcart-init.js. It must be included on
 * EVERY page that has "Add to Cart" buttons, ideally right after <body>.
 *
 * Public API key below is the Snipcart PUBLIC key (safe to expose client-side).
 * It is NOT a Stripe key. Stripe is connected separately, inside the Snipcart
 * dashboard under Payment Gateways — never in this file.
 *
 * Bootstrap IIFE is copied verbatim from Snipcart's official v3 install docs:
 * https://docs.snipcart.com/v3/setup/installation
 * The loader is self-contained: it creates the hidden #snipcart div if missing,
 * applies the API key, and injects snipcart.js + snipcart.css from the CDN.
 * It is idempotent — it will not double-load if Snipcart is already present.
 * ---------------------------------------------------------------------------
 */
(function () {
  window.SnipcartSettings = {
    publicApiKey: "ZjA5YTllMjAtNjY5Ny00OWZkLTg3ZmMtMjM1NmRjMWVhMGY0NjM5MTQ4MTA1ODI0OTI2NTQz",
    loadStrategy: "on-user-interaction",
    version: "3.7.1",   // pinned for launch stability; delete this line to always load latest
    currency: "usd",
    modalStyle: "side"  // slide-in cart; change to remove for full-page cart
  };

  // ── Official Snipcart bootstrap (verbatim from Snipcart v3 docs) ──────────
  (function(){var c,d;(d=(c=window.SnipcartSettings).version)!=null||(c.version="3.0");var s,S;(S=(s=window.SnipcartSettings).timeoutDuration)!=null||(s.timeoutDuration=2750);var l,p;(p=(l=window.SnipcartSettings).domain)!=null||(l.domain="cdn.snipcart.com");var w,u;(u=(w=window.SnipcartSettings).protocol)!=null||(w.protocol="https");var m,g;(g=(m=window.SnipcartSettings).loadCSS)!=null||(m.loadCSS=!0);var y=window.SnipcartSettings.version.includes("v3.0.0-ci")||window.SnipcartSettings.version!="3.0"&&window.SnipcartSettings.version.localeCompare("3.4.0",void 0,{numeric:!0,sensitivity:"base"})===-1,f=["focus","mouseover","touchmove","scroll","keydown"];window.LoadSnipcart=o;document.readyState==="loading"?document.addEventListener("DOMContentLoaded",r):r();function r(){window.SnipcartSettings.loadStrategy?window.SnipcartSettings.loadStrategy==="on-user-interaction"&&(f.forEach(function(t){return document.addEventListener(t,o)}),setTimeout(o,window.SnipcartSettings.timeoutDuration)):o()}var a=!1;function o(){if(a)return;a=!0;let t=document.getElementsByTagName("head")[0],n=document.querySelector("#snipcart"),i=document.querySelector('src[src^="'.concat(window.SnipcartSettings.protocol,"://").concat(window.SnipcartSettings.domain,'"][src$="snipcart.js"]')),e=document.querySelector('link[href^="'.concat(window.SnipcartSettings.protocol,"://").concat(window.SnipcartSettings.domain,'"][href$="snipcart.css"]'));n||(n=document.createElement("div"),n.id="snipcart",n.setAttribute("hidden","true"),document.body.appendChild(n)),h(n),i||(i=document.createElement("script"),i.src="".concat(window.SnipcartSettings.protocol,"://").concat(window.SnipcartSettings.domain,"/themes/v").concat(window.SnipcartSettings.version,"/default/snipcart.js"),i.async=!0,t.appendChild(i)),!e&&window.SnipcartSettings.loadCSS&&(e=document.createElement("link"),e.rel="stylesheet",e.type="text/css",e.href="".concat(window.SnipcartSettings.protocol,"://").concat(window.SnipcartSettings.domain,"/themes/v").concat(window.SnipcartSettings.version,"/default/snipcart.css"),t.prepend(e)),f.forEach(function(v){return document.removeEventListener(v,o)})}function h(t){!y||(t.dataset.apiKey=window.SnipcartSettings.publicApiKey,window.SnipcartSettings.addProductBehavior&&(t.dataset.configAddProductBehavior=window.SnipcartSettings.addProductBehavior),window.SnipcartSettings.modalStyle&&(t.dataset.configModalStyle=window.SnipcartSettings.modalStyle),window.SnipcartSettings.currency&&(t.dataset.currency=window.SnipcartSettings.currency),window.SnipcartSettings.templatesUrl&&(t.dataset.templatesUrl=window.SnipcartSettings.templatesUrl))}})();
})();
