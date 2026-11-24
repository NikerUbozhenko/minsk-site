// Локальный сервер для проверки сайта у себя на компьютере (без установки пакетов).
// Запуск: двойной клик по start.bat  или  в папке сайта:  node server.js   ->  http://localhost:3000
// Отдаёт сайт и принимает заявки на /api/send тем же кодом (api/send.js), что работает на Vercel.
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import handler from './api/send.js';

const root = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3000;
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp',
  '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8', '.ico': 'image/x-icon' };
// служебные файлы наружу не отдаём (в том числе файлы с токеном)
const HIDDEN = new Set(['api', 'node_modules', 'server.js', 'start.bat', 'check-telegram.mjs', 'check-telegram.bat', 'package.json', 'vercel.json', 'set-domain.mjs']);

http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname === '/api/send') {
      let body = '';
      for await (const c of req) { body += c; if (body.length > 20000) { res.statusCode = 413; return res.end(); } }
      req.body = body;
      res.status = code => { res.statusCode = code; return res; };
      res.json = obj => { res.setHeader('Content-Type', 'application/json; charset=utf-8'); res.end(JSON.stringify(obj)); };
      return await handler(req, res);
    }
    let p = decodeURIComponent(url.pathname);
    if (p.endsWith('/')) p += 'index.html';
    const file = path.join(root, p);
    const rel = path.relative(root, file);
    const parts = rel.split(path.sep);
    if (rel.startsWith('..') || path.isAbsolute(rel) || parts.some(s => s.startsWith('.')) || HIDDEN.has(parts[0])) { res.statusCode = 404; return res.end('Not found'); }
    const data = await readFile(file);
    res.setHeader('Content-Type', MIME[path.extname(file).toLowerCase()] || 'application/octet-stream');
    res.setHeader('Cache-Control', 'no-store');
    res.end(data);
  } catch (e) {
    res.statusCode = e.code === 'ENOENT' || e.code === 'EISDIR' ? 404 : 500;
    res.end(res.statusCode === 404 ? 'Not found' : 'Server error');
    if (res.statusCode === 500) console.error(e);
  }
}).listen(PORT, () => console.log(`\nСайт: http://localhost:${PORT}\nЗаявки из квиза уйдут в Telegram. Ошибки отправки будут видны в этом окне.\nОстановить: Ctrl+C\n`));
