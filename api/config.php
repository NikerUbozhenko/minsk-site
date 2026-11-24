<?php
// Настройки Telegram для хостинга с PHP (используется api/send.php).
// Файл защищён: он выполняется на сервере и не отдаётся браузеру, а .htaccess дополнительно запрещает прямой доступ.
return [
    'token'    => '9157215166:AAEMV-zYCwTpx7yqvYygN2QoscYsX-mhV84',
    'chat_ids' => ['7508436846'],   // можно несколько: ['123', '456']
    'api_base' => getenv('TG_API_BASE') ?: 'https://api.telegram.org',
];
