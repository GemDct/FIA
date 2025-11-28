import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { InvoiceList } from './components/InvoiceList';
import { InvoiceForm } from './components/InvoiceForm';
import { RecurringInvoiceList } from './components/RecurringInvoiceList';
import { RecurringInvoiceForm } from './components/RecurringInvoiceForm';
import { PrintView } from './components/PrintView';
import { AuthScreen } from './components/AuthScreen';
import { ForgotPasswordScreen } from './components/ForgotPasswordScreen';
import { ResetPasswordScreen } from './components/ResetPasswordScreen';
import { SettingsForm } from './components/SettingsForm';
import { ProductList } from './components/ProductList';
import { ServiceList } from './components/ServiceList';
import { QuoteList } from './components/QuoteList';
import { PricingPage } from './components/PricingPage';
import { AccountSubscriptionPage } from './components/AccountSubscriptionPage';
import { AiAssistant } from './components/AiAssistant';
import { Client, Invoice, ViewState, AIInvoiceResponse, User, Product, Service, CompanySettings, RecurringInvoice, UserSubscription, UserUsage, SubscriptionPlan, PlanId } from './types';
import { InvoiceDraft, ClientDraft, CatalogItemDraft } from './models/aiTypes';
import { INITIAL_CLIENTS, INITIAL_INVOICES, INITIAL_PRODUCTS, INITIAL_SERVICES, DEFAULT_SETTINGS, INITIAL_RECURRING_INVOICES, AVAILABLE_PLANS } from './constants';
import { api } from './services/api';
import { billingService } from './services/billingService';
import { Menu, FileText, Bot, Plus, Sparkles } from 'lucide-react';

