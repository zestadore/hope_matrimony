<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateLocaleRequest extends FormRequest
{
    /**
     * Mirrors mobile/src/lib/i18n/translations.ts — keep the two in step when
     * adding a language.
     */
    public const SUPPORTED = ['en', 'ml'];

    public function rules(): array
    {
        return [
            'locale' => ['required', 'string', Rule::in(self::SUPPORTED)],
        ];
    }
}
