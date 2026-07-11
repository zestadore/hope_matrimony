<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ChangePasswordRequest;
use App\Http\Requests\Auth\LoginRequest;
use App\Models\User;
use App\Services\LoginSecurityService;
use GuzzleHttp\Psr7\HttpFactory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cookie;
use Illuminate\Support\Facades\Hash;
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
                'message' => 'Too many failed attempts. Please try again later.',
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

            return response()->json(['message' => 'Invalid credentials.'], 401);
        }

        $this->security->registerSuccess($user, $request);
        $this->security->recordAttempt($user, $mobileNumber, $request, true);

        return $this->respondWithTokens($tokenResponse['body']);
    }

    /**
     * Silently mint a new access token using the httpOnly refresh cookie,
     * rotating the refresh token in the process.
     */
    public function refresh(Request $request): JsonResponse
    {
        $refreshToken = $request->cookie(self::REFRESH_COOKIE);

        if (! $refreshToken) {
            return response()->json(['message' => 'Session expired. Please log in again.'], 401);
        }

        $tokenResponse = $this->requestToken([
            'grant_type' => 'refresh_token',
            'refresh_token' => $refreshToken,
            'scope' => '',
        ]);

        if ($tokenResponse['status'] !== 200) {
            return response()->json(['message' => 'Session expired. Please log in again.'], 401)
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

        return response()->json(['message' => 'Logged out.'])
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

        return response()->json(['message' => 'Logged out of all devices.'])
            ->withCookie(Cookie::forget(self::REFRESH_COOKIE, '/api/auth'));
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'user' => $this->presentUser($user),
        ]);
    }

    public function changePassword(ChangePasswordRequest $request): JsonResponse
    {
        $user = $request->user();

        if (! Hash::check($request->string('current_password')->toString(), $user->password)) {
            return response()->json([
                'message' => 'The current password is incorrect.',
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

        return response()->json(['message' => 'Password updated.']);
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
            'roles' => $user->getRoleNames(),
            'permissions' => $user->getAllPermissions()->pluck('name'),
        ];
    }
}
