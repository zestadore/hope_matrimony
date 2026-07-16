<?php

namespace App\Notifications;

use Illuminate\Auth\Notifications\ResetPassword as ResetPasswordBase;
use Illuminate\Notifications\Messages\MailMessage;

class ResetPasswordNotification extends ResetPasswordBase
{
    /**
     * Points the reset link at the mobile app's deep link scheme — this API
     * has no web frontend for Laravel's default password-reset URL to land on.
     */
    public function toMail(mixed $notifiable): MailMessage
    {
        $url = 'mobile://reset-password?token='.$this->token.'&email='.urlencode($notifiable->getEmailForPasswordReset());

        return (new MailMessage)
            ->subject('Reset your Hope Matrimony password')
            ->greeting('Hello '.$notifiable->name.',')
            ->line('We received a request to reset your Hope Matrimony account password.')
            ->action('Reset Password', $url)
            ->line('This link expires in '.config('auth.passwords.users.expire').' minutes.')
            ->line('If you did not request a password reset, you can safely ignore this email.');
    }
}
