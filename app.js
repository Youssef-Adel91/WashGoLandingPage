(function () {
  var C = window.WASHGO_CONFIG || {};
  var form = document.getElementById('leadForm');
  var steps = [].slice.call(form.querySelectorAll('.step'));
  var bars = [].slice.call(form.querySelectorAll('.progress i'));
  var current = 0;
  var chosen = {};

  // ----- WhatsApp links
  function wa(text) {
    var n = (C.WHATSAPP_NUMBER || '').replace(/\D/g, '');
    return n && n.indexOf('X') < 0 ? 'https://wa.me/' + n + '?text=' + encodeURIComponent(text) : '#register';
  }
  var waText = 'أهلاً واش جو، عايز أسجّل مغسلتي.';
  ['waTop', 'waFoot', 'waSuccess'].forEach(function (id) { var a = document.getElementById(id); if (a) a.href = wa(waText); });

  // ----- QR / UTM attribution (?a=maadi&utm_source=flyer&utm_campaign=nov)
  var q = new URLSearchParams(location.search);
  var attrib = {
    area: (q.get('a') || '').slice(0, 60) || null,
    utm_source: (q.get('utm_source') || q.get('s') || '').slice(0, 60) || null,
    utm_campaign: (q.get('utm_campaign') || q.get('c') || '').slice(0, 60) || null
  };

  // ----- helpers
  function digits(s) { return (s || '').replace(/[٠-٩]/g, function (d) { return d.charCodeAt(0) - 1632; }).replace(/[۰-۹]/g, function (d) { return d.charCodeAt(0) - 1776; }); }
  function normPhone(s) { var d = digits(s).replace(/\D/g, ''); if (d.indexOf('0020') === 0) d = '0' + d.slice(4); else if (d.indexOf('20') === 0 && d.length === 12) d = '0' + d.slice(2); return d; }
  function show(i) {
    current = i;
    steps.forEach(function (s, k) { s.hidden = k !== i; });
    bars.forEach(function (b, k) { b.classList.toggle('on', k <= i); });
    var f = steps[i].querySelector('input,select'); if (f && i === 0) { /* no auto-focus to avoid mobile zoom jump */ }
  }
  function err(step, msg) { var e = steps[step].querySelector('.err'); e.textContent = msg || ''; }
  function validate(i) {
    var f = form.elements;
    if (i === 0) {
      if (f.shop_name.value.trim().length < 2) return 'اكتب اسم المغسلة';
      if (f.owner_name.value.trim().length < 2) return 'اكتب اسمك';
      if (!/^01[0125]\d{8}$/.test(normPhone(f.phone.value))) return 'رقم الواتساب غير صحيح (مثال: 01012345678)';
    }
    if (i === 1 && !f.governorate.value) return 'اختار المحافظة';
    if (i === 2 && !f.consent.checked) return 'محتاجين موافقتك عشان نتواصل معاك';
    return '';
  }

  // chips (single choice, toggle)
  [].forEach.call(form.querySelectorAll('.chips'), function (g) {
    g.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      [].forEach.call(g.children, function (x) { x.setAttribute('aria-pressed', 'false'); });
      b.setAttribute('aria-pressed', 'true'); chosen[g.dataset.name] = b.textContent.trim();
    });
  });

  form.addEventListener('click', function (e) {
    if (e.target.classList.contains('next')) { var m = validate(current); err(current, m); if (!m) { show(current + 1); form.scrollIntoView({ behavior: 'smooth', block: 'start' }); } }
    if (e.target.classList.contains('prev')) { show(current - 1); }
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var m = validate(2); err(2, m); if (m) return;
    if (form.elements.website.value) { done(); return; } // honeypot: bots get a fake success
    var f = form.elements;
    var row = {
      shop_name: f.shop_name.value.trim(), owner_name: f.owner_name.value.trim(), phone: normPhone(f.phone.value),
      governorate: f.governorate.value || null, bays: chosen.bays || null, cars_per_day: chosen.cars_per_day || null,
      booking_method: chosen.booking_method || null, biggest_problem: chosen.biggest_problem || null,
      best_call_time: chosen.best_call_time || null, consent: true,
      area: attrib.area, utm_source: attrib.utm_source, utm_campaign: attrib.utm_campaign
    };
    var btn = document.getElementById('submitBtn'); btn.disabled = true; btn.textContent = 'جاري الإرسال...';
    send(row).then(done).catch(function (ex) {
      btn.disabled = false; btn.textContent = 'ابعت بياناتي';
      var a = wa('أهلاً واش جو، أنا ' + row.owner_name + ' صاحب ' + row.shop_name + ' وعايز أسجّل. رقمي ' + row.phone);
      err(2, ex && ex.message === 'NOT_CONFIGURED' ? 'التسجيل مش متاح دلوقتي — كلّمنا على واتساب: ' + a : 'حصلت مشكلة في الإرسال، جرّب تاني أو كلّمنا على واتساب.');
    });
  });

  function hdrs() {
    var h = { 'Content-Type': 'application/json', apikey: C.SUPABASE_ANON_KEY, Prefer: 'return=minimal' };
    if (C.SUPABASE_ANON_KEY.indexOf('sb_') !== 0) h.Authorization = 'Bearer ' + C.SUPABASE_ANON_KEY; // legacy JWT anon keys only
    return h;
  }

  function send(row) {
    if (!C.SUPABASE_URL || !C.SUPABASE_ANON_KEY) return Promise.reject(new Error('NOT_CONFIGURED'));
    return fetch(C.SUPABASE_URL.replace(/\/$/, '') + '/rest/v1/shop_leads', {
      method: 'POST',
      headers: hdrs(),
      body: JSON.stringify(row)
    }).then(function (r) {
      if (r.ok || r.status === 409) return; // 409 = this phone already registered → still success for the user
      throw new Error('HTTP_' + r.status);
    });
  }

  function done() {
    form.hidden = true; var s = document.getElementById('success'); s.hidden = false; s.focus(); s.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  show(0);
})();
