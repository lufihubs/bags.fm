# 🚀 Complete Render Deployment Guide for Bags.fm Bot

## Step 1: Prepare Your Code for GitHub

### 1.1 Initialize Git Repository (if not already done)
```bash
cd c:\Users\dell\bags.fm
git init
git add .
git commit -m "Initial commit - Bags.fm token monitoring bot"
```

### 1.2 Create GitHub Repository
1. Go to https://github.com
2. Click "New Repository"
3. Name it `bags-fm-bot`
4. Keep it **Public** (Render free tier requires public repos)
5. Don't initialize with README (we already have one)
6. Click "Create Repository"

### 1.3 Push to GitHub
```bash
git remote add origin https://github.com/lufihubs/bags-fm-bot.git
git branch -M main
git push -u origin main
```

## Step 2: Deploy on Render

### 2.1 Create Render Account
1. Go to https://render.com
2. Sign up with GitHub account
3. Authorize Render to access your repositories

### 2.2 Create New Web Service
1. Click **"New +"** button
2. Select **"Web Service"**
3. Connect your GitHub repository `bags-fm-bot`
4. Click **"Connect"**

### 2.3 Configure Service Settings

**Basic Settings:**
- **Name:** `bags-fm-bot`
- **Region:** `Oregon (US West)` (or closest to you)
- **Branch:** `main`
- **Runtime:** `Node`

**Build & Deploy Settings:**
- **Root Directory:** Leave blank
- **Build Command:** `npm run build`
- **Start Command:** `npm start`

**Advanced Settings:**
- **Auto-Deploy:** ✅ Yes (recommended)

## Step 3: Set Environment Variables

In the Render dashboard, scroll to **Environment Variables** section and add:

| Key | Value |
|-----|-------|
| `TELEGRAM_BOT_TOKEN` | `7733553298:AAFLTcY8UvGdMIW3JnIIYYmtoCSEhOkUEG8` |
| `TELEGRAM_CHAT_ID` | `-1002789011652` |
| `BAGS_FM_API_URL` | `https://api2.bags.fm` |
| `CHECK_INTERVAL_MINUTES` | `1` |
| `MARKET_CAP_THRESHOLD` | `100000` |
| `NODE_ENV` | `production` |

**⚠️ Important:** Click **"Add"** after each environment variable!

## Step 4: Deploy

1. Click **"Create Web Service"**
2. Render will automatically:
   - Clone your repository
   - Install dependencies (`npm install`)
   - Build your project (`npm run build`)
   - Start your bot (`npm start`)

## Step 5: Monitor Deployment

### 5.1 Watch Build Logs
- In Render dashboard, click on your service
- Go to **"Logs"** tab
- Watch for successful deployment messages

### 5.2 Expected Log Output
```
==> Installing dependencies
==> Building application
==> Starting service
[INFO] Bags.fm Bot started successfully
[INFO] === STARTING TOKEN MIGRATION CHECK ===
[INFO] ✅ No new token migrations found - all duplicates filtered
```

## Step 6: Verify Bot is Working

### 6.1 Check Render Logs
Look for these success indicators:
- ✅ `Bags.fm Bot started successfully`
- ✅ `Retrieved X token launches from scraper`
- ✅ `DUPLICATE SKIPPED` messages (showing duplicate prevention working)

### 6.2 Check Telegram Channel
- Your bot should be running and checking every minute
- No messages initially (all existing tokens are already in database)
- New token migrations will appear when they happen

## Step 7: Managing Your Deployment

### 7.1 View Logs
- Go to Render dashboard → Your service → Logs
- Monitor real-time bot activity

### 7.2 Restart Service
- If needed, click **"Manual Deploy"** → **"Deploy latest commit"**

### 7.3 Update Bot
1. Make changes to your local code
2. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Update bot features"
   git push
   ```
3. Render will automatically redeploy (if Auto-Deploy enabled)

### 7.4 Scale (if needed)
- Render free tier: 750 hours/month (sufficient for bots)
- Can upgrade to paid plans for 24/7 uptime

## 🎯 Troubleshooting

### Issue: Build Failed
**Solution:** Check build logs for missing dependencies
```bash
# Add any missing dependencies locally
npm install <missing-package>
git add package.json package-lock.json
git commit -m "Add missing dependencies"
git push
```

### Issue: Environment Variables Not Working
**Solution:** 
1. Double-check all environment variables in Render dashboard
2. Ensure no extra spaces or quotes
3. Redeploy after adding variables

### Issue: Bot Not Responding
**Solution:** Check logs for:
- Network connectivity issues
- API rate limiting
- Telegram token validation

### Issue: Database Not Persisting
**Solution:** Render's free tier has ephemeral storage
- Database resets on each deployment
- For persistence, upgrade to paid plan with disk storage

## 🔧 Production Optimizations

### Enable Health Checks
Add to your Render service:
- **Health Check Path:** `/health` (if you add a health endpoint)

### Monitor Performance
- Use Render's built-in metrics
- Monitor memory usage and response times

### Backup Strategy
- Your database is in `./data/migrations.json`
- Consider periodic backups to external storage

## 💰 Render Pricing

**Free Tier:**
- ✅ 750 hours/month (sufficient for small bots)
- ✅ Auto-sleep after 15 minutes of inactivity
- ✅ Cold starts (2-3 second delay)

**Paid Plans:**
- 🚀 24/7 uptime
- 🚀 Faster cold starts
- 🚀 Persistent disk storage
- 🚀 Custom domains

## ✅ Deployment Checklist

- [ ] Code pushed to GitHub
- [ ] Render account created
- [ ] Web Service configured
- [ ] All environment variables set
- [ ] Build command: `npm run build`
- [ ] Start command: `npm start`
- [ ] Service deployed successfully
- [ ] Logs showing bot activity
- [ ] Telegram integration working

## 🎉 Success!

Your bot is now running 24/7 on Render's infrastructure! It will:
- Monitor bags.fm every minute
- Send notifications for new token migrations above $100k
- Never send duplicate notifications
- Automatically restart if it crashes
- Update automatically when you push code changes

**Dashboard URL:** https://dashboard.render.com/web/your-service-id

Your bot is production-ready! 🚀
