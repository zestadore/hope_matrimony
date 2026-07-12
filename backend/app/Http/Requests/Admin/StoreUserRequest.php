<?php

namespace App\Http\Requests\Admin;

use App\Http\Requests\Admin\Concerns\HasMemberProfileRules;
use App\Support\Roles;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreUserRequest extends FormRequest
{
    use HasMemberProfileRules;

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
        $account = [
            'name' => ['required', 'string', 'max:255'],
            'mobile_number' => ['required', 'string', 'max:20', Rule::unique('users', 'mobile_number')],
            'email' => ['nullable', 'email', 'max:255', Rule::unique('users', 'email')],
            'password' => ['required', 'string', 'min:8'],
            'status' => ['required', Rule::in(['active', 'inactive', 'suspended'])],
            'role' => ['required', 'string', Rule::exists('roles', 'name')->where('guard_name', 'api')],
        ];

        // Team accounts carry no matrimonial profile, so only the account
        // fields are validated for them.
        return Roles::isTeam($this->input('role'))
            ? $account
            : array_merge($account, $this->memberProfileRules());
    }
}
