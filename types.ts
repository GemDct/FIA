
export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
}

export type DocumentType = 'INVOICE' | 'QUOTE';

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

export interface PasswordResetToken {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  usedAt?: Date | null;
}

export interface CompanySettings {
  name: string;
  address: string;
  email: string;
  phone: string;
  siret: string;
  vatNumber?: string;
  isVatSubject: boolean;
  logoUrl?: string;
  paymentRib?: string;
  paymentTerms?: string;
  primaryColor: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  address: string;
  siret?: string;
  notes?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  defaultPrice: number;
  vatRate: number;
  unit: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  unitPrice: number;
  vatRate: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  price: number;
  vatRate: number;
  productId?: string;
  serviceId?: string;
}

export interface Invoice {
  id: string;
  type: DocumentType;
  number: string;
  date: string;
  dueDate?: string;
  clientId: string;
  items: InvoiceItem[];
  status: InvoiceStatus;
  notes?: string;
  subtotal: number;
  taxAmount: number;
  total: number;
  convertedFromQuoteId?: string;
  sourceRecurringInvoiceId?: string; // Link to the parent recurring definition
}

export interface RecurringInvoice {
  id: string;
  clientId: string;
  label: string; // Internal name (e.g., "Hosting Plan")
  items: InvoiceItem[];
  frequency: 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  startDate: string; // ISO Date YYYY-MM-DD
  endDate?: string; // ISO Date YYYY-MM-DD
  nextRunDate: string; // ISO Date YYYY-MM-DD
  lastRunDate?: string; // ISO Date YYYY-MM-DD
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Input type for creation/updates (omits system fields)
export interface RecurringInvoiceInput {
  clientId: string;
  label: string;
  items: InvoiceItem[];
  frequency: 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  startDate: string;
  endDate?: string;
  isActive: boolean;
}

// --- SaaS Billing Interfaces ---

export type PlanId = "free" | "pro" | "business";
export type SubscriptionStatus = "NONE" | "TRIAL" | "ACTIVE" | "PAST_DUE" | "CANCELED";

export interface SubscriptionPlan {
  id: PlanId;
  name: string;
  pricePerMonthCents: number;
  currency: string;
  description: string;
  features: string[];
  limits: {
    maxClients?: number; // undefined = unlimited
    maxInvoicesPerMonth?: number;
    maxRecurringInvoices?: number;
    aiAssistantIncluded: boolean;
    prioritySupport: boolean;
  };
}

export interface UserSubscription {
  userId: string;
  planId: PlanId;
  status: SubscriptionStatus;
  currentPeriodStart: string; // ISO
  currentPeriodEnd: string;   // ISO
  cancelAtPeriodEnd: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserUsage {
  userId: string;
  periodStart: string;
  periodEnd: string;
  invoicesCreatedCurrentMonth: number;
  clientsCreatedTotal: number;
  recurringInvoicesCreatedTotal: number;
}

export type ViewState = 
  | 'AUTH'
  | 'FORGOT_PASSWORD'
  | 'RESET_PASSWORD'
  | 'DASHBOARD' 
  | 'INVOICES' 
  | 'QUOTES' 
  | 'PRODUCTS' 
  | 'SERVICES'
  | 'CLIENTS' 
  | 'RECURRING_INVOICES' 
  | 'CREATE_RECURRING'
  | 'EDIT_RECURRING'
  | 'CREATE_INVOICE' 
  | 'EDIT_INVOICE' 
  | 'CREATE_QUOTE'
  | 'EDIT_QUOTE'
  | 'SETTINGS'
  | 'PRICING'
  | 'ACCOUNT_SUBSCRIPTION'
  | 'AI_ASSISTANT'; // New

export interface AIInvoiceResponse {
  clientName: string;
  items: { description: string; quantity: number; price: number }[];
  dueDate?: string;
}
