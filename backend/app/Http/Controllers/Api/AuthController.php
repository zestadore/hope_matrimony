<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ChangePasswordRequest;
use App\Http\Requests\Auth\ForgotPasswordRequest;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Requests\Auth\ResetPasswordRequest;
use App\Http\Requests\Auth\UpdateLocaleRequest;
use App\Models\User;
use App\Services\LoginSecurityService;
use App\Support\Roles;
use GuzzleHttp\Psr7\HttpFactory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cookie;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Laravel\Passport\Exceptions\OAuthServerException;
use Laravel\Passport\Http\Controllers\AccessTokenController;

class AuthController extends Controller
{
    private const REFRESH_COOKIE = 'refresh_token';

    public function __construct(private readonly LoginSecurityService $security)
    {
    }

    /**
     * Authenticate with mobile number + password. Proxies to Passport's
     * password grant server-to-server so the OAuth client secret never
     * reaches the frontend, then hands the SPA a short-lived access token
     * and stores the refresh token only in an httpOnly cookie.
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $mobileNumber = $request->string('mobile_number')->toString();
        $user = User::where('mobile_number', $mobileNumber)->first();

        if ($user && $this->security->isLocked($user)) {
            $this->security->recordAttempt($user, $mobileNumber, $request, false, 'locked');

            return response()->json([
                'message' => __('api.account_locked'),
            ], 423);
        }

        $tokenResponse = $this->requestToken([
            'grant_type' => 'password',
            'username' => $mobileNumber,
            'password' => $request->string('password')->toString(),
            'scope' => '',
        ]);

        if ($tokenResponse['status'] !== 200) {
            if ($user) {
                $this->security->registerFailure($user);
            }
            $this->security->recordAttempt($user, $mobileNumber, $request, false, 'invalid_credentials');

            return response()->json(['message' => __('api.invalid_credentials')], 401);
        }

        $this->security->registerSuccess($user, $request);
        $this->security->recordAttempt($user, $mobileNumber, $request, true);

        return $this->respondWithTokens($tokenResponse['body']);
    }

    /**
     * Self-service signup. Creates a bare member account — the matrimonial
     * profile is completed after first login, not collected here — and
     * signs the new user straight in.
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        $user = DB::transaction(function () use ($request) {
            $user = new User;
            $user->forceFill([
                'name' => $request->string('name')->toString(),
                'mobile_number' => $request->string('mobile_number')->toString(),
                'email' => $request->input('email'),
                'password' => Hash::make($request->string('password')->toString()),
                'status' => 'active',
            ])->save();

            $user->assignRole(Roles::MEMBER);

            return $user;
        });

        $tokenResponse = $this->requestToken([
            'grant_type' => 'password',
            'username' => $user->mobile_number,
            'password' => $request->string('password')->toString(),
            'scope' => '',
        ]);

        if ($tokenResponse['status'] !== 200) {
            // Extremely unlikely since we just set this password, but don't
            // leave the new account holder stuck with no way in if it happens.
            return response()->json(['message' => __('api.account_created_please_login')], 201);
        }

        return $this->respondWithTokens($tokenResponse['body']);
    }

    /**
     * Request an email reset link. Always responds the same way regardless
     * of whether the address is registered, so the endpoint can't be used
     * to enumerate accounts.
     */
    public function forgotPassword(ForgotPasswordRequest $request): JsonResponse
    {
        Password::sendResetLink($request->only('email'));

        return response()->json([
            'message' => __('api.reset_link_sent'),
        ]);
    }

    /**
     * Complete a password reset from the link emailed by forgotPassword().
     * Revokes every existing token for the account, since the old password
     * may have been compromised.
     */
    public function resetPassword(ResetPasswordRequest $request): JsonResponse
    {
        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function (User $user, string $password) {
                $user->forceFill(['password' => $password])->save();

                foreach ($user->tokens as $token) {
                    $token->refreshToken?->revoke();
                    $token->revoke();
                }
            }
        );

        if ($status !== Password::PASSWORD_RESET) {
            return response()->json(['message' => __($status)], 422);
        }

