import { users, User, InsertUser, tickets, Ticket, InsertTicket, clients, Client, InsertClient, invoices, Invoice, InsertInvoice, payments, Payment, InsertPayment, notifications, Notification, InsertNotification, ticketComments, TicketComment, InsertTicketComment, notificationTemplates, NotificationTemplate, InsertNotificationTemplate, companyBranding, CompanyBranding, InsertCompanyBranding, invoiceTemplates, InvoiceTemplate, InsertInvoiceTemplate } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import connectPg from "connect-pg-simple";
import { db } from "./db";
import { eq, and, desc, count, sql, gt, gte, ne } from "drizzle-orm";
import { pool } from "./db";

const MemoryStore = createMemoryStore(session);
const PostgresSessionStore = connectPg(session);

// Defines all the storage operations needed by the application
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Session store
  sessionStore: session.Store;
  
  // Ticket operations
  getAllTickets(): Promise<Ticket[]>;
  getTicket(id: number): Promise<Ticket | undefined>;
  createTicket(ticket: InsertTicket): Promise<Ticket>;
  updateTicket(id: number, ticket: Partial<InsertTicket>): Promise<Ticket | undefined>;
  deleteTicket(id: number): Promise<boolean>;
  countActiveTickets(): Promise<number>;
  countUrgentTickets(): Promise<number>;
  
  // Client operations
  getAllClients(): Promise<Client[]>;
  getClient(id: number): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: number, client: Partial<InsertClient>): Promise<Client | undefined>;
  deleteClient(id: number): Promise<boolean>;
  
  // Invoice operations
  getAllInvoices(): Promise<Invoice[]>;
  getInvoice(id: number): Promise<Invoice | undefined>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: number, invoice: Partial<InsertInvoice>): Promise<Invoice | undefined>;
  deleteInvoice(id: number): Promise<boolean>;
  
  // Payment operations
  getAllPayments(): Promise<Payment[]>;
  getPayment(id: number): Promise<Payment | undefined>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  getMonthlyRevenue(): Promise<number>;
  
  // Notification operations
  getNotifications(userId: number | undefined): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markAllNotificationsAsRead(userId: number | undefined): Promise<void>;
  
  // Analytics operations
  getAvgResolutionTime(): Promise<string>;
}

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  
  // Subscription operations
  updateUserStripeInfo(userId: number, stripeInfo: { stripeCustomerId: string, stripeSubscriptionId: string }): Promise<User | undefined>;
  updateSubscriptionStatus(userId: number, status: string, currentPeriodEnd?: Date): Promise<User | undefined>;
  updateSubscriptionTier(userId: number, tier: string): Promise<User | undefined>;
  
  // Session store
  sessionStore: session.Store;
  
  // Ticket operations
  getAllTickets(): Promise<Ticket[]>;
  getTicket(id: number): Promise<Ticket | undefined>;
  createTicket(ticket: InsertTicket): Promise<Ticket>;
  updateTicket(id: number, ticket: Partial<InsertTicket>): Promise<Ticket | undefined>;
  deleteTicket(id: number): Promise<boolean>;
  countActiveTickets(): Promise<number>;
  countUrgentTickets(): Promise<number>;
  
  // Ticket comments operations
  getTicketComments(ticketId: number): Promise<TicketComment[]>;
  createTicketComment(comment: InsertTicketComment): Promise<TicketComment>;
  
  // Client operations
  getAllClients(): Promise<Client[]>;
  getClient(id: number): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: number, client: Partial<InsertClient>): Promise<Client | undefined>;
  deleteClient(id: number): Promise<boolean>;
  
  // Invoice operations
  getAllInvoices(): Promise<Invoice[]>;
  getInvoice(id: number): Promise<Invoice | undefined>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: number, invoice: Partial<InsertInvoice>): Promise<Invoice | undefined>;
  deleteInvoice(id: number): Promise<boolean>;
  
  // Payment operations
  getAllPayments(): Promise<Payment[]>;
  getPayment(id: number): Promise<Payment | undefined>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  getMonthlyRevenue(): Promise<number>;
  
  // Notification operations
  getNotifications(userId: number | undefined): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markAllNotificationsAsRead(userId: number | undefined): Promise<void>;
  // Notification template operations
  getActiveTemplatesByType(type: string, channel: string): Promise<NotificationTemplate[]>;
  createNotificationTemplate(template: InsertNotificationTemplate): Promise<NotificationTemplate>;
  updateNotificationTemplate(id: number, template: Partial<InsertNotificationTemplate>): Promise<NotificationTemplate | undefined>;
  deleteNotificationTemplate(id: number): Promise<boolean>;

  
  // Analytics operations
  getAvgResolutionTime(): Promise<string>;
}

// Define additional interface for Company Branding and Invoice Templates
export interface IBrandingAndTemplates {
  // Company branding operations
  getCompanyBranding(userId: number): Promise<CompanyBranding | undefined>;
  createCompanyBranding(branding: InsertCompanyBranding): Promise<CompanyBranding>;
  updateCompanyBranding(id: number, branding: Partial<InsertCompanyBranding>): Promise<CompanyBranding | undefined>;
  
  // Invoice template operations
  getInvoiceTemplates(userId: number): Promise<InvoiceTemplate[]>;
  getInvoiceTemplate(id: number): Promise<InvoiceTemplate | undefined>;
  createInvoiceTemplate(template: InsertInvoiceTemplate): Promise<InvoiceTemplate>;
  updateInvoiceTemplate(id: number, template: Partial<InsertInvoiceTemplate>): Promise<InvoiceTemplate | undefined>;
  deleteInvoiceTemplate(id: number): Promise<boolean>;
}

// Combine the interfaces
export interface IFullStorage extends IStorage, IBrandingAndTemplates {}

