<?php

namespace App\Models;

use App\Notifications\ResetPasswordNotification;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Passport\Contracts\OAuthenticatable;
use Laravel\Passport\HasApiTokens;
use League\OAuth2\Server\Entities\ClientEntityInterface;
use Spatie\Permission\Traits\HasRoles;

#[Fillable(['name', 'mobile_number', 'email', 'password', 'locale'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable implements OAuthenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, HasRoles, Notifiable;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'locked_until' => 'datetime',
            'last_login_at' => 'datetime',
        ];
    }

    /**
     * Look up a user by mobile number for Passport's password grant.
     * Only active accounts can obtain tokens, even via a direct /oauth/token call.
     */
    public function findForPassport(string $username, ClientEntityInterface $clientEntity): ?self
    {
        return static::where('mobile_number', $username)
            ->where('status', 'active')
            ->first();
    }

    public function profile(): HasOne
    {
        return $this->hasOne(MemberProfile::class);
    }

    public function familyDetail(): HasOne
    {
        return $this->hasOne(MemberFamilyDetail::class);
    }

    public function residency(): HasOne
    {
        return $this->hasOne(MemberResidency::class);
    }

    public function educations(): HasMany
    {
        return $this->hasMany(MemberEducation::class);
    }

    public function careers(): HasMany
    {
        return $this->hasMany(MemberCareer::class);
    }

    public function partnerPreference(): HasOne
    {
        return $this->hasOne(MemberPartnerPreference::class);
    }

    public function sendPasswordResetNotification(#[\SensitiveParameter] $token): void
    {
        $this->notify(new ResetPasswordNotification($token));
    }

    public function photos(): HasMany
    {
        return $this->hasMany(MemberPhoto::class)
            ->orderByDesc('is_default')
            ->orderBy('id');
    }
}
