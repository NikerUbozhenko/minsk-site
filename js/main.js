'use strict';
/* ====== Настройки сайта ====== */
const SITE = { city: 'Минск', phone: '+375 44 587-67-56', tg: 'https://t.me/zamvec' };
const IMGS = {"1": "img/betonnyj-cokol.jpg", "2": "img/zamena-vencov-brus.jpg", "3": "img/dom-na-oporah.jpg", "4": "img/usilenie-gruntov.jpg", "5": "img/gidroizolyaciya-fundamenta.jpg", "6": "img/novyj-venec-gidroizolyaciya.jpg", "7": "img/zamena-vencov-rabota.jpg", "9": "img/gnilye-vency.jpg", "10": "img/fundament-pod-srub.jpg", "11": "img/gidroizolyaciya-uteplitel.jpg", "12": "img/opalubka-fundamenta.jpg"};
const DIM = {"1": [1200, 904], "2": [1200, 900], "3": [1200, 904], "4": [675, 1200], "5": [1200, 904], "6": [1200, 904], "7": [1200, 900], "9": [1200, 900], "10": [1200, 904], "11": [1200, 904], "12": [1200, 904]};
const GAL = [[7,'Замена венцов: старые убираем, новые ставим'],
  [2,'Новые нижние венцы под резными наличниками'],
  [12,'Опалубка под новый пояс фундамента'],
  [6,'Новый брус и гидроизоляция'],
  [5,'Фундамент с гидроизоляцией и дренажными выпусками'],
  [4,'Усиление грунта под фундаментной лентой'],
  [11,'Гидроизоляция и утеплитель по периметру'],
  [1,'Новая цокольная лента под обшитым домом'],
  [3,'Дом на временных опорах, заливка основания'],
  [10,'Фундамент под срубом'],
  [9,'Старый венец срублен, новый брус уложен']];
const TOWNS = ['Минск','Минский район','Борисов','Жодино','Заславль','Фаниполь','Дзержинск','Смолевичи','Логойск','Марьина Горка','Молодечно','Другой населённый пункт'];

/* ====== Галерея ====== */
const gal = document.getElementById('gal');
if (gal) gal.innerHTML = GAL.map(([i, c]) => { const d = DIM[i] || [1200, 900];
  return `<figure><img src="${IMGS[i]}" alt="${c}" loading="lazy" decoding="async" width="${d[0]}" height="${d[1]}"><figcaption>${c}</figcaption></figure>`; }).join('');

/* ====== FAQ: плавное раскрытие; открытый вопрос закрывает остальные ====== */
const EASE = 'cubic-bezier(.22,.61,.36,1)';
const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
(() => {
  const items = [...document.querySelectorAll('.faq details')];
  const anims = new WeakMap(), intent = new WeakMap();
  const isOpen = d => (intent.has(d) ? intent.get(d) : d.open);
  const measure = (d, open) => { const was = d.open; d.style.height = ''; d.open = open; const h = d.getBoundingClientRect().height; d.open = was; return h; };
  function run(d, open) {
    const from = d.getBoundingClientRect().height, prev = anims.get(d);
    if (prev) prev.cancel();
    const to = measure(d, open);
    d.style.overflow = 'hidden';
    if (open) { d.open = true; d.removeAttribute('data-closing'); } else d.setAttribute('data-closing', '');
    const a = d.animate({ height: [from + 'px', to + 'px'] }, { duration: 320, easing: EASE });
    anims.set(d, a);
    a.onfinish = () => { if (!open) d.open = false; d.removeAttribute('data-closing'); d.style.height = d.style.overflow = ''; anims.delete(d); };
  }
  items.forEach(d => {
    d.querySelector('summary').addEventListener('click', e => {
      if (reduceMotion() || typeof d.animate !== 'function') return;   // без анимации: обычное поведение
      e.preventDefault();
      const open = !isOpen(d);
      intent.set(d, open);
      if (open) items.forEach(o => { if (o !== d && isOpen(o)) { intent.set(o, false); run(o, false); } });
      run(d, open);
    });
    d.addEventListener('toggle', () => { if ((reduceMotion() || typeof d.animate !== 'function') && d.open) items.forEach(o => { if (o !== d) o.open = false; }); });
  });
})();

