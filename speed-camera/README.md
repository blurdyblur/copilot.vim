# Speed Camera MVP

A mobile-first web application that alerts drivers to nearby speed cameras in real time.

## Features

### Core Features
- **Live Map**: Display speed cameras on an interactive dark-mode map
- **Real-Time Alerts**: Get notified when approaching speed cameras
- **Camera Types**: Fixed speed, red light, and average speed cameras
- **GPS Tracking**: Track your location in real-time while driving
- **Settings**: Customize alert distance, sound, and speed units

### Monetization
- **Free Tier**: Limited alert distance (300m), basic features
- **Premium Tier**: Unlimited alerts, extended alert distance (up to 1000m)

## Tech Stack

### Frontend
- React + TypeScript
- Vite
- Tailwind CSS
- Mapbox GL JS
- React Router
- Axios

### Backend
- Node.js + Express
- TypeScript
- PostgreSQL
- Prisma ORM
- JWT Authentication
- Stripe Integration

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Mapbox account and API token
- Stripe account

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Copy and configure environment variables:
```bash
cp .env.example .env
# Edit .env with your database credentials, JWT secret, and Stripe keys
```

4. Generate Prisma client:
```bash
npm run prisma:generate
```

5. Run database migrations:
```bash
npm run prisma:migrate
```

6. Seed the database with sample cameras:
```bash
npm run prisma:seed
```

7. Start the development server:
```bash
npm run dev
```

The backend will be running on http://localhost:3001

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Copy and configure environment variables:
```bash
cp .env.example .env
# Add your Mapbox token to .env
```

4. (Optional) Add an alert sound:
```bash
# Place an alert.mp3 file in the public directory for audio alerts
# If not provided, audio alerts will fail silently
```

5. Start the development server:
```bash
npm run dev
```

The frontend will be running on http://localhost:5173

## Deployment

### Frontend (Vercel)
1. Connect your repository to Vercel
2. Set environment variables:
   - `VITE_API_URL`: Your backend API URL
   - `VITE_MAPBOX_TOKEN`: Your Mapbox token
3. Deploy

### Backend (Railway/Fly.io)
1. Set up a PostgreSQL database
2. Configure environment variables:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_PRICE_ID`
   - `STRIPE_WEBHOOK_SECRET`
   - `FRONTEND_URL`
3. Deploy the backend
4. Run migrations: `npx prisma migrate deploy`
5. Seed the database: `npm run prisma:seed`

## Stripe Setup

1. Create a product in Stripe Dashboard
2. Create a monthly price for the product
3. Set up webhook endpoint: `https://your-backend-url/api/subscriptions/webhook`
4. Subscribe to events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Copy the webhook secret to your environment variables

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/guest` - Create guest account

### Cameras
- `GET /api/cameras` - Get cameras in bounding box
- `GET /api/cameras/:id` - Get camera by ID

### Subscriptions
- `POST /api/subscriptions/create-checkout` - Create Stripe checkout session
- `GET /api/subscriptions/status` - Get subscription status
- `POST /api/subscriptions/cancel` - Cancel subscription
- `POST /api/subscriptions/webhook` - Stripe webhook handler

### Settings
- `GET /api/settings` - Get user settings
- `PUT /api/settings` - Update user settings

### Analytics
- `POST /api/analytics/track` - Track analytics event

## Safety & Legal

The app includes a mandatory disclaimer that users must accept before use:

- App is informational only
- No guarantee of data accuracy
- Users responsible for traffic law compliance
- No interaction while driving
- No liability for fines or damages

## Future Enhancements (v1.5+)

- Background alerts (where OS allows)
- Crowdsourced camera reporting
- Camera verification voting
- Regional expansion
- Native mobile apps
- Annual subscriptions
- Fleet/rideshare mode

## License

Proprietary - All rights reserved
