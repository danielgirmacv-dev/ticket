<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Automatic approval for self-registration
    |--------------------------------------------------------------------------
    |
    | When greater than 0, pending self-registered users are activated after
    | this many minutes if a manager has not approved them yet. Set to 0 to
    | require manual approval only.
    |
    */
    'auto_approve_after_minutes' => (int) env('REGISTRATION_AUTO_APPROVE_AFTER_MINUTES', 2),

    /*
    | Copy shown in API responses (frontend may mirror for UX).
    */
    'support_email' => env('REGISTRATION_SUPPORT_EMAIL', 'itsupport@eecproducts.com'),

];
