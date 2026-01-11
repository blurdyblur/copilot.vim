import express from 'express';
import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-01-27.acacia'
});

// Create checkout session
router.post('/create-checkout', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (req.isGuest) {
      return res.status(403).json({ error: 'Guest users cannot subscribe' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user already has subscription
    const existingSub = await prisma.subscription.findUnique({
      where: { userId: req.userId }
    });

    if (existingSub && existingSub.status === 'ACTIVE') {
      return res.status(400).json({ error: 'Already subscribed' });
    }

    // Create or retrieve Stripe customer
    let customerId = existingSub?.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId: user.id }
      });
      customerId = customer.id;
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1
        }
      ],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/settings`,
      metadata: {
        userId: user.id
      }
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Create checkout error:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Get subscription status
router.get('/status', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const subscription = await prisma.subscription.findUnique({
      where: { userId: req.userId }
    });

    if (!subscription) {
      return res.json({ status: 'FREE', hasActiveSubscription: false });
    }

    res.json({
      status: subscription.status,
      hasActiveSubscription: subscription.status === 'ACTIVE',
      planType: subscription.planType,
      currentPeriodEnd: subscription.currentPeriodEnd
    });
  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({ error: 'Failed to fetch subscription' });
  }
});

// Stripe webhook
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];

  try {
    if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
      return res.status(400).send('Missing signature or webhook secret');
    }

    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const subscriptionId = session.subscription as string;

        if (userId && subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          
          await prisma.subscription.upsert({
            where: { userId },
            update: {
              stripeSubId: subscriptionId,
              status: 'ACTIVE',
              planType: 'PREMIUM',
              currentPeriodEnd: new Date(subscription.current_period_end * 1000)
            },
            create: {
              userId,
              stripeCustomerId: session.customer as string,
              stripeSubId: subscriptionId,
              status: 'ACTIVE',
              planType: 'PREMIUM',
              currentPeriodEnd: new Date(subscription.current_period_end * 1000)
            }
          });

          // Log analytics
          await prisma.analytics.create({
            data: {
              userId,
              eventType: 'SUBSCRIPTION_STARTED'
            }
          });
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId;

        if (userId) {
          await prisma.subscription.update({
            where: { stripeSubId: subscription.id },
            data: {
              status: subscription.status === 'active' ? 'ACTIVE' : 
                     subscription.status === 'past_due' ? 'PAST_DUE' :
                     subscription.status === 'canceled' ? 'CANCELED' : 'UNPAID',
              currentPeriodEnd: new Date(subscription.current_period_end * 1000)
            }
          });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        
        await prisma.subscription.update({
          where: { stripeSubId: subscription.id },
          data: {
            status: 'CANCELED'
          }
        });

        // Log analytics
        const sub = await prisma.subscription.findUnique({
          where: { stripeSubId: subscription.id }
        });
        
        if (sub) {
          await prisma.analytics.create({
            data: {
              userId: sub.userId,
              eventType: 'SUBSCRIPTION_CANCELED'
            }
          });
        }
        break;
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).send(`Webhook Error: ${error}`);
  }
});

// Cancel subscription
router.post('/cancel', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const subscription = await prisma.subscription.findUnique({
      where: { userId: req.userId }
    });

    if (!subscription) {
      return res.status(404).json({ error: 'No subscription found' });
    }

    await stripe.subscriptions.cancel(subscription.stripeSubId);

    res.json({ message: 'Subscription canceled' });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

export default router;
