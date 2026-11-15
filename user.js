(function () {
  var C = window.WASHGO_CONFIG || {};
  var form = document.getElementById('userForm');
  if (!form) return;
  var q = new URLSearchParams(location.search);
  var attrib = {
    area: (q.get('a') || '').slice(0, 60) || null,
    utm_source: (q.get('utm_source') || q.get('s') || '').slice(0, 60) || null,
    utm_campaign: (q.get('utm_campaign') || q.get('c') || '').slice(0, 60) || null
  };
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
    var rawPhone = f.phone.value.trim();
    var phone = rawPhone ? normPhone(rawPhone) : '';
    var m = '';
    if (!chosen.preferred_place) m = 'اختار تفضّل تغسل عربيتك فين';
    else if (!f.governorate.value) m = 'اختار المحافظة';
    else if (rawPhone && !/^01[0125]\d{8}$/.test(phone)) m = 'رقم الواتساب غير صحيح (مثال: 01012345678) أو سيبه فاضي';
    else if (rawPhone && !f.consent.checked) m = 'علشان نبلّغك لازم توافق إننا نتواصل معاك';
    errEl.textContent = m; if (m) return;
    if (f.website.value) { done(); return; } // honeypot
    var row = {
      preferred_place: chosen.preferred_place,
      wash_frequency: chosen.wash_frequency || null,
      top_priority: chosen.top_priority || null,
      wash_type: chosen.wash_type || null,
      max_price: chosen.max_price || null,
      wants_plan: chosen.wants_plan || null,
      governorate: f.governorate.value,
      full_name: f.full_name.value.trim() || null,
      phone: phone || null,
      consent: !!phone,
      area: attrib.area, utm_source: attrib.utm_source, utm_campaign: attrib.utm_campaign
    };
    var btn = document.getElementById('submitUser'); btn.disabled = true; btn.textContent = 'جاري الإرسال...';
    var h = { 'Content-Type': 'application/json', apikey: C.SUPABASE_ANON_KEY, Prefer: 'return=minimal' };
    if ((C.SUPABASE_ANON_KEY || '').indexOf('sb_') !== 0) h.Authorization = 'Bearer ' + C.SUPABASE_ANON_KEY;
    fetch(C.SUPABASE_URL.replace(/\/$/, '') + '/rest/v1/user_leads', { method: 'POST', headers: h, body: JSON.stringify(row) })
      .then(function (r) { if (r.ok || r.status === 409) return done(); throw new Error('HTTP_' + r.status); })
      .catch(function () {
        btn.disabled = false; btn.textContent = 'ابعت إجاباتي';
        errEl.textContent = 'حصلت مشكلة في الإرسال، جرّب تاني بعد شوية.';
      });
  });
  function done() {
    form.hidden = true; var s = document.getElementById('successUser'); s.hidden = false; s.focus();
    s.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
})();
