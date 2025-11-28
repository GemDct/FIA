
import { Invoice, InvoiceStatus, RecurringInvoice, RecurringInvoiceInput, InvoiceItem, CompanySettings } from '../types';

/**
 * Service to handle Recurring Invoice logic.
 * This simulates a backend service or database interaction layer.
 */

// Helper to calculate totals for generated invoices
const calculateTotals = (items: InvoiceItem[], isVatSubject: boolean) => {
  let subtotal = 0;
  let taxAmount = 0;

  items.forEach(item => {
    const lineTotal = item.quantity * item.price;
    subtotal += lineTotal;
    if (isVatSubject) {
      taxAmount += lineTotal * (item.vatRate / 100);
    }
  });

  return { subtotal, taxAmount, total: subtotal + taxAmount };
};

// Helper to calculate next date based on frequency
const calculateNextDate = (currentDateStr: string, frequency: 'WEEKLY' | 'MONTHLY' | 'YEARLY'): string => {
  const date = new Date(currentDateStr);
  
  switch (frequency) {
    case 'WEEKLY':
      date.setDate(date.getDate() + 7);
      break;
    case 'MONTHLY':
      date.setMonth(date.getMonth() + 1);
      break;
    case 'YEARLY':
      date.setFullYear(date.getFullYear() + 1);
      break;
  }
  
  return date.toISOString().split('T')[0];
};

export const recurringInvoiceService = {
  
  // --- Core Business Logic ---

  /**
   * Generates invoices for all active subscriptions that are due on or before the given date.
   */
  generateDueInvoicesForDate: (params: {
    date: Date;
    recurringInvoices: RecurringInvoice[];
    settings: CompanySettings;
  }): { generatedInvoices: Invoice[]; updatedRecurringInvoices: RecurringInvoice[] } => {
    const targetDateStr = params.date.toISOString().split('T')[0];
    const generatedInvoices: Invoice[] = [];
    const updatedRecurringInvoices: RecurringInvoice[] = [];

    params.recurringInvoices.forEach(recInvoice => {
      // 1. Filter: Must be active, due date passed, and not past end date
      if (!recInvoice.isActive) {
        updatedRecurringInvoices.push(recInvoice);
        return;
      }

      if (recInvoice.nextRunDate > targetDateStr) {
        updatedRecurringInvoices.push(recInvoice);
        return;
      }

      if (recInvoice.endDate && recInvoice.endDate < targetDateStr) {
        // Expired
        updatedRecurringInvoices.push({ ...recInvoice, isActive: false });
        return;
      }

      // 2. Generate Invoice
      const { subtotal, taxAmount, total } = calculateTotals(recInvoice.items, params.settings.isVatSubject);
      
      const newInvoice: Invoice = {
        id: `inv-rec-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        type: 'INVOICE',
        number: `INV-${new Date().getFullYear()}-${Math.floor(Math.random() * 100000)}`, // TODO: Real numbering sequence
        date: targetDateStr, // Date of generation
        dueDate: calculateNextDate(targetDateStr, 'MONTHLY'), // Default due date 30 days later? Or configurable.
        clientId: recInvoice.clientId,
        items: recInvoice.items.map(i => ({ ...i })), // Clone items
        status: InvoiceStatus.DRAFT,
        subtotal,
        taxAmount,
        total,
        notes: `Généré automatiquement selon l'abonnement : ${recInvoice.label}`,
        sourceRecurringInvoiceId: recInvoice.id
      };

      generatedInvoices.push(newInvoice);

      // 3. Update Next Run Date
      const nextRun = calculateNextDate(recInvoice.nextRunDate, recInvoice.frequency);

      updatedRecurringInvoices.push({
        ...recInvoice,
        lastRunDate: targetDateStr,
        nextRunDate: nextRun
      });
    });

    return { generatedInvoices, updatedRecurringInvoices };
  },


  // --- CRUD Placeholders (Simulating DB) ---

  create: async (userId: string, input: RecurringInvoiceInput): Promise<RecurringInvoice> => {
    // TODO: Insert into DB
    const newRec: RecurringInvoice = {
      id: `rec-${Date.now()}`,
      ...input,
      nextRunDate: input.startDate, // Initial run is start date
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    return newRec;
  },

  update: async (id: string, input: RecurringInvoiceInput): Promise<RecurringInvoice> => {
    // TODO: Update DB
    // Returning mock updated object
    return {
      id,
      ...input,
      nextRunDate: input.startDate, // Re-eval based on logic if needed
      lastRunDate: undefined, // simplistic update
      createdAt: new Date().toISOString(), // mock
      updatedAt: new Date().toISOString()
    };
  },

  toggleActive: async (id: string, currentState: boolean): Promise<boolean> => {
    // TODO: DB Update isActive = !currentState
    return !currentState;
  }
};