/* ====== Мобильное меню ====== */
(() => {
  const b = document.querySelector('.burger'), nav = document.getElementById('mnav');
  if (!b || !nav) return;
  const finish = () => { nav.classList.remove('open', 'closing'); };
  const set = o => {
    b.setAttribute('aria-expanded', String(o)); document.body.classList.toggle('menu-open', o);
    if (o) { nav.classList.remove('closing'); nav.classList.add('open'); return; }
    if (!nav.classList.contains('open')) return;
    if (reduceMotion()) return finish();
    nav.classList.add('closing');
    nav.addEventListener('animationend', finish, { once: true });
    setTimeout(finish, 400);
  };
  b.addEventListener('click', () => set(b.getAttribute('aria-expanded') !== 'true'));
  nav.addEventListener('click', e => { if (e.target.closest('a')) set(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && b.getAttribute('aria-expanded') === 'true') { set(false); b.focus(); } });
  matchMedia('(min-width:1001px)').addEventListener('change', e => { if (e.matches) set(false); });
})();

/* ====== Нижняя панель на телефоне: прячем, пока на экране квиз или контакты ====== */
(() => {
  const bar = document.getElementById('mbar');
  if (!bar || !('IntersectionObserver' in window)) return;
  const seen = new Set();
  const io = new IntersectionObserver(es => { es.forEach(e => e.isIntersecting ? seen.add(e.target) : seen.delete(e.target)); bar.classList.toggle('hide', seen.size > 0); }, { threshold: .15 });
  ['quiz', 'contacts'].forEach(id => { const el = document.getElementById(id); if (el) io.observe(el); });
})();

/* ====== Квиз. Цены в руб., правятся здесь ====== */
const P = { demo: 35, beam: 65, log: 80, waterproof: 15, insul: 10, fRepair: 110, fNew: 240, grunt: 140, roofM2: 50, liftMin: 450, liftM: 25 };
const SZ = { s: ['До 6×6 м', 'небольшой дом, периметр около 24 м', 24], m: ['6×9 м', 'периметр около 30 м', 30], l: ['9×10 м', 'периметр около 40 м', 40], xl: ['Больше', 'большой дом или два этажа, около 52 м', 52] };
const SV = { venzy: 'Замена венцов', fRepair: 'Ремонт фундамента', fNew: 'Замена фундамента', grunt: 'Усиление грунтов', roof: 'Ремонт кровли', lift: 'Только подъём дома' };
const WALL = { log: 'Бревно', beam: 'Брус', other: 'Не знаю / другое' };
const ST = { local: ['Локальная гниль', 'один венец или угол', .4], one: ['Гниль в 1 венце', 'по всему периметру', 1], two: ['Гниль в 2–3 венцах', 'просадка, перекос окон', 2.5], unk: ['Не знаю', 'нужен осмотр', 1.5] };
const VIA = ['Звонок', 'Telegram', 'WhatsApp', 'Viber'];
const S = { sv: [], wall: '', sz: '', st: '', town: '', name: '', phone: '', via: 'Звонок', note: '', ok: false };
const steps = [
  { k: 'sv', t: 'Что нужно сделать?', multi: 1, o: Object.entries(SV) },
  { k: 'wall', t: 'Из чего построен дом?', o: Object.entries(WALL) },
  { k: 'sz', t: 'Какой размер дома?', o: Object.entries(SZ).map(([v, a]) => [v, a[0], a[1]]) },
  { k: 'st', t: 'В каком состоянии нижние венцы?', o: Object.entries(ST).map(([v, a]) => [v, a[0], a[1]]) },
  { k: 'town', t: 'Где находится дом?', two: 1, o: TOWNS.map(x => [x, x]) },
  { k: 'contact', t: 'Куда прислать расчёт?' }
];
let n = 0, sending = false, lastData = null, lastEst = [0, 0], prevPct = 0;
const t0 = Date.now();
const box = document.getElementById('qz');
const g = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* телефон: +375 29 123-45-67, 80 29 123-45-67, 29 123-45-67 или международный +7... */
function normPhone(v) {
  const raw = String(v || '').trim();
  let d = raw.replace(/\D/g, '');
  if (d.length === 11 && d.startsWith('80')) d = '375' + d.slice(2);
  else if (d.length === 9) d = '375' + d;
  else if (!(d.length === 12 && d.startsWith('375')) && !(raw.startsWith('+') && d.length >= 10 && d.length <= 15)) return '';
  return '+' + d;
}
const fmtPhone = p => { const m = /^\+375(\d{2})(\d{3})(\d{2})(\d{2})$/.exec(p); return m ? `+375 ${m[1]} ${m[2]}-${m[3]}-${m[4]}` : p; };
function contactErr() {
  if (S.name.trim().length < 2) return ['f-name', 'Укажите имя'];
  if (!normPhone(S.phone)) return ['f-phone', 'Введите телефон, например +375 29 123-45-67'];
  if (!S.ok) return ['f-ok', 'Нужно согласие на обработку персональных данных'];
  return null;
}
const ok = s => s.k === 'contact' ? true : s.multi ? S.sv.length > 0 : !!S[s.k];

