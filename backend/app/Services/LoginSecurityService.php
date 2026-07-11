<?php

namespace App\Services;

use App\Models\LoginAudit;
use App\Models\User;
use Illuminate\Http\Request;

class LoginSecurityService
{
    /**
     * Determine whether the account is currently locked out due to
     * repeated failed login attempts.
     */
    public function isLocked(User $user): bool
    {
        return $user->locked_until !== null && $user->locked_until->isFuture();
    }

    /**
     * Seconds remaining until the lockout clears, or 0 if not locked.
     */
    public function lockoutSecondsRemaining(User $user): int
    {
        if (! $this->isLocked($user)) {
            return 0;
        }

        return max(0, now()->diffInSeconds($user->locked_until, false));
    }

    /**
     * Record a failed login attempt, locking the account after the
     * configured number of consecutive failures.
     */
    public function registerFailure(User $user): void
    {
        $maxAttempts = (int) config('security.login.max_attempts');
        $lockoutMinutes = (int) config('security.login.lockout_minutes');

        $attempts = $user->failed_login_attempts + 1;

        $user->forceFill([
            'failed_login_attempts' => $attempts,
            'locked_until' => $attempts >= $maxAttempts
                ? now()->addMinutes($lockoutMinutes)
                : $user->locked_until,
        ])->save();
    }

    /**
     * Reset lockout state and record a successful login.
     */
    public function registerSuccess(User $user, Request $request): void
    {
        $user->forceFill([
            'failed_login_attempts' => 0,
            'locked_until' => null,
            'last_login_at' => now(),
            'last_login_ip' => $request->ip(),
        ])->save();
    }

    /**
     * Write an audit trail entry for a login attempt (successful or not).
     */
    public function recordAttempt(
        ?User $user,
        string $mobileNumber,
        Request $request,
        bool $successful,
        ?string $reason = null,
    ): void {
        LoginAudit::create([
            'user_id' => $user?->id,
            'mobile_number' => $mobileNumber,
            'ip_address' => (string) $request->ip(),
            'user_agent' => (string) $request->userAgent(),
            'successful' => $successful,
            'reason' => $reason,
        ]);
    }
}
