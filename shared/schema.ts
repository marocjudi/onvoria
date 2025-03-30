import { pgTable, text, serial, integer, boolean, timestamp, json, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User role enum
export const UserRoleEnum = pgEnum("user_role", ["ADMIN", "SHOP_OWNER", "TECHNICIAN", "RECEPTIONIST", "CUSTOMER"]);

// Subscription tier enum
export const SubscriptionTierEnum = pgEnum("subscription_tier", ["NONE", "BASIC", "PROFESSIONAL", "ENTERPRISE"]);

// Subscription status enum
export const SubscriptionStatusEnum = pgEnum("subscription_status", ["ACTIVE", "PAST_DUE", "UNPAID", "CANCELED", "INCOMPLETE", "INCOMPLETE_EXPIRED", "TRIALING"]);

// Invoice template type enum
export const InvoiceTemplateTypeEnum = pgEnum("invoice_template_type", ["DEFAULT", "MODERN", "PROFESSIONAL", "MINIMAL", "CUSTOM"]);

// Users schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  phone: text("phone"),
  role: UserRoleEnum("role").default("TECHNICIAN"),
  isAdmin: boolean("is_admin").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  // Subscription related fields
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  subscriptionTier: SubscriptionTierEnum("subscription_tier").default("NONE"),
  subscriptionStatus: SubscriptionStatusEnum("subscription_status"),
  subscriptionCurrentPeriodEnd: timestamp("subscription_current_period_end"),
  shopId: integer("shop_id"), // For linking technicians to a shop/store
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  firstName: true,
  lastName: true,
  phone: true,
  role: true,
  isAdmin: true,
  stripeCustomerId: true,
  stripeSubscriptionId: true,
  subscriptionTier: true,
  subscriptionStatus: true,
  subscriptionCurrentPeriodEnd: true,
  shopId: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Ticket status enum
export const TicketStatusEnum = pgEnum("ticket_status", [
  "RECEIVED",
  "DIAGNOSED",
  "IN_PROGRESS", 
  "COMPLETED", 
  "READY"
]);

export type TicketStatus = 'RECEIVED' | 'DIAGNOSED' | 'IN_PROGRESS' | 'COMPLETED' | 'READY';

// Tickets schema
export const tickets = pgTable("tickets", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull(),
  clientName: text("client_name").notNull(),
  deviceType: text("device_type").notNull(),
  deviceModel: text("device_model").notNull(),
  issueType: text("issue_type").notNull(),
  issueDescription: text("issue_description").notNull(),
  priority: text("priority").notNull(),
  status: TicketStatusEnum("status").notNull().default("RECEIVED"),
  dueDate: timestamp("due_date").notNull(),
  technicianId: integer("technician_id"),
  marketingRating: integer("marketing_rating").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  statusHistory: json("status_history").$type<Array<{status: string, timestamp: string, note?: string}>>().default([]),
  attachments: json("attachments").$type<Array<{name: string, url: string, type: string}>>().default([]),
});

export const insertTicketSchema = createInsertSchema(tickets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  statusHistory: true,
  attachments: true,
});

export type InsertTicket = z.infer<typeof insertTicketSchema>;
export type Ticket = typeof tickets.$inferSelect;

// Clients schema
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  company: text("company"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  ticketCount: integer("ticket_count").default(0),
  // Notification preferences
  smsNotifications: boolean("sms_notifications").default(false),
  whatsappNotifications: boolean("whatsapp_notifications").default(false),
  emailNotifications: boolean("email_notifications").default(true),
});

export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  ticketCount: true,
});

export type InsertClient = z.infer<typeof insertClientSchema>;
export type Client = typeof clients.$inferSelect;

// Payment status enum
export const PaymentStatusEnum = pgEnum("payment_status", ["PENDING", "PAID", "REFUNDED", "CANCELLED"]);

