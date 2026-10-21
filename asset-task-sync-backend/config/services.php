<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'azure_graph' => [
        'tenant_id'     => env('MICROSOFT_GRAPH_TENANT_ID'),
        'client_id'     => env('MICROSOFT_GRAPH_CLIENT_ID'),
        'client_secret' => env('MICROSOFT_GRAPH_CLIENT_SECRET'),
        'sender_email'  => env('MICROSOFT_GRAPH_SENDER_EMAIL', 'system@eeigconstruction.com'),
    ],

    /*
    |--------------------------------------------------------------------------
    | SMS (Ethio Telecom gateway / aggregator)
    |--------------------------------------------------------------------------
    | driver: 'log' (dev — writes SMS to the log instead of sending)
    |         'api' (real sending via SMS_API_URL)
    | auth_mode: 'bearer' | 'basic' | 'header' | 'none'
    | *_field: JSON body field names — adjust to match your provider's docs.
    */
    'sms' => [
        'driver'        => env('SMS_DRIVER', 'log'),
        'api_url'       => env('SMS_API_URL'),
        'auth_mode'     => env('SMS_AUTH_MODE', 'bearer'),
        'api_key'       => env('SMS_API_KEY'),
        'username'      => env('SMS_USERNAME'),
        'password'      => env('SMS_PASSWORD'),
        'auth_header'   => env('SMS_AUTH_HEADER', 'KEY'),
        'sender_id'     => env('SMS_SENDER_ID'),
        'device_id'     => env('SMS_DEVICE_ID'),
        'mode'          => env('SMS_MODE'),
        'sim'           => env('SMS_SIM'),
        'content_type'  => env('SMS_CONTENT_TYPE', 'form'),
        'to_field'      => env('SMS_TO_FIELD', 'to'),
        'message_field' => env('SMS_MESSAGE_FIELD', 'message'),
        'sender_field'  => env('SMS_SENDER_FIELD', 'sender_id'),
        'secret_field'  => env('SMS_SECRET_FIELD', 'secret'),
        'device_field'  => env('SMS_DEVICE_FIELD', 'device'),
    ],

];
