(function () {
  var doc = document.documentElement;
  doc.classList.remove('no-js');

  // Old links ending in /index.html: show the clean address instead
  if (/\/index\.html$/.test(location.pathname) && history.replaceState) {
    history.replaceState(null, '', location.pathname.replace(/index\.html$/, '') + location.search + location.hash);
  }

  // Header border on scroll
  var header = document.querySelector('.site-header');
  function onScroll() { if (header) header.classList.toggle('scrolled', window.scrollY > 8); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Mobile menu
  var btn = document.querySelector('.menu-btn');
  if (btn) {
    btn.addEventListener('click', function () {
      var open = document.body.classList.toggle('menu-open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.querySelectorAll('.mobile-menu a').forEach(function (a) {
      a.addEventListener('click', function () {
        document.body.classList.remove('menu-open');
        btn.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // Reveal on scroll
  var items = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.08 });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add('in'); });
  }

  // Quiet scroll motion. Only elements that start below the screen are held back,
  // so nothing already visible flickers, and nothing is hidden if this script fails.
  if (doc.classList.contains('motion') && 'IntersectionObserver' in window) {
    var marks = [];
    document.querySelectorAll('.cards, .process, .cols, .ai-options, .insight-list, .help-list, .cs-grid').forEach(function (el) {
      el.classList.add('stagger');
      Array.prototype.forEach.call(el.children, function (c, i) { c.style.setProperty('--i', Math.min(i, 6)); });
      marks.push(el);
    });
    document.querySelectorAll('.case-media, .find-us').forEach(function (el) { el.classList.add('img-reveal'); marks.push(el); });
    document.querySelectorAll('.pad.africa-band').forEach(function (el) { marks.push(el); });
    var watch = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.remove('is-pending'); watch.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.05 });
    var pending = [];
    marks.forEach(function (el) {
      if (el.getBoundingClientRect().top > window.innerHeight * 0.9) { el.classList.add('is-pending'); watch.observe(el); pending.push(el); }
    });
    // Fallback: anything already scrolled past (fast scroll, jump links) is shown straight away
    function sweep() {
      pending = pending.filter(function (el) {
        if (!el.classList.contains('is-pending')) return false;
        if (el.getBoundingClientRect().top < window.innerHeight * 0.88) { el.classList.remove('is-pending'); watch.unobserve(el); return false; }
        return true;
      });
      if (!pending.length) window.removeEventListener('scroll', onSweep);
    }
    function onSweep() { sweep(); }
    window.addEventListener('scroll', onSweep, { passive: true });
    window.addEventListener('hashchange', sweep);
    sweep();
  }

  // Footer year
  document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  // Contact form: preselect the enquiry area from ?service=<key>
  var pick = new URLSearchParams(location.search).get('service');
  var sel = document.getElementById('service');
  if (pick && sel) {
    for (var i = 0; i < sel.options.length; i++) {
      if ((sel.options[i].getAttribute('data-key') || '').split(' ').indexOf(pick) !== -1) { sel.selectedIndex = i; break; }
    }
  }

  // Contact form: show a sending state so visitors do not submit twice
  var form = document.getElementById('enquiry');
  if (form) {
    form.addEventListener('submit', function () {
      var b = form.querySelector('button[type="submit"]');
      if (b) { b.disabled = true; b.textContent = 'Sending…'; }
    });
  }
})();