export class MemStorage implements IFullStorage {
  private users: Map<number, User>;
  private tickets: Map<number, Ticket>;
  private clients: Map<number, Client>;
  private invoices: Map<number, Invoice>;
  private payments: Map<number, Payment>;
  private notifications: Map<number, Notification>;
  private ticketComments: Map<number, TicketComment>;
  private notificationTemplates: Map<number, NotificationTemplate>;
  private companyBranding: Map<number, CompanyBranding>;
  private invoiceTemplates: Map<number, InvoiceTemplate>;
  public sessionStore: session.Store;
  
  private userIdCounter: number;
  private ticketIdCounter: number;
  private clientIdCounter: number;
  private invoiceIdCounter: number;
  private paymentIdCounter: number;
  private notificationIdCounter: number;
  private commentIdCounter: number;
  private notificationTemplateIdCounter: number;
  private brandingIdCounter: number;
  private invoiceTemplateIdCounter: number;

  constructor() {
    this.users = new Map();
    this.tickets = new Map();
    this.clients = new Map();
    this.invoices = new Map();
    this.payments = new Map();
    this.notifications = new Map();
    this.ticketComments = new Map();
    this.notificationTemplates = new Map();
    this.companyBranding = new Map();
    this.invoiceTemplates = new Map();
    
    this.userIdCounter = 1;
    this.ticketIdCounter = 1;
    this.clientIdCounter = 1;
    this.invoiceIdCounter = 1;
    this.paymentIdCounter = 1;
    this.notificationIdCounter = 1;
    this.commentIdCounter = 1;
    this.notificationTemplateIdCounter = 1;
    this.brandingIdCounter = 1;
    this.invoiceTemplateIdCounter = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
    
    // Create initial clients and tickets
    this.initializeDemoData();
  }

