<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Login Security
    |--------------------------------------------------------------------------
    |
    | Controls brute-force protection for the mobile-number + password login.
    | After max_attempts consecutive failures, the account is locked for
    | lockout_minutes.
    |
    */

    'login' => [
        'max_attempts' => (int) env('AUTH_LOGIN_MAX_ATTEMPTS', 5),
        'lockout_minutes' => (int) env('AUTH_LOCKOUT_MINUTES', 15),
    ],

    /*
    |--------------------------------------------------------------------------
    | Passport Token Lifetimes
    |--------------------------------------------------------------------------
    |
    | Short-lived access tokens with a longer-lived, rotating refresh token
    | (delivered only via an httpOnly cookie, never exposed to JS).
    |
    */

    'token' => [
        'access_ttl_minutes' => (int) env('AUTH_ACCESS_TOKEN_TTL_MINUTES', 30),
        'refresh_ttl_minutes' => (int) env('AUTH_REFRESH_TOKEN_TTL_MINUTES', 60 * 24 * 14),
    ],

    /*
    |--------------------------------------------------------------------------
    | Seeded Super Admin
    |--------------------------------------------------------------------------
    |
    | Used only by database\seeders\SuperAdminSeeder to create the initial
    | account. Change SUPER_ADMIN_PASSWORD before deploying anywhere shared.
    |
    */

    'super_admin' => [
        'mobile' => env('SUPER_ADMIN_MOBILE', '9999999999'),
        'password' => env('SUPER_ADMIN_PASSWORD', 'change-me-in-production'),
    ],

];
