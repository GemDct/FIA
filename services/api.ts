
import { Invoice, InvoiceStatus, User, PasswordResetToken, CompanySettings, Client, Service, RecurringInvoice, UserSubscription, UserUsage, SubscriptionPlan, PlanId } from '../types';
import { renderInvoiceToHtml } from './pdfService';
import { recurringInvoiceService } from './recurringInvoiceService';
import { billingService } from './billingService';
import { MOCK_USER, DEFAULT_SETTINGS, INITIAL_CLIENTS, INITIAL_SERVICES, INITIAL_RECURRING_INVOICES, MOCK_USER_SUBSCRIPTION, MOCK_USER_USAGE, AVAILABLE_PLANS } from '../constants';

// In-memory store
let mockResetTokens: PasswordResetToken[] = [];
let mockServices: Service[] = [...INITIAL_SERVICES];
let mockRecurringInvoices: RecurringInvoice[] = [...INITIAL_RECURRING_INVOICES];
let mockUserSubscription: UserSubscription = { ...MOCK_USER_SUBSCRIPTION };
let mockUserUsage: UserUsage = { ...MOCK_USER_USAGE };

/**
 * Placeholder for backend API calls.
 */
export const api = {
  auth: {
    login: async (email: string, password: string) => {
      await new Promise(resolve => setTimeout(resolve, 800));
      if (email && password) return { token: 'mock-jwt-token', user: { ...MOCK_USER, email }};
      throw new Error('Invalid credentials');
    },
    
    register: async (email: string, password: string, name: string) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { token: 'mock-jwt-token', user: { id: `u-${Date.now()}`, email, name }};
    },

    forgotPassword: async (email: string) => {
      await new Promise(resolve => setTimeout(resolve, 800));
      const tokenString = Math.random().toString(36).substr(2, 12);
      const resetToken: PasswordResetToken = {
        id: `t-${Date.now()}`,
        userId: 'u1', 
        token: tokenString,
        expiresAt: new Date(Date.now() + 3600000), 
      };
      mockResetTokens.push(resetToken);

      console.log(`[EMAIL SERVICE] To: ${email} | Subject: Reset Password`);
      console.log(`[EMAIL SERVICE] Link: ${window.location.origin}?token=${tokenString}`);
      
      return { success: true };
    },

    resetPassword: async (token: string, newPassword: string) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const foundTokenIdx = mockResetTokens.findIndex(t => t.token === token && t.expiresAt > new Date() && !t.usedAt);
      
      if (foundTokenIdx === -1) {
        throw new Error("Ce lien est invalide ou expiré.");
      }

      mockResetTokens[foundTokenIdx].usedAt = new Date();
      console.log(`[DB] Password updated for user ${mockResetTokens[foundTokenIdx].userId} to ${newPassword}`);

      return { success: true };
    }
  },

  email: {
    sendInvoice: async (invoice: Invoice, email: string) => {
      console.log(`[MOCK API] Sending invoice ${invoice.number} to ${email}...`);
      await new Promise(resolve => setTimeout(resolve, 1500));
      return { success: true, message: 'Email queued for delivery' };
    }
  },

  pdf: {
    generateUrl: async (invoice: Invoice, companySettings: CompanySettings) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      const client = INITIAL_CLIENTS.find(c => c.id === invoice.clientId) || INITIAL_CLIENTS[0];
      const html = renderInvoiceToHtml({ invoice, company: companySettings, client });
      const blob = new Blob([html], { type: 'text/html' });
      return URL.createObjectURL(blob);
    },

    htmlToPdfBuffer: async (html: string): Promise<ArrayBuffer> => {
       throw new Error("Not implemented in browser-only mock.");
    }
  },

  // Billing & Subscription (SaaS)
  billing: {
    convertQuoteToInvoice: (quote: Invoice): Invoice => {
      const newInvoice: Invoice = {
        ...quote,
        id: `inv-${Date.now()}`,
        type: 'INVOICE',
        number: quote.number.replace('DEV', 'INV').replace('Q', 'INV'),
        date: new Date().toISOString().split('T')[0],
        status: InvoiceStatus.DRAFT,
        convertedFromQuoteId: quote.id
      };
      return newInvoice;
    },

    listPlans: async (): Promise<SubscriptionPlan[]> => {
      await new Promise(r => setTimeout(r, 200));
      return AVAILABLE_PLANS;
    },

    getUserBillingInfo: async (userId: string) => {
       await new Promise(r => setTimeout(r, 400));
       return {
         subscription: mockUserSubscription,
         usage: mockUserUsage,
         plan: billingService.getPlanById(mockUserSubscription.planId) || AVAILABLE_PLANS[0]
       };
    },

    startPlanCheckoutSession: async (userId: string, planId: PlanId) => {
      await new Promise(r => setTimeout(r, 1000));
      console.log(`[PAYMENT MOCK] Starting checkout for plan ${planId}...`);
      
      // Update mock state immediately for demo purposes
      mockUserSubscription = {
        ...mockUserSubscription,
        planId: planId,
        updatedAt: new Date().toISOString()
      };
      
      return { checkoutUrl: 'https://checkout.stripe.com/test-url', success: true };
    },

    cancelSubscription: async (userId: string) => {
      await new Promise(r => setTimeout(r, 800));
      console.log(`[PAYMENT MOCK] Canceling subscription at period end...`);
      mockUserSubscription.cancelAtPeriodEnd = true;
      return { success: true };
    }
  },

  // Mock Service CRUD
  services: {
    list: async () => {
      return [...mockServices];
    },
    create: async (service: Service) => {
      mockServices.push(service);
      return service;
    },
    update: async (service: Service) => {
      mockServices = mockServices.map(s => s.id === service.id ? service : s);
      return service;
    },
    delete: async (id: string) => {
      mockServices = mockServices.filter(s => s.id !== id);
      return true;
    }
  },

  // Recurring Invoices Logic
  recurringInvoices: {
    list: async () => {
      return [...mockRecurringInvoices];
    },
    create: async (rec: RecurringInvoice) => {
      // Logic handled in service, simplified here for mock store
      const newRec: RecurringInvoice = await recurringInvoiceService.create('u1', rec);
      mockRecurringInvoices.push(newRec);
      
      // Update Usage Mock
      mockUserUsage.recurringInvoicesCreatedTotal += 1;
      
      return newRec;
    },
    update: async (rec: RecurringInvoice) => {
      mockRecurringInvoices = mockRecurringInvoices.map(r => r.id === rec.id ? rec : r);
      return rec;
    },
    toggleActive: async (id: string) => {
      const rec = mockRecurringInvoices.find(r => r.id === id);
      if (rec) {
        rec.isActive = !rec.isActive;
        return rec;
      }
      throw new Error("Not found");
    },
    delete: async (id: string) => {
      mockRecurringInvoices = mockRecurringInvoices.filter(r => r.id !== id);
      return true;
    },
    
    // Calls the service logic
    processDue: async (settings: CompanySettings): Promise<{ generatedInvoices: Invoice[], updatedRecurringInvoices: RecurringInvoice[] }> => {
      const { generatedInvoices, updatedRecurringInvoices } = recurringInvoiceService.generateDueInvoicesForDate({
        date: new Date(),
        recurringInvoices: mockRecurringInvoices,
        settings
      });

      // Update local store with new dates
      const updatedMap = new Map(updatedRecurringInvoices.map(r => [r.id, r]));
      mockRecurringInvoices = mockRecurringInvoices.map(r => updatedMap.get(r.id) || r);

      // Update Usage Mock (Invoices created)
      mockUserUsage.invoicesCreatedCurrentMonth += generatedInvoices.length;

      return { generatedInvoices, updatedRecurringInvoices: mockRecurringInvoices };
    }
  }
};
