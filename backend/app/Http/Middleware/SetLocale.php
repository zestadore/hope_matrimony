<?php

namespace App\Http\Middleware;

use App\Http\Requests\Auth\UpdateLocaleRequest;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Answers in the language the app asked for via Accept-Language, so validation
 * and error messages the app surfaces verbatim match the UI around them.
 *
 * The header is only honoured when it names a language we actually ship —
 * anything else falls through to config('app.locale').
 */
class SetLocale
{
    public function handle(Request $request, Closure $next): Response
    {
        // The app sends a bare tag ('ml'), but browsers send a full
        // Accept-Language list ('ml-IN,ml;q=0.9,en;q=0.8'), so take the first
        // supported entry rather than trusting the raw header.
        foreach ($this->candidates($request) as $candidate) {
            if (in_array($candidate, UpdateLocaleRequest::SUPPORTED, true)) {
                app()->setLocale($candidate);
                break;
            }
        }

        return $next($request);
    }

    /**
     * @return list<string>
     */
    private function candidates(Request $request): array
    {
        $header = $request->header('Accept-Language');

        if (! is_string($header) || $header === '') {
            return [];
        }

        $candidates = [];

        foreach (explode(',', $header) as $part) {
            $tag = trim(explode(';', $part)[0]);

            if ($tag === '') {
                continue;
            }

            // Match 'ml' from 'ml-IN' — we ship languages, not regions.
            $candidates[] = strtolower(explode('-', $tag)[0]);
        }

        return $candidates;
    }
}
