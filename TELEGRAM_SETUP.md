# Telegram Bot Configuration

To enable Telegram notifications, you need to add the following environment variables to your `.env` file:

```bash
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_BOT_USERNAME=your_bot_username_here
```

## How to Get These Values

### 1. Create a Telegram Bot

1. Open Telegram and search for [@BotFather](https://t.me/BotFather)
2. Send `/newbot` command
3. Follow the prompts to:
   - Choose a name for your bot (e.g., "Asset Management Bot")
   - Choose a username for your bot (must end with 'bot', e.g., "AssetManagementBot")
4. BotFather will give you:
   - **Bot Token**: A long string like `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`
   - **Bot Username**: What you just chose (e.g., `AssetManagementBot`)

### 2. Configure Your .env File

Add the values from BotFather to your `.env` file:

```bash
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_BOT_USERNAME=AssetManagementBot
```

### 3. Set Up Webhook (Production Only)

Once your application is deployed to a public URL, configure the Telegram webhook:

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -d "url=https://your-domain.com/api/telegram/webhook"
```

Replace:
- `<YOUR_BOT_TOKEN>` with your actual bot token
- `your-domain.com` with your actual domain

**For local development**: Webhooks won't work on localhost. You can use a service like [ngrok](https://ngrok.com/) to expose your local server:

```bash
# Install ngrok and expose your local server
ngrok http 8000

# Then set the webhook with the ngrok URL
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -d "url=https://your-ngrok-url.ngrok.io/api/telegram/webhook"
```

### 4. Verify Webhook is Set

Check if your webhook is configured correctly:

```bash
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo"
```

You should see your webhook URL in the response.

## Testing the Integration

1. In your application, go to **Settings → Notifications**
2. Click **"Link Telegram Account"**
3. Click the generated link or copy it and open in Telegram
4. Press **Start** in the Telegram bot conversation
5. You should receive a confirmation message in both Telegram and the web app
6. Your account is now linked!

## Troubleshooting

**Link doesn't work:**
- Make sure webhook is properly configured
- Check Laravel logs: `tail -f storage/logs/laravel.log`
- Verify bot token and username are correct in `.env`

**No messages received:**
- Ensure the webhook URL is publicly accessible
- Check that the bot has not been blocked
- Verify the user has linked their account (check database `profiles.telegram_chat_id`)

**Approval notifications not working:**
- Check that `telegram_chat_id` is stored in the database
- Verify the TelegramService is being called in AuthController
- Check Laravel logs for any errors
