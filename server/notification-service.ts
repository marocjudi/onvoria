import { Notification, NotificationTemplate, NotificationChannelEnum } from "@shared/schema";
import { storage } from "./storage";
import schedule from "node-schedule";

interface NotificationJob {
  id: string;
  schedule: schedule.Job;
}

class NotificationService {
  private jobs: Map<string, NotificationJob>;

  constructor() {
    this.jobs = new Map();
    this.initScheduler();
  }

  /**
   * Initialize the notification scheduler
   */
  private initScheduler() {
    console.log("Initializing notification scheduler...");
    // Load and schedule any pending notifications from the database
    this.checkPendingNotifications();
  }

  /**
   * Check for pending notifications that need to be scheduled
   */
  private async checkPendingNotifications() {
    // This would typically load notifications with scheduled delivery from a database
    // For now, it's a placeholder for future implementation
  }

  /**
   * Schedule a notification to be sent at a specific time
   */
  public scheduleNotification(
    userId: number,
    type: string,
    title: string,
    message: string,
    scheduledTime: Date,
    resourceId?: number,
    resourceType?: string
  ): string {
    const jobId = `notification-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // Schedule the job
    const job = schedule.scheduleJob(scheduledTime, async () => {
      await this.sendNotification(userId, type, title, message, resourceId, resourceType);
      this.jobs.delete(jobId);
    });
    
    this.jobs.set(jobId, { id: jobId, schedule: job });
    console.log(`Scheduled notification ${jobId} for ${scheduledTime}`);
    
    return jobId;
  }

  /**
   * Cancel a scheduled notification
   */
  public cancelScheduledNotification(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (job) {
      job.schedule.cancel();
      this.jobs.delete(jobId);
      console.log(`Cancelled notification ${jobId}`);
      return true;
    }
    return false;
  }

  /**
   * Send an immediate notification
   */
  public async sendNotification(
    userId: number,
    type: string,
    title: string,
    message: string,
    resourceId?: number,
    resourceType?: string,
    actionLabel?: string,
    actionUrl?: string
  ): Promise<Notification> {
    // Create in-app notification
    const notification = await storage.createNotification({
      userId,
      type: type as any,
      title,
      message,
      resourceId: resourceId || null,
      resourceType: resourceType || null,
      isRead: false,
      actionLabel: actionLabel || null,
      actionUrl: actionUrl || null,
    });

    console.log(`Sent notification to user ${userId}: ${title}`);
    return notification;
  }

  /**
   * Send a notification to a client based on their notification preferences
   */
  public async notifyClient(
    clientId: number,
    type: string,
    subject: string,
    message: string,
    resourceId?: number,
    resourceType?: string
  ): Promise<void> {
    try {
      // Get client details
      const client = await storage.getClient(clientId);
      if (!client) {
        console.error(`Client ${clientId} not found`);
        return;
      }

      // Check notification preferences and send accordingly
      if (client.emailNotifications) {
        await this.sendEmailNotification(client.email, subject, message);
      }

      if (client.smsNotifications) {
        // Check if we have Twilio credentials before attempting to send
        const hasSecrets = await this.checkTwilioSecrets();
        if (hasSecrets) {
          await this.sendSmsNotification(client.phone, message);
        } else {
          console.log("SMS notification skipped: Twilio credentials not configured");
        }
      }

      if (client.whatsappNotifications) {
        // Check if we have Twilio credentials before attempting to send
        const hasSecrets = await this.checkTwilioSecrets();
        if (hasSecrets) {
          await this.sendWhatsAppNotification(client.phone, message);
        } else {
          console.log("WhatsApp notification skipped: Twilio credentials not configured");
        }
      }

      console.log(`Notifications sent to client ${client.name}`);
    } catch (error) {
      console.error("Error sending client notification:", error);
    }
  }

  /**
   * Check if required Twilio secrets are available
   */
  private async checkTwilioSecrets(): Promise<boolean> {
    return (
      process.env.TWILIO_ACCOUNT_SID !== undefined &&
      process.env.TWILIO_AUTH_TOKEN !== undefined &&
      process.env.TWILIO_PHONE_NUMBER !== undefined
    );
  }

  /**
   * Send an email notification
   */
  private async sendEmailNotification(email: string, subject: string, message: string): Promise<void> {
    // This is a placeholder for integrating with an actual email service
    console.log(`[EMAIL] To: ${email}, Subject: ${subject}, Message: ${message}`);
  }

  /**
   * Send an SMS notification
   */
  private async sendSmsNotification(phoneNumber: string, message: string): Promise<void> {
    // Here we would integrate with Twilio SDK if credentials are available
    if (!this.checkTwilioSecrets()) {
      console.log("SMS not sent: Twilio credentials missing");
      return;
    }

    // This is a placeholder for Twilio SMS integration
    console.log(`[SMS] To: ${phoneNumber}, Message: ${message}`);
  }

  /**
   * Send a WhatsApp notification
   */
  private async sendWhatsAppNotification(phoneNumber: string, message: string): Promise<void> {
    // Here we would integrate with Twilio WhatsApp API if credentials are available
    if (!this.checkTwilioSecrets()) {
      console.log("WhatsApp not sent: Twilio credentials missing");
      return;
    }

    // This is a placeholder for Twilio WhatsApp integration
    console.log(`[WhatsApp] To: ${phoneNumber}, Message: ${message}`);
  }

  /**
   * Process a notification template
   */
  private processTemplate(template: string, data: Record<string, any>): string {
    // Replace template variables with actual data
    // Example: "Hello {{name}}" becomes "Hello John"
    return template.replace(/\{\{([^}]+)\}\}/g, (_, key) => {
      return data[key] || '';
    });
  }

  /**
   * Get a notification template and process it with provided data
   */
  public async getAndProcessTemplate(
    type: string,
    channel: string,
    data: Record<string, any>
  ): Promise<{ subject: string; message: string } | null> {
    try {
      // Get active templates for this type and channel
      const templates = await storage.getActiveTemplatesByType(type, channel);
      if (!templates || templates.length === 0) {
        console.warn(`No active template found for type ${type} and channel ${channel}`);
        return null;
      }

      // Use the first matching template
      const template = templates[0];
      
      return {
        subject: this.processTemplate(template.subject, data),
        message: this.processTemplate(template.template, data)
      };
    } catch (error) {
      console.error("Error processing notification template:", error);
      return null;
    }
  }
}

// Create a singleton instance
export const notificationService = new NotificationService();