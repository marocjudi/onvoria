import { users, User, InsertUser, tickets, Ticket, InsertTicket, clients, Client, InsertClient, invoices, Invoice, InsertInvoice, payments, Payment, InsertPayment, notifications, Notification, InsertNotification } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

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

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private tickets: Map<number, Ticket>;
  private clients: Map<number, Client>;
  private invoices: Map<number, Invoice>;
  private payments: Map<number, Payment>;
  private notifications: Map<number, Notification>;
  public sessionStore: session.Store;
  
  private userIdCounter: number;
  private ticketIdCounter: number;
  private clientIdCounter: number;
  private invoiceIdCounter: number;
  private paymentIdCounter: number;
  private notificationIdCounter: number;

  constructor() {
    this.users = new Map();
    this.tickets = new Map();
    this.clients = new Map();
    this.invoices = new Map();
    this.payments = new Map();
    this.notifications = new Map();
    
    this.userIdCounter = 1;
    this.ticketIdCounter = 1;
    this.clientIdCounter = 1;
    this.invoiceIdCounter = 1;
    this.paymentIdCounter = 1;
    this.notificationIdCounter = 1;
    
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
}

export const storage = new MemStorage();
