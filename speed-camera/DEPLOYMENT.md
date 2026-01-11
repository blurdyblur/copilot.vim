# Speed Camera - Deployment Guide

## Overview

This guide covers deploying the Speed Camera MVP to production using:
- **Frontend**: Vercel
- **Backend**: Railway or Fly.io
- **Database**: PostgreSQL (managed service)

## Pre-Deployment Checklist

- [ ] Mapbox account and API token
- [ ] Stripe account configured with product and pricing
- [ ] PostgreSQL database provisioned
- [ ] Domain name (optional but recommended)
- [ ] SSL certificates will be handled by platforms

## Backend Deployment (Railway)

### 1. Create Railway Account
Visit https://railway.app and sign up

### 2. Create New Project
1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Connect your repository
4. Select the backend directory

### 3. Add PostgreSQL Database
1. In your project, click "New"
2. Select "Database" → "PostgreSQL"
3. Copy the DATABASE_URL from the PostgreSQL service

### 4. Configure Environment Variables
In Railway dashboard, add these variables:

```
DATABASE_URL=<from-postgresql-service>
JWT_SECRET=<generate-secure-random-string>
STRIPE_SECRET_KEY=<from-stripe-dashboard>
STRIPE_PRICE_ID=<from-stripe-dashboard>
STRIPE_WEBHOOK_SECRET=<will-set-after-webhook-setup>
FRONTEND_URL=https://your-frontend-domain.vercel.app
PORT=3001
NODE_ENV=production
```

### 5. Deploy
Railway will automatically deploy your backend

### 6. Run Database Migrations
In Railway CLI or dashboard:
```bash
npx prisma migrate deploy
npx prisma db seed
```

### 7. Set Up Stripe Webhooks
1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-backend-url.railway.app/api/subscriptions/webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy the signing secret
5. Add to Railway environment variables as `STRIPE_WEBHOOK_SECRET`

## Alternative: Backend Deployment (Fly.io)

### 1. Install Fly CLI
```bash
curl -L https://fly.io/install.sh | sh
```

### 2. Login
```bash
fly auth login
```

### 3. Create fly.toml
In backend directory:
```toml
app = "speedcamera-api"

[build]
  builder = "heroku/buildpacks:20"

[env]
  PORT = "8080"

[[services]]
  internal_port = 8080
  protocol = "tcp"

  [[services.ports]]
    handlers = ["http"]
    port = 80

  [[services.ports]]
    handlers = ["tls", "http"]
    port = 443
```

### 4. Create PostgreSQL Database
```bash
fly postgres create
fly postgres attach <postgres-app-name>
```

### 5. Set Environment Variables
```bash
fly secrets set JWT_SECRET=<your-secret>
fly secrets set STRIPE_SECRET_KEY=<your-key>
fly secrets set STRIPE_PRICE_ID=<your-price-id>
fly secrets set STRIPE_WEBHOOK_SECRET=<your-webhook-secret>
fly secrets set FRONTEND_URL=<your-frontend-url>
```

### 6. Deploy
```bash
fly deploy
```

### 7. Run Migrations
```bash
fly ssh console
npx prisma migrate deploy
npx prisma db seed
exit
```

## Frontend Deployment (Vercel)

### 1. Create Vercel Account
Visit https://vercel.com and sign up

### 2. Import Project
1. Click "Add New..." → "Project"
2. Import your Git repository
3. Vercel will auto-detect it's a Vite project

### 3. Configure Build Settings
- **Framework Preset**: Vite
- **Root Directory**: `speed-camera/frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

### 4. Environment Variables
Add these in Vercel dashboard:

```
VITE_API_URL=https://your-backend-url.railway.app/api
VITE_MAPBOX_TOKEN=<your-mapbox-token>
```

### 5. Deploy
Click "Deploy" - Vercel will build and deploy automatically

### 6. Update Backend FRONTEND_URL
Go back to Railway and update the `FRONTEND_URL` environment variable to your Vercel deployment URL

## Post-Deployment Configuration

### 1. Test the Application
1. Visit your frontend URL
2. Try guest login
3. Test map functionality
4. Verify camera markers appear
5. Test subscription flow (use Stripe test cards)

### 2. Configure Custom Domain (Optional)
- **Vercel**: Add custom domain in project settings
- **Railway**: Add custom domain in service settings

### 3. Monitoring
- Enable error tracking (Sentry, LogRocket)
- Set up uptime monitoring
- Configure alerts for critical errors

### 4. Stripe Production Mode
1. Switch Stripe keys from test to live mode
2. Update environment variables in Railway
3. Reconfigure webhook with production URL

## Environment Variables Summary

### Backend
| Variable | Description | Example |
|----------|-------------|---------|
| DATABASE_URL | PostgreSQL connection string | postgresql://... |
| JWT_SECRET | Secret for JWT tokens | random-secure-string |
| STRIPE_SECRET_KEY | Stripe API key | sk_live_... |
| STRIPE_PRICE_ID | Stripe price ID | price_... |
| STRIPE_WEBHOOK_SECRET | Stripe webhook secret | whsec_... |
| FRONTEND_URL | Frontend URL | https://speedcamera.app |
| PORT | Server port | 3001 |

### Frontend
| Variable | Description | Example |
|----------|-------------|---------|
| VITE_API_URL | Backend API URL | https://api.speedcamera.app/api |
| VITE_MAPBOX_TOKEN | Mapbox access token | pk.ey... |

## Troubleshooting

### Database Connection Issues
- Verify DATABASE_URL is correct
- Check if database is accessible from backend
- Ensure migrations have been run

### Stripe Webhook Failures
- Verify webhook secret is correct
- Check webhook endpoint is publicly accessible
- Review Stripe webhook logs in dashboard

### Map Not Loading
- Verify VITE_MAPBOX_TOKEN is set correctly
- Check browser console for errors
- Ensure Mapbox token has correct permissions

### CORS Errors
- Verify FRONTEND_URL is set correctly in backend
- Check CORS configuration in backend index.ts
- Ensure both frontend and backend use HTTPS in production

## Security Checklist

- [ ] All environment variables are set correctly
- [ ] JWT_SECRET is strong and unique
- [ ] Stripe keys are in live mode (for production)
- [ ] Database uses SSL connection
- [ ] HTTPS is enabled on all endpoints
- [ ] Stripe webhook signature verification is enabled
- [ ] Rate limiting is configured (future enhancement)

## Scaling Considerations

- **Database**: Start with smallest tier, scale as needed
- **Backend**: Railway/Fly.io auto-scales based on load
- **Frontend**: Vercel automatically handles CDN and scaling
- **Monitoring**: Set up alerts for high load

## Costs Estimate (Monthly)

- **Vercel**: Free tier suitable for MVP
- **Railway**: ~$5-20 depending on usage
- **PostgreSQL**: ~$5-15 for managed service
- **Mapbox**: Free tier (50k loads/month)
- **Stripe**: 2.9% + $0.30 per transaction
- **Total**: ~$10-35/month + transaction fees

## Support

For issues or questions:
1. Check application logs in Railway/Vercel dashboard
2. Review Stripe webhook events
3. Check database connection status
4. Review browser console for frontend errors
