import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import { insertTicketSchema, insertClientSchema, insertPaymentSchema, insertInvoiceSchema, insertNotificationSchema, insertTicketCommentSchema, insertNotificationTemplateSchema } from "@shared/schema";
import { WebSocketServer, WebSocket } from "ws";
import Stripe from "stripe";

// Initialize Stripe with the secret key from environment variables
if (!process.env.STRIPE_SECRET_KEY) {
  console.warn("Warning: STRIPE_SECRET_KEY is not set. Stripe payments will not work.");
}

const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY) 
  : null;

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);

  // Middleware to check if user is authenticated
  const isAuthenticated = (req: any, res: any, next: any) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  };

  // Dashboard stats route
  app.get("/api/dashboard/stats", isAuthenticated, async (req, res) => {
    try {
      const stats = {
        activeTickets: await storage.countActiveTickets(),
        monthlyRevenue: await storage.getMonthlyRevenue(),
        avgResolutionTime: await storage.getAvgResolutionTime(),
        urgentRepairs: await storage.countUrgentTickets(),
      };
      res.json(stats);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Tickets routes
  app.get("/api/tickets", isAuthenticated, async (req, res) => {
    try {
      const tickets = await storage.getAllTickets();
      res.json(tickets);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/tickets", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertTicketSchema.parse(req.body);
      const ticket = await storage.createTicket(validatedData);
      res.status(201).json(ticket);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors });
      } else {
        res.status(500).json({ message: err.message });
      }
    }
  });

  app.get("/api/tickets/:id", isAuthenticated, async (req, res) => {
    try {
      const ticket = await storage.getTicket(parseInt(req.params.id));
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      res.json(ticket);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.patch("/api/tickets/:id", isAuthenticated, async (req, res) => {
    try {
      const ticketId = parseInt(req.params.id);
      const validatedData = insertTicketSchema.partial().parse(req.body);
      const updatedTicket = await storage.updateTicket(ticketId, validatedData);
      if (!updatedTicket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      res.json(updatedTicket);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors });
      } else {
        res.status(500).json({ message: err.message });
      }
    }
  });

  app.delete("/api/tickets/:id", isAuthenticated, async (req, res) => {
    try {
      const ticketId = parseInt(req.params.id);
      const success = await storage.deleteTicket(ticketId);
      if (!success) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      res.sendStatus(204);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Clients routes
  app.get("/api/clients", isAuthenticated, async (req, res) => {
    try {
      const clients = await storage.getAllClients();
      res.json(clients);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/clients", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertClientSchema.parse(req.body);
      const client = await storage.createClient(validatedData);
      res.status(201).json(client);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors });
      } else {
        res.status(500).json({ message: err.message });
      }
    }
  });

  // Invoices routes
  app.get("/api/invoices", isAuthenticated, async (req, res) => {
    try {
      const invoices = await storage.getAllInvoices();
      res.json(invoices);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });
  
  app.get("/api/invoices/:id", isAuthenticated, async (req, res) => {
    try {
      const invoice = await storage.getInvoice(parseInt(req.params.id));
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      res.json(invoice);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/invoices", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertInvoiceSchema.parse(req.body);
      const invoice = await storage.createInvoice(validatedData);
      res.status(201).json(invoice);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors });
      } else {
        res.status(500).json({ message: err.message });
      }
    }
  });

  // Payments routes
  app.get("/api/payments", isAuthenticated, async (req, res) => {
    try {
      const payments = await storage.getAllPayments();
      res.json(payments);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/payments", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertPaymentSchema.parse(req.body);
      const payment = await storage.createPayment(validatedData);
      res.status(201).json(payment);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors });
      } else {
        res.status(500).json({ message: err.message });
      }
    }
  });

  // Notifications routes
  app.get("/api/notifications", isAuthenticated, async (req, res) => {
    try {
      const notifications = await storage.getNotifications(req.user?.id);
      res.json(notifications);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/notifications/mark-all-read", isAuthenticated, async (req, res) => {
    try {
      await storage.markAllNotificationsAsRead(req.user?.id);
      res.sendStatus(200);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });
  
  // Notification Templates routes
  app.get("/api/notification-templates", isAuthenticated, async (req, res) => {
    try {
      const { type, channel } = req.query;
      
      if (type && channel) {
        // Get active templates by type and channel
        const templates = await storage.getActiveTemplatesByType(type.toString(), channel.toString());
        res.json(templates);
      } else {
        // Return error if type and channel are not provided
        res.status(400).json({ message: "Type and channel parameters are required" });
      }
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });
  
  app.post("/api/notification-templates", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertNotificationTemplateSchema.parse(req.body);
      const template = await storage.createNotificationTemplate(validatedData);
      res.status(201).json(template);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors });
      } else {
        res.status(500).json({ message: err.message });
      }
    }
  });
  
  app.patch("/api/notification-templates/:id", isAuthenticated, async (req, res) => {
    try {
      const templateId = parseInt(req.params.id);
      const validatedData = insertNotificationTemplateSchema.partial().parse(req.body);
      const updatedTemplate = await storage.updateNotificationTemplate(templateId, validatedData);
      if (!updatedTemplate) {
        return res.status(404).json({ message: "Notification template not found" });
      }
      res.json(updatedTemplate);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors });
      } else {
        res.status(500).json({ message: err.message });
      }
    }
  });
  
  app.delete("/api/notification-templates/:id", isAuthenticated, async (req, res) => {
    try {
      const templateId = parseInt(req.params.id);
      const success = await storage.deleteNotificationTemplate(templateId);
      if (!success) {
        return res.status(404).json({ message: "Notification template not found" });
      }
      res.sendStatus(204);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Stripe payment endpoints
  if (stripe) {
    // Create a payment intent for one-time payments
    app.post("/api/create-payment-intent", isAuthenticated, async (req, res) => {
      try {
        const { amount, invoiceId } = req.body;
        
        // Validate input
        if (!amount || amount <= 0) {
          return res.status(400).json({ message: "Invalid amount" });
        }
        
        // Create a payment intent
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(amount * 100), // Convert to cents
          currency: "usd",
          metadata: {
            invoiceId: invoiceId || "",
            userId: req.user?.id?.toString() || "",
          },
        });
        
        res.json({
          clientSecret: paymentIntent.client_secret,
        });
      } catch (err: any) {
        console.error("Stripe payment intent error:", err);
        res.status(500).json({ message: err.message });
      }
    });
    
    // Webhook endpoint to handle Stripe events
    app.post("/api/stripe-webhook", async (req, res) => {
      // This should be enabled in production with proper webhook signature verification
      // For development, we'll just log the event
      console.log("Stripe webhook event received");
      res.sendStatus(200);
    });
    
    // Get available subscription plans/prices
    app.get("/api/subscription-plans", isAuthenticated, async (req, res) => {
      try {
        const plans = [
          {
            id: "BASIC",
            name: "Basic Plan",
            description: "For individual technicians and small repair shops",
            price: 9.99,
            priceId: process.env.STRIPE_PRICE_ID_BASIC,
            features: [
              "Manage up to 50 tickets",
              "Basic client management",
              "Simple invoicing",
              "Email notifications"
            ]
          },
          {
            id: "PROFESSIONAL",
            name: "Professional Plan",
            description: "For established repair shops with multiple technicians",
            price: 29.99,
            priceId: process.env.STRIPE_PRICE_ID_PROFESSIONAL,
            features: [
              "Unlimited tickets",
              "Advanced client management",
              "Full invoicing and payments",
              "Email, SMS notifications",
              "Detailed analytics"
            ]
          },
          {
            id: "ENTERPRISE",
            name: "Enterprise Plan",
            description: "For large repair businesses with multiple locations",
            price: 99.99,
            priceId: process.env.STRIPE_PRICE_ID_ENTERPRISE,
            features: [
              "Everything in Professional",
              "Multi-store management",
              "Advanced analytics and reporting",
              "Priority support",
              "Custom notifications"
            ]
          }
        ];
        
        res.json(plans);
      } catch (err: any) {
        res.status(500).json({ message: err.message });
      }
    });
    
    // Create or retrieve a subscription for the user
    app.post("/api/create-subscription", isAuthenticated, async (req, res) => {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      try {
        const { planId } = req.body;
        let priceId;
        
        // Determine which price ID to use based on the plan
        switch (planId) {
          case "BASIC":
            priceId = process.env.STRIPE_PRICE_ID_BASIC;
            break;
          case "PROFESSIONAL":
            priceId = process.env.STRIPE_PRICE_ID_PROFESSIONAL;
            break;
          case "ENTERPRISE":
            priceId = process.env.STRIPE_PRICE_ID_ENTERPRISE;
            break;
          default:
            return res.status(400).json({ message: "Invalid plan ID" });
        }
        
        if (!priceId) {
          return res.status(400).json({ message: "Price ID not configured for this plan" });
        }
        
        let user = req.user;
        
        // If user already has a subscription, return it
        if (user.stripeSubscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
          
          return res.json({
            subscriptionId: subscription.id,
            clientSecret: subscription.latest_invoice?.payment_intent?.client_secret || null,
            status: subscription.status
          });
        }
        
        // Create a new customer if one doesn't exist
        if (!user.stripeCustomerId) {
          const customer = await stripe.customers.create({
            email: user.email || undefined,
            name: user.username,
            metadata: {
              userId: user.id.toString()
            }
          });
          
          // Update user with new Stripe customer ID
          user = await storage.updateUserStripeInfo(user.id, { 
            stripeCustomerId: customer.id,
            stripeSubscriptionId: "" 
          }) || user;
        }
        
        // Create a subscription
        const subscription = await stripe.subscriptions.create({
          customer: user.stripeCustomerId!,
          items: [{ price: priceId }],
          payment_behavior: 'default_incomplete',
          expand: ['latest_invoice.payment_intent'],
          metadata: {
            userId: user.id.toString(),
            planId: planId
          }
        });
        
        // Update user with subscription ID and tier
        await storage.updateUserStripeInfo(user.id, {
          stripeCustomerId: user.stripeCustomerId!,
          stripeSubscriptionId: subscription.id
        });
        
        await storage.updateSubscriptionTier(user.id, planId);
        await storage.updateSubscriptionStatus(user.id, subscription.status);
        
        res.json({
          subscriptionId: subscription.id,
          clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret || null,
          status: subscription.status
        });
        
      } catch (err: any) {
        console.error("Subscription creation error:", err);
        res.status(500).json({ message: err.message });
      }
    });
    
    // Cancel a subscription
    app.post("/api/cancel-subscription", isAuthenticated, async (req, res) => {
      if (!req.user || !req.user.stripeSubscriptionId) {
        return res.status(400).json({ message: "No active subscription" });
      }
      
      try {
        const subscription = await stripe.subscriptions.update(
          req.user.stripeSubscriptionId,
          { cancel_at_period_end: true }
        );
        
        await storage.updateSubscriptionStatus(req.user.id, subscription.status);
        
        res.json({
          message: "Subscription will be canceled at the end of the billing period",
          cancelAt: new Date(subscription.cancel_at * 1000)
        });
      } catch (err: any) {
        console.error("Subscription cancellation error:", err);
        res.status(500).json({ message: err.message });
      }
    });
    
    // Update a subscription to a different plan
    app.post("/api/update-subscription", isAuthenticated, async (req, res) => {
      if (!req.user || !req.user.stripeSubscriptionId) {
        return res.status(400).json({ message: "No active subscription" });
      }
      
      try {
        const { planId } = req.body;
        let priceId;
        
        // Determine which price ID to use based on the plan
        switch (planId) {
          case "BASIC":
            priceId = process.env.STRIPE_PRICE_ID_BASIC;
            break;
          case "PROFESSIONAL":
            priceId = process.env.STRIPE_PRICE_ID_PROFESSIONAL;
            break;
          case "ENTERPRISE":
            priceId = process.env.STRIPE_PRICE_ID_ENTERPRISE;
            break;
          default:
            return res.status(400).json({ message: "Invalid plan ID" });
        }
        
        if (!priceId) {
          return res.status(400).json({ message: "Price ID not configured for this plan" });
        }
        
        // Get the subscription first to identify the item ID
        const currentSubscription = await stripe.subscriptions.retrieve(req.user.stripeSubscriptionId);
        
        // Get the subscription item ID (usually there's just one item)
        const subscriptionItemId = currentSubscription.items.data[0].id;
        
        // Update the subscription with the new price
        const subscription = await stripe.subscriptions.update(
          req.user.stripeSubscriptionId,
          {
            items: [{
              id: subscriptionItemId,
              price: priceId
            }],
            metadata: {
              planId: planId
            }
          }
        );
        
        // Update user's subscription tier in the database
        await storage.updateSubscriptionTier(req.user.id, planId);
        
        res.json({
          message: "Subscription updated successfully",
          subscriptionId: subscription.id,
          status: subscription.status
        });
      } catch (err: any) {
        console.error("Subscription update error:", err);
        res.status(500).json({ message: err.message });
      }
    });
  }

  // Ticket comments routes
  app.get("/api/tickets/:id/comments", isAuthenticated, async (req, res) => {
    try {
      const ticketId = parseInt(req.params.id);
      const comments = await storage.getTicketComments(ticketId);
      res.json(comments);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/tickets/:id/comments", isAuthenticated, async (req, res) => {
    try {
      const ticketId = parseInt(req.params.id);
      const userId = req.user?.id;
      const username = req.user?.username || "Unknown User";
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const ticket = await storage.getTicket(ticketId);
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      
      const validatedData = insertTicketCommentSchema.parse({
        ...req.body,
        ticketId,
        userId,
        username
      });
      
      const comment = await storage.createTicketComment(validatedData);
      
      // Broadcast to all connected WebSocket clients
      broadcastToTicket(ticketId, {
        type: "NEW_COMMENT",
        data: comment
      });
      
      res.status(201).json(comment);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors });
      } else {
        res.status(500).json({ message: err.message });
      }
    }
  });

  const httpServer = createServer(app);
  
  // Set up WebSocket server for real-time comments
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Keep track of clients connected to specific tickets
  const ticketConnections = new Map<number, Set<WebSocket>>();
  
  wss.on('connection', (ws, req) => {
    // Extract ticket ID from URL query parameters
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const ticketId = parseInt(url.searchParams.get('ticketId') || '0');
    
    if (!ticketId) {
      ws.close(1008, 'Missing ticket ID');
      return;
    }
    
    // Add client to ticket connections
    if (!ticketConnections.has(ticketId)) {
      ticketConnections.set(ticketId, new Set());
    }
    ticketConnections.get(ticketId)?.add(ws);
    
    // Send initial comments
    storage.getTicketComments(ticketId).then(comments => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: "INIT_COMMENTS",
          data: comments
        }));
      }
    });
    
    // Handle client disconnection
    ws.on('close', () => {
      const connections = ticketConnections.get(ticketId);
      if (connections) {
        connections.delete(ws);
        if (connections.size === 0) {
          ticketConnections.delete(ticketId);
        }
      }
    });
    
    // Handle messages from client (not needed for this implementation)
    ws.on('message', (message) => {
      // Could handle client messages here if needed
      console.log('Received message from client:', message.toString());
    });
  });
  
  // Function to broadcast a message to all clients connected to a specific ticket
  function broadcastToTicket(ticketId: number, message: any) {
    const connections = ticketConnections.get(ticketId);
    if (connections) {
      const messageStr = JSON.stringify(message);
      connections.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(messageStr);
        }
      });
    }
  }
  
  return httpServer;
}
