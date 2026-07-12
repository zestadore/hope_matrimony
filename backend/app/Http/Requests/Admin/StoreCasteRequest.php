<?php

namespace App\Http\Requests\Admin;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCasteRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'religion_id' => ['required', 'integer', Rule::exists('religions', 'id')],
            'name' => [
                'required',
                'string',
                'max:100',
                Rule::unique('castes', 'name')->where('religion_id', $this->input('religion_id')),
            ],
        ];
    }
}