const App: React.FC = () => {
  // Auth State
  const [user, setUser] = useState<User | null>(null);

  // Data State
  const [view, setView] = useState<ViewState>('AUTH');
  const [resetToken, setResetToken] = useState<string | null>(null);

  const [clients, setClients] = useState<Client[]>(INITIAL_CLIENTS);
  const [invoices, setInvoices] = useState<Invoice[]>(INITIAL_INVOICES);
  const [recurringInvoices, setRecurringInvoices] = useState<RecurringInvoice[]>(INITIAL_RECURRING_INVOICES);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [services, setServices] = useState<Service[]>(INITIAL_SERVICES);
  const [settings, setSettings] = useState<CompanySettings>(DEFAULT_SETTINGS);

  // Billing State
  const [userSubscription, setUserSubscription] = useState<UserSubscription | null>(null);
  const [userUsage, setUserUsage] = useState<UserUsage | null>(null);
  const [currentPlan, setCurrentPlan] = useState<SubscriptionPlan | null>(null);

  // UI State
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [editingRecurring, setEditingRecurring] = useState<RecurringInvoice | null>(null);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [aiDraftData, setAiDraftData] = useState<Partial<Invoice> | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Load persistence (Mock) & Check URL for reset token
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    
    if (token) {
      setResetToken(token);
      setView('RESET_PASSWORD');
    } else if (user && view === 'AUTH') {
      setView('DASHBOARD');
    }
  }, [user, view]);

  // Load Billing Info when user logs in
  useEffect(() => {
    if (user) {
      api.billing.getUserBillingInfo(user.id).then(info => {
        setUserSubscription(info.subscription);
        setUserUsage(info.usage);
        setCurrentPlan(info.plan);
      });
    }
  }, [user, view]); // Reload when view changes to refresh usage

  // Handlers
  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    setView('DASHBOARD');
  };

  const handleLogout = () => {
    setUser(null);
    setView('AUTH');
  };

  const handleSaveInvoice = (invoice: Invoice) => {
    if (editingInvoice) {
      setInvoices(invoices.map(inv => inv.id === invoice.id ? invoice : inv));
    } else {
      // New invoice - Update usage mock locally
      setInvoices([...invoices, invoice]);
      if (invoice.type === 'INVOICE' && userUsage) {
         setUserUsage({...userUsage, invoicesCreatedCurrentMonth: userUsage.invoicesCreatedCurrentMonth + 1});
      }
    }
    setEditingInvoice(null);
    setAiDraftData(null);
    if (invoice.type === 'QUOTE') setView('QUOTES');
    else setView('INVOICES');
  };

  const handleCreateInvoice = (type: 'INVOICE' | 'QUOTE' = 'INVOICE') => {
    // GATEKEEPING
    if (type === 'INVOICE' && userUsage && userSubscription) {
      if (!billingService.canCreateInvoice(userUsage, userSubscription)) {
        alert("Limite de factures atteinte pour ce mois. Veuillez mettre à jour votre plan.");
        setView('PRICING');
        return;
      }
    }

    setEditingInvoice(null);
    setAiDraftData({ type });
    setView(type === 'QUOTE' ? 'CREATE_QUOTE' : 'CREATE_INVOICE');
  };

  const handleEditInvoice = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    if (invoice.type === 'QUOTE') setView('EDIT_QUOTE');
    else setView('EDIT_INVOICE');
  };

  const handleConvertQuote = (quote: Invoice) => {
    // Gatekeeping for conversion too
    if (userUsage && userSubscription && !billingService.canCreateInvoice(userUsage, userSubscription)) {
      alert("Limite de factures atteinte. Impossible de convertir le devis.");
      setView('PRICING');
      return;
    }

    const newInvoice = api.billing.convertQuoteToInvoice(quote);
    setEditingInvoice(null);
    setAiDraftData(newInvoice);
    setView('CREATE_INVOICE');
  };

  const handleDeleteInvoice = (id: string) => {
     if(window.confirm('Êtes-vous sûr ?')) {
       setInvoices(invoices.filter(i => i.id !== id));
     }
  };

  // Recurring Invoice Handlers
  const handleCreateRecurring = () => {
    if (userUsage && userSubscription) {
      if (!billingService.canCreateRecurringInvoice(userUsage, userSubscription)) {
        alert("Limite de factures récurrentes atteinte. Passez au plan Pro.");
        setView('PRICING');
        return;
      }
    }
    setEditingRecurring(null); 
    setView('CREATE_RECURRING');
  };

  const handleSaveRecurring = async (rec: RecurringInvoice) => {
    if (editingRecurring) {
      await api.recurringInvoices.update(rec);
      setRecurringInvoices(recurringInvoices.map(r => r.id === rec.id ? rec : r));
    } else {
      await api.recurringInvoices.create(rec);
      setRecurringInvoices([...recurringInvoices, rec]);
      if(userUsage) setUserUsage({...userUsage, recurringInvoicesCreatedTotal: userUsage.recurringInvoicesCreatedTotal + 1});
    }
    setEditingRecurring(null);
    setView('RECURRING_INVOICES');
  };

  const handleToggleRecurring = async (rec: RecurringInvoice) => {
    const updated = { ...rec, isActive: !rec.isActive };
    await api.recurringInvoices.update(updated);
    setRecurringInvoices(recurringInvoices.map(r => r.id === rec.id ? updated : r));
  };

  const handleRunRecurring = async () => {
    const { generatedInvoices, updatedRecurringInvoices } = await api.recurringInvoices.processDue(settings);
    if (generatedInvoices.length > 0) {
      setInvoices([...invoices, ...generatedInvoices]);
      
      // Update local state with new dates
      const updatedMap = new Map(updatedRecurringInvoices.map(r => [r.id, r]));
      setRecurringInvoices(recurringInvoices.map(r => updatedMap.get(r.id) || r));
      
      if (userUsage) {
         setUserUsage({...userUsage, invoicesCreatedCurrentMonth: userUsage.invoicesCreatedCurrentMonth + generatedInvoices.length});
      }

      alert(`${generatedInvoices.length} facture(s) générée(s) avec succès !`);
    } else {
      alert("Aucune facture récurrente à générer pour aujourd'hui.");
    }
  };

  const handleSaveSettings = (newSettings: CompanySettings) => {
    setSettings(newSettings);
    alert('Paramètres enregistrés');
  };

  // Product Handlers
  const handleAddProduct = (p: Product) => setProducts([...products, p]);
  const handleUpdateProduct = (p: Product) => setProducts(products.map(prod => prod.id === p.id ? p : prod));
  const handleDeleteProduct = (id: string) => setProducts(products.filter(p => p.id !== id));

  // Service Handlers
  const handleAddService = (s: Service) => setServices([...services, s]);
  const handleUpdateService = (s: Service) => setServices(services.map(srv => srv.id === s.id ? s : srv));
  const handleDeleteService = (id: string) => setServices(services.filter(s => s.id !== id));

  // Billing Handlers
  const handleSelectPlan = async (planId: PlanId) => {
    if (!user) return;
    const res = await api.billing.startPlanCheckoutSession(user.id, planId);
    if (res.success) {
      // Mock update local state
      alert("Plan mis à jour avec succès (Simulation)");
      if (userSubscription) setUserSubscription({...userSubscription, planId: planId});
      const newPlan = billingService.getPlanById(planId);
      if (newPlan) setCurrentPlan(newPlan);
      setView('ACCOUNT_SUBSCRIPTION');
    }
  };

  const handleCancelSubscription = async () => {
    if (!user) return;
    if(window.confirm('Voulez-vous vraiment résilier à la fin de la période ?')) {
       await api.billing.cancelSubscription(user.id);
       if (userSubscription) setUserSubscription({...userSubscription, cancelAtPeriodEnd: true});
    }
  };

  // AI Navigation Logic
  const handleOpenAI = () => {
    if (userSubscription && !billingService.hasAIAccess(userSubscription)) {
       alert("L'assistant IA est réservé aux plans Pro et Business.");
       setView('PRICING');
       return;
    }
    setView('AI_ASSISTANT'); // Le nouvel assistant est universel, plus besoin de 'tab'
  };

  const handleDocumentDraftAccepted = (draft: InvoiceDraft) => {
     let clientId = '';
 
     // Try to match client or create new
     if (draft.client.name) {
        const existing = clients.find(c => c.name.toLowerCase().includes(draft.client.name!.toLowerCase()));
        if (existing) {
          clientId = existing.id;
        } else {
           // Auto-create client from draft if possible
           const newClient: Client = {
             id: `c-${Date.now()}`,
             name: draft.client.name,
             email: draft.client.email || '',
             address: draft.client.address || '',
             siret: draft.client.vatNumber || ''
           };
           setClients(prev => [...prev, newClient]);
           clientId = newClient.id;
        }
     }
 
     const newItems = draft.lines.map((line, idx) => ({
        id: `ai-item-${Date.now()}-${idx}`,
        description: line.label,
        quantity: line.quantity,
        price: line.unitPrice,
        vatRate: line.vatRate !== null ? line.vatRate : (settings.isVatSubject ? 20 : 0)
     }));
 
     // Pré-remplir les données pour le formulaire
     setAiDraftData({
        clientId,
        items: newItems,
        dueDate: draft.dueDate || undefined,
        notes: draft.notes || 'Généré par Assistant IA',
        type: draft.type // 'INVOICE' ou 'QUOTE'
     });
     
     // Changer la vue vers le bon formulaire
     setView(draft.type === 'QUOTE' ? 'CREATE_QUOTE' : 'CREATE_INVOICE');
  };

  const handleAiClientDraftAccepted = (draft: ClientDraft) => {
    console.log("Brouillon de client reçu depuis l'IA :", draft);
    alert(
      `Brouillon client IA : ${draft.name ?? "Sans nom"} (implémentation à venir).`
    );
    // TODO : plus tard, ouvrir un vrai écran/formulaire de création de client
  };
  
  const handleAiCatalogItemDraftAccepted = (draft: CatalogItemDraft) => {
    console.log("Brouillon d'élément de catalogue IA :", draft);
  
    if (draft.type === "PRODUCT") {
      alert(
        `Brouillon produit IA : ${draft.name} à ${draft.defaultPrice}€ (implémentation à venir).`
      );
      // TODO : créer un vrai produit à partir du draft
    } else if (draft.type === "SERVICE") {
      alert(
        `Brouillon service IA : ${draft.name} à ${draft.defaultPrice}€ (implémentation à venir).`
      );
      // TODO : créer un vrai service à partir du draft
    }
  };

  const renderContent = () => {
    switch (view) {
      case 'AUTH':
        return <AuthScreen onLogin={handleLogin} onForgotPassword={() => setView('FORGOT_PASSWORD')} />;
      case 'FORGOT_PASSWORD':
        return <ForgotPasswordScreen onBack={() => setView('AUTH')} />;
      case 'RESET_PASSWORD':
        return <ResetPasswordScreen token={resetToken || ''} onSuccess={() => { setResetToken(null); setView('AUTH'); }} />;
      case 'DASHBOARD':
        return <Dashboard invoices={invoices.filter(i => i.type === 'INVOICE')} onCreateInvoice={() => handleCreateInvoice('INVOICE')} />;
      case 'INVOICES':
        return <InvoiceList 
          invoices={invoices.filter(i => i.type === 'INVOICE')} 
          clients={clients} 
          onEdit={handleEditInvoice} 
          onView={setViewingInvoice} 
          onCreate={() => handleCreateInvoice('INVOICE')}
          onOpenAI={handleOpenAI}
        />;
      case 'QUOTES':
        return <QuoteList 
          quotes={invoices.filter(i => i.type === 'QUOTE')} 
          clients={clients} 
          onEdit={handleEditInvoice} 
          onConvert={handleConvertQuote}
          onDelete={handleDeleteInvoice}
          onCreate={() => handleCreateInvoice('QUOTE')}
          onOpenAI={handleOpenAI}
        />;
      case 'RECURRING_INVOICES':
        return <RecurringInvoiceList 
          recurringInvoices={recurringInvoices}
          clients={clients}
          onEdit={(rec) => { setEditingRecurring(rec); setView('EDIT_RECURRING'); }}
          onToggleActive={handleToggleRecurring}
          onRunNow={handleRunRecurring}
          onCreate={handleCreateRecurring}
        />;
      case 'AI_ASSISTANT':
        return (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Bot className="w-8 h-8 text-indigo-600" />
              Assistant Intelligent
            </h2>
            <AiAssistant
              onDocumentDraftAccepted={handleDocumentDraftAccepted}
              onClientDraftAccepted={handleAiClientDraftAccepted}
              onCatalogItemDraftAccepted={handleAiCatalogItemDraftAccepted}
            />
          </div>
        );
      case 'PRODUCTS':
        return <ProductList products={products} onAdd={handleAddProduct} onUpdate={handleUpdateProduct} onDelete={handleDeleteProduct} />;
      case 'SERVICES':
        return <ServiceList services={services} onAdd={handleAddService} onUpdate={handleUpdateService} onDelete={handleDeleteService} />;
      case 'SETTINGS':
        return <SettingsForm settings={settings} onSave={handleSaveSettings} />;
      case 'CREATE_INVOICE':
      case 'EDIT_INVOICE':
        return (
          <InvoiceForm
            clients={clients}
            products={products}
            services={services}
            settings={settings}
            initialData={aiDraftData || editingInvoice}
            documentType="INVOICE"
            onSave={handleSaveInvoice}
            onCancel={() => { setEditingInvoice(null); setView('INVOICES'); }}
          />
        );
      case 'CREATE_QUOTE':
      case 'EDIT_QUOTE':
        return (
          <InvoiceForm
            clients={clients}
            products={products}
            services={services}
            settings={settings}
            initialData={aiDraftData || editingInvoice}
            documentType="QUOTE"
            onSave={handleSaveInvoice}
            onCancel={() => { setEditingInvoice(null); setView('QUOTES'); }}
          />
        );
      case 'CREATE_RECURRING':
      case 'EDIT_RECURRING':
        return (
          <RecurringInvoiceForm
            clients={clients}
            products={products}
            services={services}
            settings={settings}
            initialData={editingRecurring}
            onSave={handleSaveRecurring}
            onCancel={() => { setEditingRecurring(null); setView('RECURRING_INVOICES'); }}
          />
        );
      case 'PRICING':
        return <PricingPage plans={AVAILABLE_PLANS} currentPlanId={userSubscription?.planId || 'free'} onSelectPlan={handleSelectPlan} />;
      case 'ACCOUNT_SUBSCRIPTION':
        if (!userSubscription || !userUsage || !currentPlan) return <div>Chargement...</div>;
        return <AccountSubscriptionPage subscription={userSubscription} usage={userUsage} plan={currentPlan} onUpgradeClick={() => setView('PRICING')} onCancelClick={handleCancelSubscription} />;
      case 'CLIENTS':
        return (
           <div className="bg-white p-6 md:p-8 rounded-xl shadow-sm ring-1 ring-slate-900/5 animate-fade-in">
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Clients</h2>
                  <p className="text-slate-500">Gérez votre base de contacts.</p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                  <button 
                    onClick={handleOpenAI}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity font-medium text-sm shadow-sm"
                  >
                    <Sparkles className="w-4 h-4" />
                    IA
                  </button>
                  <button 
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Nouveau Client
                  </button>
                </div>
            </div>

            <ul className="space-y-2">
                {clients.map(c => (
                  <li key={c.id} className="p-4 bg-slate-50 rounded-lg border border-slate-100 flex justify-between items-center group hover:border-indigo-100 transition-colors">
                    <div>
                      <span className="font-semibold block text-slate-900">{c.name}</span>
                      <span className="text-sm text-slate-500">{c.email}</span>
                    </div>
                    <span className="text-xs text-slate-400 bg-white px-2 py-1 rounded border border-slate-200">{c.siret || 'No SIRET'}</span>
                  </li>
                ))}
            </ul>
          </div>
        );
      default:
        return <div>Page introuvable</div>;
    }
  };

  if (view === 'AUTH' || view === 'FORGOT_PASSWORD' || view === 'RESET_PASSWORD') {
    return renderContent();
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <FileText className="text-white w-5 h-5" />
          </div>
          <span className="font-bold text-slate-800">FastInvoice</span>
        </div>
        <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg">
          <Menu className="w-6 h-6" />
        </button>
      </div>

      <Sidebar 
        currentView={view} 
        onChangeView={setView} 
        onAIClick={handleOpenAI}
        user={user}
        currentPlan={currentPlan}
        onLogout={handleLogout}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      
      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 transition-all duration-300 w-full">
        {renderContent()}
      </main>

      {viewingInvoice && (
        <PrintView
          invoice={viewingInvoice}
          client={clients.find(c => c.id === viewingInvoice.clientId)}
          settings={settings}
          onClose={() => setViewingInvoice(null)}
        />
      )}
    </div>
  );
};

export default App;