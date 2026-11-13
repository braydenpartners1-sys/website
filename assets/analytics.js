/* Brayden Partners: consent-first analytics.
 *
 * Fill in the IDs below once the accounts exist. Until at least one ID is set,
 * nothing is loaded, no banner is shown and no data leaves the visitor's browser.
 *
 *   GTM_ID      Google Tag Manager container, e.g. "GTM-XXXXXXX". If set, GA4 and
 *               Clarity should be configured inside GTM and the two IDs below left
 *               empty, so nothing is loaded twice.
 *   GA4_ID      Google Analytics 4 measurement ID, e.g. "G-XXXXXXXXXX".
 *   CLARITY_ID  Microsoft Clarity project ID.
 *
 * Privacy: under UK PECR, analytics cookies need consent. No analytics script
 * loads until the visitor clicks "Accept analytics". Google Consent Mode v2
 * defaults are set to "denied" first, and advertising storage is never granted.
 * Form contents are never sent: only the fact that a form was started or sent.
 */
(function () {
  var CONFIG = {
    GTM_ID: "",
    GA4_ID: "G-4NXWCPBYK4",
    CLARITY_ID: ""
  };

  var KEY = "bp-analytics-consent"; // "granted" | "denied"
  var configured = !!(CONFIG.GTM_ID || CONFIG.GA4_ID || CONFIG.CLARITY_ID);
  var preview = /[?&]analytics_preview=1/.test(location.search); // local testing of the banner only
  var debug = /[?&]debug_mode=1/.test(location.search);           // sends events to GA4 DebugView

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = window.gtag || gtag;

  // Consent Mode v2: everything denied until the visitor chooses
  gtag("consent", "default", {
    ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied",
    analytics_storage: "denied", functionality_storage: "granted", security_storage: "granted",
    wait_for_update: 500
  });

  function stored() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function store(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }

  // ---------- Loading (only after consent, only once) ----------
  var loaded = false;
  function addScript(src) { var s = document.createElement("script"); s.async = true; s.src = src; document.head.appendChild(s); }

  function loadAll() {
    if (loaded) return;
    loaded = true;
    gtag("consent", "update", { analytics_storage: "granted" });
    if (CONFIG.GTM_ID) {
      window.dataLayer.push({ "gtm.start": new Date().getTime(), event: "gtm.js" });
      addScript("https://www.googletagmanager.com/gtm.js?id=" + encodeURIComponent(CONFIG.GTM_ID));
    } else {
      if (CONFIG.GA4_ID) {
        addScript("https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(CONFIG.GA4_ID));
        gtag("js", new Date());
        gtag("config", CONFIG.GA4_ID, debug ? { debug_mode: true } : {});
      }
      if (CONFIG.CLARITY_ID) {
        (function (c, l, a, r, i) {
          c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
          var t = l.createElement(r); t.async = 1; t.src = "https://www.clarity.ms/tag/" + i;
          var y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
        })(window, document, "clarity", "script", CONFIG.CLARITY_ID);
        window.clarity("consent");
      }
    }
    flush();
  }

  // ---------- Events ----------
  // Events are queued until consent; if consent is refused they are discarded.
  var queue = [];
  var sentOnce = {};
  function track(name, params, onceKey) {
    if (onceKey) { if (sentOnce[onceKey]) return; sentOnce[onceKey] = true; }
    var p = params || {};
    p.page_path = location.pathname;
    if (!loaded) { if (stored() !== "denied") queue.push([name, p]); return; }
    send(name, p);
  }
  function send(name, p) {
    if (preview) { (window.bpEvents = window.bpEvents || []).push({ event: name, params: p }); }
    if (CONFIG.GTM_ID) {
      var o = { event: name }; for (var k in p) o[k] = p[k];
      window.dataLayer.push(o);
    } else {
      if (CONFIG.GA4_ID) gtag("event", name, p);
      if (CONFIG.CLARITY_ID && window.clarity) window.clarity("event", name);
    }
  }
  function flush() { var q = queue; queue = []; q.forEach(function (e) { send(e[0], e[1]); }); }
  window.bpTrack = track; // for testing in the console

  function label(a) { return (a.textContent || "").replace(/\s+/g, " ").trim().slice(0, 80); }
  function where(a) {
    if (a.closest(".site-header")) return "header";
    if (a.closest(".site-footer")) return "footer";
    if (a.closest(".home-hero, .page-hero, .portrait-hero, .overlay-hero, .band-hero")) return "hero";
    if (a.closest(".cta")) return "closing_cta";
    if (a.closest(".svc2")) return "service_section";
    if (a.closest(".card")) return "service_card";
    return "body";
  }

  // Clicks: consultation CTAs, other contact links, email links, booking links
  document.addEventListener("click", function (ev) {
    var a = ev.target.closest && ev.target.closest("a[href]");
    if (!a) return;
    var href = a.getAttribute("href") || "";
    if (/^mailto:/i.test(href)) {
      track("email_click", { link_location: where(a) });           // the address itself is not sent
    } else if (/calendly\.com|cal\.com|savvycal\.com|bookings\./i.test(href)) {
      track("consultation_click", { link_text: label(a), link_location: where(a), booking: "external" });
    } else if (/^\/contact\//.test(href)) {
      var service = (href.match(/[?&]service=([a-z]+)/) || [])[1] || "";
      if (a.classList.contains("btn-primary") || a.classList.contains("btn")) {
        track("consultation_click", { link_text: label(a), link_location: where(a), service_interest: service });
      } else {
        track("contact_click", { link_text: label(a), link_location: where(a), service_interest: service });
      }
    }
  }, true);

  // Service views: a dedicated service page, or a service section read on the Services page
  var path = location.pathname;
  if (path === "/services/technology-systems-ai/") {
    track("view_service", { service_name: "Technology, Systems & AI" }, "svc-technology");
  } else if (path === "/supporting-black-owned-businesses/") {
    track("view_service", { service_name: "Supporting Black-owned businesses" }, "svc-bob");
  } else if (path === "/services/") {
    // A service counts as viewed once its section reaches the upper 60% of the screen
    var sections = Array.prototype.slice.call(document.querySelectorAll(".svc2[id]"));
    var ticking = false;
    function checkSections() {
      ticking = false;
      sections = sections.filter(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < window.innerHeight * 0.6 && r.bottom > 0) {
          var h = el.querySelector("h2");
          track("view_service", { service_name: h ? h.textContent.replace(/\s+/g, " ").trim() : el.id }, "svc-" + el.id);
          return false;
        }
        return true;
      });
      if (!sections.length) window.removeEventListener("scroll", onSectionScroll);
    }
    function onSectionScroll() { if (!ticking) { ticking = true; setTimeout(checkSections, 150); } }
    if (sections.length) {
      window.addEventListener("scroll", onSectionScroll, { passive: true });
      window.addEventListener("hashchange", checkSections);
      if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", checkSections); else checkSections();
    }
  }

  // Enquiry form: started (first interaction) and sent. No field values are ever read.
  var form = document.getElementById("enquiry");
  if (form) {
    form.setAttribute("data-clarity-mask", "true");
    var started = false;
    function startForm() { if (started) return; started = true; track("enquiry_form_start", {}); }
    form.addEventListener("focusin", startForm);
    form.addEventListener("input", startForm);
    form.addEventListener("change", startForm);
    form.addEventListener("submit", function () {
      var sel = document.getElementById("service");
      var area = sel && sel.selectedIndex > 0 ? sel.options[sel.selectedIndex].text : "";
      try { sessionStorage.setItem("bp-enquiry-sent", area || "1"); } catch (e) {}
      startForm();
      track("enquiry_form_submit", { service_interest: area });
    });
  }
  // Successful enquiry: the thank-you page after a real submission (not a refresh or direct visit)
  if (path === "/thank-you/") {
    var flag = null;
    try { flag = sessionStorage.getItem("bp-enquiry-sent"); sessionStorage.removeItem("bp-enquiry-sent"); } catch (e) {}
    if (flag) track("generate_lead", { service_interest: flag === "1" ? "" : flag, form_name: "enquiry" }, "lead");
  }

  // ---------- Consent banner ----------
  function banner() {
    if (document.getElementById("consent")) return;
    var d = document.createElement("div");
    d.id = "consent";
    d.className = "consent";
    d.setAttribute("role", "dialog");
    d.setAttribute("aria-live", "polite");
    d.setAttribute("aria-label", "Cookie choices");
    d.innerHTML =
      '<p>We use analytics cookies to understand how people use this website and improve it. They are only set if you agree. <a href="/privacy/#cookies">Privacy notice</a></p>' +
      '<div class="consent-actions"><button type="button" class="btn btn-outline" data-consent="denied">Reject</button>' +
      '<button type="button" class="btn btn-outline" data-consent="granted">Accept analytics</button></div>';
    d.addEventListener("click", function (ev) {
      var b = ev.target.closest("[data-consent]");
      if (!b) return;
      var v = b.getAttribute("data-consent");
      store(v);
      d.remove();
      if (v === "granted") loadAll(); else queue = [];
    });
    document.body.appendChild(d);
  }

  function init() {
    if (!configured && !preview) return;
    document.querySelectorAll("[data-cookie-settings]").forEach(function (el) {
      el.hidden = false;
      el.addEventListener("click", function (ev) {
        ev.preventDefault();
        // Withdrawing consent stops loading on the next page; Google and Clarity cookies are cleared where possible
        try { localStorage.removeItem(KEY); } catch (e) {}
        if (loaded) {
          document.cookie.split(";").forEach(function (c) {
            var n = c.split("=")[0].trim();
            if (/^(_ga|_gid|_gat|_clck|_clsk|CLID|MUID)/.test(n)) {
              document.cookie = n + "=; Max-Age=0; path=/; domain=." + location.hostname.replace(/^www\./, "");
              document.cookie = n + "=; Max-Age=0; path=/";
            }
          });
        }
        banner();
      });
    });
    var choice = stored();
    if (choice === "granted") loadAll();
    else if (!choice) banner();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
