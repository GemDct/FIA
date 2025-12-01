
import { Invoice, InvoiceStatus, User, PasswordResetToken, CompanySettings, Client, Service, RecurringInvoice, UserSubscription, UserUsage, SubscriptionPlan, PlanId } from '../types';
import { renderInvoiceToHtml } from './pdfService';
import { recurringInvoiceService } from './recurringInvoiceService';
import { billingService } from './billingService';
import { MOCK_USER, DEFAULT_SETTINGS, INITIAL_CLIENTS, INITIAL_SERVICES, INITIAL_RECURRING_INVOICES, MOCK_USER_SUBSCRIPTION, MOCK_USER_USAGE, AVAILABLE_PLANS } from '../constants';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://admin.codemotard.fr/api';

// Helper for Fetch
async function fetchJson(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: { ...headers, ...options.headers }
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `API Error: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Real API Implementation connected to PHP Backend
 */
export const api = {
  auth: {
    login: async (email: string, password: string) => {
       const data = await fetchJson(`/auth.php?action=login`, {
         method: 'POST',
         body: JSON.stringify({ email, password })
       });
       return data;
    },
    
    register: async (email: string, password: string, name: string) => {
       const data = await fetchJson(`/auth.php?action=register`, {
         method: 'POST',
         body: JSON.stringify({ email, password, name })
       });
       return data;
    },

    forgotPassword: async (email: string) => {
       const data = await fetchJson(`/auth.php?action=forgot_password`, {
         method: 'POST',
         body: JSON.stringify({ email })
       });
       return data;
    },

    resetPassword: async (token: string, newPassword: string) => {
       const data = await fetchJson(`/auth.php?action=reset_password`, {
         method: 'POST',
         body: JSON.stringify({ token, newPassword })
       });
       return data;
    }
  },

  email: {
    sendInvoice: async (invoice: Invoice, email: string) => {
       // TODO: Call PHP mail endpoint
      console.log(`Sending invoice ${invoice.number} to ${email}...`);
      return { success: true, message: 'Email queued for delivery' };
    }
  },

  pdf: {
    generateUrl: async (invoice: Invoice, companySettings: CompanySettings) => {
      // Fetch fresh client data to ensure PDF is accurate
      const client = await api.clients.get(invoice.clientId);
      const html = renderInvoiceToHtml({ invoice, company: companySettings, client: client || INITIAL_CLIENTS[0] });
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
      return AVAILABLE_PLANS;
    },

    getUserBillingInfo: async (userId: string) => {
       // TODO: Fetch from backend
       return {
         subscription: MOCK_USER_SUBSCRIPTION,
         usage: MOCK_USER_USAGE,
         plan: AVAILABLE_PLANS[0]
       };
    },

    startPlanCheckoutSession: async (userId: string, planId: PlanId) => {
      console.log(`[PAYMENT] Starting checkout for plan ${planId}...`);
      return { checkoutUrl: 'https://checkout.stripe.com/test-url', success: true };
    },

    cancelSubscription: async (userId: string) => {
      return { success: true };
    }
  },

  // Service CRUD
  services: {
    list: async () => {
      return fetchJson('/services.php');
    },
    create: async (service: Service) => {
      return fetchJson('/services.php', { method: 'POST', body: JSON.stringify(service) });
    },
    update: async (service: Service) => {
      return fetchJson('/services.php', { method: 'PUT', body: JSON.stringify(service) });
    },
    delete: async (id: string) => {
      return fetchJson(`/services.php?id=${id}`, { method: 'DELETE' });
    }
  },

  // Clients CRUD
  clients: {
      list: async () => {
          return fetchJson('/clients.php');
      },
      get: async (id: string) => {
          const all = await fetchJson('/clients.php');
          return all.find((c: any) => c.id === id);
      },
      create: async (client: Client) => {
          return fetchJson('/clients.php', { method: 'POST', body: JSON.stringify(client) });
      },
      update: async (client: Client) => {
          return fetchJson('/clients.php', { method: 'PUT', body: JSON.stringify(client) });
      },
      delete: async (id: string) => {
          return fetchJson(`/clients.php?id=${id}`, { method: 'DELETE' });
      }
  },

  // Recurring Invoices Logic
  recurringInvoices: {
    list: async () => {
      return fetchJson('/recurring.php');
    },
    create: async (rec: RecurringInvoice) => {
      return fetchJson('/recurring.php', { method: 'POST', body: JSON.stringify(rec) });
    },
    update: async (rec: RecurringInvoice) => {
      return fetchJson('/recurring.php', { method: 'PUT', body: JSON.stringify(rec) });
    },
    toggleActive: async (id: string) => {
      const invoices = await api.recurringInvoices.list();
      const rec = invoices.find((r: RecurringInvoice) => r.id === id);
      if (!rec) throw new Error("Recurring invoice not found");

      const updated = { ...rec, isActive: !rec.isActive };
      await api.recurringInvoices.update(updated);
      return updated;
    },
    delete: async (id: string) => {
      return fetchJson(`/recurring.php?id=${id}`, { method: 'DELETE' });
    },
    
    processDue: async (settings: CompanySettings) => {
      return fetchJson('/recurring.php?action=process_due', { method: 'POST', body: JSON.stringify({ settings }) });
    }
  },

  // Invoices CRUD
  invoices: {
      list: async () => {
           return fetchJson('/invoices.php');
      },
      create: async (invoice: Invoice) => {
          return fetchJson('/invoices.php', { method: 'POST', body: JSON.stringify(invoice) });
      },
      update: async (invoice: Invoice) => {
           return fetchJson('/invoices.php', { method: 'PUT', body: JSON.stringify(invoice) });
      },
      delete: async (id: string) => {
           return fetchJson(`/invoices.php?id=${id}`, { method: 'DELETE' });
      }
  }
};