function calc() {
  const p = SZ[S.sz || 'm'][2], rows = ST[S.st || 'unk'][2], rate = S.wall === 'log' ? P.log : P.beam;
  let t = 0, lift = 0;
  const has = v => S.sv.includes(v);
  if (has('venzy')) { t += p * rows * (P.demo + rate + P.waterproof + P.insul); lift = 1; }
  if (has('fRepair')) t += p * P.fRepair;
  if (has('fNew')) { t += p * P.fNew; lift = 1; }
  if (has('grunt')) t += p * P.grunt;
  if (has('roof')) t += Math.pow(p / 4, 2) * 1.3 * P.roofM2;
  if (has('lift')) lift = 1;
  if (lift) t += Math.max(P.liftMin, p * P.liftM);
  const r = x => Math.round(x / 10) * 10;
  return [r(t), r(t * 1.35)];
}

function swap(html, anim) {
  const h0 = box.offsetHeight;
  box.innerHTML = html;
  const go = anim && !reduceMotion();
  box.classList.toggle('qz-anim', go);
  if (!go || typeof box.animate !== 'function') return;
  const h1 = box.offsetHeight;
  if (Math.abs(h1 - h0) < 2) return;
  box.style.overflow = 'hidden';
  const a = box.animate({ height: [h0 + 'px', h1 + 'px'] }, { duration: 320, easing: EASE });
  a.onfinish = a.oncancel = () => { box.style.overflow = ''; };
}
function growBar(p) {
  const i = box.querySelector('.bar i'); prevPct = p;
  if (i) requestAnimationFrame(() => requestAnimationFrame(() => { i.style.width = p + '%'; }));
}

function focusStep() {
  const h = g('qt'); if (!h) return;
  h.focus({ preventScroll: true });
  const top = box.getBoundingClientRect().top;
  if (top < 0 || top > innerHeight * .6) box.scrollIntoView({ block: 'start', behavior: 'smooth' });
}