// Invoices schema
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  invoiceNumber: text("invoice_number").notNull().unique(),
  clientId: integer("client_id").notNull(),
  clientName: text("client_name").notNull(),
  ticketId: integer("ticket_id").notNull(),
  items: json("items").$type<Array<{description: string, quantity: number, unitPrice: number, total: number}>>().notNull(),
  subTotal: integer("sub_total").notNull(),
  tax: integer("tax").notNull(),
  total: integer("total").notNull(),
  notes: text("notes"),
  status: PaymentStatusEnum("status").notNull().default("PENDING"),
  date: timestamp("date").defaultNow(),
  dueDate: timestamp("due_date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoices.$inferSelect;

// Payments schema
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id").notNull(),
  invoiceNumber: text("invoice_number").notNull(),
  clientId: integer("client_id").notNull(),
  clientName: text("client_name").notNull(),
  amount: integer("amount").notNull(),
  method: text("method").notNull(),
  reference: text("reference"),
  status: PaymentStatusEnum("status").notNull().default("PAID"),
  date: timestamp("date").defaultNow(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
});

export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;

// Notification types enum
export const NotificationTypeEnum = pgEnum("notification_type", [
  "NEW_TICKET",
  "STATUS_UPDATE",
  "PAYMENT",
  "INVOICE",
  "INFO"
]);

// Notifications schema
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: NotificationTypeEnum("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  resourceId: integer("resource_id"),
  resourceType: text("resource_type"),
  isRead: boolean("is_read").default(false),
  actionLabel: text("action_label"),
  actionUrl: text("action_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

// Ticket comments schema
export const ticketComments = pgTable("ticket_comments", {
  id: serial("id").primaryKey(),
  ticketId: integer("ticket_id").notNull(),
  userId: integer("user_id").notNull(),
  username: text("username").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTicketCommentSchema = createInsertSchema(ticketComments).omit({
  id: true,
  createdAt: true,
});

export type InsertTicketComment = z.infer<typeof insertTicketCommentSchema>;
export type TicketComment = typeof ticketComments.$inferSelect;

// Notification channels enum
export const NotificationChannelEnum = pgEnum("notification_channel", ["SMS", "EMAIL", "WHATSAPP", "APP"]);

// Notification templates schema
export const notificationTemplates = pgTable("notification_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: NotificationTypeEnum("type").notNull(),
  channel: NotificationChannelEnum("channel").notNull(),
  subject: text("subject").notNull(),
  template: text("template").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertNotificationTemplateSchema = createInsertSchema(notificationTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertNotificationTemplate = z.infer<typeof insertNotificationTemplateSchema>;
export type NotificationTemplate = typeof notificationTemplates.$inferSelect;

// Company branding schema
export const companyBranding = pgTable("company_branding", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  companyName: text("company_name").notNull(),
  companyLogo: text("company_logo"),
  primaryColor: text("primary_color").default("#3b82f6"),
  accentColor: text("accent_color").default("#f59e0b"),
  fontFamily: text("font_family").default("Inter, sans-serif"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  phone: text("phone"),
  email: text("email"),
  website: text("website"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const insertCompanyBrandingSchema = createInsertSchema(companyBranding).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export type InsertCompanyBranding = z.infer<typeof insertCompanyBrandingSchema>;
export type CompanyBranding = typeof companyBranding.$inferSelect;

// Invoice template schema
export const invoiceTemplates = pgTable("invoice_templates", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  type: InvoiceTemplateTypeEnum("type").notNull().default("DEFAULT"),
  headerHtml: text("header_html"),
  footerHtml: text("footer_html"),
  itemsTableHtml: text("items_table_html"),
  css: text("css"),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const insertInvoiceTemplateSchema = createInsertSchema(invoiceTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export type InsertInvoiceTemplate = z.infer<typeof insertInvoiceTemplateSchema>;
export type InvoiceTemplate = typeof invoiceTemplates.$inferSelect;
