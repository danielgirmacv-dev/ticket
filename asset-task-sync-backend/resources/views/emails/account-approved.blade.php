<x-mail::message>
    <div style="text-align: center; margin-bottom: 30px;">
        <img src="{{ config('app.url') }}/eecc.png" alt="EEC Logo" style="width: 80px; height: 80px; margin: 0 auto;">
    </div>

    # 🎉 Account Approved!

    Hello **{{ $userName }}**,

    Great news! Your account registration has been approved by our administrator.

    You can now log in to the **Asset & Ticket Management System** and start submitting maintenance requests, viewing your
    assigned assets, and tracking tickets.

    <x-mail::button :url="$loginUrl" color="success">
        Login to Your Account
    </x-mail::button>

    If you have any questions or need assistance, please don't hesitate to contact our support team.

    Welcome aboard!

    Thanks,<br>
    {{ config('app.name') }}
</x-mail::message>