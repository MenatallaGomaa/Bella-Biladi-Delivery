# Keep-Alive Setup Guide

This guide explains how to set up the keep-alive ping service to prevent Render.com cold starts.

## Overview

The keep-alive service pings the backend API every 10 minutes to prevent it from spinning down due to inactivity. This works in combination with:
1. **Server-side script**: Runs independently to ping the backend
2. **Client-side pinging**: Automatically pings when users visit the site (production only)

## Setup Options

### Option 1: Run on Render.com (Recommended)

You can add the keep-alive script as a background service on Render.com:

1. **Create a new Background Worker service** on Render.com:
   - Name: `bella-biladi-keep-alive`
   - Environment: `Node`
   - Build Command: `npm install`
   - Start Command: `npm run keep-alive`
   - Add environment variable: `API_URL=https://bella-biladi-api.onrender.com`

2. **Or use Render Cron Jobs** (if available):
   - Set up a cron job to run every 10 minutes
   - Command: `curl https://bella-biladi-api.onrender.com/api/health`

### Option 2: Run on Your Local Machine

If you have a machine that's always on:

```bash
cd server
npm run keep-alive
```

To run in the background:
```bash
nohup npm run keep-alive > keep-alive.log 2>&1 &
```

### Option 3: Use PM2 (Process Manager)

```bash
npm install -g pm2
pm2 start keep-alive.js --name keep-alive
pm2 save
pm2 startup  # Follow instructions to enable auto-start on boot
```

### Option 4: Use External Monitoring Service

Services like **UptimeRobot** (free) or **Pingdom** can ping your health endpoint:
- URL: `https://bella-biladi-api.onrender.com/api/health`
- Interval: Every 10 minutes
- Alert: Only if down for more than 5 minutes

## Environment Variables

Create a `.env` file in the `server` directory (optional):

```env
API_URL=https://bella-biladi-api.onrender.com
```

If not set, it defaults to `https://bella-biladi-api.onrender.com`.

## How It Works

1. **Health Check Endpoint**: `/api/health` - Returns server status and uptime
2. **Server-side Script**: Pings every 10 minutes (before Render's 15-minute timeout)
3. **Client-side Pinging**: Automatically runs when users visit the production site (every 9 minutes)

## Testing

Test the health endpoint:
```bash
curl https://bella-biladi-api.onrender.com/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-12-08T14:00:00.000Z",
  "uptime": 3600
}
```

## Monitoring

The keep-alive script logs:
- ✅ Successful pings
- ⚠️ Failed pings (HTTP errors)
- ❌ Network errors or timeouts
- 🚨 Alerts after 3 consecutive failures

Check logs:
```bash
tail -f keep-alive.log  # If using nohup
pm2 logs keep-alive     # If using PM2
```

## Notes

- The client-side pinging only works when users are actively on the site
- The server-side script ensures the backend stays warm even without active users
- Combined with a paid Render plan, this provides the best reliability
- The ping interval (10 minutes) is set to be less than Render's spin-down timeout (15 minutes)

