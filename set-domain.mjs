// Подставляет домен сайта вместо ВАШ-ДОМЕН в index.html, privacy.html, sitemap.xml, robots.txt.
// На Vercel запускается САМ при каждом деплое (см. buildCommand в vercel.json) и берёт домен:
//   1) из переменной SITE_DOMAIN (если задана в Vercel, например example.by или www.example.by),
//   2) иначе из VERCEL_PROJECT_PRODUCTION_URL — это ваш подключённый домен, а если его нет, адрес вида проект.vercel.app.
// Вручную: node set-domain.mjs example.by   (без домена и без переменных скрипт ничего не меняет)
import { readFileSync, writeFileSync } from 'node:fs';

const clean = s => String(s || '').trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
const domain = clean(process.argv[2] || process.env.SITE_DOMAIN || process.env.VERCEL_PROJECT_PRODUCTION_URL);

if (!domain) { console.log('Домен не задан, файлы не изменены (локальный запуск).'); process.exit(0); }
if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(domain)) { console.error('Некорректный домен:', domain); process.exit(1); }

for (const f of ['index.html', 'privacy.html', 'sitemap.xml', 'robots.txt']) {
  const t = readFileSync(f, 'utf8');
  if (t.includes('ВАШ-ДОМЕН')) { writeFileSync(f, t.replaceAll('ВАШ-ДОМЕН', domain)); console.log(`${f}: домен ${domain}`); }
}
