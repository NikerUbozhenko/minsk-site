<?php
// Приём заявки из квиза -> Telegram (для обычного PHP-хостинга). Аналог api/send.js для Vercel.
// Токен и ID берутся из api/config.php (или из переменных окружения BOT_TOKEN / CHAT_ID, если заданы).

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

function out(int $code, bool $ok): void { http_response_code($code); echo json_encode(['ok' => $ok]); exit; }
function sub_u(string $s, int $n): string {   // работает и без расширения mbstring
    if (function_exists('mb_substr')) return mb_substr($s, 0, $n);
    return preg_match('/^.{0,' . $n . '}/su', $s, $m) ? $m[0] : substr($s, 0, $n);
}
function len_u(string $s): int { return function_exists('mb_strlen') ? mb_strlen($s) : (int)preg_match_all('/./su', $s); }
function clean($s, int $n = 300): string {
    $s = is_scalar($s) ? (string)$s : '';
    $s = preg_replace('/[\x00-\x1f\x7f]/u', ' ', $s) ?? '';
    $s = preg_replace('/\s+/u', ' ', $s) ?? '';
    return sub_u(trim($s), $n);
}
function e($s, int $n = 300): string { return htmlspecialchars(clean($s, $n), ENT_NOQUOTES, 'UTF-8'); }
function line(string $label, $v, int $n = 300): string { return clean($v, $n) === '' ? '' : "<b>$label:</b> " . e($v, $n) . "\n"; }
function norm_phone($v): string {
    $raw = trim(is_scalar($v) ? (string)$v : '');
    $d = preg_replace('/\D/', '', $raw);
    if (strlen($d) === 11 && strpos($d, '80') === 0) $d = '375' . substr($d, 2);
    elseif (strlen($d) === 9) $d = '375' . $d;
    elseif (!(strlen($d) === 12 && strpos($d, '375') === 0) && !($raw !== '' && $raw[0] === '+' && strlen($d) >= 10 && strlen($d) <= 15)) return '';
    return '+' . $d;
}
function rate_limited(string $ip, int $max = 5, int $window = 600): bool {
    $f = sys_get_temp_dir() . '/zv_rl_' . md5($ip) . '.json';
    $fh = @fopen($f, 'c+'); if (!$fh) return false;
    flock($fh, LOCK_EX);
    $now = time(); $arr = json_decode((string)stream_get_contents($fh), true);
    $arr = array_values(array_filter(is_array($arr) ? $arr : [], fn($t) => $now - (int)$t < $window));
    $arr[] = $now;
    ftruncate($fh, 0); rewind($fh); fwrite($fh, json_encode($arr));
    flock($fh, LOCK_UN); fclose($fh);
    return count($arr) > $max;
}
function tg_send(string $base, string $token, string $chat, string $text): bool {
    $url = rtrim($base, '/') . '/bot' . $token . '/sendMessage';
    $payload = json_encode(['chat_id' => $chat, 'text' => $text, 'parse_mode' => 'HTML', 'disable_web_page_preview' => true], JSON_UNESCAPED_UNICODE);
    $resp = false;
    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [CURLOPT_POST => true, CURLOPT_POSTFIELDS => $payload, CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
            CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 10, CURLOPT_CONNECTTIMEOUT => 6]);
        $resp = curl_exec($ch); curl_close($ch);
    } else {
        $ctx = stream_context_create(['http' => ['method' => 'POST', 'header' => "Content-Type: application/json\r\n", 'content' => $payload, 'timeout' => 10, 'ignore_errors' => true]]);
        $resp = @file_get_contents($url, false, $ctx);
    }
    $j = is_string($resp) ? json_decode($resp, true) : null;
    if (empty($j['ok'])) error_log('Telegram: chat ' . $chat . ' — ' . (is_array($j) ? ($j['description'] ?? 'ошибка') : 'нет ответа (возможно, хостинг блокирует исходящие запросы)'));
    return !empty($j['ok']);
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') out(405, false);

// только запросы с нашего же сайта
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '') {
    $oh = parse_url($origin, PHP_URL_HOST) . (($p = parse_url($origin, PHP_URL_PORT)) ? ':' . $p : '');
    $host = $_SERVER['HTTP_HOST'] ?? '';
    if ($oh !== $host && !preg_match('/^(localhost|127\.0\.0\.1)(:\d+)?$/', $oh)) out(403, false);
}

$raw = file_get_contents('php://input');
if (strlen($raw) > 20000) out(413, false);
$d = json_decode($raw, true);
if (!is_array($d)) out(400, false);

// защита от ботов: скрытое поле и слишком быстрая отправка. Боту отвечаем «успехом», в Telegram ничего не уходит
if (!empty($d['hp']) || (isset($d['t']) && is_numeric($d['t']) && $d['t'] < 2500)) out(200, true);

if (rate_limited($_SERVER['REMOTE_ADDR'] ?? 'unknown')) out(429, false);

$phone = norm_phone($d['phone'] ?? '');
$name = clean($d['name'] ?? '', 80);
if ($phone === '' || len_u($name) < 2) out(422, false);

$cfg = is_file(__DIR__ . '/config.php') ? require __DIR__ . '/config.php' : [];
$token = getenv('BOT_TOKEN') ?: ($cfg['token'] ?? '');
$envChats = getenv('CHAT_ID') ? array_map('trim', explode(',', getenv('CHAT_ID'))) : [];
$chats = array_values(array_filter($envChats ?: ($cfg['chat_ids'] ?? [])));
$base = $cfg['api_base'] ?? 'https://api.telegram.org';
if (!$token || !$chats) { error_log('Не заданы токен бота или chat id (api/config.php)'); out(500, false); }

$services = '';
if (isset($d['services']) && is_array($d['services'])) $services = implode(', ', array_map(fn($s) => clean($s, 60), array_slice($d['services'], 0, 8)));
$src = array_filter([clean($d['utm'] ?? '', 120), clean($d['ref'] ?? '', 60) !== '' ? 'переход с ' . clean($d['ref'], 60) : '']);

$text = '🏠 <b>Новая заявка с сайта' . (clean($d['city'] ?? '', 40) !== '' ? ' — ' . e($d['city'], 40) : '') . "</b>\n\n"
    . line('Услуги', $services) . line('Материал', $d['wall'] ?? '', 60) . line('Размер', $d['size'] ?? '', 100)
    . line('Состояние', $d['state'] ?? '', 100) . line('Населённый пункт', $d['town'] ?? '', 80) . line('Расчёт на сайте', $d['estimate'] ?? '', 60)
    . "\n<b>Имя:</b> " . e($name, 80) . "\n<b>Телефон:</b> $phone\n"
    . line('Связь', $d['via'] ?? '', 30) . line('Комментарий', $d['note'] ?? '', 300)
    . "\n" . line('Источник', implode('; ', $src), 200) . line('Устройство', $d['device'] ?? '', 30) . line('Страница', $d['page'] ?? '', 200);

$ok = false;
foreach ($chats as $chat) { if (tg_send($base, $token, (string)$chat, $text)) $ok = true; }
out($ok ? 200 : 502, $ok);