function render(opt = {}) {
  const s = steps[n], last = n === steps.length - 1, newPct = (n + 1) / steps.length * 100;
  let h = `<div class="bar" role="progressbar" aria-label="Прогресс расчёта" aria-valuemin="1" aria-valuemax="${steps.length}" aria-valuenow="${n + 1}"><i style="width:${prevPct}%"></i></div>` +
    `<div class="qn">Шаг ${n + 1} из ${steps.length}</div><h3 class="qt" id="qt" tabindex="-1">${s.t}</h3>`;
  const nav = `<div class="qnav"><button type="button" class="back" id="bk"${n ? '' : ' style="visibility:hidden"'}>← Назад</button><button type="${last ? 'submit' : 'button'}" class="btn" id="nx"${ok(s) ? '' : ' disabled'}>${last ? 'Получить расчёт' : 'Далее'}</button></div>`;
  if (last) {
    h += `<form id="qf" novalidate><div class="fld">
 <label>Имя<input id="f-name" name="name" autocomplete="name" maxlength="60" value="${esc(S.name)}" placeholder="Как к вам обращаться"></label>
 <label>Телефон<input id="f-phone" name="tel" type="tel" inputmode="tel" autocomplete="tel" maxlength="20" value="${esc(S.phone)}" placeholder="+375 29 123-45-67"></label>
 <label>Как с вами связаться<select id="f-via">${VIA.map(x => `<option${S.via === x ? ' selected' : ''}>${x}</option>`).join('')}</select></label>
 <label>Комментарий (необязательно)<textarea id="f-note" rows="2" maxlength="300" placeholder="Например, адрес или удобное время">${esc(S.note)}</textarea></label>
 <label class="chk"><input type="checkbox" id="f-ok"${S.ok ? ' checked' : ''}><span>Согласен на обработку персональных данных (<a href="privacy.html" target="_blank" rel="noopener">политика конфиденциальности</a>)</span></label>
 <input class="hp" id="f-hp" name="hp_field" tabindex="-1" autocomplete="off" aria-hidden="true">
</div><p class="err" id="err" role="alert"></p>${nav}</form>`;
  } else {
    h += `<div class="opts${s.two ? ' two' : ''}" role="group" aria-labelledby="qt">` + s.o.map(o => {
      const on = s.multi ? S.sv.includes(o[0]) : S[s.k] === o[0];
      return `<button type="button" class="opt" aria-pressed="${on}" data-v="${esc(o[0])}">${s.multi ? '<span class="bx" aria-hidden="true">' + (on ? '✓' : '') + '</span>' : ''}<span>${esc(o[1])}${o[2] ? '<small>' + esc(o[2]) + '</small>' : ''}</span></button>`;
    }).join('') + '</div>' + nav;
  }
  swap(h, !!opt.step); growBar(newPct);

  box.querySelectorAll('.opt').forEach(b => b.addEventListener('click', () => {
    const v = b.dataset.v;
    if (s.multi) { S.sv = S.sv.includes(v) ? S.sv.filter(x => x !== v) : [...S.sv, v]; render({ keep: v }); }
    else { S[s.k] = v; n++; render({ step: 1 }); }
  }));
  if (opt.keep) { const b = box.querySelector(`.opt[data-v="${CSS.escape(opt.keep)}"]`); if (b) b.focus({ preventScroll: true }); }
  g('bk').addEventListener('click', () => { n--; render({ step: 1 }); });
  if (last) {
    const up = () => { S.name = g('f-name').value; S.phone = g('f-phone').value; S.via = g('f-via').value; S.note = g('f-note').value; S.ok = g('f-ok').checked; g('err').textContent = ''; };
    ['f-name', 'f-phone', 'f-via', 'f-note', 'f-ok'].forEach(i => { g(i).addEventListener('input', up); g(i).addEventListener('change', up); });
    g('f-phone').addEventListener('blur', e => { const p = normPhone(e.target.value); if (p) { e.target.value = fmtPhone(p); up(); } });
    g('qf').addEventListener('submit', e => { e.preventDefault(); up(); const er = contactErr(); if (er) { g('err').textContent = er[1]; g(er[0]).focus(); return; } send(); });
  } else {
    g('nx').addEventListener('click', () => { n++; render({ step: 1 }); });
  }
  if (opt.step) focusStep();
}

