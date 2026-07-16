<?php

/**
 * User-facing messages the API returns to the mobile app, which shows them
 * verbatim. Resolved against the caller's Accept-Language by SetLocale.
 */

return [
    'generic_error' => 'Something went wrong. Please try again.',
    'account_locked' => 'Too many failed attempts. Please try again later.',
    'invalid_credentials' => 'Invalid credentials.',
    'account_created_please_login' => 'Account created. Please log in.',
    'reset_link_sent' => 'If that email is registered, a reset link is on its way.',
    'password_updated_please_login' => 'Password updated. Please log in.',
    'password_updated' => 'Password updated.',
    'session_expired' => 'Session expired. Please log in again.',
    'logged_out' => 'Logged out.',
    'logged_out_all' => 'Logged out of all devices.',
    'current_password_incorrect' => 'The current password is incorrect.',
];
