(function () {
  var C = window.WASHGO_CONFIG || {};
  var body = document.body;
  var KEY = 'washgo_aud';
  var q = new URLSearchParams(location.search);

  // ----- who is this visitor? ?w=shop|mobile (from a QR) > last choice > ask
  function setMode(m, scroll) {
    body.setAttribute('data-mode', m);
    [].forEach.call(document.querySelectorAll('[data-aud]'), function (el) { el.hidden = el.getAttribute('data-aud') !== m; });
    document.getElementById('switchAud').hidden = false;
    try { localStorage.setItem(KEY, m); } catch (e) {}
    if (scroll) window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function clearMode() {
    body.removeAttribute('data-mode');
    [].forEach.call(document.querySelectorAll('[data-aud]'), function (el) { el.hidden = true; });
    document.getElementById('switchAud').hidden = true;
    try { localStorage.removeItem(KEY); } catch (e) {}
    window.scrollTo({ top: 0 });
  }
  var start = q.get('w');
  if (start !== 'shop' && start !== 'mobile') { start = null; }
  if (start) setMode(start, false);
  document.getElementById('choose').addEventListener('click', function (e) {
    var b = e.target.closest('[data-pick]'); if (b) setMode(b.getAttribute('data-pick'), true);
  });
  document.getElementById('switchAud').addEventListener('click', clearMode);
  if (!start) { clearMode(); } // always ask first when there is no ?w= (the poster QR has none)

  // ----- WhatsApp
  var n = (C.WHATSAPP_NUMBER || '').replace(/\D/g, '');
  var wa = document.getElementById('waSuccessMobile');
  if (wa && n) wa.href = 'https://wa.me/' + n + '?text=' + encodeURIComponent('أهلاً واش جو، عايز أبدأ مغسلة متنقلة.');

  // ----- attribution (same params as the shop form)
  var attrib = {
    area: (q.get('a') || '').slice(0, 60) || null,
    utm_source: (q.get('utm_source') || q.get('s') || '').slice(0, 60) || null,
    utm_campaign: (q.get('utm_campaign') || q.get('c') || '').slice(0, 60) || null
  };

  // ----- mobile-washer lead form
  var form = document.getElementById('mobileForm');
  if (!form) return;
  var chosen = {};
  function digits(s) { return (s || '').replace(/[٠-٩]/g, function (d) { return d.charCodeAt(0) - 1632; }).replace(/[۰-۹]/g, function (d) { return d.charCodeAt(0) - 1776; }); }
  function normPhone(s) { var d = digits(s).replace(/\D/g, ''); if (d.indexOf('0020') === 0) d = '0' + d.slice(4); else if (d.indexOf('20') === 0 && d.length === 12) d = '0' + d.slice(2); return d; }
  [].forEach.call(form.querySelectorAll('.chips'), function (g) {
    g.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      [].forEach.call(g.children, function (x) { x.setAttribute('aria-pressed', 'false'); });
      b.setAttribute('aria-pressed', 'true'); chosen[g.dataset.name] = b.textContent.trim();
    });
  });
  var errEl = form.querySelector('.err');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var f = form.elements;
    var phone = normPhone(f.phone.value);
    var m = '';
    if (f.full_name.value.trim().length < 2) m = 'اكتب اسمك';
    else if (!/^01[0125]\d{8}$/.test(phone)) m = 'رقم الواتساب غير صحيح (مثال: 01012345678)';
    else if (!f.governorate.value) m = 'اختار المحافظة';
    else if (!f.consent.checked) m = 'محتاجين موافقتك عشان نتواصل معاك';
    errEl.textContent = m; if (m) return;
    if (f.website.value) { done(); return; } // honeypot
    var row = {
      full_name: f.full_name.value.trim(), phone: phone, governorate: f.governorate.value,
      equipment: chosen.equipment || null, vehicle: chosen.vehicle || null, best_call_time: chosen.best_call_time || null,
      consent: true, area: attrib.area, utm_source: attrib.utm_source, utm_campaign: attrib.utm_campaign
    };
    var btn = document.getElementById('submitMobile'); btn.disabled = true; btn.textContent = 'جاري الإرسال...';
    var h = { 'Content-Type': 'application/json', apikey: C.SUPABASE_ANON_KEY, Prefer: 'return=minimal' };
    if ((C.SUPABASE_ANON_KEY || '').indexOf('sb_') !== 0) h.Authorization = 'Bearer ' + C.SUPABASE_ANON_KEY;
    fetch(C.SUPABASE_URL.replace(/\/$/, '') + '/rest/v1/mobile_leads', { method: 'POST', headers: h, body: JSON.stringify(row) })
      .then(function (r) { if (r.ok || r.status === 409) return done(); throw new Error('HTTP_' + r.status); })
      .catch(function () {
        btn.disabled = false; btn.textContent = 'ابعت بياناتي';
        errEl.textContent = 'حصلت مشكلة في الإرسال، جرّب تاني أو كلّمنا على واتساب.';
      });
  });
  function done() {
    form.hidden = true; var s = document.getElementById('successMobile'); s.hidden = false; s.focus();
    s.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
})();