        return response()->json(['message' => __('api.password_updated_please_login')]);
    }

    /**
     * Silently mint a new access token using the httpOnly refresh cookie,
     * rotating the refresh token in the process.
     */
    public function refresh(Request $request): JsonResponse
    {
        $refreshToken = $request->cookie(self::REFRESH_COOKIE);

        if (! $refreshToken) {
            return response()->json(['message' => __('api.session_expired')], 401);
        }

        $tokenResponse = $this->requestToken([
            'grant_type' => 'refresh_token',
            'refresh_token' => $refreshToken,
            'scope' => '',
        ]);

        if ($tokenResponse['status'] !== 200) {
            return response()->json(['message' => __('api.session_expired')], 401)
                ->withCookie(Cookie::forget(self::REFRESH_COOKIE, '/api/auth'));
        }

        return $this->respondWithTokens($tokenResponse['body']);
    }

    /**
     * Revoke the current access token (and its refresh token) and clear
     * the refresh cookie.
     */
    public function logout(Request $request): JsonResponse
    {
        $token = $request->user()->token();
        $token->refreshToken?->revoke();
        $token->revoke();

        return response()->json(['message' => __('api.logged_out')])
            ->withCookie(Cookie::forget(self::REFRESH_COOKIE, '/api/auth'));
    }

    /**
     * Revoke every token for the user (logout of all devices/sessions).
     */
    public function logoutAll(Request $request): JsonResponse
    {
        foreach ($request->user()->tokens as $token) {
            $token->refreshToken?->revoke();
            $token->revoke();
        }

        return response()->json(['message' => __('api.logged_out_all')])
            ->withCookie(Cookie::forget(self::REFRESH_COOKIE, '/api/auth'));
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'user' => $this->presentUser($user),
        ]);
    }

    /**
     * Persist the user's preferred UI language so it follows them to a new
     * device. The app is the source of truth for the current session — it
     * pushes here after the user picks a language, and only adopts this value
     * on a device that has no choice of its own yet.
     */
    public function updateLocale(UpdateLocaleRequest $request): JsonResponse
    {
        $user = $request->user();
        $user->forceFill(['locale' => $request->string('locale')->toString()])->save();

        return response()->json(['user' => $this->presentUser($user)]);
    }

    public function changePassword(ChangePasswordRequest $request): JsonResponse
    {
        $user = $request->user();

        if (! Hash::check($request->string('current_password')->toString(), $user->password)) {
            return response()->json([
                'message' => __('api.current_password_incorrect'),
            ], 422);
        }

        $user->forceFill([
            'password' => $request->string('password')->toString(),
        ])->save();

        $currentTokenId = $user->token()->id;

        foreach ($user->tokens as $token) {
            if ($token->id !== $currentTokenId) {
                $token->refreshToken?->revoke();
                $token->revoke();
            }
        }

        return response()->json(['message' => __('api.password_updated')]);
    }

    /**
     * Issue/refresh a token via Passport's own AccessTokenController, called
     * in-process rather than over HTTP. An HTTP loopback to our own
     * /oauth/token would deadlock single-threaded dev servers (and wastes a
     * network round-trip in production) — this reuses the exact same OAuth2
     * grant handling without a self-request. The client secret lives only
     * in this process's env, never shipped to the frontend.
     *
     * @return array{status: int, body: array<string, mixed>}
     */
    private function requestToken(array $params): array
    {
        $factory = new HttpFactory;

        $psrRequest = $factory->createServerRequest('POST', config('services.passport.token_url'))
            ->withParsedBody(array_merge([
                'client_id' => config('services.passport.password_client_id'),
                'client_secret' => config('services.passport.password_client_secret'),
            ], $params));

        try {
            $response = app(AccessTokenController::class)->issueToken($psrRequest, $factory->createResponse());
        } catch (OAuthServerException $e) {
            // Invalid credentials/refresh token — expected failure path, not a server error.
            $response = $e->getResponse();
        }

        return [
            'status' => $response->getStatusCode(),
            'body' => json_decode($response->getContent(), true) ?? [],
        ];
    }

    private function respondWithTokens(array $tokens): JsonResponse
    {
        $cookie = cookie(
            name: self::REFRESH_COOKIE,
            value: $tokens['refresh_token'],
            minutes: (int) config('security.token.refresh_ttl_minutes'),
            path: '/api/auth',
            domain: null,
            secure: app()->environment('production'),
            httpOnly: true,
            raw: false,
            sameSite: 'strict',
        );

        return response()->json([
            'access_token' => $tokens['access_token'],
            'token_type' => 'Bearer',
            'expires_in' => $tokens['expires_in'],
        ])->withCookie($cookie);
    }

    private function presentUser(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'mobile_number' => $user->mobile_number,
            'email' => $user->email,
            'status' => $user->status,
            'locale' => $user->locale,
            'roles' => $user->getRoleNames(),
            'permissions' => $user->getAllPermissions()->pluck('name'),
        ];
    }
}
