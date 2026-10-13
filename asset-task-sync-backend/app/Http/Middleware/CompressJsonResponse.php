<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Gzip-compresses JSON API responses when the client supports it.
 * Cuts API payloads (tickets, notifications, assets) by 70–90%.
 */
class CompressJsonResponse
{
    public function handle(Request $request, Closure $next)
    {
        $response = $next($request);

        if (! $this->shouldCompress($request, $response)) {
            return $response;
        }

        $content = $response->getContent();
        if ($content === false || $content === null || $content === '') {
            return $response;
        }

        // Gzip overhead (~20 bytes) makes small bodies bigger — skip them
        if (strlen($content) < 1024) {
            return $response;
        }

        $compressed = gzencode($content, 6);
        if ($compressed === false) {
            return $response;
        }

        $response->setContent($compressed);
        $response->headers->set('Content-Encoding', 'gzip');
        $response->headers->set('Vary', 'Accept-Encoding');
        $response->headers->remove('Content-Length');

        return $response;
    }

    private function shouldCompress(Request $request, Response $response): bool
    {
        if ($response->getStatusCode() < 200 || $response->getStatusCode() >= 300) {
            return false;
        }

        if (! str_contains($request->header('Accept-Encoding', ''), 'gzip')) {
            return false;
        }

        $contentType = $response->headers->get('Content-Type', '');
        if (! str_contains($contentType, 'application/json')) {
            return false;
        }

        if ($response->headers->has('Content-Encoding')) {
            return false;
        }

        return true;
    }
}
