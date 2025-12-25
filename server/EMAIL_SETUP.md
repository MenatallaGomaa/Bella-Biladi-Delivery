# Email Setup Guide for Password Reset

This guide explains how to configure email sending for the password reset functionality on Render.

## Problem

If password reset emails are not being sent, it's likely because email credentials are not configured on Render.

## Solution: Configure Gmail App Password

### Step 1: Enable 2-Factor Authentication on Gmail

1. Go to your Google Account: https://myaccount.google.com/
2. Navigate to **Security** → **2-Step Verification**
3. Enable 2-Step Verification if not already enabled

### Step 2: Generate App Password

1. Go to **Security** → **App passwords** (or visit: https://myaccount.google.com/apppasswords)
2. Select **Mail** as the app
3. Select **Other (Custom name)** as the device
4. Enter a name like "Bella Biladi Render"
5. Click **Generate**
6. Copy the 16-character password (it will look like: `abcd efgh ijkl mnop`)

### Step 3: Set Environment Variables on Render

1. Go to your Render dashboard
2. Select your service (the API server)
3. Go to **Environment** tab
4. Add the following environment variables:

   ```
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=abcd efgh ijkl mnop
   ```

   **Important:**
   - `EMAIL_USER` should be your full Gmail address
   - `EMAIL_PASS` should be the App Password (16 characters, spaces don't matter)
   - Make sure there are no extra spaces or quotes

5. Click **Save Changes**
6. Render will automatically redeploy your service

### Step 4: Verify Configuration

After deployment, test the email configuration:

1. Visit: `https://your-api-url.onrender.com/api/test-email-config`
2. You should see:
   ```json
   {
     "nodeEnv": "production",
     "hasEmailCredentials": true,
     "emailUser": "you...",
     "emailPass": "SET",
     "transporterStatus": "verified and ready"
   }
   ```

If `transporterStatus` shows an error, check:
- App Password is correct (no extra spaces)
- 2FA is enabled on Gmail account
- Gmail account is not locked or restricted

### Step 5: Test Password Reset

1. Go to the forgot password page
2. Enter a registered email address
3. Check the server logs on Render to see if email was sent
4. Check the email inbox (and spam folder)

## Troubleshooting

### Check Server Logs on Render

1. Go to Render dashboard → Your service → **Logs**
2. Look for messages starting with `📧` (email-related logs)
3. Check for error messages with `❌`

### Common Issues

1. **"EMAIL_USER and EMAIL_PASS not set"**
   - Environment variables are not configured on Render
   - Solution: Follow Step 3 above

2. **"Gmail authentication failed"**
   - App Password is incorrect
   - Solution: Generate a new App Password and update `EMAIL_PASS`

3. **"Invalid login"**
   - Using regular Gmail password instead of App Password
   - Solution: Use App Password (16 characters from Step 2)

4. **Emails go to spam**
   - Gmail may flag emails from new senders
   - Solution: Check spam folder, mark as not spam

## Alternative: Use Test Email Service (Development Only)

If you're testing locally and don't want to configure Gmail:

1. Don't set `EMAIL_USER` and `EMAIL_PASS`
2. The system will automatically use Ethereal test emails
3. Check the server logs for the preview URL
4. Visit the preview URL to see the test email

## Security Notes

- Never commit `EMAIL_USER` or `EMAIL_PASS` to git
- Use App Passwords, not your regular Gmail password
- App Passwords can be revoked if compromised
- Consider using a dedicated Gmail account for sending emails

