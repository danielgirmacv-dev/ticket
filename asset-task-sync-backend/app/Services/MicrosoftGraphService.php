<?php

namespace App\Services;

use GuzzleHttp\Client;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Exception;

class MicrosoftGraphService
{
    protected string $tenantId;
    protected string $clientId;
    protected string $clientSecret;
    protected string $senderEmail;
    protected Client $httpClient;

    public function __construct()
    {
        $this->tenantId     = config('services.azure_graph.tenant_id') ?? '';
        $this->clientId     = config('services.azure_graph.client_id') ?? '';
        $this->clientSecret = config('services.azure_graph.client_secret') ?? '';
        $this->senderEmail  = config('services.azure_graph.sender_email', 'system@eeigconstruction.com');
        $this->httpClient   = new Client();
    }

    /**
     * Fetch OAuth2 Client Credentials Access Token (cached until expiration)
     */
    public function getAccessToken(): string
    {
        return Cache::remember('ms_graph_access_token', 3300, function () {
            $tokenUrl = "https://login.microsoftonline.com/{$this->tenantId}/oauth2/v2.0/token";

            $response = $this->httpClient->post($tokenUrl, [
                'form_params' => [
                    'client_id'     => $this->clientId,
                    'client_secret' => $this->clientSecret,
                    'scope'         => 'https://graph.microsoft.com/.default',
                    'grant_type'    => 'client_credentials',
                ],
            ]);

            $data = json_decode($response->getBody()->getContents(), true);

            if (! isset($data['access_token'])) {
                throw new Exception('Failed to retrieve access token from Microsoft Entra ID.');
            }

            return $data['access_token'];
        });
    }

    /**
     * Send email via Microsoft Graph API sendMail endpoint
     */
    public function sendEmail(string $toEmail, string $subject, string $htmlBody): bool
    {
        $accessToken = $this->getAccessToken();
        $endpointUrl = "https://graph.microsoft.com/v1.0/users/{$this->senderEmail}/sendMail";

        $payload = [
            'message' => [
                'subject' => $subject,
                'body' => [
                    'contentType' => 'HTML',
                    'content'     => $htmlBody,
                ],
                'toRecipients' => [
                    [
                        'emailAddress' => [
                            'address' => $toEmail,
                        ],
                    ],
                ],
            ],
            'saveToSentItems' => 'true',
        ];

        try {
            $response = $this->httpClient->post($endpointUrl, [
                'headers' => [
                    'Authorization' => "Bearer {$accessToken}",
                    'Content-Type'  => 'application/json',
                ],
                'json' => $payload,
            ]);

            return $response->getStatusCode() === 202;
        } catch (Exception $e) {
            Log::error('Microsoft Graph sendMail failed: ' . $e->getMessage(), [
                'to'      => $toEmail,
                'subject' => $subject,
            ]);
            throw $e;
        }
    }
}
