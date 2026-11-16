// Vercel Serverless Function. Переменные BOT_TOKEN и CHAT_ID задаются в Vercel: Settings -> Environment Variables
const esc = s => String(s ?? '').slice(0, 500).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false });
  const d = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  if (d.website) return res.status(400).json({ ok: false });
  const phone = String(d.phone || '').replace(/[^\d+]/g, '');
  if (phone.length < 9) return res.status(422).json({ ok: false });

  const services = Array.isArray(d.services) ? d.services.map(esc).join(', ') : '';
  const text = `🏠 <b>Новая заявка с сайта (Минск)</b>\n\n` +
    `<b>Услуги:</b> ${services}\n<b>Материал:</b> ${esc(d.wall)}\n<b>Размер:</b> ${esc(d.size)}\n` +
    `<b>Состояние:</b> ${esc(d.state)}\n<b>Населённый пункт:</b> ${esc(d.town)}\n` +
    `<b>Расчёт на сайте:</b> ${esc(d.estimate)}\n\n<b>Имя:</b> ${esc(d.name)}\n<b>Телефон:</b> ${phone}\n` +
    `<b>Связь:</b> ${esc(d.via)}\n` + (d.note ? `<b>Комментарий:</b> ${esc(d.note)}\n` : '') + `\n${esc(d.page)}`;

  try {
    const r = await fetch(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: process.env.CHAT_ID, text, parse_mode: 'HTML', disable_web_page_preview: true })
    });
    const j = await r.json();
    return res.status(200).json({ ok: !!j.ok });
  } catch (e) {
    return res.status(200).json({ ok: false });
  }
}
