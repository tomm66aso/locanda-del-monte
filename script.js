/* =====================================================================
   La Locanda del Monte — script.js v3
   Preloader · Nav · Reveal · Parallax · Sunset · Cookie · WhatsApp
   Form prenotazione · Mappa condizionale
   ===================================================================== */
(function () {
  'use strict';

  /* ----------------------------------------------------------------
     CONFIG
     ---------------------------------------------------------------- */
  var FORMSPREE_ID = 'YOUR_FORM_ID'; // → sostituisci con il tuo ID Formspree
  var GENOVA = { lat: 44.4127, lng: 8.9633 };
  var COOKIE_KEY = 'locanda_cookie_consent';

  /* ================================================================
     PRELOADER
     ================================================================ */
  var preloader = document.getElementById('preloader');
  function hidePreloader() {
    if (preloader) {
      preloader.classList.add('done');
      document.body.style.overflow = '';
    }
  }
  if (preloader) {
    document.body.style.overflow = 'hidden';
    setTimeout(hidePreloader, 1300);
  }

  /* ================================================================
     NAV
     ================================================================ */
  var nav = document.getElementById('nav');

  // Active link based on data-page on <body>
  var page = document.body.dataset.page || '';
  if (page) {
    var activeLink = nav.querySelector('[data-page="' + page + '"]');
    if (activeLink) activeLink.classList.add('active');
  }

  // Scroll state
  function onScroll() {
    nav.classList.toggle('scrolled', window.scrollY > 60);
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // Mobile burger
  var burger   = document.getElementById('navBurger');
  var navLinks = document.getElementById('navLinks');
  var overlay  = document.getElementById('navOverlay');

  function closeMenu() {
    burger.classList.remove('open');
    navLinks.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
    if (overlay) overlay.style.display = 'none';
  }
  burger.addEventListener('click', function () {
    var open = burger.classList.toggle('open');
    navLinks.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (overlay) overlay.style.display = open ? 'block' : 'none';
  });
  navLinks.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', closeMenu);
  });
  if (overlay) overlay.addEventListener('click', closeMenu);

  /* ================================================================
     SCROLL REVEAL
     ================================================================ */
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in-view'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -5% 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in-view'); });
  }

  /* ================================================================
     HERO ENTRANCE + PARALLAX
     ================================================================ */
  var hero = document.querySelector('.hero');
  if (hero) {
    setTimeout(function () { hero.classList.add('loaded'); }, 200);

    var layers  = document.querySelectorAll('.scene-layer');
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var mouseX  = 0, ticking = false;

    function doParallax() {
      var y = window.scrollY;
      layers.forEach(function (l) {
        var d = parseFloat(l.getAttribute('data-depth')) || 0;
        l.style.transform = 'translate3d(' + (mouseX * d * 0.45) + 'px,' + (-(y * d) / 100) + 'px,0)';
      });
      ticking = false;
    }
    if (!reduced && layers.length) {
      window.addEventListener('scroll', function () {
        if (!ticking) { requestAnimationFrame(doParallax); ticking = true; }
      }, { passive: true });
      window.addEventListener('pointermove', function (e) {
        mouseX = e.clientX / window.innerWidth - 0.5;
        if (!ticking) { requestAnimationFrame(doParallax); ticking = true; }
      }, { passive: true });
    }
  }

  /* ================================================================
     SUNSET WIDGET
     ================================================================ */
  var sunsetEl  = document.getElementById('sunsetTime');
  var sunsetSub = document.getElementById('sunsetSub');

  function calcSunset(lat, lng) {
    var now   = new Date();
    var year  = now.getFullYear();
    var doy   = Math.floor((now - new Date(year, 0, 0)) / 864e5);

    var B     = (2 * Math.PI / 365) * (doy - 81);
    var decl  = 23.45 * Math.PI / 180 * Math.sin(B);
    var EoT   = 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);

    var latR  = lat * Math.PI / 180;
    var cosH  = -Math.tan(latR) * Math.tan(decl);
    cosH = Math.max(-1, Math.min(1, cosH));
    var H = Math.acos(cosH) * 180 / Math.PI;

    // UTC sunset in minutes from midnight
    var sunsetUTC = 720 - 4 * lng - EoT + 4 * H;

    // Italy timezone (CET = +60, CEST = +120)
    function lastSundayOf(y, m) {
      var d = new Date(y, m, 1);
      d.setDate(d.getDate() - 1);
      d.setDate(d.getDate() - d.getDay());
      return d;
    }
    var dstStart = lastSundayOf(year, 3);
    var dstEnd   = lastSundayOf(year, 10);
    var tzOff    = (now >= dstStart && now < dstEnd) ? 120 : 60;

    var local = sunsetUTC + tzOff;
    var h     = Math.floor(local / 60) % 24;
    var m     = Math.floor(local % 60);
    return { h: h, m: m };
  }

  if (sunsetEl) {
    var s = calcSunset(GENOVA.lat, GENOVA.lng);
    var hh = s.h;
    var mm = s.m < 10 ? '0' + s.m : s.m;
    sunsetEl.textContent = hh + ':' + mm;

    // Dynamic sub-text
    if (sunsetSub) {
      var now2 = new Date();
      var currentMin = now2.getHours() * 60 + now2.getMinutes();
      var sunsetMin  = s.h * 60 + s.m;
      var diff = sunsetMin - currentMin - 60; // 1h before sunset = aperitivo window

      if (diff > 120) {
        var dh = Math.floor(diff / 60), dm = diff % 60;
        sunsetSub.textContent = 'Hai ' + dh + ' ora' + (dh > 1 ? 'e' : '') +
          (dm > 0 ? ' e ' + dm + ' minuti' : '') + ' per prenotare l\'aperitivo sul sagrato.';
      } else if (diff > 0) {
        sunsetSub.textContent = 'Stai arrivando giusto in tempo — prenota ora l\'aperitivo sul sagrato.';
      } else {
        sunsetSub.textContent = 'Il tramonto è già calato. Prenota il tuo tavolo per cena, ne vale la pena.';
      }
    }
  }

  /* ================================================================
     COOKIE BANNER
     ================================================================ */
  var banner   = document.getElementById('cookieBanner');
  var mapWrap  = document.getElementById('mapWrap');
  var mapIframe = document.getElementById('mapIframe');
  var mapPlaceholder = document.getElementById('mapPlaceholder');
  var mapLoadBtn = document.getElementById('mapLoadBtn');

  var consent = null;
  try { consent = localStorage.getItem(COOKIE_KEY); } catch(e){}

  function setConsent(val) {
    try { localStorage.setItem(COOKIE_KEY, val); } catch(e){}
    consent = val;
    if (banner) { banner.classList.remove('show'); }
  }

  function loadMap() {
    if (mapIframe && mapIframe.dataset.src) {
      mapIframe.src = mapIframe.dataset.src;
      delete mapIframe.dataset.src;
    }
    if (mapPlaceholder) mapPlaceholder.classList.add('map-hidden');
    if (mapIframe) mapIframe.style.display = 'block';
  }

  // Show banner if no consent
  if (!consent) {
    setTimeout(function () {
      if (banner) banner.classList.add('show');
    }, 1800);
  } else if (consent === 'accepted') {
    loadMap();
  }

  // Accept button
  var acceptBtn = document.getElementById('cookieAccept');
  if (acceptBtn) acceptBtn.addEventListener('click', function () {
    setConsent('accepted');
    loadMap();
  });

  // Reject button
  var rejectBtn = document.getElementById('cookieReject');
  if (rejectBtn) rejectBtn.addEventListener('click', function () {
    setConsent('rejected');
  });

  // Manual map load from placeholder
  if (mapLoadBtn) mapLoadBtn.addEventListener('click', function () {
    setConsent('accepted');
    loadMap();
  });

  // If map is present but iframe needs conditional loading
  if (mapIframe && consent !== 'accepted') {
    mapIframe.style.display = 'none';
  } else if (mapIframe && consent === 'accepted') {
    loadMap();
  }

  /* ================================================================
     FORM PRENOTAZIONE
     ================================================================ */
  var form      = document.getElementById('bookingForm');
  var submitBtn = document.getElementById('formSubmit');
  var errorsBox = document.getElementById('formErrors');
  var successBox= document.getElementById('formSuccess');

  if (form) {
    // Set date minimum to today
    var dateInput = document.getElementById('f-data');
    if (dateInput) dateInput.min = new Date().toISOString().split('T')[0];

    function validate() {
      var errors = [];
      form.querySelectorAll('[required]').forEach(function (field) {
        field.classList.remove('error');
        if (!field.value.trim()) {
          field.classList.add('error');
          var lbl = form.querySelector('label[for="' + field.id + '"]');
          var name = lbl ? lbl.textContent.replace('*', '').trim() : 'Campo';
          errors.push(name + ' è obbligatorio.');
        }
      });
      var emailF = document.getElementById('f-email');
      if (emailF && emailF.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailF.value)) {
        emailF.classList.add('error');
        errors.push("Inserisci un'email valida.");
      }
      return errors;
    }

    function showSuccess() {
      form.querySelectorAll('input,select,textarea,button').forEach(function (el) { el.disabled = true; });
      successBox.classList.add('show');
      successBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function simulate() {
      submitBtn.classList.add('loading');
      setTimeout(function () { submitBtn.classList.remove('loading'); showSuccess(); }, 1200);
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      errorsBox.classList.remove('show');
      successBox.classList.remove('show');

      var errors = validate();
      if (errors.length) {
        errorsBox.innerHTML = errors.map(function (m) { return '<p>• ' + m + '</p>'; }).join('');
        errorsBox.classList.add('show');
        errorsBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        return;
      }

      if (FORMSPREE_ID === 'YOUR_FORM_ID') { simulate(); return; }

      submitBtn.classList.add('loading');
      fetch('https://formspree.io/f/' + FORMSPREE_ID, {
        method: 'POST', body: new FormData(form),
        headers: { 'Accept': 'application/json' }
      })
      .then(function (res) {
        submitBtn.classList.remove('loading');
        if (res.ok) { showSuccess(); }
        else { res.json().then(function (j) {
          var msg = j && j.errors ? j.errors.map(function(x){return x.message;}).join(', ') : 'Errore. Contattaci per telefono.';
          errorsBox.innerHTML = '<p>' + msg + '</p>';
          errorsBox.classList.add('show');
        }); }
      })
      .catch(function () {
        submitBtn.classList.remove('loading');
        errorsBox.innerHTML = '<p>Connessione non riuscita. Contattaci per telefono.</p>';
        errorsBox.classList.add('show');
      });
    });

    form.querySelectorAll('input,select,textarea').forEach(function (f) {
      f.addEventListener('input', function () { f.classList.remove('error'); });
    });
  }

  /* ================================================================
     ANNO FOOTER
     ================================================================ */
  var yr = document.getElementById('year');
  if (yr) yr.textContent = new Date().getFullYear();

})();
