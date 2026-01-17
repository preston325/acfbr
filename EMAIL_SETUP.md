# Email Verification Setup

This application requires email verification for new user registrations. You'll need to configure an SMTP email service to send verification emails.

## Required Environment Variables

Add these to your `.env.local` file (for local development) or your production environment:

```env
# SMTP Configuration
SMTP_HOST=smtp.gmail.com          # Your SMTP server host
SMTP_PORT=587                     # SMTP port (587 for TLS, 465 for SSL)
SMTP_USER=your-email@gmail.com    # Your SMTP username/email
SMTP_PASSWORD=your-app-password   # Your SMTP password or app password
SMTP_FROM=your-email@gmail.com    # From address (usually same as SMTP_USER)

# Application URL (for verification links)
APP_URL=http://localhost:3000     # For local development
# APP_URL=https://yourdomain.com  # For production
```

## Email Service Options

### Option 1: Gmail (Development/Testing)

1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account → Security → 2-Step Verification → App passwords
   - Create a new app password for "Mail"
   - Use this app password as `SMTP_PASSWORD`

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-16-char-app-password
SMTP_FROM=your-email@gmail.com
```

### Option 2: SendGrid (Recommended for Production)

1. Sign up at [SendGrid](https://sendgrid.com/)
2. Create an API key
3. Verify your sender email address
4. Configure:

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
SMTP_FROM=your-verified-email@yourdomain.com
```

### Option 3: AWS SES (Production)

1. Set up AWS SES
2. Verify your email/domain
3. Create SMTP credentials
4. Configure:

```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com  # Use your region
SMTP_PORT=587
SMTP_USER=your-ses-smtp-username
SMTP_PASSWORD=your-ses-smtp-password
SMTP_FROM=your-verified-email@yourdomain.com
```

### Option 4: Brevo (formerly Sendinblue)

1. Sign up at [Brevo](https://www.brevo.com/)
2. Go to SMTP & API → SMTP
3. Create an SMTP key or use your existing SMTP credentials
4. Configure:

```env
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=a046c2001@smtp-brevo.com
SMTP_PASSWORD=Etc4dfDOsMUyvISA
SMTP_FROM=americas.cfb.rankings@gmail.com  # Your verified sender email
```

### Option 5: Other SMTP Services

Any SMTP service that supports standard SMTP authentication will work. Common options:
- Mailgun
- Postmark
- Mailjet
- Your own mail server

## Database Migration

After setting up environment variables, run the migration to add the email verification column:

```bash
node scripts/add-email-verification.js
```

Or if using Docker:

```bash
docker-compose exec app node scripts/add-email-verification.js
```

## Testing Email Verification

1. **Without SMTP configured**: The system will log the verification link to the console for development purposes
2. **With SMTP configured**: Users will receive verification emails automatically

## How It Works

1. User registers → `email_verified_y_n` is set to `'N'` and a verification token is generated
2. Verification email is sent with a link containing the token
3. User clicks link → `/api/auth/verify-email?token=...` verifies the email
4. `email_verified_y_n` is set to `'Y'` and the token is cleared
5. User can now sign in (signin route checks `email_verified_y_n === 'Y'`)

## Troubleshooting

- **Emails not sending**: Check SMTP credentials and ensure your email service allows SMTP access
- **Verification links not working**: Ensure `APP_URL` is set correctly for your environment
- **"Email already verified"**: The token is cleared after verification, so clicking the link again will show this message