  // Initialize some demo data
  private async initializeDemoData() {
    // Create sample clients
    const clients = [
      {
        name: "Michael Johnson",
        email: "mjohnson@example.com",
        phone: "555-1234",
        company: "Johnson Tech",
        address: "123 Tech Lane",
        city: "San Francisco",
        state: "CA",
        zipCode: "94107",
      },
      {
        name: "Sarah Miller",
        email: "smiller@example.com",
        phone: "555-5678",
        company: "Miller Designs",
        address: "456 Design Avenue",
        city: "New York",
        state: "NY",
        zipCode: "10001",
      },
      {
        name: "David Chen",
        email: "dchen@example.com",
        phone: "555-9012",
        company: "",
        address: "789 Main Street",
        city: "Boston",
        state: "MA",
        zipCode: "02108",
      },
      {
        name: "Emily Wilson",
        email: "ewilson@example.com",
        phone: "555-3456",
        company: "Wilson Enterprises",
        address: "321 Business Road",
        city: "Chicago",
        state: "IL",
        zipCode: "60601",
      },
    ];

    for (const client of clients) {
      await this.createClient(client);
    }

    // Create sample tickets
    const tickets = [
      {
        clientId: 1,
        clientName: "Michael Johnson",
        deviceType: "smartphone",
        deviceModel: "iPhone 12",
        issueType: "Screen",
        issueDescription: "Cracked screen needs replacement",
        priority: "medium",
        status: "COMPLETED" as const,
        dueDate: new Date(Date.now() + 0 * 24 * 60 * 60 * 1000),
        technicianId: 1,
      },
      {
        clientId: 2,
        clientName: "Sarah Miller",
        deviceType: "laptop",
        deviceModel: "MacBook Pro",
        issueType: "Battery",
        issueDescription: "Battery doesn't hold charge",
        priority: "high",
        status: "IN_PROGRESS" as const,
        dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        technicianId: 1,
      },
      {
        clientId: 3,
        clientName: "David Chen",
        deviceType: "smartphone",
        deviceModel: "Samsung S21",
        issueType: "Charging Port",
        issueDescription: "Charging port damaged",
        priority: "urgent",
        status: "DIAGNOSED" as const,
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        technicianId: 2,
      },
      {
        clientId: 4,
        clientName: "Emily Wilson",
        deviceType: "tablet",
        deviceModel: "iPad Air",
        issueType: "Screen",
        issueDescription: "Screen unresponsive to touch",
        priority: "low",
        status: "RECEIVED" as const,
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        technicianId: null,
      },
    ];

    for (const ticket of tickets) {
      await this.createTicket(ticket);
    }

    // Create sample invoices
    const invoices = [
      {
        invoiceNumber: "INV-2021",
        clientId: 1,
        clientName: "Michael Johnson",
        ticketId: 1,
        items: [
          {
            description: "iPhone 12 Screen Repair",
            quantity: 1,
            unitPrice: 14999,
            total: 14999,
          },
        ],
        subTotal: 14999,
        tax: 0,
        total: 14999,
        notes: "Warranty: 90 days",
        status: "PAID" as const,
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },
      {
        invoiceNumber: "INV-2020",
        clientId: 2,
        clientName: "Sarah Miller",
        ticketId: 2,
        items: [
          {
            description: "MacBook Pro Battery Replacement",
            quantity: 1,
            unitPrice: 19999,
            total: 19999,
          },
        ],
        subTotal: 19999,
        tax: 0,
        total: 19999,
        notes: "Warranty: 90 days",
        status: "PENDING" as const,
        date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      },
      {
        invoiceNumber: "INV-2019",
        clientId: 3,
        clientName: "David Chen",
        ticketId: 3,
        items: [
          {
            description: "Samsung S21 Charging Port Repair",
            quantity: 1,
            unitPrice: 8999,
            total: 8999,
          },
        ],
        subTotal: 8999,
        tax: 0,
        total: 8999,
        notes: "Warranty: 90 days",
        status: "PAID" as const,
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        dueDate: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000),
      },
      {
        invoiceNumber: "INV-2018",
        clientId: 4,
        clientName: "Emily Wilson",
        ticketId: 4,
        items: [
          {
            description: "iPad Air Screen Repair",
            quantity: 1,
            unitPrice: 12999,
            total: 12999,
          },
        ],
        subTotal: 12999,
        tax: 0,
        total: 12999,
        notes: "Warranty: 90 days",
        status: "PAID" as const,
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    ];

    for (const invoice of invoices) {
      await this.createInvoice(invoice);
    }

    // Create sample payments
    const payments = [
      {
        invoiceId: 1,
        invoiceNumber: "INV-2021",
        clientId: 1,
        clientName: "Michael Johnson",
        amount: 14999,
        method: "Credit Card",
        reference: "TXN12345",
        status: "PAID" as const,
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        description: "iPhone 12 Screen Repair",
      },
      {
        invoiceId: 3,
        invoiceNumber: "INV-2019",
        clientId: 3,
        clientName: "David Chen",
        amount: 8999,
        method: "Cash",
        reference: "CASH98765",
        status: "PAID" as const,
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        description: "Samsung S21 Charging Port",
      },
      {
        invoiceId: 4,
        invoiceNumber: "INV-2018",
        clientId: 4,
        clientName: "Emily Wilson",
        amount: 12999,
        method: "Credit Card",
        reference: "TXN54321",
        status: "PAID" as const,
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        description: "iPad Air Screen Repair",
      },
    ];

    for (const payment of payments) {
      await this.createPayment(payment);
    }

    // Create sample notifications
    const notifications = [
      {
        userId: 1,
        type: "NEW_TICKET" as const,
        title: "New repair request from David Chen",
        message: "Samsung S21 - Charging Port issue needs assessment",
        resourceId: 3,
        resourceType: "ticket",
        isRead: false,
        actionLabel: "Assign",
        actionUrl: "/tickets/3",
        createdAt: new Date(Date.now() - 20 * 60 * 1000), // 20 minutes ago
      },
      {
        userId: 1,
        type: "PAYMENT" as const,
        title: "Invoice #INV-2018 has been paid",
        message: "Emily Wilson completed payment for iPad Air screen repair",
        resourceId: 4,
        resourceType: "invoice",
        isRead: false,
        actionLabel: null,
        actionUrl: "/invoices/4",
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      },
      {
        userId: 1,
        type: "STATUS_UPDATE" as const,
        title: "Ticket #TK-2344 status changed",
        message: "Sarah Miller's MacBook Pro repair is now in progress",
        resourceId: 2,
        resourceType: "ticket",
        isRead: false,
        actionLabel: "Update status",
        actionUrl: "/tickets/2",
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
      },
    ];

    for (const notification of notifications) {
      await this.createNotification(notification);
    }
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...insertUser, id, createdAt: new Date() };
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: number, userUpdate: Partial<InsertUser>): Promise<User | undefined> {
    const existingUser = this.users.get(id);
    if (!existingUser) {
      return undefined;
    }
    
    const updatedUser: User = {
      ...existingUser,
      ...userUpdate,
    };
    
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async updateUserStripeInfo(userId: number, stripeInfo: { stripeCustomerId: string, stripeSubscriptionId: string }): Promise<User | undefined> {
    const existingUser = this.users.get(userId);
    if (!existingUser) {
      return undefined;
    }
    
    const updatedUser: User = {
      ...existingUser,
      stripeCustomerId: stripeInfo.stripeCustomerId,
      stripeSubscriptionId: stripeInfo.stripeSubscriptionId,
    };
    
    this.users.set(userId, updatedUser);
    return updatedUser;
  }
  
  async updateSubscriptionStatus(userId: number, status: string, currentPeriodEnd?: Date): Promise<User | undefined> {
    const existingUser = this.users.get(userId);
    if (!existingUser) {
      return undefined;
    }
    
    const updatedUser: User = {
      ...existingUser,
      subscriptionStatus: status as any, // Type cast to match enum
      ...(currentPeriodEnd && { subscriptionCurrentPeriodEnd: currentPeriodEnd }),
    };
    
    this.users.set(userId, updatedUser);
    return updatedUser;
  }
  
  async updateSubscriptionTier(userId: number, tier: string): Promise<User | undefined> {
    const existingUser = this.users.get(userId);
    if (!existingUser) {
      return undefined;
    }
    
    const updatedUser: User = {
      ...existingUser,
      subscriptionTier: tier as any, // Type cast to match enum
    };
    
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  // Ticket methods
  async getAllTickets(): Promise<Ticket[]> {
    return Array.from(this.tickets.values());
  }

  async getTicket(id: number): Promise<Ticket | undefined> {
    return this.tickets.get(id);
  }

  async createTicket(insertTicket: InsertTicket): Promise<Ticket> {
    const id = this.ticketIdCounter++;
    const statusHistory = [{
      status: insertTicket.status || "RECEIVED",
      timestamp: new Date().toISOString(),
      note: "Ticket created"
    }];
    
    const ticket: Ticket = {
      ...insertTicket,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
      statusHistory,
      attachments: [],
    };
    
    this.tickets.set(id, ticket);
    
    // Update client's ticket count
    const client = await this.getClient(insertTicket.clientId);
    if (client) {
      await this.updateClient(client.id, { 
        ...client,
        ticketCount: (client.ticketCount || 0) + 1 
      });
    }
    
    return ticket;
  }

  async updateTicket(id: number, ticketUpdate: Partial<InsertTicket>): Promise<Ticket | undefined> {
    const existingTicket = this.tickets.get(id);
    if (!existingTicket) {
      return undefined;
    }
    
    // If status is updated, add to history
    const statusHistory = [...existingTicket.statusHistory];
    if (ticketUpdate.status && ticketUpdate.status !== existingTicket.status) {
      statusHistory.push({
        status: ticketUpdate.status,
        timestamp: new Date().toISOString(),
        note: `Status changed from ${existingTicket.status} to ${ticketUpdate.status}`
      });
    }
    
    const updatedTicket: Ticket = {
      ...existingTicket,
      ...ticketUpdate,
      updatedAt: new Date(),
      statusHistory,
    };
    
    this.tickets.set(id, updatedTicket);
    return updatedTicket;
  }

  async deleteTicket(id: number): Promise<boolean> {
    return this.tickets.delete(id);
  }

  async countActiveTickets(): Promise<number> {
    const activeStatuses = ["RECEIVED", "DIAGNOSED", "IN_PROGRESS"];
    return Array.from(this.tickets.values()).filter(ticket => 
      activeStatuses.includes(ticket.status)
    ).length;
  }

  async countUrgentTickets(): Promise<number> {
    return Array.from(this.tickets.values()).filter(ticket => 
      ticket.priority === "urgent" && ["RECEIVED", "DIAGNOSED", "IN_PROGRESS"].includes(ticket.status)
    ).length;
  }

  // Client methods
  async getAllClients(): Promise<Client[]> {
    return Array.from(this.clients.values());
  }

  async getClient(id: number): Promise<Client | undefined> {
    return this.clients.get(id);
  }

  async createClient(insertClient: InsertClient): Promise<Client> {
    const id = this.clientIdCounter++;
    const client: Client = {
      ...insertClient,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
      ticketCount: 0,
    };
    
    this.clients.set(id, client);
    return client;
  }

  async updateClient(id: number, clientUpdate: Partial<Client>): Promise<Client | undefined> {
    const existingClient = this.clients.get(id);
    if (!existingClient) {
      return undefined;
    }
    
    const updatedClient: Client = {
      ...existingClient,
      ...clientUpdate,
      updatedAt: new Date(),
    };
    
    this.clients.set(id, updatedClient);
    return updatedClient;
  }

  async deleteClient(id: number): Promise<boolean> {
    return this.clients.delete(id);
  }

  // Invoice methods
  async getAllInvoices(): Promise<Invoice[]> {
    return Array.from(this.invoices.values());
  }

  async getInvoice(id: number): Promise<Invoice | undefined> {
    return this.invoices.get(id);
  }

  async createInvoice(insertInvoice: InsertInvoice): Promise<Invoice> {
    const id = this.invoiceIdCounter++;
    const invoice: Invoice = {
      ...insertInvoice,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.invoices.set(id, invoice);
    return invoice;
  }

  async updateInvoice(id: number, invoiceUpdate: Partial<InsertInvoice>): Promise<Invoice | undefined> {
    const existingInvoice = this.invoices.get(id);
    if (!existingInvoice) {
      return undefined;
    }
    
    const updatedInvoice: Invoice = {
      ...existingInvoice,
      ...invoiceUpdate,
      updatedAt: new Date(),
    };
    
    this.invoices.set(id, updatedInvoice);
    return updatedInvoice;
  }

  async deleteInvoice(id: number): Promise<boolean> {
    return this.invoices.delete(id);
  }

  // Payment methods
  async getAllPayments(): Promise<Payment[]> {
    return Array.from(this.payments.values());
  }

  async getPayment(id: number): Promise<Payment | undefined> {
    return this.payments.get(id);
  }

  async createPayment(insertPayment: InsertPayment): Promise<Payment> {
    const id = this.paymentIdCounter++;
    const payment: Payment = {
      ...insertPayment,
      id,
      createdAt: new Date(),
    };
    
    this.payments.set(id, payment);
    
    // Update the related invoice status if payment is completed
    if (payment.status === "PAID") {
      const invoice = await this.getInvoice(payment.invoiceId);
      if (invoice) {
        await this.updateInvoice(invoice.id, { status: "PAID" });
      }
    }
    
    return payment;
  }

  async getMonthlyRevenue(): Promise<number> {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    return Array.from(this.payments.values())
      .filter(payment => 
        payment.status === "PAID" && 
        new Date(payment.date) >= firstDayOfMonth
      )
      .reduce((total, payment) => total + payment.amount, 0) / 100; // Convert from cents to dollars
  }

  // Notification methods
  async getNotifications(userId: number | undefined): Promise<Notification[]> {
    if (!userId) {
      return [];
    }
    
    return Array.from(this.notifications.values())
      .filter(notification => notification.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const id = this.notificationIdCounter++;
    const notification: Notification = {
      ...insertNotification,
      id,
      createdAt: new Date(),
    };
    
    this.notifications.set(id, notification);
    return notification;
  }

  async markAllNotificationsAsRead(userId: number | undefined): Promise<void> {
    if (!userId) {
      return;
    }
    
    Array.from(this.notifications.values())
      .filter(notification => notification.userId === userId && !notification.isRead)
      .forEach(notification => {
        notification.isRead = true;
        this.notifications.set(notification.id, notification);
      });
  }
  
  // Notification template methods
  async getActiveTemplatesByType(type: string, channel: string): Promise<NotificationTemplate[]> {
    return Array.from(this.notificationTemplates.values())
      .filter(template => 
        template.type === type && 
        template.channel === channel && 
        template.isActive
      );
  }
  
  async createNotificationTemplate(template: InsertNotificationTemplate): Promise<NotificationTemplate> {
    const id = this.notificationTemplateIdCounter++;
    const notificationTemplate: NotificationTemplate = {
      ...template,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.notificationTemplates.set(id, notificationTemplate);
    return notificationTemplate;
  }
  
  async updateNotificationTemplate(id: number, templateUpdate: Partial<InsertNotificationTemplate>): Promise<NotificationTemplate | undefined> {
    const existingTemplate = this.notificationTemplates.get(id);
    if (!existingTemplate) {
      return undefined;
    }
    
    const updatedTemplate: NotificationTemplate = {
      ...existingTemplate,
      ...templateUpdate,
      updatedAt: new Date(),
    };
    
    this.notificationTemplates.set(id, updatedTemplate);
    return updatedTemplate;
  }
  
  async deleteNotificationTemplate(id: number): Promise<boolean> {
    return this.notificationTemplates.delete(id);
  }

  // Ticket comments methods
  async getTicketComments(ticketId: number): Promise<TicketComment[]> {
    return Array.from(this.ticketComments.values())
      .filter(comment => comment.ticketId === ticketId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }
  
  async createTicketComment(comment: InsertTicketComment): Promise<TicketComment> {
    const id = this.commentIdCounter++;
    const ticketComment: TicketComment = {
      ...comment,
      id,
      createdAt: new Date(),
    };
    
    this.ticketComments.set(id, ticketComment);
    
    // Create a notification for the ticket owner if applicable
    const ticket = await this.getTicket(comment.ticketId);
    if (ticket && ticket.technicianId && ticket.technicianId !== comment.userId) {
      await this.createNotification({
        userId: ticket.technicianId,
        type: "INFO",
        title: `New comment on Ticket #${ticket.id}`,
        message: `${comment.username} commented: ${comment.content.substring(0, 50)}${comment.content.length > 50 ? '...' : ''}`,
        resourceId: ticket.id,
        resourceType: "ticket",
        isRead: false,
        actionLabel: "View",
        actionUrl: `/tickets/${ticket.id}`,
      });
    }
    
    return ticketComment;
  }
  
  // Analytics
  async getAvgResolutionTime(): Promise<string> {
    const completedTickets = Array.from(this.tickets.values())
      .filter(ticket => ticket.status === "COMPLETED");
    
    if (completedTickets.length === 0) {
      return "0 days";
    }
    
    // Calculate resolution time in milliseconds for each completed ticket
    const totalTimeMs = completedTickets.reduce((total, ticket) => {
      const createdDate = new Date(ticket.createdAt);
      
      // Find completion date from status history
      const completionEntry = ticket.statusHistory.find(history => history.status === "COMPLETED");
      const completionDate = completionEntry 
        ? new Date(completionEntry.timestamp) 
        : new Date(ticket.updatedAt);
      
      const ticketResolutionTime = completionDate.getTime() - createdDate.getTime();
      return total + ticketResolutionTime;
    }, 0);
    
    // Calculate average resolution time in days
    const avgTimeMs = totalTimeMs / completedTickets.length;
    const avgTimeDays = avgTimeMs / (1000 * 60 * 60 * 24);
    
    return `${avgTimeDays.toFixed(1)} days`;
  }
  
  // Company branding methods
  async getCompanyBranding(userId: number): Promise<CompanyBranding | undefined> {
    return Array.from(this.companyBranding.values()).find(
      (branding) => branding.userId === userId
    );
  }

  async createCompanyBranding(branding: InsertCompanyBranding): Promise<CompanyBranding> {
    const id = this.brandingIdCounter++;
    const companyBranding: CompanyBranding = {
      ...branding,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.companyBranding.set(id, companyBranding);
    return companyBranding;
  }

  async updateCompanyBranding(id: number, brandingUpdate: Partial<InsertCompanyBranding>): Promise<CompanyBranding | undefined> {
    const existingBranding = this.companyBranding.get(id);
    if (!existingBranding) {
      return undefined;
    }
    
    const updatedBranding: CompanyBranding = {
      ...existingBranding,
      ...brandingUpdate,
      updatedAt: new Date()
    };
    
    this.companyBranding.set(id, updatedBranding);
    return updatedBranding;
  }

  // Invoice template methods
  async getInvoiceTemplates(userId: number): Promise<InvoiceTemplate[]> {
    return Array.from(this.invoiceTemplates.values()).filter(
      (template) => template.userId === userId
    );
  }

  async getInvoiceTemplate(id: number): Promise<InvoiceTemplate | undefined> {
    return this.invoiceTemplates.get(id);
  }

  async createInvoiceTemplate(template: InsertInvoiceTemplate): Promise<InvoiceTemplate> {
    const id = this.invoiceTemplateIdCounter++;
    const invoiceTemplate: InvoiceTemplate = {
      ...template,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.invoiceTemplates.set(id, invoiceTemplate);
    return invoiceTemplate;
  }

  async updateInvoiceTemplate(id: number, templateUpdate: Partial<InsertInvoiceTemplate>): Promise<InvoiceTemplate | undefined> {
    const existingTemplate = this.invoiceTemplates.get(id);
    if (!existingTemplate) {
      return undefined;
    }
    
    const updatedTemplate: InvoiceTemplate = {
      ...existingTemplate,
      ...templateUpdate,
      updatedAt: new Date()
    };
    
    this.invoiceTemplates.set(id, updatedTemplate);
    return updatedTemplate;
  }

  async deleteInvoiceTemplate(id: number): Promise<boolean> {
    return this.invoiceTemplates.delete(id);
  }
}

export class DatabaseStorage implements IFullStorage {
  public sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    // Ensure optional fields are properly handled with null values instead of undefined
    const userData = {
      ...insertUser,
      email: insertUser.email || null,
      firstName: insertUser.firstName || null,
      lastName: insertUser.lastName || null,
      phone: insertUser.phone || null,
      role: insertUser.role || "TECHNICIAN",
      isAdmin: insertUser.isAdmin !== undefined ? insertUser.isAdmin : false,
      // Initialize subscription fields with null values
      stripeCustomerId: insertUser.stripeCustomerId || null,
      stripeSubscriptionId: insertUser.stripeSubscriptionId || null,
      subscriptionTier: insertUser.subscriptionTier || "NONE",
      subscriptionStatus: insertUser.subscriptionStatus || null,
      subscriptionCurrentPeriodEnd: insertUser.subscriptionCurrentPeriodEnd || null,
      shopId: insertUser.shopId || null
    };
    
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }
  
  async updateUser(id: number, userUpdate: Partial<InsertUser>): Promise<User | undefined> {
    // Ensure optional fields are not undefined
    const userData = {
      ...userUpdate,
      email: userUpdate.email === undefined ? undefined : userUpdate.email || null,
      firstName: userUpdate.firstName === undefined ? undefined : userUpdate.firstName || null,
      lastName: userUpdate.lastName === undefined ? undefined : userUpdate.lastName || null,
      phone: userUpdate.phone === undefined ? undefined : userUpdate.phone || null,
      role: userUpdate.role === undefined ? undefined : userUpdate.role || null,
      stripeCustomerId: userUpdate.stripeCustomerId === undefined ? undefined : userUpdate.stripeCustomerId || null,
      stripeSubscriptionId: userUpdate.stripeSubscriptionId === undefined ? undefined : userUpdate.stripeSubscriptionId || null,
      subscriptionTier: userUpdate.subscriptionTier === undefined ? undefined : userUpdate.subscriptionTier || null,
      subscriptionStatus: userUpdate.subscriptionStatus === undefined ? undefined : userUpdate.subscriptionStatus || null,
      subscriptionCurrentPeriodEnd: userUpdate.subscriptionCurrentPeriodEnd === undefined ? undefined : userUpdate.subscriptionCurrentPeriodEnd || null,
      shopId: userUpdate.shopId === undefined ? undefined : userUpdate.shopId || null
    };
    
    const [updatedUser] = await db.update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
      
    return updatedUser;
  }
  
  async updateUserStripeInfo(userId: number, stripeInfo: { stripeCustomerId: string, stripeSubscriptionId: string }): Promise<User | undefined> {
    const [updatedUser] = await db.update(users)
      .set({
        stripeCustomerId: stripeInfo.stripeCustomerId || null,
        stripeSubscriptionId: stripeInfo.stripeSubscriptionId || null
      })
      .where(eq(users.id, userId))
      .returning();
      
    return updatedUser;
  }
  
  async updateSubscriptionStatus(userId: number, status: string, currentPeriodEnd?: Date): Promise<User | undefined> {
    const updateData: any = {
      subscriptionStatus: status || null
    };
    
    if (currentPeriodEnd) {
      updateData.subscriptionCurrentPeriodEnd = currentPeriodEnd;
    }
    
    const [updatedUser] = await db.update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning();
      
    return updatedUser;
  }
  
  async updateSubscriptionTier(userId: number, tier: string): Promise<User | undefined> {
    const [updatedUser] = await db.update(users)
      .set({
        subscriptionTier: tier || null
      })
      .where(eq(users.id, userId))
      .returning();
      
    return updatedUser;
  }
  
  // Ticket methods
  async getAllTickets(): Promise<Ticket[]> {
    return await db.select().from(tickets).orderBy(desc(tickets.createdAt));
  }
  
  async getTicket(id: number): Promise<Ticket | undefined> {
    const [ticket] = await db.select().from(tickets).where(eq(tickets.id, id));
    return ticket;
  }
  
  async createTicket(insertTicket: InsertTicket): Promise<Ticket> {
    // Ensure status is defined
    const status = insertTicket.status || "RECEIVED";
    
    // Initialize status history with proper typing
    const statusHistory: Array<{status: string, timestamp: string, note?: string}> = [{
      status,
      timestamp: new Date().toISOString(),
      note: "Ticket created"
    }];
    
    // Insert the ticket with properly specified fields
    const [ticket] = await db.insert(tickets)
      .values({
        ...insertTicket,
        status, // Ensure status is defined
        statusHistory
      })
      .returning();
    
    // Update client's ticket count
    await db.update(clients)
      .set({
        ticketCount: sql`${clients.ticketCount} + 1`
      })
      .where(eq(clients.id, insertTicket.clientId));
    
    return ticket;
  }
  
  async updateTicket(id: number, ticketUpdate: Partial<InsertTicket>): Promise<Ticket | undefined> {
    const [existingTicket] = await db.select().from(tickets).where(eq(tickets.id, id));
    if (!existingTicket) {
      return undefined;
    }
    
    // If status is updated, add to history
    const statusHistory: Array<{status: string, timestamp: string, note?: string}> = 
      existingTicket.statusHistory ? [...existingTicket.statusHistory] : [];
    
    if (ticketUpdate.status && ticketUpdate.status !== existingTicket.status) {
      statusHistory.push({
        status: ticketUpdate.status,
        timestamp: new Date().toISOString(), 
        note: `Status changed from ${existingTicket.status} to ${ticketUpdate.status}`
      });
    }
    
    // Update the ticket
    const [updatedTicket] = await db.update(tickets)
      .set({
        ...ticketUpdate,
        updatedAt: new Date(),
        statusHistory
      })
      .where(eq(tickets.id, id))
      .returning();
    
    return updatedTicket;
  }
  
  async deleteTicket(id: number): Promise<boolean> {
    const result = await db.delete(tickets).where(eq(tickets.id, id));
    return !!result;
  }
  
  async countActiveTickets(): Promise<number> {
    const [result] = await db.select({
      count: count()
    })
    .from(tickets)
    .where(ne(tickets.status, "COMPLETED"));
    
    return result?.count || 0;
  }
  
  async countUrgentTickets(): Promise<number> {
    const [result] = await db.select({
      count: count()
    })
    .from(tickets)
    .where(and(
      eq(tickets.priority, "urgent"),
      ne(tickets.status, "COMPLETED")
    ));
    
    return result?.count || 0;
  }
  
  // Ticket comments methods
  async getTicketComments(ticketId: number): Promise<TicketComment[]> {
    return await db.select()
      .from(ticketComments)
      .where(eq(ticketComments.ticketId, ticketId))
      .orderBy(ticketComments.createdAt);
  }
  
  async createTicketComment(comment: InsertTicketComment): Promise<TicketComment> {
    const [newComment] = await db.insert(ticketComments)
      .values(comment)
      .returning();
    
    return newComment;
  }
  
  // Client methods
  async getAllClients(): Promise<Client[]> {
    return await db.select().from(clients).orderBy(clients.name);
  }
  
  async getClient(id: number): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    return client;
  }
  
  async createClient(insertClient: InsertClient): Promise<Client> {
    // Ensure optional fields are properly handled with null values instead of undefined
    const clientData = {
      ...insertClient,
      company: insertClient.company || null,
      address: insertClient.address || null,
      city: insertClient.city || null,
      state: insertClient.state || null,
      zipCode: insertClient.zipCode || null,
      smsNotifications: insertClient.smsNotifications !== undefined ? insertClient.smsNotifications : false,
      whatsappNotifications: insertClient.whatsappNotifications !== undefined ? insertClient.whatsappNotifications : false,
      emailNotifications: insertClient.emailNotifications !== undefined ? insertClient.emailNotifications : true
    };
    
    const [client] = await db.insert(clients)
      .values(clientData)
      .returning();
    
    return client;
  }
  
  async updateClient(id: number, clientUpdate: Partial<InsertClient>): Promise<Client | undefined> {
    const [updatedClient] = await db.update(clients)
      .set({
        ...clientUpdate,
        updatedAt: new Date()
      })
      .where(eq(clients.id, id))
      .returning();
    
    return updatedClient;
  }
  
  async deleteClient(id: number): Promise<boolean> {
    const result = await db.delete(clients).where(eq(clients.id, id));
    return !!result;
  }
  
  // Invoice methods
  async getAllInvoices(): Promise<Invoice[]> {
    return await db.select().from(invoices).orderBy(desc(invoices.date));
  }
  
  async getInvoice(id: number): Promise<Invoice | undefined> {
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id));
    return invoice;
  }
  
  async createInvoice(insertInvoice: InsertInvoice): Promise<Invoice> {
    // Ensure proper handling of nullable fields
    const invoiceData = {
      ...insertInvoice,
      date: insertInvoice.date || new Date(),
      status: insertInvoice.status || "PENDING",
      total: insertInvoice.total || 0,
      tax: insertInvoice.tax || 0,
      subTotal: insertInvoice.subTotal || 0,
      items: Array.isArray(insertInvoice.items) ? insertInvoice.items : [], 
      notes: insertInvoice.notes || null
    };
    
    const [invoice] = await db.insert(invoices)
      .values(invoiceData)
      .returning();
    
    return invoice;
  }
  
  async updateInvoice(id: number, invoiceUpdate: Partial<InsertInvoice>): Promise<Invoice | undefined> {
    const [updatedInvoice] = await db.update(invoices)
      .set({
        ...invoiceUpdate,
        updatedAt: new Date()
      })
      .where(eq(invoices.id, id))
      .returning();
    
    return updatedInvoice;
  }
  
  async deleteInvoice(id: number): Promise<boolean> {
    const result = await db.delete(invoices).where(eq(invoices.id, id));
    return !!result;
  }
  
  // Payment methods
  async getAllPayments(): Promise<Payment[]> {
    return await db.select().from(payments).orderBy(desc(payments.date));
  }
  
  async getPayment(id: number): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.id, id));
    return payment;
  }
  
  async createPayment(insertPayment: InsertPayment): Promise<Payment> {
    // Ensure proper handling of nullable fields
    const paymentData = {
      ...insertPayment,
      date: insertPayment.date || new Date(),
      status: insertPayment.status || "PAID",
      reference: insertPayment.reference || null,
      description: insertPayment.description || null
    };
    
    const [payment] = await db.insert(payments)
      .values(paymentData)
      .returning();
    
    // Update invoice status if payment is created
    if (paymentData.status === "PAID") {
      await db.update(invoices)
        .set({ status: "PAID" })
        .where(eq(invoices.id, paymentData.invoiceId));
    }
    
    return payment;
  }
  
  async getMonthlyRevenue(): Promise<number> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const [result] = await db.select({
      sum: sql<number>`SUM(${payments.amount})`
    })
    .from(payments)
    .where(gte(payments.date, startOfMonth));
    
    return result?.sum || 0;
  }
  
  // Notification methods
  async getNotifications(userId: number | undefined): Promise<Notification[]> {
    return await db.select()
      .from(notifications)
      .where(userId ? eq(notifications.userId, userId) : sql`TRUE`)
      .orderBy(desc(notifications.createdAt));
  }
  
  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    // Ensure nullable fields are properly handled
    const notificationData = {
      ...insertNotification,
      resourceId: insertNotification.resourceId || null,
      resourceType: insertNotification.resourceType || null,
      isRead: insertNotification.isRead !== undefined ? insertNotification.isRead : false,
      actionLabel: insertNotification.actionLabel || null,
      actionUrl: insertNotification.actionUrl || null
    };
    
    const [notification] = await db.insert(notifications)
      .values(notificationData)
      .returning();
    
    return notification;
  }
  
  async markAllNotificationsAsRead(userId: number | undefined): Promise<void> {
    await db.update(notifications)
      .set({ isRead: true })
      .where(userId ? eq(notifications.userId, userId) : sql`TRUE`);
  }
  
  // Notification template methods
  async getActiveTemplatesByType(type: string, channel: string): Promise<NotificationTemplate[]> {
    return await db.select()
      .from(notificationTemplates)
      .where(and(
        eq(notificationTemplates.type, type as any),
        eq(notificationTemplates.channel, channel as any),
        eq(notificationTemplates.isActive, true)
      ));
  }
  
  async createNotificationTemplate(template: InsertNotificationTemplate): Promise<NotificationTemplate> {
    // Ensure nullable fields are properly handled
    const templateData = {
      ...template,
      isActive: template.isActive !== undefined ? template.isActive : true,
    };
    
    const [notificationTemplate] = await db.insert(notificationTemplates)
      .values(templateData)
      .returning();
    
    return notificationTemplate;
  }
  
  async updateNotificationTemplate(id: number, templateUpdate: Partial<InsertNotificationTemplate>): Promise<NotificationTemplate | undefined> {
    const [updatedTemplate] = await db.update(notificationTemplates)
      .set({
        ...templateUpdate,
        updatedAt: new Date()
      })
      .where(eq(notificationTemplates.id, id))
      .returning();
    
    return updatedTemplate;
  }
  
  async deleteNotificationTemplate(id: number): Promise<boolean> {
    const result = await db.delete(notificationTemplates)
      .where(eq(notificationTemplates.id, id));
    
    return !!result;
  }
  
  // Analytics methods
  async getAvgResolutionTime(): Promise<string> {
    // Calculate average time between ticket creation and completion
    const completedTickets = await db.select({
      createdAt: tickets.createdAt,
      updatedAt: tickets.updatedAt
    })
    .from(tickets)
    .where(eq(tickets.status, "COMPLETED"));
    
    if (completedTickets.length === 0) {
      return "N/A";
    }
    
    let totalHours = 0;
    for (const ticket of completedTickets) {
      const createdTime = new Date(ticket.createdAt || new Date()).getTime();
      const completedTime = new Date(ticket.updatedAt || new Date()).getTime();
      const hours = (completedTime - createdTime) / (1000 * 60 * 60);
      totalHours += hours;
    }
    
    const avgHours = Math.round(totalHours / completedTickets.length);
    const days = Math.floor(avgHours / 24);
    const remainingHours = Math.round(avgHours % 24);
    
    return days > 0 
      ? `${days} ${days === 1 ? 'day' : 'days'} ${remainingHours} ${remainingHours === 1 ? 'hour' : 'hours'}`
      : `${remainingHours} ${remainingHours === 1 ? 'hour' : 'hours'}`;
  }
  
  // Company branding methods
  async getCompanyBranding(userId: number): Promise<CompanyBranding | undefined> {
    const [branding] = await db.select()
      .from(companyBranding)
      .where(eq(companyBranding.userId, userId));
    
    return branding;
  }

  async createCompanyBranding(branding: InsertCompanyBranding): Promise<CompanyBranding> {
    // Ensure nullable fields are properly handled
    const brandingData = {
      ...branding,
      companyLogo: branding.companyLogo || null,
      address: branding.address || null,
      city: branding.city || null,
      state: branding.state || null,
      zipCode: branding.zipCode || null,
      phone: branding.phone || null,
      email: branding.email || null,
      website: branding.website || null
    };
    
    const [newBranding] = await db.insert(companyBranding)
      .values(brandingData)
      .returning();
    
    return newBranding;
  }

  async updateCompanyBranding(id: number, brandingUpdate: Partial<InsertCompanyBranding>): Promise<CompanyBranding | undefined> {
    // Handle nullable fields properly
    const brandingData: any = {
      ...brandingUpdate,
      updatedAt: new Date()
    };
    
    // Ensure nullable fields are not set to undefined
    if ('companyLogo' in brandingUpdate) brandingData.companyLogo = brandingUpdate.companyLogo || null;
    if ('address' in brandingUpdate) brandingData.address = brandingUpdate.address || null;
    if ('city' in brandingUpdate) brandingData.city = brandingUpdate.city || null;
    if ('state' in brandingUpdate) brandingData.state = brandingUpdate.state || null;
    if ('zipCode' in brandingUpdate) brandingData.zipCode = brandingUpdate.zipCode || null;
    if ('phone' in brandingUpdate) brandingData.phone = brandingUpdate.phone || null;
    if ('email' in brandingUpdate) brandingData.email = brandingUpdate.email || null;
    if ('website' in brandingUpdate) brandingData.website = brandingUpdate.website || null;
    
    const [updatedBranding] = await db.update(companyBranding)
      .set(brandingData)
      .where(eq(companyBranding.id, id))
      .returning();
    
    return updatedBranding;
  }

  // Invoice template methods
  async getInvoiceTemplates(userId: number): Promise<InvoiceTemplate[]> {
    return await db.select()
      .from(invoiceTemplates)
      .where(eq(invoiceTemplates.userId, userId))
      .orderBy(invoiceTemplates.name);
  }

  async getInvoiceTemplate(id: number): Promise<InvoiceTemplate | undefined> {
    const [template] = await db.select()
      .from(invoiceTemplates)
      .where(eq(invoiceTemplates.id, id));
    
    return template;
  }

  async createInvoiceTemplate(template: InsertInvoiceTemplate): Promise<InvoiceTemplate> {
    // Ensure nullable fields are properly handled
    const templateData = {
      ...template,
      type: template.type || "DEFAULT",
      headerHtml: template.headerHtml || null,
      footerHtml: template.footerHtml || null,
      itemsTableHtml: template.itemsTableHtml || null,
      css: template.css || null,
      isDefault: template.isDefault !== undefined ? template.isDefault : false
    };
    
    const [newTemplate] = await db.insert(invoiceTemplates)
      .values(templateData)
      .returning();
    
    return newTemplate;
  }

  async updateInvoiceTemplate(id: number, templateUpdate: Partial<InsertInvoiceTemplate>): Promise<InvoiceTemplate | undefined> {
    // Handle nullable fields properly
    const templateData: any = {
      ...templateUpdate,
      updatedAt: new Date()
    };
    
    // Ensure nullable fields are not set to undefined
    if ('headerHtml' in templateUpdate) templateData.headerHtml = templateUpdate.headerHtml || null;
    if ('footerHtml' in templateUpdate) templateData.footerHtml = templateUpdate.footerHtml || null;
    if ('itemsTableHtml' in templateUpdate) templateData.itemsTableHtml = templateUpdate.itemsTableHtml || null;
    if ('css' in templateUpdate) templateData.css = templateUpdate.css || null;
    
    const [updatedTemplate] = await db.update(invoiceTemplates)
      .set(templateData)
      .where(eq(invoiceTemplates.id, id))
      .returning();
    
    return updatedTemplate;
  }

  async deleteInvoiceTemplate(id: number): Promise<boolean> {
    const result = await db.delete(invoiceTemplates)
      .where(eq(invoiceTemplates.id, id));
    
    return !!result;
  }


}

// Use the DatabaseStorage implementation instead of MemStorage
export const storage = new DatabaseStorage();
