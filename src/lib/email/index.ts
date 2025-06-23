// Main email system exports
export * from "./types";
export * from "./service";
export * from "./providers/resend";
export * from "./providers/nodemailer";
export { getEmailTemplate } from "./templates";

// Re-export the email service helpers for easy use
export { emailService, createEmailService } from "./service";
