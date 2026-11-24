import cfg from './_config.js';

// Vercel Serverless Function: заявка из квиза -> Telegram.
// Токен и ID берутся из api/_config.js. Если в Vercel заданы переменные BOT_TOKEN / CHAT_ID, они главнее.
// Бот должен получить от вас первое сообщение (/start), иначе Telegram не даст ему писать.

const LIMIT = { max: 5, windowMs: 10 * 60 * 1000 }; // не более 5 заявок с одного IP за 10 минут
const hits = new Map();

const clean = (s, n = 300) => String(s ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, n);
const esc = (s, n) => clean(s, n).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

function normPhone(v) {
  const raw = String(v ?? '').trim();
  let d = raw.replace(/\D/g, '');
  if (d.length === 11 && d.startsWith('80')) d = '375' + d.slice(2);
  else if (d.length === 9) d = '375' + d;
  else if (!(d.length === 12 && d.startsWith('375')) && !(raw.startsWith('+') && d.length >= 10 && d.length <= 15)) return '';
  return '+' + d;
}

function limited(ip) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter(t => now - t < LIMIT.windowMs);
  arr.push(now);
  hits.set(ip, arr);
  if (hits.size > 500) for (const [k, v] of hits) if (!v.some(t => now - t < LIMIT.windowMs)) hits.delete(k);
  return arr.length > LIMIT.max;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ ok: false });

  // запросы только с нашего же сайта
  const origin = req.headers.origin;
  if (origin) {
    try {
      const oh = new URL(origin).host;
      if (oh !== req.headers.host && !/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(oh)) return res.status(403).json({ ok: false });
    } catch { return res.status(403).json({ ok: false }); }
  }

  let d;
  try { d = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {}); }
  catch { return res.status(400).json({ ok: false }); }
  if (!d || typeof d !== 'object' || Array.isArray(d)) return res.status(400).json({ ok: false });

  // защита от ботов: скрытое поле и слишком быстрая отправка. Боту отвечаем «успехом», в Telegram ничего не уходит
  if (d.hp || Number(d.t) < 2500) return res.status(200).json({ ok: true });

  const ip = clean((req.headers['x-forwarded-for'] || '').split(',')[0] || req.socket?.remoteAddress || 'unknown', 60);
  if (limited(ip)) return res.status(429).json({ ok: false });

  const phone = normPhone(d.phone);
  const name = clean(d.name, 80);
  if (!phone || name.length < 2) return res.status(422).json({ ok: false });

  const token = process.env.BOT_TOKEN || cfg.token;
  const chats = (process.env.CHAT_ID ? String(process.env.CHAT_ID).split(',') : (cfg.chatIds || [])).map(s => String(s).trim()).filter(Boolean);
  if (!token || !chats.length) {
    console.error('Не заданы токен бота или chat id (api/_config.js)');
    return res.status(500).json({ ok: false });
  }

  const services = Array.isArray(d.services) ? d.services.slice(0, 8).map(s => clean(s, 60)).join(', ') : '';
  const line = (label, v, n) => (clean(v, n) ? `<b>${label}:</b> ${esc(v, n)}\n` : '');
  const text =
    `🏠 <b>Новая заявка с сайта${d.city ? ' — ' + esc(d.city, 40) : ''}</b>\n\n` +
    line('Услуги', services, 300) + line('Материал', d.wall, 60) + line('Размер', d.size, 100) +
    line('Состояние', d.state, 100) + line('Населённый пункт', d.town, 80) + line('Расчёт на сайте', d.estimate, 60) +
    `\n<b>Имя:</b> ${esc(name, 80)}\n<b>Телефон:</b> ${phone}\n` +
    line('Связь', d.via, 30) + line('Комментарий', d.note, 300) +
    `\n` + line('Источник', [d.utm, d.ref && 'переход с ' + clean(d.ref, 60)].filter(Boolean).join('; '), 200) +
    line('Устройство', d.device, 30) + line('Страница', d.page, 200);

  try {
    const results = await Promise.allSettled(chats.map(async chat_id => {
      const r = await fetch(`${process.env.TG_API_BASE || 'https://api.telegram.org'}/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id, text, parse_mode: 'HTML', disable_web_page_preview: true }),
        signal: AbortSignal.timeout(8000)
      });
      const j = await r.json().catch(() => ({}));
      if (!j.ok) console.error('Telegram:', chat_id, j.description || r.status);
      return !!j.ok;
    }));
    const ok = results.some(r => r.status === 'fulfilled' && r.value === true);
    return res.status(ok ? 200 : 502).json({ ok });
  } catch (e) {
    console.error('send error', e);
    return res.status(502).json({ ok: false });
  }
}
