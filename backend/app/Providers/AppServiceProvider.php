<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Laravel\Passport\Passport;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Passport::enablePasswordGrant();
        Passport::tokensExpireIn(now()->addMinutes((int) config('security.token.access_ttl_minutes')));
        Passport::refreshTokensExpireIn(now()->addMinutes((int) config('security.token.refresh_ttl_minutes')));

        RateLimiter::for('login', function (Request $request) {
            $mobileKey = mb_strtolower((string) $request->input('mobile_number')).'|'.$request->ip();

            return [
                Limit::perMinute(10)->by($mobileKey),
                Limit::perMinute(30)->by('login-ip|'.$request->ip()),
            ];
        });
    }
}