function utm() {
  const q = new URLSearchParams(location.search), o = [];
  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term'].forEach(k => q.get(k) && o.push(k.slice(4) + '=' + q.get(k)));
  if (q.get('yclid')) o.push('yclid'); if (q.get('gclid')) o.push('gclid');
  return o.join(', ');
}
async function post(d) {
  const c = new AbortController(), to = setTimeout(() => c.abort(), 12000);
  try {
    // сначала /api/send (Vercel или Apache-правило), если такого адреса нет (404/405) — /api/send.php (обычный PHP-хостинг)
    for (const url of ['/api/send', '/api/send.php']) {
      const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d), signal: c.signal });
      if ([404, 405, 501].includes(r.status)) continue;
      const j = await r.json().catch(() => ({}));
      return r.ok && j.ok === true;
    }
    return false;
  } catch (e) { return false; } finally { clearTimeout(to); }
}
async function send() {
  if (sending) return; sending = true;
  const btn = g('nx'); btn.disabled = true; btn.textContent = 'Отправляем…';
  const [lo, hi] = lastEst = calc();
  let ref = ''; try { ref = document.referrer ? new URL(document.referrer).hostname : ''; } catch (e) {}
  lastData = {
    city: SITE.city, services: S.sv.map(v => SV[v]), wall: WALL[S.wall], size: SZ[S.sz][0] + ' (' + SZ[S.sz][1] + ')', state: ST[S.st][0], town: S.town,
    name: S.name.trim(), phone: normPhone(S.phone), via: S.via, note: S.note.trim(), estimate: lo + ' – ' + hi + ' руб.',
    page: location.origin + location.pathname, utm: utm(), ref, device: matchMedia('(max-width:700px)').matches ? 'телефон' : 'компьютер',
    hp: g('f-hp').value, t: Date.now() - t0
  };
  const sent = await post(lastData);
  sending = false;
  result(sent);
}
function result(sent) {
  const [lo, hi] = lastEst, d = lastData;
  const fb = SITE.tg + '?text=' + encodeURIComponent('Заявка с сайта: ' + d.services.join(', ') + '. ' + d.size + ', ' + d.town + '. ' + d.name + ' ' + d.phone);
  swap(`<div class="res"><div class="bar"><i style="width:${prevPct}%"></i></div><h3 class="qt" id="qt" tabindex="-1" style="margin-top:20px">${sent ? 'Заявка отправлена' : 'Расчёт готов'}</h3><p>Ориентировочная стоимость</p><div class="sum">${lo} – ${hi} руб.</div>
 <p>${sent ? 'Мастер перезвонит вам в течение рабочего дня и уточнит детали. Точную цену назовём после выезда инженера (50 руб.).' : (location.protocol === 'file:' ? 'Сайт открыт как файл (file://), поэтому заявка не может уйти. Запустите start.bat и откройте http://localhost:3000, либо выложите сайт на Vercel или хостинг. ' : 'Не удалось отправить заявку автоматически. ') + 'Нажмите «Отправить ещё раз», напишите нам в Telegram или позвоните: ' + SITE.phone + '.'}</p>
 <div class="cta-row" style="justify-content:center;margin-top:18px">${sent ? '' : '<button type="button" class="btn" id="retry">Отправить ещё раз</button><a class="btn ghost" href="' + fb + '" target="_blank" rel="noopener" style="color:var(--spruce)">Написать в Telegram</a>'}<a class="btn ghost" href="tel:${SITE.phone.replace(/[^\d+]/g, '')}" style="color:var(--spruce)">Позвонить</a>${sent ? '<button type="button" class="btn ghost" id="again" style="color:var(--spruce)">Рассчитать другой дом</button>' : ''}</div></div>`, true); growBar(100);
  const r = g('retry'); if (r) r.addEventListener('click', async () => { r.disabled = true; r.textContent = 'Отправляем…'; const ok2 = await post({ ...lastData, t: Date.now() - t0 }); result(ok2); });
  const a = g('again'); if (a) a.addEventListener('click', () => { Object.assign(S, { sv: [], wall: '', sz: '', st: '', town: '', note: '', ok: false }); n = 0; render({ step: 1 }); });
  focusStep();
}
if (box) render();
