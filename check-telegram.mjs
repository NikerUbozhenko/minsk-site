// Проверка бота: показывает, почему заявки не приходят.
// Запуск: двойной клик по check-telegram.bat  или  node check-telegram.mjs
// Токен и ID берутся из api/_config.js (или из переменных BOT_TOKEN / CHAT_ID).
import cfg from './api/_config.js';

const BASE = process.env.TG_API_BASE || 'https://api.telegram.org';
const token = process.env.BOT_TOKEN || cfg.token;
const chats = (process.env.CHAT_ID ? process.env.CHAT_ID.split(',') : cfg.chatIds || []).map(s => String(s).trim()).filter(Boolean);

async function tg(method, body) {
  const r = await fetch(`${BASE}/bot${token}/${method}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body || {}), signal: AbortSignal.timeout(10000) });
  return r.json().catch(() => ({ ok: false, description: 'Telegram вернул не JSON, код ' + r.status }));
}
const hint = d => {
  d = String(d || '');
  if (/bot can't initiate|Forbidden/i.test(d)) return 'Бот не может вам писать: откройте своего бота в Telegram и нажмите «Запустить» (Start), затем повторите проверку.';
  if (/chat not found/i.test(d)) return 'Неверный CHAT_ID. Нужен ваш личный числовой id (узнать у @userinfobot), а не id бота. Если ID верный, нажмите Start у бота.';
  if (/Unauthorized|not found/i.test(d)) return 'Токен неверный или отозван. Возьмите актуальный токен у @BotFather и впишите в api/_config.js и api/config.php.';
  return '';
};

console.log('Проверяю бота…\n');
if (!token || !chats.length) { console.log('❌ В api/_config.js не заданы token или chatIds.'); process.exit(1); }
let me;
try { me = await tg('getMe'); }
catch (e) { console.log('❌ Нет связи с api.telegram.org (' + (e.cause?.code || e.message) + ').\n   Проверьте интернет/VPN и антивирус, возможно, доступ блокируется.'); process.exit(1); }
if (!me.ok) { console.log('❌ Токен не принят: ' + me.description + '\n   ' + hint(me.description)); process.exit(1); }
console.log(`✅ Токен верный. Бот: @${me.result.username}`);
let bad = 0;
for (const chat_id of chats) {
  const r = await tg('sendMessage', { chat_id, text: '✅ Проверка связи: сайт сможет присылать сюда заявки.' });
  if (r.ok) console.log(`✅ Тестовое сообщение отправлено (chat_id ${chat_id}). Проверьте Telegram.`);
  else { bad++; console.log(`❌ chat_id ${chat_id}: ${r.description}\n   ${hint(r.description)}`); }
}
process.exit(bad ? 1 : 0);
