# Email Configuration for Approval Notifications

Email notifications have been implemented to send approval emails to users when their accounts are approved by an administrator.

## Mail Configuration

Laravel supports multiple mail drivers. Configure your mail settings in the `.env` file:

### Option 1: SMTP (Recommended for Production)

Use any SMTP service like Gmail, SendGrid, Mailgun, etc.

```bash
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS="noreply@yourdomain.com"
MAIL_FROM_NAME="${APP_NAME}"
```

**For Gmail:**
1. Enable 2-factor authentication
2. Generate an [App Password](https://myaccount.google.com/apppasswords)
3. Use the app password in `MAIL_PASSWORD`

### Option 2: Mailgun

```bash
MAIL_MAILER=mailgun
MAILGUN_DOMAIN=your-domain.mailgun.org
MAILGUN_SECRET=your-mailgun-secret-key
MAIL_FROM_ADDRESS="noreply@yourdomain.com"
MAIL_FROM_NAME="${APP_NAME}"
```

### Option 3: Log Driver (Development Only)

For development/testing, emails are written to `storage/logs/laravel.log`:

```bash
MAIL_MAILER=log
```

### Option 4: Mailtrap (Development/Staging)

[Mailtrap](https://mailtrap.io/) is perfect for testing emails in development:

```bash
MAIL_MAILER=smtp
MAIL_HOST=sandbox.smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USERNAME=your-mailtrap-username
MAIL_PASSWORD=your-mailtrap-password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS="noreply@example.com"
MAIL_FROM_NAME="${APP_NAME}"
```

## Implementation Details

### Mailable Class

`app/Mail/AccountApproved.php` - Handles account approval email:
- Uses Markdown template for professional formatting
- Includes user's name and email
- Provides direct login link with action button
- Subject: "🎉 Your Account Has Been Approved!"

### Email Template

`resources/views/emails/account-approved.blade.php`:
- Professional, welcoming design
- Clear call-to-action button
- Uses Laravel's Mail components for responsive design
- Automatically adapts to light/dark mode

### Integration

The email is automatically sent when an admin approves a user account in `AuthController@approveUser`:

```php
// Send email notification
Mail::to($user->email)->send(new \App\Mail\AccountApproved($user));
```

## Testing Email Notifications

### 1. Using Log Driver (Quickest)

Set `MAIL_MAILER=log` in `.env`, then:

1. Register a new test account
2. Have admin approve the account
3. Check `storage/logs/laravel.log` for the email content

Example log output:
```
[2025-12-06 12:00:00] local.DEBUG: 🎉 Your Account Has Been Approved!
To: testuser@example.com
...
```

### 2. Using Mailtrap (Recommended for Testing)

1. Sign up at [mailtrap.io](https://mailtrap.io)
2. Create a new inbox
3. Copy SMTP credentials to `.env`
4. Approve a test account
5. Check Mailtrap inbox to see the email preview

### 3. Production Testing

Before going live:
1. Configure your production SMTP service
2. Test with your actual email address
3. Verify email deliverability
4. Check spam folder if not received

## Email Content Preview

When a user's account is approved, they receive:

**Subject:** 🎉 Your Account Has Been Approved!

**Body:**
> Hello **[User Name]**,
>
> Great news! Your account registration has been approved by our administrator.
>
> You can now log in to the **Asset & Task Management System** and start submitting maintenance requests, viewing your assigned assets, and tracking tasks.
>
> [Login to Your Account] ← Green button linking to login page
>
> If you have any questions or need assistance, please don't hesitate to contact our support team.
>
> Welcome aboard!

## Notification Channels Summary

When a user is approved, they now receive notifications through **THREE channels**:

1. **In-App Notification** ✓ (existing)
   - Stored in database
   - Visible in notification dropdown

2. **Email** ✓ (newly added)
   - Professional HTML email
   - Direct login link

3. **Telegram** ✓ (just implemented)
   - Instant message if linked
   - Direct login link

## Troubleshooting

**Emails not sending:**
- Check `.env` mail configuration
- Verify SMTP credentials are correct
- Check Laravel logs: `tail -f storage/logs/laravel.log`
- Ensure `MAIL_FROM_ADDRESS` is valid

**Emails going to spam:**
- Use a verified domain in `MAIL_FROM_ADDRESS`
- Set up SPF and DKIM records for your domain
- Use a reputable SMTP service

**Testing not working:**
- Clear config cache: `php artisan config:clear`
- Check queue is running if using queues
- Verify user email is correct in database

## Optional: Queue Emails (Recommended for Production)

To avoid blocking the approval request, queue the email:

1. Update `AccountApproved` to implement `ShouldQueue`:
   ```php
   class AccountApproved extends Mailable implements ShouldQueue
   ```

2. Start queue worker:
   ```bash
   php artisan queue:work
   ```

This sends emails in the background for better performance.
