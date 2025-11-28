
import { Client, Invoice, InvoiceStatus, Product, Service, CompanySettings, User, RecurringInvoice, SubscriptionPlan, UserSubscription, UserUsage } from './types';

export const MOCK_USER: User = {
  id: 'u1',
  name: 'Alex Freelance',
  email: 'alex@freelance.com',
  avatarUrl: 'https://ui-avatars.com/api/?name=Alex+Freelance&background=6366f1&color=fff'
};

export const DEFAULT_SETTINGS: CompanySettings = {
  name: 'Mon Entreprise Créative',
  address: '12 Avenue des Codes, 75011 Paris',
  email: 'contact@monentreprise.com',
  phone: '+33 6 12 34 56 78',
  siret: '800 123 456 00012',
  isVatSubject: true, // Default to true
  primaryColor: '#4f46e5',
  paymentTerms: 'Paiement à 30 jours fin de mois.'
};

// --- SaaS Plans Configuration ---
export const AVAILABLE_PLANS: SubscriptionPlan[] = [
  {
    id: "free",
    name: "Gratuit",
    pricePerMonthCents: 0,
    currency: "EUR",
    description: "Pour démarrer votre activité",
    features: [
      "Jusqu'à 3 factures / mois",
      "Jusqu'à 3 clients",
      "Devis illimités",
      "Pas de factures récurrentes",
    ],
    limits: {
      maxInvoicesPerMonth: 3,
      maxClients: 3,
      maxRecurringInvoices: 0,
      aiAssistantIncluded: false,
      prioritySupport: false,
    },
  },
  {
    id: "pro",
    name: "Pro",
    pricePerMonthCents: 900, // 9.00€
    currency: "EUR",
    description: "Pour les freelances actifs",
    features: [
      "Factures illimitées",
      "Clients illimités",
      "Jusqu'à 5 factures récurrentes",
      "Assistant IA inclus",
      "Support email"
    ],
    limits: {
      maxInvoicesPerMonth: undefined, // Unlimited
      maxClients: undefined,
      maxRecurringInvoices: 5,
      aiAssistantIncluded: true,
      prioritySupport: false,
    },
  },
  {
    id: "business",
    name: "Business",
    pricePerMonthCents: 2900, // 29.00€
    currency: "EUR",
    description: "Pour les petites agences",
    features: [
      "Tout illimité",
      "Factures récurrentes illimitées",
      "Assistant IA avancé",
      "Support prioritaire 24/7",
      "Multi-utilisateurs (bientôt)"
    ],
    limits: {
      maxInvoicesPerMonth: undefined,
      maxClients: undefined,
      maxRecurringInvoices: undefined,
      aiAssistantIncluded: true,
      prioritySupport: true,
    },
  },
];

// Mock Subscription Data for "Free" Plan user initially
export const MOCK_USER_SUBSCRIPTION: UserSubscription = {
  userId: 'u1',
  planId: 'free',
  status: 'ACTIVE',
  currentPeriodStart: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
  currentPeriodEnd: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString(),
  cancelAtPeriodEnd: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const MOCK_USER_USAGE: UserUsage = {
  userId: 'u1',
  periodStart: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
  periodEnd: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString(),
  invoicesCreatedCurrentMonth: 1,
  clientsCreatedTotal: 2,
  recurringInvoicesCreatedTotal: 0,
};


export const INITIAL_PRODUCTS: Product[] = [
  { id: 'p1', name: 'Licence Logiciel', description: 'Licence annuelle', defaultPrice: 120, vatRate: 20, unit: 'an' },
  { id: 'p2', name: 'Hébergement Web', description: 'Serveur dédié', defaultPrice: 50, vatRate: 20, unit: 'mois' },
];

export const INITIAL_SERVICES: Service[] = [
  { 
    id: 's1', 
    name: 'Dév Frontend', 
    description: 'Développement React/TypeScript', 
    unitPrice: 450, 
    vatRate: 20, 
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  { 
    id: 's2', 
    name: 'Design UX/UI', 
    description: 'Maquettes Figma', 
    unitPrice: 400, 
    vatRate: 20, 
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  { 
    id: 's3', 
    name: 'Formation', 
    description: 'Formation équipe', 
    unitPrice: 600, 
    vatRate: 0, // Education often exempt
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

export const INITIAL_CLIENTS: Client[] = [
  {
    id: 'c1',
    name: 'Tech Solutions Inc.',
    email: 'billing@techsolutions.com',
    address: '123 Innovation Drive, Silicon Valley, CA',
    siret: '123 456 789 00012'
  },
  {
    id: 'c2',
    name: 'Studio Graphique',
    email: 'contact@studiographique.fr',
    address: '45 Rue des Arts, Paris, France',
    siret: '987 654 321 00034'
  }
];

export const INITIAL_INVOICES: Invoice[] = [
  {
    id: 'inv1',
    type: 'INVOICE',
    number: 'INV-2024-001',
    date: '2024-05-01',
    dueDate: '2024-05-15',
    clientId: 'c1',
    status: InvoiceStatus.PAID,
    subtotal: 1500,
    taxAmount: 300,
    total: 1800,
    items: [
      { id: 'i1', description: 'Frontend Development', quantity: 2, price: 750, vatRate: 20, serviceId: 's1' }
    ]
  }
];

export const INITIAL_RECURRING_INVOICES: RecurringInvoice[] = [
  {
    id: 'rec1',
    clientId: 'c1',
    label: 'Maintenance Site Web',
    frequency: 'MONTHLY',
    startDate: '2024-01-01',
    nextRunDate: new Date().toISOString().split('T')[0], // Due today for demo
    isActive: true,
    items: [
      { id: 'ri1', description: 'Forfait Maintenance Mensuel', quantity: 1, price: 50, vatRate: 20 }
    ]
  }
];
