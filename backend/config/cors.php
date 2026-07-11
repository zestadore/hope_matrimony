<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | The admin panel authenticates using an httpOnly refresh-token cookie,
    | so this must allow credentials and restrict origins to an explicit
    | allow-list (browsers reject '*' combined with supports_credentials).
    |
    */

    'paths' => ['api/*', 'oauth/*'],

    'allowed_methods' => ['*'],

    'allowed_origins' => array_filter(explode(',', env('ADMIN_FRONTEND_URL', 'http://localhost:5173'))),

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,

];
